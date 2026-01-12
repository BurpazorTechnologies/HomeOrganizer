/**
 * Queries Module - Public Exports
 *
 * Exports query types and the QueryService for the grid system.
 *
 * Usage:
 *   import { createQueryService, GridQuery, QueryResult } from '@/Components/Grid/core/queries';
 *
 *   const queryService = createQueryService(store);
 *   const shape = queryService.query({ type: 'GET_SHAPE', payload: { shapeId: '123' } });
 */

// Export QueryService
export { createQueryService } from './QueryService';
export type { QueryService } from './QueryService';

// Export all query types
export type {
  // Union types
  GridQuery,
  GridQueryType,
  GridQueryPayload,
  QueryResult,
  QueryResultMap,
  // Shape queries
  GetShapeQuery,
  GetShapeBoundsQuery,
  GetChildShapesQuery,
  GetParentShapeQuery,
  GetParentBoundsQuery,
  GetRootShapeQuery,
  GetAreaShapesQuery,
  GetShapesByAreaTypeQuery,
  GetAllShapesQuery,
  // Layer queries
  GetLayerQuery,
  GetCurrentLayerQuery,
  GetAllLayersQuery,
  IsLayerLockedQuery,
  GetLockedLayerIdsQuery,
  // Area queries (legacy)
  GetAreaQuery,
  GetAreaByShapeIdQuery,
  GetRootAreaQuery,
  GetAllAreasQuery,
  // Selection queries
  GetSelectionQuery,
  GetSelectedShapeQuery,
  IsShapeSelectedQuery,
  // Viewport queries
  GetViewportQuery,
  GetZoomQuery,
  GetPanQuery,
  // Grid config queries
  GetGridConfigQuery,
  GetGridSizeQuery,
  IsSnapEnabledQuery,
  IsGridVisibleQuery,
  // Action lock queries
  GetActionLockQuery,
  GetCurrentActionQuery,
  IsActionAllowedQuery,
  // Step queries
  GetCurrentStepQuery,
  IsSavedQuery,
  // Serialization queries
  SerializeQuery,
} from './types';
