/**
 * ShapeCreationFlow
 *
 * Handles child area shape creation (Step 2+).
 * Creates shapes within a parent boundary, handling overlap detection
 * and proper parent-child relationships.
 *
 * Event Flow:
 * 1. Listen for CREATE_CHILD_AREA_REQUESTED
 * 2. Validate position is within parent bounds
 * 3. Check for overlaps with sibling shapes
 * 4. Dispatch SHAPE_CREATE command
 * 5. Dispatch SHAPE_ADD_CHILD to update parent
 * 6. Dispatch LAYER_ADD_SHAPE command
 * 7. Emit CHILD_AREA_CREATED on success
 *
 * This flow replaces the child area creation logic from StepHandlers.createShape()
 */

import { BaseFlow, type FlowDependencies } from './BaseFlow';
import type { ShapeState, AreaType } from '../../types/state';
import { SHAPE_COLORS } from '../../types/constants';

/**
 * Default shape dimensions for child areas
 */
const DEFAULT_WIDTH = 150;
const DEFAULT_HEIGHT = 150;

/**
 * ShapeCreationFlow - handles child shape creation within parent boundaries
 */
export class ShapeCreationFlow extends BaseFlow {
  protected setupSubscriptions(): void {
    this.on('CREATE_CHILD_AREA_REQUESTED', this.handleCreateChildRequested);
    this.on('SHAPE_DELETE_REQUESTED', this.handleDeleteRequested);
  }

  /**
   * Handle request to create child area
   */
  private handleCreateChildRequested = (payload: {
    parentShapeId: string;
    position: { x: number; y: number };
    layerId: string;
    defaults?: {
      width?: number;
      height?: number;
      label?: string;
      fill?: string;
      stroke?: string;
    };
  }): void => {
    const { parentShapeId, position, layerId, defaults = {} } = payload;

    // 1. Get parent shape
    const parentShape = this.queryService.query({
      type: 'GET_SHAPE',
      payload: { shapeId: parentShapeId },
    });

    if (!parentShape) {
      console.error('[ShapeCreationFlow] Parent shape not found:', parentShapeId);
      return;
    }

    // 2. Calculate dimensions
    const width = defaults.width ?? DEFAULT_WIDTH;
    const height = defaults.height ?? DEFAULT_HEIGHT;

    // 3. Validate position is within parent bounds
    const parentBounds = {
      x: parentShape.x,
      y: parentShape.y,
      width: parentShape.width,
      height: parentShape.height,
    };

    if (!this.isWithinBounds(position, { width, height }, parentBounds)) {
      console.warn('[ShapeCreationFlow] Position outside parent bounds');
      return;
    }

    // 4. Check for overlaps with sibling shapes
    const siblings = this.queryService.query({
      type: 'GET_CHILD_SHAPES',
      payload: { parentShapeId },
    });

    const newBounds = {
      x: position.x,
      y: position.y,
      width,
      height,
    };

    if (this.hasOverlap(newBounds, siblings)) {
      console.warn('[ShapeCreationFlow] New shape would overlap existing sibling');
      return;
    }

    // 5. Determine depth (parent depth + 1)
    const depth = (parentShape.depth ?? 0) + 1;

    // 6. Build the shape state
    const shapeId = `shape_area_${Date.now()}`;
    const shape: ShapeState = {
      id: shapeId,
      type: 'rectangle',
      x: position.x,
      y: position.y,
      width,
      height,
      fill: defaults.fill ?? SHAPE_COLORS.AREA_FILL,
      stroke: defaults.stroke ?? SHAPE_COLORS.AREA_STROKE,
      strokeWidth: 2,
      label: defaults.label ?? 'Area',
      layerId,
      zIndex: siblings.length, // Stack above existing siblings
      // Area semantics (unified model)
      areaType: 'area' as AreaType,
      depth,
      parentShapeId,
      childShapeIds: [],
    };

    // 7. Create the shape via command
    const createResult = this.dispatch({
      type: 'SHAPE_CREATE',
      payload: { shape },
    });

    if (!createResult.success) {
      console.error('[ShapeCreationFlow] Failed to create shape:', createResult.error);
      return;
    }

    // 8. Add as child of parent shape
    const childResult = this.dispatch({
      type: 'SHAPE_ADD_CHILD',
      payload: {
        parentId: parentShapeId,
        childId: shapeId,
      },
    });

    if (!childResult.success) {
      console.error('[ShapeCreationFlow] Failed to add child to parent:', childResult.error);
    }

    // 9. Add to layer
    const layerResult = this.dispatch({
      type: 'LAYER_ADD_SHAPE',
      payload: {
        layerId,
        shapeId,
        isPrimary: siblings.length === 0, // First child is primary
      },
    });

    if (!layerResult.success) {
      console.error('[ShapeCreationFlow] Failed to add shape to layer:', layerResult.error);
    }

    // 10. Select the newly created shape
    this.dispatch({
      type: 'SELECTION_SELECT',
      payload: {
        shapeId,
        layerId,
        isParent: false,
      },
    });

    // 11. Emit completion event
    this.emit({
      type: 'CHILD_AREA_CREATED',
      payload: {
        shapeId,
        parentShapeId,
        layerId,
      },
    });

    console.log('[ShapeCreationFlow] Child area created:', shapeId);
  };

  /**
   * Handle request to delete shape
   */
  private handleDeleteRequested = (payload: {
    shapeId: string;
    layerId: string;
  }): void => {
    const { shapeId, layerId } = payload;

    // 1. Get shape to check if it has a parent
    const shape = this.queryService.query({
      type: 'GET_SHAPE',
      payload: { shapeId },
    });

    if (!shape) {
      console.error('[ShapeCreationFlow] Shape not found for deletion:', shapeId);
      return;
    }

    // 2. If shape has a parent, remove from parent's children
    if (shape.parentShapeId) {
      this.dispatch({
        type: 'SHAPE_REMOVE_CHILD',
        payload: {
          parentId: shape.parentShapeId,
          childId: shapeId,
        },
      });
    }

    // 3. Remove from layer
    this.dispatch({
      type: 'LAYER_REMOVE_SHAPE',
      payload: {
        layerId,
        shapeId,
      },
    });

    // 4. Clear selection if this shape was selected
    const selection = this.queryService.query({
      type: 'GET_SELECTION',
      payload: {},
    });

    if (selection.selectedShapeId === shapeId) {
      this.dispatch({
        type: 'SELECTION_DESELECT',
        payload: {},
      });
    }

    // 5. Delete the shape
    this.dispatch({
      type: 'SHAPE_DELETE',
      payload: { shapeId },
    });

    console.log('[ShapeCreationFlow] Shape deleted:', shapeId);
  };

  /**
   * Check if position + dimensions fit within bounds
   */
  private isWithinBounds(
    position: { x: number; y: number },
    size: { width: number; height: number },
    bounds: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      position.x >= bounds.x &&
      position.y >= bounds.y &&
      position.x + size.width <= bounds.x + bounds.width &&
      position.y + size.height <= bounds.y + bounds.height
    );
  }

  /**
   * Check if new bounds overlap with any existing shapes
   */
  private hasOverlap(
    newBounds: { x: number; y: number; width: number; height: number },
    existingShapes: ShapeState[]
  ): boolean {
    for (const shape of existingShapes) {
      const overlap = !(
        newBounds.x + newBounds.width <= shape.x ||
        newBounds.x >= shape.x + shape.width ||
        newBounds.y + newBounds.height <= shape.y ||
        newBounds.y >= shape.y + shape.height
      );

      if (overlap) {
        return true;
      }
    }

    return false;
  }

  protected onStart(): void {
    console.log('[ShapeCreationFlow] Started');
  }

  protected onStop(): void {
    console.log('[ShapeCreationFlow] Stopped');
  }
}

/**
 * Factory function to create ShapeCreationFlow
 */
export function createShapeCreationFlow(deps: FlowDependencies): ShapeCreationFlow {
  return new ShapeCreationFlow(deps);
}
