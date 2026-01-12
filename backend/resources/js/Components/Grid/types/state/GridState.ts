/**
 * GridState - Complete grid state type
 *
 * Single source of truth for the complete grid state.
 * Composes all individual state types into a unified structure.
 */

import type { ShapeState } from './ShapeState';
import type { LayerState } from './LayerState';
import type { AreaState } from './AreaState';
import type { SelectionState } from './SelectionState';
import type { ViewportState } from './ViewportState';
import type { GridConfigState } from './GridConfigState';
import type { ActionLockState } from './ActionLockState';

/**
 * Complete grid state - the root state object
 */
export interface GridState {
  /** All shapes indexed by ID */
  shapes: Map<string, ShapeState>;

  /** All layers indexed by ID */
  layers: Map<string, LayerState>;

  /** All areas indexed by ID (legacy - being migrated to unified shape/area model) */
  areas: Map<string, AreaState>;

  /** Current selection state */
  selection: SelectionState;

  /** Viewport state (zoom/pan) */
  viewport: ViewportState;

  /** Grid configuration */
  gridConfig: GridConfigState;

  /** Action lock state (prevents concurrent actions) */
  actionLock: ActionLockState;

  /** ID of the currently active layer */
  currentLayerId: string | null;

  /** Current step number (1-based) */
  currentStep: number;

  /** Whether the current state has been saved */
  isSaved: boolean;

  /** Root area ID (legacy - use rootShapeId for new code) */
  rootAreaId: string | null;

  /** Root shape ID for unified shape/area hierarchy */
  rootShapeId: string | null;
}

/**
 * Serialized format for persistence (JSON-compatible)
 */
export interface SerializedGridState {
  /** Schema version for migration support */
  version: string;

  /** Array of shapes (Maps don't serialize to JSON) */
  shapes: ShapeState[];

  /** Array of layers */
  layers: LayerState[];

  /** Array of areas (legacy - will be empty after migration) */
  areas: AreaState[];

  /** Current step number */
  currentStep: number;

  /** Root area ID (legacy - use rootShapeId after migration) */
  rootAreaId: string | null;

  /** Root shape ID for unified hierarchy */
  rootShapeId: string | null;
}

/**
 * Current schema version for serialization
 */
export const GRID_STATE_VERSION = '2.0';
