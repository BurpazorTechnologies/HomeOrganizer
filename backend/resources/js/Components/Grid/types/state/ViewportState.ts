/**
 * ViewportState - Canonical viewport state type
 *
 * Single source of truth for viewport (zoom/pan) state in the grid system.
 *
 * Naming convention:
 * - `zoom` (not `scale`) - zoom level where 1.0 = 100%
 * - `pan` (not `position`) - pan offset in world coordinates
 */

/**
 * Point in 2D space for pan position
 */
export interface PanPosition {
  x: number;
  y: number;
}

/**
 * Viewport state - tracks zoom and pan
 */
export interface ViewportState {
  /** Zoom level (1.0 = 100%, range: 0.25 to 2.0) */
  zoom: number;

  /** Pan offset in world coordinates */
  pan: PanPosition;
}

/**
 * Default viewport state values
 */
export const DEFAULT_VIEWPORT_STATE: ViewportState = {
  zoom: 1.0,
  pan: { x: 0, y: 0 },
};
