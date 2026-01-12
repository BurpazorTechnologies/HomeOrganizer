/**
 * State Types - Canonical state type definitions
 *
 * This is the SINGLE SOURCE OF TRUTH for all state types in the grid system.
 * All managers and stores should import types from here.
 *
 * @example
 * import type { ShapeState, LayerState, GridState } from '../types/state';
 */

// Shape types
export type { ShapeState, ShapeStateUpdate, ShapeType, AreaType } from './ShapeState';

// Layer types
export type { LayerState, LayerStateUpdate } from './LayerState';

// Area types (legacy - being migrated)
export type { AreaState, AreaStateUpdate } from './AreaState';

// Selection types
export type { SelectionState } from './SelectionState';
export { DEFAULT_SELECTION_STATE } from './SelectionState';

// Viewport types
export type { ViewportState, PanPosition } from './ViewportState';
export { DEFAULT_VIEWPORT_STATE } from './ViewportState';

// Grid config types
export type { GridConfigState } from './GridConfigState';
export { DEFAULT_GRID_CONFIG_STATE } from './GridConfigState';

// Action lock types
export type { ActionLockState, ActionType } from './ActionLockState';
export { DEFAULT_ACTION_LOCK_STATE } from './ActionLockState';

// Complete state types
export type { GridState, SerializedGridState } from './GridState';
export { GRID_STATE_VERSION } from './GridState';
