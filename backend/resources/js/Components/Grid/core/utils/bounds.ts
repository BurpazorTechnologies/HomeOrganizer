/**
 * Bounds Utilities
 *
 * Pure functions for bounds calculations and constraints.
 * These replace the duplicated logic that was scattered across multiple managers.
 */

/**
 * Represents a rectangular bounds area
 */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Represents a 2D position
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Represents a 2D size
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Constrain a position within bounds, accounting for shape size.
 * The shape's top-left corner will be constrained so the entire shape stays within bounds.
 *
 * @param position - The proposed position (top-left corner of shape)
 * @param shapeSize - The size of the shape being positioned
 * @param bounds - The bounds to constrain within
 * @returns The constrained position
 */
export function constrainPositionToBounds(
  position: Position,
  shapeSize: Size,
  bounds: Bounds
): Position {
  return {
    x: Math.max(bounds.x, Math.min(position.x, bounds.x + bounds.width - shapeSize.width)),
    y: Math.max(bounds.y, Math.min(position.y, bounds.y + bounds.height - shapeSize.height)),
  };
}

/**
 * Constrain a resize operation within parent bounds.
 * Adjusts the bounds to fit entirely within the parent while respecting minimum size.
 *
 * @param newBounds - The proposed new bounds after resize
 * @param parentBounds - The parent bounds to constrain within
 * @param minSize - Minimum allowed size (default 20x20)
 * @returns The constrained bounds
 */
export function constrainResizeToBounds(
  newBounds: Bounds,
  parentBounds: Bounds,
  minSize: Size = { width: 20, height: 20 }
): Bounds {
  let { x, y, width, height } = newBounds;

  // Enforce minimum size first
  width = Math.max(width, minSize.width);
  height = Math.max(height, minSize.height);

  // Constrain left edge
  if (x < parentBounds.x) {
    width -= parentBounds.x - x;
    x = parentBounds.x;
  }

  // Constrain top edge
  if (y < parentBounds.y) {
    height -= parentBounds.y - y;
    y = parentBounds.y;
  }

  // Constrain right edge
  if (x + width > parentBounds.x + parentBounds.width) {
    width = parentBounds.x + parentBounds.width - x;
  }

  // Constrain bottom edge
  if (y + height > parentBounds.y + parentBounds.height) {
    height = parentBounds.y + parentBounds.height - y;
  }

  // Re-enforce minimum size after edge constraints
  width = Math.max(width, minSize.width);
  height = Math.max(height, minSize.height);

  return { x, y, width, height };
}

/**
 * Check if a child bounds is completely contained within parent bounds.
 *
 * @param child - The child bounds to check
 * @param parent - The parent bounds
 * @returns True if child is fully within parent
 */
export function isWithinBounds(child: Bounds, parent: Bounds): boolean {
  return (
    child.x >= parent.x &&
    child.y >= parent.y &&
    child.x + child.width <= parent.x + parent.width &&
    child.y + child.height <= parent.y + parent.height
  );
}

/**
 * Check if a position is within bounds.
 *
 * @param position - The position to check
 * @param bounds - The bounds to check against
 * @returns True if position is within bounds
 */
export function isPositionWithinBounds(position: Position, bounds: Bounds): boolean {
  return (
    position.x >= bounds.x &&
    position.x <= bounds.x + bounds.width &&
    position.y >= bounds.y &&
    position.y <= bounds.y + bounds.height
  );
}

/**
 * Check if two bounds overlap (AABB collision).
 *
 * @param a - First bounds
 * @param b - Second bounds
 * @returns True if bounds overlap
 */
export function boundsOverlap(a: Bounds, b: Bounds): boolean {
  return !(
    a.x + a.width <= b.x ||
    a.x >= b.x + b.width ||
    a.y + a.height <= b.y ||
    a.y >= b.y + b.height
  );
}

/**
 * Apply grid snapping to a value.
 *
 * @param value - The value to snap
 * @param gridSize - The grid cell size
 * @param enabled - Whether snapping is enabled
 * @returns The snapped value (or original if disabled)
 */
export function applyGridSnap(value: number, gridSize: number, enabled: boolean): number {
  if (!enabled) return value;
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Apply grid snapping to a position.
 *
 * @param position - The position to snap
 * @param gridSize - The grid cell size
 * @param enabled - Whether snapping is enabled
 * @returns The snapped position
 */
export function applyGridSnapToPosition(
  position: Position,
  gridSize: number,
  enabled: boolean
): Position {
  if (!enabled) return position;
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
}

/**
 * Apply grid snapping to bounds (position and size).
 *
 * @param bounds - The bounds to snap
 * @param gridSize - The grid cell size
 * @param enabled - Whether snapping is enabled
 * @returns The snapped bounds
 */
export function applyGridSnapToBounds(
  bounds: Bounds,
  gridSize: number,
  enabled: boolean
): Bounds {
  if (!enabled) return bounds;
  return {
    x: Math.round(bounds.x / gridSize) * gridSize,
    y: Math.round(bounds.y / gridSize) * gridSize,
    width: Math.round(bounds.width / gridSize) * gridSize,
    height: Math.round(bounds.height / gridSize) * gridSize,
  };
}

/**
 * Calculate the intersection of two bounds.
 *
 * @param a - First bounds
 * @param b - Second bounds
 * @returns The intersection bounds, or null if no intersection
 */
export function intersectBounds(a: Bounds, b: Bounds): Bounds | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);

  if (right <= x || bottom <= y) {
    return null;
  }

  return {
    x,
    y,
    width: right - x,
    height: bottom - y,
  };
}

/**
 * Get the center point of bounds.
 *
 * @param bounds - The bounds
 * @returns The center position
 */
export function getBoundsCenter(bounds: Bounds): Position {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
}

/**
 * Create bounds from a position and size.
 *
 * @param position - The top-left position
 * @param size - The size
 * @returns The bounds
 */
export function createBounds(position: Position, size: Size): Bounds {
  return {
    x: position.x,
    y: position.y,
    width: size.width,
    height: size.height,
  };
}

/**
 * Expand bounds by a given amount on all sides.
 *
 * @param bounds - The bounds to expand
 * @param amount - The amount to expand (can be negative to shrink)
 * @returns The expanded bounds
 */
export function expandBounds(bounds: Bounds, amount: number): Bounds {
  return {
    x: bounds.x - amount,
    y: bounds.y - amount,
    width: bounds.width + amount * 2,
    height: bounds.height + amount * 2,
  };
}
