/**
 * Grid Command Types
 *
 * Defines all commands (mutations) that can be dispatched in the grid system.
 * Commands are the ONLY way to modify state - they go through the store's dispatch() method.
 *
 * This follows Command/Query Responsibility Segregation (CQRS):
 * - Commands: Modify state (defined here)
 * - Queries: Read state (see QueryService)
 *
 * Naming convention: DOMAIN_ACTION (e.g., SHAPE_CREATE, LAYER_LOCK)
 *
 * Pattern:
 *   store.dispatch({ type: 'SHAPE_CREATE', payload: { ... } })
 *   → executes command handler
 *   → mutates state
 *   → emits event (SHAPE_CREATED)
 */

import type {
  ShapeState,
  ShapeStateUpdate,
  LayerState,
  LayerStateUpdate,
  AreaState,
  ViewportState,
  GridConfigState,
  ActionType,
  AreaType,
  SerializedGridState,
} from '../../types/state';

// ==================== Shape Commands ====================

export interface CreateShapeCommand {
  type: 'SHAPE_CREATE';
  payload: {
    shape: ShapeState;
  };
}

export interface UpdateShapeCommand {
  type: 'SHAPE_UPDATE';
  payload: {
    shapeId: string;
    updates: ShapeStateUpdate;
  };
}

export interface MoveShapeCommand {
  type: 'SHAPE_MOVE';
  payload: {
    shapeId: string;
    x: number;
    y: number;
  };
}

export interface ResizeShapeCommand {
  type: 'SHAPE_RESIZE';
  payload: {
    shapeId: string;
    width: number;
    height: number;
  };
}

export interface DeleteShapeCommand {
  type: 'SHAPE_DELETE';
  payload: {
    shapeId: string;
  };
}

export interface SetRootShapeCommand {
  type: 'SHAPE_SET_ROOT';
  payload: {
    shapeId: string | null;
  };
}

export interface AddChildShapeCommand {
  type: 'SHAPE_ADD_CHILD';
  payload: {
    parentId: string;
    childId: string;
  };
}

export interface RemoveChildShapeCommand {
  type: 'SHAPE_REMOVE_CHILD';
  payload: {
    parentId: string;
    childId: string;
  };
}

// ==================== Layer Commands ====================

export interface CreateLayerCommand {
  type: 'LAYER_CREATE';
  payload: {
    layer: LayerState;
  };
}

export interface UpdateLayerCommand {
  type: 'LAYER_UPDATE';
  payload: {
    layerId: string;
    updates: LayerStateUpdate;
  };
}

export interface DeleteLayerCommand {
  type: 'LAYER_DELETE';
  payload: {
    layerId: string;
  };
}

export interface SetCurrentLayerCommand {
  type: 'LAYER_SET_CURRENT';
  payload: {
    layerId: string | null;
  };
}

export interface AddShapeToLayerCommand {
  type: 'LAYER_ADD_SHAPE';
  payload: {
    layerId: string;
    shapeId: string;
    isPrimary?: boolean;
  };
}

export interface RemoveShapeFromLayerCommand {
  type: 'LAYER_REMOVE_SHAPE';
  payload: {
    layerId: string;
    shapeId: string;
  };
}

export interface LockLayerCommand {
  type: 'LAYER_LOCK';
  payload: {
    layerId: string;
  };
}

export interface UnlockLayerCommand {
  type: 'LAYER_UNLOCK';
  payload: {
    layerId: string;
  };
}

// ==================== Area Commands (Legacy) ====================

export interface CreateAreaCommand {
  type: 'AREA_CREATE';
  payload: {
    area: AreaState;
  };
}

export interface UpdateAreaCommand {
  type: 'AREA_UPDATE';
  payload: {
    areaId: string;
    updates: Partial<Omit<AreaState, 'id'>>;
  };
}

export interface DeleteAreaCommand {
  type: 'AREA_DELETE';
  payload: {
    areaId: string;
  };
}

export interface SetRootAreaCommand {
  type: 'AREA_SET_ROOT';
  payload: {
    areaId: string | null;
  };
}

// ==================== Selection Commands ====================

export interface SelectCommand {
  type: 'SELECTION_SELECT';
  payload: {
    shapeId: string;
    layerId: string;
    isParent?: boolean;
  };
}

export interface DeselectCommand {
  type: 'SELECTION_DESELECT';
  payload: Record<string, never>; // Empty object
}

// ==================== Step Commands ====================

export interface SetCurrentStepCommand {
  type: 'STEP_SET_CURRENT';
  payload: {
    step: number;
  };
}

export interface SetSavedStateCommand {
  type: 'STEP_SET_SAVED';
  payload: {
    isSaved: boolean;
  };
}

// ==================== Viewport Commands ====================

export interface SetZoomCommand {
  type: 'VIEWPORT_SET_ZOOM';
  payload: {
    zoom: number;
  };
}

export interface SetPanCommand {
  type: 'VIEWPORT_SET_PAN';
  payload: {
    pan: { x: number; y: number };
  };
}

export interface SetViewportCommand {
  type: 'VIEWPORT_SET';
  payload: {
    viewport: Partial<ViewportState>;
  };
}

// ==================== Grid Config Commands ====================

export interface SetGridSizeCommand {
  type: 'GRID_CONFIG_SET_SIZE';
  payload: {
    gridSize: number;
  };
}

export interface SetSnapEnabledCommand {
  type: 'GRID_CONFIG_SET_SNAP';
  payload: {
    snapEnabled: boolean;
  };
}

export interface SetGridVisibleCommand {
  type: 'GRID_CONFIG_SET_VISIBLE';
  payload: {
    gridVisible: boolean;
  };
}

export interface SetGridConfigCommand {
  type: 'GRID_CONFIG_SET';
  payload: {
    config: Partial<GridConfigState>;
  };
}

// ==================== Action Lock Commands ====================

export interface AcquireActionLockCommand {
  type: 'ACTION_LOCK_ACQUIRE';
  payload: {
    action: ActionType;
    lockerId: string;
  };
}

export interface ReleaseActionLockCommand {
  type: 'ACTION_LOCK_RELEASE';
  payload: {
    lockerId: string;
  };
}

export interface ForceReleaseActionLockCommand {
  type: 'ACTION_LOCK_FORCE_RELEASE';
  payload: Record<string, never>; // Empty object
}

// ==================== Store Lifecycle Commands ====================

export interface DeserializeStoreCommand {
  type: 'STORE_DESERIALIZE';
  payload: {
    data: SerializedGridState;
  };
}

export interface ClearStoreCommand {
  type: 'STORE_CLEAR';
  payload: Record<string, never>; // Empty object
}

// ==================== Union Type ====================

/**
 * All possible grid commands - discriminated union
 */
export type GridCommand =
  // Shape commands
  | CreateShapeCommand
  | UpdateShapeCommand
  | MoveShapeCommand
  | ResizeShapeCommand
  | DeleteShapeCommand
  | SetRootShapeCommand
  | AddChildShapeCommand
  | RemoveChildShapeCommand
  // Layer commands
  | CreateLayerCommand
  | UpdateLayerCommand
  | DeleteLayerCommand
  | SetCurrentLayerCommand
  | AddShapeToLayerCommand
  | RemoveShapeFromLayerCommand
  | LockLayerCommand
  | UnlockLayerCommand
  // Area commands (legacy)
  | CreateAreaCommand
  | UpdateAreaCommand
  | DeleteAreaCommand
  | SetRootAreaCommand
  // Selection commands
  | SelectCommand
  | DeselectCommand
  // Step commands
  | SetCurrentStepCommand
  | SetSavedStateCommand
  // Viewport commands
  | SetZoomCommand
  | SetPanCommand
  | SetViewportCommand
  // Grid config commands
  | SetGridSizeCommand
  | SetSnapEnabledCommand
  | SetGridVisibleCommand
  | SetGridConfigCommand
  // Action lock commands
  | AcquireActionLockCommand
  | ReleaseActionLockCommand
  | ForceReleaseActionLockCommand
  // Store lifecycle commands
  | DeserializeStoreCommand
  | ClearStoreCommand;

/**
 * Extract command type string union
 */
export type GridCommandType = GridCommand['type'];

/**
 * Extract payload type for a specific command type
 */
export type GridCommandPayload<T extends GridCommandType> = Extract<GridCommand, { type: T }>['payload'];

/**
 * Command result - returned by dispatch()
 * Commands that need to return values (like acquireActionLock) use this
 */
export interface CommandResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Command handler function type
 */
export type CommandHandler<T extends GridCommandType> = (
  payload: GridCommandPayload<T>
) => CommandResult<unknown> | void;
