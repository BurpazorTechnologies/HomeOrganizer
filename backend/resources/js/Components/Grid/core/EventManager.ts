import Konva from 'konva';
import type { GridStateStore } from '@/Components/Grid/core/state/GridStateStore';
import { EVENT_TIMING } from '@/Components/Grid/types/constants';

/**
 * Configuration for EventManager
 */
export interface EventManagerConfig {
  wheelThrottleMs: number;      // Default: 16ms (~60fps)
  wheelDebounceMs: number;      // Default: 150ms for zoom end detection
}

/**
 * Callbacks for delegating to other managers
 * EventManager doesn't contain business logic - it delegates via callbacks
 */
export interface EventManagerCallbacks {
  // Zoom callbacks
  onZoomWheel: (delta: number) => void;
  onZoomEnd: () => void;

  // Pan callbacks
  onPanStart: () => void;
  onPanEnd: (newPan: { x: number; y: number }, isPanMode: boolean) => Promise<void>;
  onPanModeExit: (currentPan: { x: number; y: number }) => Promise<void>;

  // Click callbacks
  onClick: (e: Konva.KonvaEventObject<MouseEvent>, position: { x: number; y: number }) => void;

  // Shape drag callbacks
  onShapeDragStart: (shapeId: string) => void;
  onShapeDragEnd: (shapeId: string) => void;

  // Pan mode state
  getIsPanMode: () => boolean;
  setIsPanMode: (value: boolean) => void;

  // Debug refresh
  refreshDebugState: () => void;
}

/**
 * EventManager
 *
 * Centralizes all Konva event handling with internal state machines.
 * Acquires/releases action locks via the store.
 * Delegates business logic to callbacks.
 *
 * Key responsibilities:
 * 1. Bind all Konva events (wheel, click, drag, etc.)
 * 2. Manage wheel throttling internally
 * 3. Manage middle-mouse pan state machine internally
 * 4. Acquire/release action locks via store
 * 5. Delegate to callbacks for business logic
 *
 * State machines managed internally:
 * - Wheel throttle: { wheelTimeout }
 * - Middle-mouse pan: { isMiddleButtonPanActive, previousPanModeState, handler }
 */
export class EventManager {
  private stage: Konva.Stage;
  private store: GridStateStore;
  private callbacks: EventManagerCallbacks;
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
    callbacks: EventManagerCallbacks,
    config?: Partial<EventManagerConfig>
  ) {
    this.stage = stage;
    this.store = store;
    this.callbacks = callbacks;
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

      this.callbacks.onClick(e, { x: pointer.x, y: pointer.y });
    });
  }

  // ==================== Drag Events ====================

  private bindDragEvents(): void {
    // Drag start - acquire action lock
    this.stage.on('dragstart', (e) => {
      const target = e.target;

      if (target === this.stage) {
        // Pan started - acquire lock and disable shape dragging
        this.store.acquireActionLock('panning', 'stage');
        this.callbacks.onPanStart();
      } else if (target.getClassName() === 'Rect') {
        // Shape drag started - acquire lock
        this.store.acquireActionLock('dragging', target.id());
        this.callbacks.onShapeDragStart(target.id());
      }
    });

    // Drag end - update labels for shapes, sync pan for stage, release lock
    this.stage.on('dragend', (e) => {
      const target = e.target;

      // If the stage itself was dragged (pan mode), sync pan to store and release lock
      if (target === this.stage) {
        // Skip if this was a middle-mouse pan (handled by mouseup listener)
        if (this.middleMouseState.isActive) {
          return;
        }

        // Delegate to callback for pan-end orchestration
        const newPan = this.stage.position();
        this.callbacks.onPanEnd(newPan, this.callbacks.getIsPanMode()).then(() => {
          // Release action lock after orchestration completes
          this.store.releaseActionLock('stage');
          this.callbacks.refreshDebugState();
        });

        return;
      }

      // Handle shape drag end
      if (target.getClassName() === 'Rect') {
        const shapeId = target.id();
        this.callbacks.onShapeDragEnd(shapeId);
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
        this.callbacks.onZoomWheel(delta);
        // Release zoom lock after zoom completes
        this.store.releaseActionLock('wheel');
        // Notify zoom end
        this.callbacks.onZoomEnd();
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
    this.middleMouseState.previousPanModeState = this.callbacks.getIsPanMode();
    this.middleMouseState.isActive = true;

    // Acquire action lock and enable panning
    this.store.acquireActionLock('panning', 'middle-mouse');
    this.stage.draggable(true);
    this.callbacks.onPanStart();
    this.callbacks.setIsPanMode(true);
  }

  private handleMiddleMouseUp(): void {
    this.middleMouseState.isActive = false;

    // Restore stage draggable state
    this.stage.draggable(this.middleMouseState.previousPanModeState);

    // Delegate to callback for pan-end orchestration
    const newPan = this.stage.position();
    this.callbacks.onPanEnd(newPan, this.middleMouseState.previousPanModeState).then(() => {
      // Release action lock after orchestration completes
      this.store.releaseActionLock('middle-mouse');
      this.callbacks.refreshDebugState();
    });

    this.callbacks.setIsPanMode(this.middleMouseState.previousPanModeState);
  }

  // ==================== Pan Mode Toggle ====================

  /**
   * Handle pan mode being toggled via button (not middle-mouse)
   * Call this from the component's pan mode watcher
   */
  handlePanModeChange(newValue: boolean, oldValue: boolean): void {
    // Update stage draggable state
    this.stage.draggable(newValue);

    // When entering pan mode, acquire lock and notify
    if (newValue === true && oldValue === false) {
      this.store.acquireActionLock('panning', 'pan-mode-toggle');
      this.callbacks.onPanStart();
    }
    // When exiting pan mode via button toggle
    else if (newValue === false && oldValue === true) {
      const currentPan = this.stage.position();
      this.callbacks.onPanModeExit(currentPan).then(() => {
        // Release action lock after orchestration completes
        this.store.releaseActionLock('pan-mode-toggle');
        this.callbacks.refreshDebugState();
      });
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
