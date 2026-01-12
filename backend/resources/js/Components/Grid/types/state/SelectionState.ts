/**
 * SelectionState - Canonical selection state type
 *
 * Single source of truth for selection state in the grid system.
 * Tracks what shape/layer is currently selected.
 */

/**
 * Selection state - tracks what's currently selected
 */
export interface SelectionState {
  /** ID of the currently selected shape (null = nothing selected) */
  selectedShapeId: string | null;

  /** ID of the layer containing the selected shape */
  selectedLayerId: string | null;

  /** Whether the selected shape is a parent/container shape */
  isParentSelected: boolean;
}

/**
 * Default selection state values
 */
export const DEFAULT_SELECTION_STATE: SelectionState = {
  selectedShapeId: null,
  selectedLayerId: null,
  isParentSelected: false,
};
