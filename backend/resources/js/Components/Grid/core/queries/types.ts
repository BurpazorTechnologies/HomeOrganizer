/**
 * Grid Query Types
 *
 * Defines all queries (read operations) in the grid system.
 * Queries are pure functions that read state without side effects.
 *
 * This follows Command/Query Responsibility Segregation (CQRS):
 * - Commands: Modify state (see commands/)
 * - Queries: Read state (defined here)
 *
 * Naming convention: GET_DOMAIN or DOMAIN_QUERY (e.g., GET_SHAPE, GET_PARENT_BOUNDS)
 *
 * Pattern:
 *   queryService.query({ type: 'GET_SHAPE', payload: { shapeId: '123' } })
 *   → returns shape or undefined
 */

import type {
  ShapeState,
  LayerState,
  AreaState,
  SelectionState,
  ViewportState,
  GridConfigState,
  ActionLockState,
  AreaType,
  SerializedGridState,
} from '../../types/state';
import type { Bounds } from '../utils/bounds';

// ==================== Shape Queries ====================

export interface GetShapeQuery {
  type: 'GET_SHAPE';
  payload: {
    shapeId: string;
  };
}

export interface GetShapeBoundsQuery {
  type: 'GET_SHAPE_BOUNDS';
  payload: {
    shapeId: string;
  };
}

export interface GetChildShapesQuery {
  type: 'GET_CHILD_SHAPES';
  payload: {
    parentShapeId: string;
  };
}

export interface GetParentShapeQuery {
  type: 'GET_PARENT_SHAPE';
  payload: {
    childShapeId: string;
  };
}

export interface GetParentBoundsQuery {
  type: 'GET_PARENT_BOUNDS';
  payload: {
    childShapeId: string;
  };
}

export interface GetRootShapeQuery {
  type: 'GET_ROOT_SHAPE';
  payload: Record<string, never>; // Empty
}

export interface GetAreaShapesQuery {
  type: 'GET_AREA_SHAPES';
  payload: Record<string, never>; // Empty - gets all shapes with areaType set
}

export interface GetShapesByAreaTypeQuery {
  type: 'GET_SHAPES_BY_AREA_TYPE';
  payload: {
    areaType: AreaType;
  };
}

export interface GetAllShapesQuery {
  type: 'GET_ALL_SHAPES';
  payload: Record<string, never>; // Empty
}

// ==================== Layer Queries ====================

export interface GetLayerQuery {
  type: 'GET_LAYER';
  payload: {
    layerId: string;
  };
}

export interface GetCurrentLayerQuery {
  type: 'GET_CURRENT_LAYER';
  payload: Record<string, never>; // Empty
}

export interface GetAllLayersQuery {
  type: 'GET_ALL_LAYERS';
  payload: Record<string, never>; // Empty
}

export interface IsLayerLockedQuery {
  type: 'IS_LAYER_LOCKED';
  payload: {
    layerId: string;
  };
}

export interface GetLockedLayerIdsQuery {
  type: 'GET_LOCKED_LAYER_IDS';
  payload: Record<string, never>; // Empty
}

// ==================== Area Queries (Legacy) ====================

export interface GetAreaQuery {
  type: 'GET_AREA';
  payload: {
    areaId: string;
  };
}

export interface GetAreaByShapeIdQuery {
  type: 'GET_AREA_BY_SHAPE_ID';
  payload: {
    shapeId: string;
  };
}

export interface GetRootAreaQuery {
  type: 'GET_ROOT_AREA';
  payload: Record<string, never>; // Empty
}

export interface GetAllAreasQuery {
  type: 'GET_ALL_AREAS';
  payload: Record<string, never>; // Empty
}

// ==================== Selection Queries ====================

export interface GetSelectionQuery {
  type: 'GET_SELECTION';
  payload: Record<string, never>; // Empty
}

export interface GetSelectedShapeQuery {
  type: 'GET_SELECTED_SHAPE';
  payload: Record<string, never>; // Empty
}

export interface IsShapeSelectedQuery {
  type: 'IS_SHAPE_SELECTED';
  payload: {
    shapeId: string;
  };
}

// ==================== Viewport Queries ====================

export interface GetViewportQuery {
  type: 'GET_VIEWPORT';
  payload: Record<string, never>; // Empty
}

export interface GetZoomQuery {
  type: 'GET_ZOOM';
  payload: Record<string, never>; // Empty
}

export interface GetPanQuery {
  type: 'GET_PAN';
  payload: Record<string, never>; // Empty
}

// ==================== Grid Config Queries ====================

export interface GetGridConfigQuery {
  type: 'GET_GRID_CONFIG';
  payload: Record<string, never>; // Empty
}

export interface GetGridSizeQuery {
  type: 'GET_GRID_SIZE';
  payload: Record<string, never>; // Empty
}

export interface IsSnapEnabledQuery {
  type: 'IS_SNAP_ENABLED';
  payload: Record<string, never>; // Empty
}

export interface IsGridVisibleQuery {
  type: 'IS_GRID_VISIBLE';
  payload: Record<string, never>; // Empty
}

// ==================== Action Lock Queries ====================

export interface GetActionLockQuery {
  type: 'GET_ACTION_LOCK';
  payload: Record<string, never>; // Empty
}

export interface GetCurrentActionQuery {
  type: 'GET_CURRENT_ACTION';
  payload: Record<string, never>; // Empty
}

export interface IsActionAllowedQuery {
  type: 'IS_ACTION_ALLOWED';
  payload: {
    action: string;
  };
}

// ==================== Step Queries ====================

export interface GetCurrentStepQuery {
  type: 'GET_CURRENT_STEP';
  payload: Record<string, never>; // Empty
}

export interface IsSavedQuery {
  type: 'IS_SAVED';
  payload: Record<string, never>; // Empty
}

// ==================== Serialization Queries ====================

export interface SerializeQuery {
  type: 'SERIALIZE';
  payload: Record<string, never>; // Empty
}

// ==================== Union Type ====================

/**
 * All possible grid queries - discriminated union
 */
export type GridQuery =
  // Shape queries
  | GetShapeQuery
  | GetShapeBoundsQuery
  | GetChildShapesQuery
  | GetParentShapeQuery
  | GetParentBoundsQuery
  | GetRootShapeQuery
  | GetAreaShapesQuery
  | GetShapesByAreaTypeQuery
  | GetAllShapesQuery
  // Layer queries
  | GetLayerQuery
  | GetCurrentLayerQuery
  | GetAllLayersQuery
  | IsLayerLockedQuery
  | GetLockedLayerIdsQuery
  // Area queries (legacy)
  | GetAreaQuery
  | GetAreaByShapeIdQuery
  | GetRootAreaQuery
  | GetAllAreasQuery
  // Selection queries
  | GetSelectionQuery
  | GetSelectedShapeQuery
  | IsShapeSelectedQuery
  // Viewport queries
  | GetViewportQuery
  | GetZoomQuery
  | GetPanQuery
  // Grid config queries
  | GetGridConfigQuery
  | GetGridSizeQuery
  | IsSnapEnabledQuery
  | IsGridVisibleQuery
  // Action lock queries
  | GetActionLockQuery
  | GetCurrentActionQuery
  | IsActionAllowedQuery
  // Step queries
  | GetCurrentStepQuery
  | IsSavedQuery
  // Serialization queries
  | SerializeQuery;

/**
 * Extract query type string union
 */
export type GridQueryType = GridQuery['type'];

/**
 * Extract payload type for a specific query type
 */
export type GridQueryPayload<T extends GridQueryType> = Extract<GridQuery, { type: T }>['payload'];

// ==================== Query Result Types ====================

/**
 * Maps query types to their result types
 */
export interface QueryResultMap {
  // Shape queries
  GET_SHAPE: ShapeState | undefined;
  GET_SHAPE_BOUNDS: Bounds | null;
  GET_CHILD_SHAPES: ShapeState[];
  GET_PARENT_SHAPE: ShapeState | undefined;
  GET_PARENT_BOUNDS: Bounds | null;
  GET_ROOT_SHAPE: ShapeState | undefined;
  GET_AREA_SHAPES: ShapeState[];
  GET_SHAPES_BY_AREA_TYPE: ShapeState[];
  GET_ALL_SHAPES: ShapeState[];
  // Layer queries
  GET_LAYER: LayerState | undefined;
  GET_CURRENT_LAYER: LayerState | undefined;
  GET_ALL_LAYERS: LayerState[];
  IS_LAYER_LOCKED: boolean;
  GET_LOCKED_LAYER_IDS: string[];
  // Area queries (legacy)
  GET_AREA: AreaState | undefined;
  GET_AREA_BY_SHAPE_ID: AreaState | undefined;
  GET_ROOT_AREA: AreaState | undefined;
  GET_ALL_AREAS: AreaState[];
  // Selection queries
  GET_SELECTION: SelectionState;
  GET_SELECTED_SHAPE: ShapeState | undefined;
  IS_SHAPE_SELECTED: boolean;
  // Viewport queries
  GET_VIEWPORT: ViewportState;
  GET_ZOOM: number;
  GET_PAN: { x: number; y: number };
  // Grid config queries
  GET_GRID_CONFIG: GridConfigState;
  GET_GRID_SIZE: number;
  IS_SNAP_ENABLED: boolean;
  IS_GRID_VISIBLE: boolean;
  // Action lock queries
  GET_ACTION_LOCK: ActionLockState;
  GET_CURRENT_ACTION: string;
  IS_ACTION_ALLOWED: boolean;
  // Step queries
  GET_CURRENT_STEP: number;
  IS_SAVED: boolean;
  // Serialization queries
  SERIALIZE: SerializedGridState;
}

/**
 * Get the result type for a specific query type
 */
export type QueryResult<T extends GridQueryType> = QueryResultMap[T];
