/**
 * Events Module - Central pub/sub system for grid events
 *
 * @example
 * import { createEventBus, createEvent } from './events';
 * import type { GridEvent, GridEventType } from './events';
 *
 * const bus = createEventBus();
 * bus.on('SHAPE_CREATED', (payload) => console.log(payload));
 * bus.emit(createEvent('SHAPE_CREATED', { shapeId: '123', shape: {...} }));
 */

// EventBus
export { createEventBus, createEvent } from './EventBus';
export type { EventBus, EventBusOptions, Unsubscribe } from './EventBus';

// Event types
export type {
  // Union type
  GridEvent,
  GridEventType,
  GridEventPayload,
  GridEventHandler,
  GridEventWildcardHandler,

  // Shape events
  ShapeCreatedEvent,
  ShapeUpdatedEvent,
  ShapeMovedEvent,
  ShapeResizedEvent,
  ShapeDeletedEvent,
  ShapeChildAddedEvent,
  ShapeChildRemovedEvent,
  RootShapeChangedEvent,

  // Layer events
  LayerCreatedEvent,
  LayerUpdatedEvent,
  LayerDeletedEvent,
  LayerLockedEvent,
  LayerUnlockedEvent,
  CurrentLayerChangedEvent,
  LayerShapeAddedEvent,
  LayerShapeRemovedEvent,

  // Area events (legacy)
  AreaCreatedEvent,
  AreaUpdatedEvent,
  AreaDeletedEvent,
  RootAreaChangedEvent,

  // Selection events
  SelectionChangedEvent,
  SelectionClearedEvent,

  // Viewport events
  ZoomChangedEvent,
  PanChangedEvent,
  ViewportChangedEvent,

  // Grid config events
  GridSizeChangedEvent,
  SnapEnabledChangedEvent,
  GridVisibleChangedEvent,
  GridConfigChangedEvent,

  // Action lock events
  ActionLockAcquiredEvent,
  ActionLockReleasedEvent,

  // Step events
  StepChangedEvent,
  SavedStateChangedEvent,

  // Store lifecycle events
  StoreDeserializedEvent,
  StoreClearedEvent,

  // User interaction events
  CanvasClickedEvent,
  ShapeDragStartedEvent,
  ShapeDragEndedEvent,
  WheelZoomEvent,
  PanStartedEvent,
  PanEndedEvent,

  // Flow request events
  CreateHomeAreaRequestedEvent,
  CreateChildAreaRequestedEvent,
  StepTransitionRequestedEvent,
  ShapeDeleteRequestedEvent,
  SaveRequestedEvent,
  LoadRequestedEvent,
  PanOrchestrationRequestedEvent,

  // Flow completion events
  HomeAreaCreatedEvent,
  ChildAreaCreatedEvent,
  StepTransitionCompletedEvent,
} from './types';
