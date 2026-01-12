/**
 * QueryService
 *
 * Pure read-only service for querying grid state.
 * Implements all query types defined in types.ts.
 *
 * This follows Command/Query Responsibility Segregation (CQRS):
 * - Commands: Modify state (handled by store.dispatch())
 * - Queries: Read state (handled by QueryService)
 *
 * Usage:
 *   const queryService = createQueryService(store);
 *   const shape = queryService.query({ type: 'GET_SHAPE', payload: { shapeId: '123' } });
 *   const bounds = queryService.query({ type: 'GET_PARENT_BOUNDS', payload: { childShapeId: '456' } });
 */

import type { GridStateStore } from '../state/GridStateStore';
import type {
  GridQuery,
  GridQueryType,
  QueryResult,
  QueryResultMap,
} from './types';

/**
 * QueryService interface
 */
export interface QueryService {
  /**
   * Execute a query and return the result.
   * Type-safe: return type is inferred from query type.
   */
  query<T extends GridQueryType>(query: Extract<GridQuery, { type: T }>): QueryResultMap[T];
}

/**
 * Create a QueryService instance bound to a store.
 */
export function createQueryService(store: GridStateStore): QueryService {
  return {
    query<T extends GridQueryType>(query: Extract<GridQuery, { type: T }>): QueryResultMap[T] {
      return executeQuery(query, store) as QueryResultMap[T];
    },
  };
}

/**
 * Execute a query against the store.
 * Routes to appropriate handler based on query type.
 */
function executeQuery(query: GridQuery, store: GridStateStore): unknown {
  switch (query.type) {
    // ==================== Shape Queries ====================
    case 'GET_SHAPE':
      return store.getShape(query.payload.shapeId);

    case 'GET_SHAPE_BOUNDS':
      return store.getShapeBounds(query.payload.shapeId);

    case 'GET_CHILD_SHAPES':
      return store.getChildShapes(query.payload.parentShapeId);

    case 'GET_PARENT_SHAPE':
      return store.getParentShape(query.payload.childShapeId);

    case 'GET_PARENT_BOUNDS':
      return store.getParentBounds(query.payload.childShapeId);

    case 'GET_ROOT_SHAPE': {
      const rootId = store.getRootShapeId();
      return rootId ? store.getShape(rootId) : undefined;
    }

    case 'GET_AREA_SHAPES':
      return store.getAreaShapes();

    case 'GET_SHAPES_BY_AREA_TYPE':
      return store.getShapesByAreaType(query.payload.areaType);

    case 'GET_ALL_SHAPES':
      return Array.from(store.state.shapes.values());

    // ==================== Layer Queries ====================
    case 'GET_LAYER':
      return store.getLayer(query.payload.layerId);

    case 'GET_CURRENT_LAYER': {
      const currentId = store.state.currentLayerId;
      return currentId ? store.getLayer(currentId) : undefined;
    }

    case 'GET_ALL_LAYERS':
      return Array.from(store.state.layers.values());

    case 'IS_LAYER_LOCKED':
      return store.isLayerLocked(query.payload.layerId);

    case 'GET_LOCKED_LAYER_IDS':
      return store.getLockedLayerIds();

    // ==================== Area Queries (Legacy) ====================
    case 'GET_AREA':
      return store.getArea(query.payload.areaId);

    case 'GET_AREA_BY_SHAPE_ID':
      return store.getAreaByShapeId(query.payload.shapeId);

    case 'GET_ROOT_AREA': {
      const rootAreaId = store.state.rootAreaId;
      return rootAreaId ? store.getArea(rootAreaId) : undefined;
    }

    case 'GET_ALL_AREAS':
      return Array.from(store.state.areas.values());

    // ==================== Selection Queries ====================
    case 'GET_SELECTION':
      return { ...store.state.selection };

    case 'GET_SELECTED_SHAPE':
      return store.getSelectedShape();

    case 'IS_SHAPE_SELECTED':
      return store.state.selection.selectedShapeId === query.payload.shapeId;

    // ==================== Viewport Queries ====================
    case 'GET_VIEWPORT':
      return store.getViewport();

    case 'GET_ZOOM':
      return store.state.viewport.zoom;

    case 'GET_PAN':
      return { ...store.state.viewport.pan };

    // ==================== Grid Config Queries ====================
    case 'GET_GRID_CONFIG':
      return store.getGridConfig();

    case 'GET_GRID_SIZE':
      return store.state.gridConfig.gridSize;

    case 'IS_SNAP_ENABLED':
      return store.state.gridConfig.snapEnabled;

    case 'IS_GRID_VISIBLE':
      return store.state.gridConfig.gridVisible;

    // ==================== Action Lock Queries ====================
    case 'GET_ACTION_LOCK':
      return store.getActionLock();

    case 'GET_CURRENT_ACTION':
      return store.getCurrentAction();

    case 'IS_ACTION_ALLOWED':
      return store.isActionAllowed(query.payload.action as any);

    // ==================== Step Queries ====================
    case 'GET_CURRENT_STEP':
      return store.state.currentStep;

    case 'IS_SAVED':
      return store.state.isSaved;

    // ==================== Serialization Queries ====================
    case 'SERIALIZE':
      return store.serialize();

    default: {
      // TypeScript exhaustiveness check
      const _exhaustiveCheck: never = query;
      throw new Error(`Unknown query type: ${(query as GridQuery).type}`);
    }
  }
}
