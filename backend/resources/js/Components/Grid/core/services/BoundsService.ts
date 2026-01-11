/**
 * BoundsService
 *
 * Provides live bounds queries and constraint calculations.
 * This service queries the GridStateStore for current bounds,
 * ensuring constraints are never stale.
 *
 * Key features:
 * - Live parent bounds queries (never uses static snapshots)
 * - Centralized constraint logic (DRY)
 * - Grid snapping integration
 * - Zoom-aware calculations
 */

import type { GridStateStore } from '../state/GridStateStore';
import {
  type Bounds,
  type Position,
  type Size,
  constrainPositionToBounds,
  constrainResizeToBounds,
  isPositionWithinBounds,
  isWithinBounds,
  boundsOverlap,
  applyGridSnapToPosition,
  applyGridSnapToBounds,
} from '../utils/bounds';

// ==================== Service Interface ====================

export interface BoundsService {
  // Live bounds queries
  getShapeBounds(shapeId: string): Bounds | null;
  getParentBounds(shapeId: string): Bounds | null;
  getCanvasBounds(): Bounds;

  // Constraint operations (used by dragBoundFunc, boundBoxFunc)
  constrainDrag(
    shapeId: string,
    position: Position,
    shapeSize: Size
  ): Position;

  constrainResize(
    shapeId: string,
    newBounds: Bounds,
    minSize?: Size
  ): Bounds;

  // Validation
  isPositionValid(position: Position, parentShapeId: string | null): boolean;
  wouldOverlapSiblings(
    bounds: Bounds,
    excludeShapeId: string,
    parentShapeId: string | null
  ): boolean;

  // Canvas management
  setCanvasBounds(bounds: Bounds): void;
  updateCanvasFromStage(width: number, height: number): void;
}

// ==================== Service Configuration ====================

export interface BoundsServiceConfig {
  getZoomScale: () => number;
  getGridSize: () => number;
  getSnapEnabled: () => boolean;
}

// ==================== Service Factory ====================

/**
 * Create a BoundsService instance
 *
 * @param store - The GridStateStore to query for shape data
 * @param config - Configuration callbacks for zoom, grid, and snap settings
 */
export function createBoundsService(
  store: GridStateStore,
  config: BoundsServiceConfig
): BoundsService {
  // Canvas bounds (updated when stage resizes)
  let canvasBounds: Bounds = { x: 0, y: 0, width: 1000, height: 800 };

  const service: BoundsService = {
    // ==================== Live Bounds Queries ====================

    /**
     * Get the current bounds of a shape (live query)
     */
    getShapeBounds(shapeId: string): Bounds | null {
      const shape = store.getShape(shapeId);
      if (!shape) return null;
      return {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
      };
    },

    /**
     * Get the current bounds of a shape's parent (live query)
     * This is the KEY method that replaces static closure captures
     */
    getParentBounds(shapeId: string): Bounds | null {
      const shape = store.getShape(shapeId);
      if (!shape) {
        return null;
      }
      if (!shape.parentShapeId) {
        return null;
      }

      const parent = store.getShape(shape.parentShapeId);
      if (!parent) {
        console.warn(`[BoundsService] Parent shape ${shape.parentShapeId} not found in store for child ${shapeId}`);
        return null;
      }

      return {
        x: parent.x,
        y: parent.y,
        width: parent.width,
        height: parent.height,
      };
    },

    /**
     * Get the current canvas bounds
     */
    getCanvasBounds(): Bounds {
      return { ...canvasBounds };
    },

    // ==================== Constraint Operations ====================

    /**
     * Constrain a drag position within parent bounds (or canvas)
     * This replaces the static dragBoundFunc closure logic
     *
     * @param shapeId - The shape being dragged
     * @param position - The proposed new position
     * @param shapeSize - The current size of the shape
     * @returns The constrained position
     */
    constrainDrag(
      shapeId: string,
      position: Position,
      shapeSize: Size
    ): Position {
      // Get effective bounds (parent or canvas)
      const parentBounds = this.getParentBounds(shapeId);
      const effectiveBounds = parentBounds || getEffectiveCanvasBounds();

      // Constrain position within bounds
      let result = constrainPositionToBounds(position, shapeSize, effectiveBounds);

      // Apply grid snapping
      if (config.getSnapEnabled()) {
        result = applyGridSnapToPosition(result, config.getGridSize(), true);
      }

      return result;
    },

    /**
     * Constrain a resize operation within parent bounds (or canvas)
     * This replaces the static boundBoxFunc logic in TransformManager
     *
     * @param shapeId - The shape being resized
     * @param newBounds - The proposed new bounds
     * @param minSize - Minimum allowed size
     * @returns The constrained bounds
     */
    constrainResize(
      shapeId: string,
      newBounds: Bounds,
      minSize: Size = { width: 20, height: 20 }
    ): Bounds {
      // Get effective bounds (parent or canvas)
      const parentBounds = this.getParentBounds(shapeId);
      const effectiveBounds = parentBounds || getEffectiveCanvasBounds();

      // Constrain resize within bounds
      let result = constrainResizeToBounds(newBounds, effectiveBounds, minSize);

      // Apply grid snapping
      if (config.getSnapEnabled()) {
        result = applyGridSnapToBounds(result, config.getGridSize(), true);
      }

      return result;
    },

    // ==================== Validation ====================

    /**
     * Check if a position is valid for shape creation
     *
     * @param position - The position to validate
     * @param parentShapeId - The parent shape ID (null for root shapes)
     */
    isPositionValid(position: Position, parentShapeId: string | null): boolean {
      if (parentShapeId) {
        const parentBounds = store.getShapeBounds(parentShapeId);
        if (!parentBounds) return false;
        return isPositionWithinBounds(position, parentBounds);
      }
      return isPositionWithinBounds(position, getEffectiveCanvasBounds());
    },

    /**
     * Check if new bounds would overlap with sibling shapes
     *
     * @param bounds - The bounds to check
     * @param excludeShapeId - Shape to exclude from check (the shape being moved/created)
     * @param parentShapeId - Parent shape ID to find siblings
     */
    wouldOverlapSiblings(
      bounds: Bounds,
      excludeShapeId: string,
      parentShapeId: string | null
    ): boolean {
      // Get all sibling shapes (shapes with same parent)
      for (const [id, shape] of store.state.shapes) {
        if (id === excludeShapeId) continue;
        if (shape.parentShapeId !== parentShapeId) continue;

        const shapeBounds: Bounds = {
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height,
        };

        if (boundsOverlap(bounds, shapeBounds)) {
          return true;
        }
      }
      return false;
    },

    // ==================== Canvas Management ====================

    /**
     * Set the canvas bounds directly
     */
    setCanvasBounds(bounds: Bounds): void {
      canvasBounds = { ...bounds };
    },

    /**
     * Update canvas bounds from stage dimensions
     */
    updateCanvasFromStage(width: number, height: number): void {
      canvasBounds = { x: 0, y: 0, width, height };
    },
  };

  // ==================== Private Helpers ====================

  /**
   * Get effective canvas bounds accounting for zoom
   */
  function getEffectiveCanvasBounds(): Bounds {
    const zoom = config.getZoomScale();
    return {
      x: 0,
      y: 0,
      width: canvasBounds.width / zoom,
      height: canvasBounds.height / zoom,
    };
  }

  return service;
}

// ==================== Type Exports ====================

export type { Bounds, Position, Size };
