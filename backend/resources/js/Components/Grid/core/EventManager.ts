import Konva from 'konva';
import type { GridStateStore } from '@/Components/Grid/core/state/GridStateStore';
import type { EventBus } from '@/Components/Grid/core/events';
import { EVENT_TIMING } from '@/Components/Grid/types/constants';

/**
 * Configuration for EventManager
 */
export interface EventManagerConfig {
  wheelThrottleMs: number;      // Default: 16ms (~60fps)
  wheelDebounceMs: number;      // Default: 150ms for zoom end detection
}

/**
 * External callbacks that must come from the Vue component
 * These are state accessors/mutators that can't be replaced with events
 * because they involve Vue reactive state owned by the component
 */
export interface EventManagerExternalCallbacks {
  // Pan mode state (Vue reactive ref in component)
  getIsPanMode: () => boolean;
  setIsPanMode: (value: boolean) => void;

  // Debug refresh (triggers Vue reactive update)
  refreshDebugState: () => void;
}

/**
 * EventManager
 *
 * Centralizes all Konva event handling with internal state machines.
 * Emits events via EventBus instead of using callbacks.
 * Acquires/releases action locks via the store.
 *
 * Key responsibilities:
 * 1. Bind all Konva events (wheel, click, drag, etc.)
 * 2. Manage wheel throttling internally
 * 3. Manage middle-mouse pan state machine internally
 * 4. Acquire/release action locks via store
 * 5. Emit events for other managers to react to
 *
 * State machines managed internally:
 * - Wheel throttle: { wheelTimeout }
 * - Middle-mouse pan: { isMiddleButtonPanActive, previousPanModeState, handler }
 *
 * Events Emitted:
 * - WHEEL_ZOOM: When mouse wheel is used for zooming
 * - PAN_STARTED: When panning begins (stage or middle-mouse)
 * - PAN_ENDED: When panning ends
 * - PAN_ORCHESTRATION_REQUESTED: When pan needs orchestration (pan end, mode exit)
 * - CANVAS_CLICKED: When stage is clicked
 * - SHAPE_DRAG_STARTED: When a shape starts being dragged
 * - SHAPE_DRAG_ENDED: When a shape stops being dragged
 */
export class EventManager {
  private stage: Konva.Stage;
  private store: GridStateStore;
  private eventBus: EventBus;
  private externalCallbacks: EventManagerExternalCallbacks;
  private config: EventManagerConfig;

  // Wheel throttle state machine
  private wheelState = {
    wheelTimeout: null as NodeJS.Timeout | null,
  };

  // Middle-mouse pan state machine
  private middleMouseState = {
    isActive: false,
    previousPanModeState: false,
    handler: null as ((e: MouseEvent) => void) | null,
  };

  constructor(
    stage: Konva.Stage,
    store: GridStateStore,
    eventBus: EventBus,
    externalCallbacks: EventManagerExternalCallbacks,
    config?: Partial<EventManagerConfig>
  ) {
    this.stage = stage;
    this.store = store;
    this.eventBus = eventBus;
    this.externalCallbacks = externalCallbacks;
    this.config = {
      wheelThrottleMs: config?.wheelThrottleMs ?? EVENT_TIMING.WHEEL_THROTTLE,
      wheelDebounceMs: config?.wheelDebounceMs ?? 150,
    };
  }

  /**
   * Initialize all event bindings
   * Call this after stage is ready
   */
  initialize(): void {
    this.bindClickEvents();
    this.bindDragEvents();
    this.bindWheelEvents();
    this.bindMiddleMouseEvents();
  }

  /**
   * Cleanup all event bindings
   * Call this on component unmount
   */
  destroy(): void {
    // Clear wheel timeout
    if (this.wheelState.wheelTimeout) {
      clearTimeout(this.wheelState.wheelTimeout);
      this.wheelState.wheelTimeout = null;
    }

    // Remove middle-mouse handler from window
    if (this.middleMouseState.handler) {
      window.removeEventListener('mouseup', this.middleMouseState.handler, true);
      this.middleMouseState.handler = null;
    }

    // Konva events are cleaned up when stage is destroyed
  }

  // ==================== Click Events ====================

  private bindClickEvents(): void {
    this.stage.on('click', (e) => {
      const pointer = this.stage.getPointerPosition();
      if (!pointer) return;

      // Calculate world position (accounting for pan and zoom)
      const stagePos = this.stage.position();
      const scale = this.stage.scaleX();
      const worldPosition = {
        x: (pointer.x - stagePos.x) / scale,
        y: (pointer.y - stagePos.y) / scale,
      };

      // Emit event instead of callback
      this.eventBus.emit({
        type: 'CANVAS_CLICKED',
        payload: {
          position: { x: pointer.x, y: pointer.y },
          worldPosition,
          target: e.target === this.stage ? 'canvas' : 'shape',
          shapeId: e.target !== this.stage ? e.target.id() : undefined,
        },
      });
    });
  }

  // ==================== Drag Events ====================

  private bindDragEvents(): void {
    // Drag start - acquire action lock
    this.stage.on('dragstart', (e) => {
      const target = e.target;

      if (target === this.stage) {
        // Pan started - acquire lock
        this.store.acquireActionLock('panning', 'stage');

        // Emit pan started event
        const position = this.stage.position();
        this.eventBus.emit({
          type: 'PAN_STARTED',
          payload: {
            position: { x: position.x, y: position.y },
          },
        });
      } else if (target.getClassName() === 'Rect') {
        // Shape drag started - acquire lock
        const shapeId = target.id();
        this.store.acquireActionLock('dragging', shapeId);

        // Emit shape drag started event
        this.eventBus.emit({
          type: 'SHAPE_DRAG_STARTED',
          payload: {
            shapeId,
            position: { x: target.x(), y: target.y() },
          },
        });
      }
    });

    // Drag end - emit events, release lock
    this.stage.on('dragend', (e) => {
      const target = e.target;

      // If the stage itself was dragged (pan mode)
      if (target === this.stage) {
        // Skip if this was a middle-mouse pan (handled by mouseup listener)
        if (this.middleMouseState.isActive) {
          return;
        }

        const newPan = this.stage.position();
        const isPanMode = this.externalCallbacks.getIsPanMode();

        // Emit pan orchestration request event
        this.eventBus.emit({
          type: 'PAN_ORCHESTRATION_REQUESTED',
          payload: {
            type: 'pan_end',
            panPosition: { x: newPan.x, y: newPan.y },
            stayInPanMode: isPanMode,
          },
        });

        // Emit pan ended event
        this.eventBus.emit({
          type: 'PAN_ENDED',
          payload: {
            pan: { x: newPan.x, y: newPan.y },
          },
        });

        // Release action lock
        this.store.releaseActionLock('stage');
        this.externalCallbacks.refreshDebugState();

        return;
      }

      // Handle shape drag end
      if (target.getClassName() === 'Rect') {
        const shapeId = target.id();
        const position = { x: target.x(), y: target.y() };

        // Emit shape drag ended event
        this.eventBus.emit({
          type: 'SHAPE_DRAG_ENDED',
          payload: {
            shapeId,
            position,
            previousPosition: position, // Note: We don't track previous position here
          },
        });

        // Release action lock
        this.store.releaseActionLock(shapeId);
      }
    });
  }

  // ==================== Wheel Events ====================

  private bindWheelEvents(): void {
    this.stage.on('wheel', (e) => {
      e.evt.preventDefault();

      // Don't allow zooming during other actions
      if (!this.store.isActionAllowed('zooming')) {
        return;
      }

      // Clear existing timeout
      if (this.wheelState.wheelTimeout) {
        clearTimeout(this.wheelState.wheelTimeout);
      }

      // Acquire zoom lock briefly
      this.store.acquireActionLock('zooming', 'wheel');

      // Throttle zoom execution
      this.wheelState.wheelTimeout = setTimeout(() => {
        const delta = e.evt.deltaY;
        const pointer = this.stage.getPointerPosition();

        // Emit wheel zoom event
        this.eventBus.emit({
          type: 'WHEEL_ZOOM',
          payload: {
            delta,
            position: pointer ? { x: pointer.x, y: pointer.y } : { x: 0, y: 0 },
          },
        });

        // Release zoom lock after zoom completes
        this.store.releaseActionLock('wheel');
      }, this.config.wheelThrottleMs);
    });
  }

  // ==================== Middle Mouse Pan ====================

  private bindMiddleMouseEvents(): void {
    // Middle mouse button down - enable temporary pan
    this.stage.content.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        this.handleMiddleMouseDown();
      }
    }, true);

    // Create mouseup handler that will be attached to window
    this.middleMouseState.handler = (e: MouseEvent) => {
      if (e.button === 1 && this.middleMouseState.isActive) {
        e.preventDefault();
        this.handleMiddleMouseUp();
      }
    };

    // Listen on both stage.content AND window to ensure we catch the mouseup
    this.stage.content.addEventListener('mouseup', this.middleMouseState.handler, true);
    window.addEventListener('mouseup', this.middleMouseState.handler, true);
  }

  private handleMiddleMouseDown(): void {
    // Don't allow middle-click pan if another action is in progress
    if (!this.store.isActionAllowed('panning')) {
      return;
    }

    // Save previous pan mode state
    this.middleMouseState.previousPanModeState = this.externalCallbacks.getIsPanMode();
    this.middleMouseState.isActive = true;

    // Acquire action lock and enable panning
    this.store.acquireActionLock('panning', 'middle-mouse');
    this.stage.draggable(true);
    this.externalCallbacks.setIsPanMode(true);

    // Emit pan started event
    const position = this.stage.position();
    this.eventBus.emit({
      type: 'PAN_STARTED',
      payload: {
        position: { x: position.x, y: position.y },
      },
    });
  }

  private handleMiddleMouseUp(): void {
    this.middleMouseState.isActive = false;

    // Restore stage draggable state
    this.stage.draggable(this.middleMouseState.previousPanModeState);

    const newPan = this.stage.position();

    // Emit pan orchestration request event
    this.eventBus.emit({
      type: 'PAN_ORCHESTRATION_REQUESTED',
      payload: {
        type: 'pan_end',
        panPosition: { x: newPan.x, y: newPan.y },
        stayInPanMode: this.middleMouseState.previousPanModeState,
      },
    });

    // Emit pan ended event
    this.eventBus.emit({
      type: 'PAN_ENDED',
      payload: {
        pan: { x: newPan.x, y: newPan.y },
      },
    });

    // Release action lock
    this.store.releaseActionLock('middle-mouse');
    this.externalCallbacks.refreshDebugState();

    this.externalCallbacks.setIsPanMode(this.middleMouseState.previousPanModeState);
  }

  // ==================== Pan Mode Toggle ====================

  /**
   * Handle pan mode being toggled via button (not middle-mouse)
   * Call this from the component's pan mode watcher
   */
  handlePanModeChange(newValue: boolean, oldValue: boolean): void {
    // Update stage draggable state
    this.stage.draggable(newValue);

    // When entering pan mode, acquire lock and emit event
    if (newValue === true && oldValue === false) {
      this.store.acquireActionLock('panning', 'pan-mode-toggle');

      // Emit pan started event
      const position = this.stage.position();
      this.eventBus.emit({
        type: 'PAN_STARTED',
        payload: {
          position: { x: position.x, y: position.y },
        },
      });
    }
    // When exiting pan mode via button toggle
    else if (newValue === false && oldValue === true) {
      const currentPan = this.stage.position();

      // Emit pan orchestration request event for mode exit
      this.eventBus.emit({
        type: 'PAN_ORCHESTRATION_REQUESTED',
        payload: {
          type: 'pan_mode_exit',
          panPosition: { x: currentPan.x, y: currentPan.y },
          stayInPanMode: false,
        },
      });

      // Emit pan ended event
      this.eventBus.emit({
        type: 'PAN_ENDED',
        payload: {
          pan: { x: currentPan.x, y: currentPan.y },
        },
      });

      // Release action lock
      this.store.releaseActionLock('pan-mode-toggle');
      this.externalCallbacks.refreshDebugState();
    }
  }

  // ==================== State Queries ====================

  /**
   * Check if middle-mouse pan is active
   */
  isMiddleMousePanActive(): boolean {
    return this.middleMouseState.isActive;
  }
}
