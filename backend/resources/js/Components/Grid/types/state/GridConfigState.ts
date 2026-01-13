/**
 * GridConfigState - Canonical grid configuration state type
 *
 * Single source of truth for grid configuration in the grid system.
 *
 * Naming convention:
 * - `gridSize` (not `size`) - spacing between grid lines
 * - `gridVisible` (not `visible`) - show/hide grid lines
 * - `snapEnabled` - whether shapes snap to grid
 */

/**
 * Grid configuration state - centralized grid settings
 */
export interface GridConfigState {
  /** Spacing between grid lines in pixels */
  gridSize: number;

  /** Whether shapes snap to grid during drag/resize */
  snapEnabled: boolean;

  /** Whether grid lines are visible */
  gridVisible: boolean;

  /** Base font size for shape labels (user-configurable starting point) */
  baseFontSize: number;
}

/**
 * Default grid configuration values
 */
export const DEFAULT_GRID_CONFIG_STATE: GridConfigState = {
  gridSize: 20,
  snapEnabled: true,
  gridVisible: true,
  baseFontSize: 24,
};
