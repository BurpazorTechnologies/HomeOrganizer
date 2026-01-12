/**
 * Grid Event Types
 *
 * Defines all events that can be emitted in the grid system.
 * Events are immutable and typed - managers emit events, others subscribe.
 *
 * Naming convention: DOMAIN_ACTION (e.g., SHAPE_CREATED, ZOOM_CHANGED)
 */

import type {
  ShapeState,
  LayerState,
  AreaState,
  SelectionState,
  ViewportState,
  GridConfigState,
  ActionType,
  AreaType,
} from '../../types/state';

// ==================== Shape Events ====================

export interface ShapeCreatedEvent {
  type: 'SHAPE_CREATED';
  payload: {
    shapeId: string;
    shape: ShapeState;
  };
}

export interface ShapeUpdatedEvent {
  type: 'SHAPE_UPDATED';
  payload: {
    shapeId: string;
    updates: Partial<ShapeState>;
    previousState: ShapeState;
  };
}

export interface ShapeMovedEvent {
  type: 'SHAPE_MOVED';
  payload: {
    shapeId: string;
    position: { x: number; y: number };
    previousPosition: { x: number; y: number };
  };
}

export interface ShapeResizedEvent {
  type: 'SHAPE_RESIZED';
  payload: {
    shapeId: string;
    dimensions: { width: number; height: number };
    previousDimensions: { width: number; height: number };
  };
}

export interface ShapeDeletedEvent {
  type: 'SHAPE_DELETED';
  payload: {
    shapeId: string;
    shape: ShapeState;
  };
}

export interface ShapeChildAddedEvent {
  type: 'SHAPE_CHILD_ADDED';
  payload: {
    parentId: string;
    childId: string;
  };
}

export interface ShapeChildRemovedEvent {
  type: 'SHAPE_CHILD_REMOVED';
  payload: {
    parentId: string;
    childId: string;
  };
}

export interface RootShapeChangedEvent {
  type: 'ROOT_SHAPE_CHANGED';
  payload: {
    rootShapeId: string | null;
    previousRootShapeId: string | null;
  };
}

// ==================== Layer Events ====================

export interface LayerCreatedEvent {
  type: 'LAYER_CREATED';
  payload: {
    layerId: string;
    layer: LayerState;
  };
}

export interface LayerUpdatedEvent {
  type: 'LAYER_UPDATED';
  payload: {
    layerId: string;
    updates: Partial<LayerState>;
    previousState: LayerState;
  };
}

export interface LayerDeletedEvent {
  type: 'LAYER_DELETED';
  payload: {
    layerId: string;
    layer: LayerState;
  };
}

export interface LayerLockedEvent {
  type: 'LAYER_LOCKED';
  payload: {
    layerId: string;
  };
}

export interface LayerUnlockedEvent {
  type: 'LAYER_UNLOCKED';
  payload: {
    layerId: string;
  };
}

export interface CurrentLayerChangedEvent {
  type: 'CURRENT_LAYER_CHANGED';
  payload: {
    layerId: string | null;
    previousLayerId: string | null;
  };
}

export interface LayerShapeAddedEvent {
  type: 'LAYER_SHAPE_ADDED';
  payload: {
    layerId: string;
    shapeId: string;
    isPrimary: boolean;
  };
}

export interface LayerShapeRemovedEvent {
  type: 'LAYER_SHAPE_REMOVED';
  payload: {
    layerId: string;
    shapeId: string;
  };
}

// ==================== Area Events (Legacy) ====================

export interface AreaCreatedEvent {
  type: 'AREA_CREATED';
  payload: {
    areaId: string;
    area: AreaState;
  };
}

export interface AreaUpdatedEvent {
  type: 'AREA_UPDATED';
  payload: {
    areaId: string;
    updates: Partial<AreaState>;
    previousState: AreaState;
  };
}

export interface AreaDeletedEvent {
  type: 'AREA_DELETED';
  payload: {
    areaId: string;
    area: AreaState;
  };
}

export interface RootAreaChangedEvent {
  type: 'ROOT_AREA_CHANGED';
  payload: {
    rootAreaId: string | null;
    previousRootAreaId: string | null;
  };
}

// ==================== Selection Events ====================

export interface SelectionChangedEvent {
  type: 'SELECTION_CHANGED';
  payload: {
    selection: SelectionState;
    previousSelection: SelectionState;
  };
}

export interface SelectionClearedEvent {
  type: 'SELECTION_CLEARED';
  payload: {
    previousSelection: SelectionState;
  };
}

// ==================== Viewport Events ====================

export interface ZoomChangedEvent {
  type: 'ZOOM_CHANGED';
  payload: {
    zoom: number;
    previousZoom: number;
  };
}

export interface PanChangedEvent {
  type: 'PAN_CHANGED';
  payload: {
    pan: { x: number; y: number };
    previousPan: { x: number; y: number };
  };
}

export interface ViewportChangedEvent {
  type: 'VIEWPORT_CHANGED';
  payload: {
    viewport: ViewportState;
    previousViewport: ViewportState;
  };
}

// ==================== Grid Config Events ====================

export interface GridSizeChangedEvent {
  type: 'GRID_SIZE_CHANGED';
  payload: {
    gridSize: number;
    previousGridSize: number;
  };
}

export interface SnapEnabledChangedEvent {
  type: 'SNAP_ENABLED_CHANGED';
  payload: {
    snapEnabled: boolean;
    previousSnapEnabled: boolean;
  };
}

export interface GridVisibleChangedEvent {
  type: 'GRID_VISIBLE_CHANGED';
  payload: {
    gridVisible: boolean;
    previousGridVisible: boolean;
  };
}

export interface GridConfigChangedEvent {
  type: 'GRID_CONFIG_CHANGED';
  payload: {
    config: GridConfigState;
    previousConfig: GridConfigState;
  };
}

// ==================== Action Lock Events ====================

export interface ActionLockAcquiredEvent {
  type: 'ACTION_LOCK_ACQUIRED';
  payload: {
    action: ActionType;
    lockerId: string;
  };
}

export interface ActionLockReleasedEvent {
  type: 'ACTION_LOCK_RELEASED';
  payload: {
    action: ActionType;
    lockerId: string;
  };
}

// ==================== Step Events ====================

export interface StepChangedEvent {
  type: 'STEP_CHANGED';
  payload: {
    step: number;
    previousStep: number;
  };
}

export interface SavedStateChangedEvent {
  type: 'SAVED_STATE_CHANGED';
  payload: {
    isSaved: boolean;
    previousIsSaved: boolean;
  };
}

// ==================== Store Lifecycle Events ====================

export interface StoreDeserializedEvent {
  type: 'STORE_DESERIALIZED';
  payload: {
    shapesCount: number;
    layersCount: number;
    areasCount: number;
  };
}

export interface StoreClearedEvent {
  type: 'STORE_CLEARED';
  payload: {
    previousShapesCount: number;
    previousLayersCount: number;
    previousAreasCount: number;
  };
}

// ==================== User Interaction Events ====================
// These are emitted by EventManager, not the store

export interface CanvasClickedEvent {
  type: 'CANVAS_CLICKED';
  payload: {
    position: { x: number; y: number };
    worldPosition: { x: number; y: number };
    target: 'canvas' | 'shape' | 'other';
    shapeId?: string;
  };
}

export interface ShapeDragStartedEvent {
  type: 'SHAPE_DRAG_STARTED';
  payload: {
    shapeId: string;
    position: { x: number; y: number };
  };
}

export interface ShapeDragEndedEvent {
  type: 'SHAPE_DRAG_ENDED';
  payload: {
    shapeId: string;
    position: { x: number; y: number };
    previousPosition: { x: number; y: number };
  };
}

export interface WheelZoomEvent {
  type: 'WHEEL_ZOOM';
  payload: {
    delta: number;
    position: { x: number; y: number };
  };
}

export interface PanStartedEvent {
  type: 'PAN_STARTED';
  payload: {
    position: { x: number; y: number };
  };
}

export interface PanEndedEvent {
  type: 'PAN_ENDED';
  payload: {
    pan: { x: number; y: number };
  };
}

// ==================== Flow Request Events ====================
// These events are emitted to request flows to perform actions
// They are "intent" events - requesting that something happen

export interface CreateHomeAreaRequestedEvent {
  type: 'CREATE_HOME_AREA_REQUESTED';
  payload: {
    position: { x: number; y: number };
    layerId: string;
    defaults?: {
      width?: number;
      height?: number;
      label?: string;
      fill?: string;
      stroke?: string;
    };
  };
}

export interface CreateChildAreaRequestedEvent {
  type: 'CREATE_CHILD_AREA_REQUESTED';
  payload: {
    parentShapeId: string;
    position: { x: number; y: number };
    layerId: string;
    defaults?: {
      width?: number;
      height?: number;
      label?: string;
      fill?: string;
      stroke?: string;
    };
  };
}

export interface StepTransitionRequestedEvent {
  type: 'STEP_TRANSITION_REQUESTED';
  payload: {
    fromStep: number;
    toStep: number;
    parentShapeId?: string; // Required when transitioning to child step
  };
}

export interface ShapeDeleteRequestedEvent {
  type: 'SHAPE_DELETE_REQUESTED';
  payload: {
    shapeId: string;
    layerId: string;
  };
}

export interface SaveRequestedEvent {
  type: 'SAVE_REQUESTED';
  payload: {
    step: number;
    layerId: string;
  };
}

export interface LoadRequestedEvent {
  type: 'LOAD_REQUESTED';
  payload: {
    step: number;
    layerId?: string;
    parentAreaId?: string;
  };
}

export interface PanOrchestrationRequestedEvent {
  type: 'PAN_ORCHESTRATION_REQUESTED';
  payload: {
    type: 'pan_end' | 'pan_mode_exit';
    panPosition: { x: number; y: number };
    stayInPanMode?: boolean;
  };
}

// ==================== Flow Completion Events ====================
// Emitted when flows complete their work

export interface HomeAreaCreatedEvent {
  type: 'HOME_AREA_CREATED';
  payload: {
    shapeId: string;
    layerId: string;
  };
}

export interface ChildAreaCreatedEvent {
  type: 'CHILD_AREA_CREATED';
  payload: {
    shapeId: string;
    parentShapeId: string;
    layerId: string;
  };
}

export interface StepTransitionCompletedEvent {
  type: 'STEP_TRANSITION_COMPLETED';
  payload: {
    fromStep: number;
    toStep: number;
    layerId: string;
  };
}

// ==================== Transform Events ====================

export interface ShapeTransformEndedEvent {
  type: 'SHAPE_TRANSFORM_ENDED';
  payload: {
    shapeId: string;
    dimensions: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
}

// ==================== Persistence Events ====================

export interface DataChangedEvent {
  type: 'DATA_CHANGED';
  payload: {
    source: 'save' | 'load' | 'clear';
  };
}

// ==================== Step Info Events ====================

/**
 * Payload for STEP_INFO_CHANGED events
 * Note: Using inline type instead of importing StepInfo to avoid circular dependencies
 */
export interface StepInfoChangedEvent {
  type: 'STEP_INFO_CHANGED';
  payload: {
    stepInfo: {
      step: { id: string; order: number };
      description: string;
      actions: any[];
      selectedShapeId?: string | null;
      pendingAreaName?: { areaId: string; shapeId: string } | null;
      selectedShapeName?: string | null;
      parentAreaId?: string | null;
    };
  };
}

// ==================== Union Type ====================

/**
 * All possible grid events - discriminated union
 */
export type GridEvent =
  // Shape events
  | ShapeCreatedEvent
  | ShapeUpdatedEvent
  | ShapeMovedEvent
  | ShapeResizedEvent
  | ShapeDeletedEvent
  | ShapeChildAddedEvent
  | ShapeChildRemovedEvent
  | RootShapeChangedEvent
  // Layer events
  | LayerCreatedEvent
  | LayerUpdatedEvent
  | LayerDeletedEvent
  | LayerLockedEvent
  | LayerUnlockedEvent
  | CurrentLayerChangedEvent
  | LayerShapeAddedEvent
  | LayerShapeRemovedEvent
  // Area events (legacy)
  | AreaCreatedEvent
  | AreaUpdatedEvent
  | AreaDeletedEvent
  | RootAreaChangedEvent
  // Selection events
  | SelectionChangedEvent
  | SelectionClearedEvent
  // Viewport events
  | ZoomChangedEvent
  | PanChangedEvent
  | ViewportChangedEvent
  // Grid config events
  | GridSizeChangedEvent
  | SnapEnabledChangedEvent
  | GridVisibleChangedEvent
  | GridConfigChangedEvent
  // Action lock events
  | ActionLockAcquiredEvent
  | ActionLockReleasedEvent
  // Step events
  | StepChangedEvent
  | SavedStateChangedEvent
  // Store lifecycle events
  | StoreDeserializedEvent
  | StoreClearedEvent
  // User interaction events
  | CanvasClickedEvent
  | ShapeDragStartedEvent
  | ShapeDragEndedEvent
  | WheelZoomEvent
  | PanStartedEvent
  | PanEndedEvent
  // Flow request events
  | CreateHomeAreaRequestedEvent
  | CreateChildAreaRequestedEvent
  | StepTransitionRequestedEvent
  | ShapeDeleteRequestedEvent
  | SaveRequestedEvent
  | LoadRequestedEvent
  | PanOrchestrationRequestedEvent
  // Flow completion events
  | HomeAreaCreatedEvent
  | ChildAreaCreatedEvent
  | StepTransitionCompletedEvent
  // Transform events
  | ShapeTransformEndedEvent
  // Persistence events
  | DataChangedEvent
  // Step info events
  | StepInfoChangedEvent;

/**
 * Extract event type string union
 */
export type GridEventType = GridEvent['type'];

/**
 * Extract payload type for a specific event type
 */
export type GridEventPayload<T extends GridEventType> = Extract<GridEvent, { type: T }>['payload'];

/**
 * Event handler function type
 */
export type GridEventHandler<T extends GridEventType> = (payload: GridEventPayload<T>) => void;

/**
 * Wildcard handler that receives all events
 */
export type GridEventWildcardHandler = (event: GridEvent) => void;
