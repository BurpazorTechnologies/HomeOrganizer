/**
 * BaseFlow
 *
 * Base class for event-driven flows in the grid system.
 * Flows are multi-step operations that react to events and coordinate managers.
 *
 * Key concepts:
 * - Flows subscribe to events via EventBus
 * - Flows can dispatch commands via store.dispatch()
 * - Flows can query state via QueryService
 * - Flows manage their own internal state machine
 *
 * Unlike direct manager calls, flows enable:
 * - Loose coupling (flows don't know about specific managers)
 * - Testability (can test flows in isolation with mock event bus)
 * - Extensibility (can add new flows without modifying existing code)
 *
 * Usage:
 * ```typescript
 * class MyFlow extends BaseFlow {
 *   protected setupSubscriptions(): void {
 *     this.on('SHAPE_CREATED', this.handleShapeCreated);
 *     this.on('SELECTION_CHANGED', this.handleSelectionChanged);
 *   }
 *
 *   private handleShapeCreated = (payload: ShapeCreatedPayload) => {
 *     // React to shape creation
 *   };
 * }
 * ```
 */

import type { EventBus, Unsubscribe } from '../events/EventBus';
import type { GridEventType, GridEventPayload, GridEvent } from '../events/types';
import type { GridStateStore } from '../state/GridStateStore';
import type { GridCommand, CommandResult } from '../commands';
import type { QueryService } from '../queries';
import { createQueryService } from '../queries';

/**
 * Dependencies injected into flows
 */
export interface FlowDependencies {
  eventBus: EventBus;
  store: GridStateStore;
  queryService?: QueryService; // Optional - will be created from store if not provided
}

/**
 * Flow state - tracks whether flow is active
 */
export type FlowState = 'idle' | 'active' | 'paused' | 'completed';

/**
 * Base class for all flows
 */
export abstract class BaseFlow {
  protected eventBus: EventBus;
  protected store: GridStateStore;
  protected queryService: QueryService;

  private subscriptions: Unsubscribe[] = [];
  private _state: FlowState = 'idle';

  constructor(deps: FlowDependencies) {
    this.eventBus = deps.eventBus;
    this.store = deps.store;
    this.queryService = deps.queryService ?? createQueryService(deps.store);
  }

  /**
   * Get current flow state
   */
  get state(): FlowState {
    return this._state;
  }

  /**
   * Start the flow - sets up subscriptions
   */
  start(): void {
    if (this._state !== 'idle' && this._state !== 'completed') {
      console.warn(`[${this.constructor.name}] Cannot start flow in state: ${this._state}`);
      return;
    }

    this._state = 'active';
    this.setupSubscriptions();
    this.onStart();
  }

  /**
   * Pause the flow - unsubscribes but keeps state
   */
  pause(): void {
    if (this._state !== 'active') {
      return;
    }

    this._state = 'paused';
    this.clearSubscriptions();
    this.onPause();
  }

  /**
   * Resume the flow - re-subscribes
   */
  resume(): void {
    if (this._state !== 'paused') {
      return;
    }

    this._state = 'active';
    this.setupSubscriptions();
    this.onResume();
  }

  /**
   * Stop the flow - clears all subscriptions and resets state
   */
  stop(): void {
    this._state = 'completed';
    this.clearSubscriptions();
    this.onStop();
  }

  /**
   * Destroy the flow - full cleanup
   */
  destroy(): void {
    this.stop();
    this.onDestroy();
  }

  // ==================== Protected Methods for Subclasses ====================

  /**
   * Subscribe to an event type
   * Subscriptions are automatically cleaned up when flow stops
   */
  protected on<T extends GridEventType>(
    type: T,
    handler: (payload: GridEventPayload<T>) => void
  ): void {
    const unsubscribe = this.eventBus.on(type, handler);
    this.subscriptions.push(unsubscribe);
  }

  /**
   * Subscribe to all events (wildcard)
   */
  protected onAll(handler: (event: GridEvent) => void): void {
    const unsubscribe = this.eventBus.onAll(handler);
    this.subscriptions.push(unsubscribe);
  }

  /**
   * Emit an event
   */
  protected emit<T extends GridEvent>(event: T): void {
    this.eventBus.emit(event);
  }

  /**
   * Dispatch a command to the store
   */
  protected dispatch(command: GridCommand): CommandResult<unknown> {
    return this.store.dispatch(command);
  }

  /**
   * Query the store for data
   * Note: Flows use queryService directly which has proper typing
   */
  protected get queries(): QueryService {
    return this.queryService;
  }

  // ==================== Abstract Methods ====================

  /**
   * Set up event subscriptions
   * Subclasses must implement this to define which events they listen to
   */
  protected abstract setupSubscriptions(): void;

  // ==================== Lifecycle Hooks (Optional Overrides) ====================

  /**
   * Called when flow starts
   */
  protected onStart(): void {
    // Override in subclass if needed
  }

  /**
   * Called when flow pauses
   */
  protected onPause(): void {
    // Override in subclass if needed
  }

  /**
   * Called when flow resumes
   */
  protected onResume(): void {
    // Override in subclass if needed
  }

  /**
   * Called when flow stops
   */
  protected onStop(): void {
    // Override in subclass if needed
  }

  /**
   * Called when flow is destroyed
   */
  protected onDestroy(): void {
    // Override in subclass if needed
  }

  // ==================== Private Methods ====================

  /**
   * Clear all subscriptions
   */
  private clearSubscriptions(): void {
    for (const unsubscribe of this.subscriptions) {
      unsubscribe();
    }
    this.subscriptions = [];
  }
}

/**
 * Type helper for creating flow instances
 */
export type FlowFactory<T extends BaseFlow> = (deps: FlowDependencies) => T;
