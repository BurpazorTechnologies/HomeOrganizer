/**
 * Grid State Type Definitions
 *
 * Types for grid configuration and state management.
 */

import type { Point } from './shapes';

/**
 * Grid configuration
 */
export interface GridConfig {
  size: number;           // spacing between grid lines
  snapEnabled: boolean;   // whether to snap shapes to grid
  visible: boolean;       // show/hide grid lines
}

/**
 * Viewport state (camera position and zoom)
 */
export interface ViewportState {
  position: Point;        // pan offset
  scale: number;          // zoom level (1.0 = 100%)
}

/**
 * Visible bounds in world coordinates
 */
export interface VisibleBounds {
  startX: number;
  endX: number;
  startY: number;
  endY: number;
}

/**
 * Grid render settings
 */
export interface GridRenderSettings {
  lineColor: string;
  lineWidth: number;
  shouldRender: boolean;
}
