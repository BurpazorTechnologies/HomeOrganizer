/**
 * Grid Type Definitions
 *
 * Types for grid rendering and visualization.
 *
 * NOTE: For state types, use types/state/ instead:
 * - GridConfigState (not GridConfig) - from types/state/
 * - ViewportState - from types/state/
 */

/**
 * Visible bounds in world coordinates
 * Used by GridManager for calculating which grid lines to render
 */
export interface VisibleBounds {
  startX: number;
  endX: number;
  startY: number;
  endY: number;
}

/**
 * Grid render settings for drawing grid lines
 */
export interface GridRenderSettings {
  lineColor: string;
  lineWidth: number;
  shouldRender: boolean;
}

// ==================== Deprecated Types ====================
// These are kept for backwards compatibility but should not be used
// Use types/state/GridConfigState and types/state/ViewportState instead

/**
 * @deprecated Use GridConfigState from types/state/ instead
 * This type has different property names (size vs gridSize, visible vs gridVisible)
 */
export interface GridConfig {
  size: number;           // Use gridSize in GridConfigState
  snapEnabled: boolean;
  visible: boolean;       // Use gridVisible in GridConfigState
}
