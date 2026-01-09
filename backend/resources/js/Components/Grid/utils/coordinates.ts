/**
 * Coordinate Transformation Utilities
 *
 * Functions for converting between screen and world coordinates,
 * and for snapping to grid.
 */

import type Konva from 'konva';
import type { Point } from '../types/shapes';
import { GRID_CONSTANTS } from '../types/constants';

/**
 * Convert screen coordinates to world coordinates
 *
 * Takes into account the stage's pan (position) and zoom (scale)
 *
 * @param screenPoint - Point in screen space (pixels on canvas)
 * @param stage - Konva stage instance
 * @returns Point in world coordinates
 *
 * @example
 * const worldPos = screenToWorld({ x: 100, y: 100 }, stage);
 */
export function screenToWorld(screenPoint: Point, stage: Konva.Stage): Point {
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  return transform.point(screenPoint);
}

/**
 * Convert world coordinates to screen coordinates
 *
 * @param worldPoint - Point in world space
 * @param stage - Konva stage instance
 * @returns Point in screen coordinates
 *
 * @example
 * const screenPos = worldToScreen({ x: 500, y: 500 }, stage);
 */
export function worldToScreen(worldPoint: Point, stage: Konva.Stage): Point {
  const transform = stage.getAbsoluteTransform().copy();
  return transform.point(worldPoint);
}

/**
 * Snap a value to the nearest grid increment
 *
 * @param value - The value to snap
 * @param gridSize - Size of grid cells
 * @returns Snapped value
 *
 * @example
 * snapToGrid(47, 20) // => 40
 * snapToGrid(51, 20) // => 60
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap a point to the grid
 *
 * @param point - Point to snap
 * @param gridSize - Size of grid cells
 * @returns Snapped point
 */
export function snapPointToGrid(point: Point, gridSize: number): Point {
  return {
    x: snapToGrid(point.x, gridSize),
    y: snapToGrid(point.y, gridSize),
  };
}

/**
 * Clamp a value between min and max, optionally snapping to grid
 *
 * @param value - Value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @param gridSize - Optional grid size for snapping
 * @returns Clamped (and optionally snapped) value
 */
export function clampValue(
  value: number,
  min: number,
  max: number,
  gridSize?: number
): number {
  let clamped = Math.max(min, Math.min(max, value));

  if (gridSize !== undefined) {
    clamped = snapToGrid(clamped, gridSize);
  }

  return clamped;
}

/**
 * Clamp a point within canvas bounds
 *
 * @param point - Point to clamp
 * @param snapEnabled - Whether to snap to grid
 * @param gridSize - Grid size for snapping
 * @returns Clamped point
 */
export function clampPointToBounds(
  point: Point,
  snapEnabled: boolean = false,
  gridSize: number = GRID_CONSTANTS.DEFAULT_GRID_SIZE
): Point {
  const clampedPoint = {
    x: clampValue(
      point.x,
      GRID_CONSTANTS.CANVAS_MIN_X,
      GRID_CONSTANTS.CANVAS_MAX_X,
      snapEnabled ? gridSize : undefined
    ),
    y: clampValue(
      point.y,
      GRID_CONSTANTS.CANVAS_MIN_Y,
      GRID_CONSTANTS.CANVAS_MAX_Y,
      snapEnabled ? gridSize : undefined
    ),
  };

  return clampedPoint;
}

/**
 * Calculate distance between two points
 *
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Distance in pixels
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if a point is within a rectangular bounds
 *
 * @param point - Point to check
 * @param bounds - Rectangle bounds { x, y, width, height }
 * @returns True if point is inside bounds
 */
export function isPointInBounds(
  point: Point,
  bounds: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}
