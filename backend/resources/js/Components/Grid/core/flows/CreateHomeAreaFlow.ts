/**
 * CreateHomeAreaFlow
 *
 * Handles the home area creation flow (Step 1).
 * This is triggered when the user clicks on the canvas to create
 * their primary "home" area shape.
 *
 * Event Flow:
 * 1. Listen for CREATE_HOME_AREA_REQUESTED
 * 2. Dispatch SHAPE_CREATE command
 * 3. Dispatch SHAPE_SET_ROOT command (marks as root shape)
 * 4. Dispatch LAYER_ADD_SHAPE command
 * 5. Emit HOME_AREA_CREATED on success
 *
 * This flow replaces the home area creation logic from StepHandlers.createShape()
 */

import { BaseFlow, type FlowDependencies } from './BaseFlow';
import type { ShapeState, AreaType } from '../../types/state';
import { SHAPE_COLORS } from '../../types/constants';

/**
 * Default shape dimensions
 */
const DEFAULT_WIDTH = 200;
const DEFAULT_HEIGHT = 200;

/**
 * CreateHomeAreaFlow - handles Step 1 home area creation
 */
export class CreateHomeAreaFlow extends BaseFlow {
  protected setupSubscriptions(): void {
    this.on('CREATE_HOME_AREA_REQUESTED', this.handleCreateRequested);
  }

  /**
   * Handle request to create home area
   */
  private handleCreateRequested = (payload: {
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
    const { position, layerId, defaults = {} } = payload;

    // Check if home area already exists (query root shape)
    const existingRoot = this.queryService.query({
      type: 'GET_ROOT_SHAPE',
      payload: {},
    });

    if (existingRoot) {
      console.warn('[CreateHomeAreaFlow] Home area already exists, ignoring request');
      return;
    }

    // Build the shape state
    const shapeId = `shape_home_${Date.now()}`;
    const shape: ShapeState = {
      id: shapeId,
      type: 'rectangle',
      x: position.x,
      y: position.y,
      width: defaults.width ?? DEFAULT_WIDTH,
      height: defaults.height ?? DEFAULT_HEIGHT,
      fill: defaults.fill ?? SHAPE_COLORS.HOME_AREA_FILL,
      stroke: defaults.stroke ?? SHAPE_COLORS.HOME_AREA_STROKE,
      strokeWidth: 2,
      label: defaults.label ?? 'Home Area',
      layerId,
      zIndex: 0,
      // Area semantics (unified model)
      areaType: 'home' as AreaType,
      depth: 0,
      parentShapeId: null,
      childShapeIds: [],
    };

    // 1. Create the shape via command
    const createResult = this.dispatch({
      type: 'SHAPE_CREATE',
      payload: { shape },
    });

    if (!createResult.success) {
      console.error('[CreateHomeAreaFlow] Failed to create shape:', createResult.error);
      return;
    }

    // 2. Set as root shape
    const rootResult = this.dispatch({
      type: 'SHAPE_SET_ROOT',
      payload: { shapeId },
    });

    if (!rootResult.success) {
      console.error('[CreateHomeAreaFlow] Failed to set root shape:', rootResult.error);
    }

    // 3. Add to layer
    const layerResult = this.dispatch({
      type: 'LAYER_ADD_SHAPE',
      payload: {
        layerId,
        shapeId,
        isPrimary: true,
      },
    });

    if (!layerResult.success) {
      console.error('[CreateHomeAreaFlow] Failed to add shape to layer:', layerResult.error);
    }

    // 4. Select the newly created shape
    this.dispatch({
      type: 'SELECTION_SELECT',
      payload: {
        shapeId,
        layerId,
        isParent: false,
      },
    });

    // 5. Emit completion event
    this.emit({
      type: 'HOME_AREA_CREATED',
      payload: {
        shapeId,
        layerId,
      },
    });

    console.log('[CreateHomeAreaFlow] Home area created:', shapeId);
  };

  protected onStart(): void {
    console.log('[CreateHomeAreaFlow] Started');
  }

  protected onStop(): void {
    console.log('[CreateHomeAreaFlow] Stopped');
  }
}

/**
 * Factory function to create CreateHomeAreaFlow
 */
export function createCreateHomeAreaFlow(deps: FlowDependencies): CreateHomeAreaFlow {
  return new CreateHomeAreaFlow(deps);
}
