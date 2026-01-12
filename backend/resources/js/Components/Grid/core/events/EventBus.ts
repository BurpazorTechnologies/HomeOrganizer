/**
 * EventBus - Central pub/sub system for grid events
 *
 * A typed, synchronous event bus that allows managers to communicate
 * without direct dependencies on each other.
 *
 * Key features:
 * - Type-safe event emission and subscription
 * - Wildcard subscriptions (listen to all events)
 * - Automatic cleanup via unsubscribe functions
 * - Dev-mode logging for debugging
 *
 * Usage:
 * ```typescript
 * const bus = createEventBus();
 *
 * // Subscribe to specific event
 * const unsubscribe = bus.on('SHAPE_CREATED', (payload) => {
 *   console.log('Shape created:', payload.shapeId);
 * });
 *
 * // Emit event
 * bus.emit({ type: 'SHAPE_CREATED', payload: { shapeId: '123', shape: {...} } });
 *
 * // Cleanup
 * unsubscribe();
 * ```
 */

import type {
  GridEvent,
  GridEventType,
  GridEventPayload,
  GridEventHandler,
  GridEventWildcardHandler,
} from './types';

/**
 * Unsubscribe function returned by on() and onAll()
 */
export type Unsubscribe = () => void;

/**
 * EventBus interface
 */
export interface EventBus {
  /**
   * Emit an event to all subscribers
   * @param event The event to emit
   */
  emit<T extends GridEvent>(event: T): void;

  /**
   * Subscribe to a specific event type
   * @param type The event type to listen for
   * @param handler The handler function
   * @returns Unsubscribe function
   */
  on<T extends GridEventType>(type: T, handler: GridEventHandler<T>): Unsubscribe;

  /**
   * Subscribe to all events (wildcard)
   * @param handler The handler function that receives all events
   * @returns Unsubscribe function
   */
  onAll(handler: GridEventWildcardHandler): Unsubscribe;

  /**
   * Unsubscribe a handler from a specific event type
   * @param type The event type
   * @param handler The handler to remove
   */
  off<T extends GridEventType>(type: T, handler: GridEventHandler<T>): void;

  /**
   * Remove all subscribers (useful for cleanup/testing)
   */
  clear(): void;

  /**
   * Get the count of subscribers for a specific event type
   * @param type The event type (optional - if omitted, returns total count)
   */
  subscriberCount(type?: GridEventType): number;

  /**
   * Enable or disable dev-mode logging
   * @param enabled Whether to log events
   */
  setLogging(enabled: boolean): void;
}

/**
 * EventBus configuration options
 */
export interface EventBusOptions {
  /** Enable logging in dev mode (default: true in dev, false in prod) */
  logging?: boolean;
  /** Custom logger function */
  logger?: (event: GridEvent) => void;
}

/**
 * Create a new EventBus instance
 */
export function createEventBus(options: EventBusOptions = {}): EventBus {
  // Storage for typed handlers
  const handlers = new Map<GridEventType, Set<GridEventHandler<any>>>();

  // Storage for wildcard handlers
  const wildcardHandlers = new Set<GridEventWildcardHandler>();

  // Logging configuration
  let loggingEnabled = options.logging ?? (typeof import.meta !== 'undefined' && import.meta.env?.DEV);
  const logger = options.logger ?? defaultLogger;

  /**
   * Default logger that logs to console in a readable format
   */
  function defaultLogger(event: GridEvent): void {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
    console.log(
      `%c[EventBus ${timestamp}]%c ${event.type}`,
      'color: #6366f1; font-weight: bold',
      'color: #059669; font-weight: bold',
      event.payload
    );
  }

  /**
   * Get or create the handler set for an event type
   */
  function getHandlerSet<T extends GridEventType>(type: T): Set<GridEventHandler<T>> {
    if (!handlers.has(type)) {
      handlers.set(type, new Set());
    }
    return handlers.get(type) as Set<GridEventHandler<T>>;
  }

  const bus: EventBus = {
    emit<T extends GridEvent>(event: T): void {
      // Log if enabled
      if (loggingEnabled) {
        logger(event);
      }

      // Get typed handlers for this event type
      const typeHandlers = handlers.get(event.type as GridEventType);
      if (typeHandlers) {
        // Create a copy to avoid issues if handler modifies subscriptions
        const handlersCopy = [...typeHandlers];
        for (const handler of handlersCopy) {
          try {
            handler(event.payload);
          } catch (error) {
            console.error(`[EventBus] Error in handler for ${event.type}:`, error);
          }
        }
      }

      // Call wildcard handlers
      const wildcardCopy = [...wildcardHandlers];
      for (const handler of wildcardCopy) {
        try {
          handler(event);
        } catch (error) {
          console.error(`[EventBus] Error in wildcard handler for ${event.type}:`, error);
        }
      }
    },

    on<T extends GridEventType>(type: T, handler: GridEventHandler<T>): Unsubscribe {
      const handlerSet = getHandlerSet(type);
      handlerSet.add(handler);

      // Return unsubscribe function
      return () => {
        handlerSet.delete(handler);
      };
    },

    onAll(handler: GridEventWildcardHandler): Unsubscribe {
      wildcardHandlers.add(handler);

      return () => {
        wildcardHandlers.delete(handler);
      };
    },

    off<T extends GridEventType>(type: T, handler: GridEventHandler<T>): void {
      const handlerSet = handlers.get(type);
      if (handlerSet) {
        handlerSet.delete(handler);
      }
    },

    clear(): void {
      handlers.clear();
      wildcardHandlers.clear();
    },

    subscriberCount(type?: GridEventType): number {
      if (type) {
        return handlers.get(type)?.size ?? 0;
      }
      // Total count across all types + wildcards
      let total = wildcardHandlers.size;
      for (const handlerSet of handlers.values()) {
        total += handlerSet.size;
      }
      return total;
    },

    setLogging(enabled: boolean): void {
      loggingEnabled = enabled;
    },
  };

  return bus;
}

/**
 * Type helper for creating events with proper typing
 *
 * @example
 * const event = createEvent('SHAPE_CREATED', { shapeId: '123', shape: {...} });
 * bus.emit(event);
 */
export function createEvent<T extends GridEventType>(
  type: T,
  payload: GridEventPayload<T>
): Extract<GridEvent, { type: T }> {
  return { type, payload } as Extract<GridEvent, { type: T }>;
}
