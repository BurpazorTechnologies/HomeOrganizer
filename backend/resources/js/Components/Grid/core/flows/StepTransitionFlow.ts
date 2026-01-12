/**
 * StepTransitionFlow
 *
 * Handles step transitions in the grid system.
 * Coordinates layer changes, locking, and state updates when moving between steps.
 *
 * Event Flow for Step 1 -> Step 2 transition:
 * 1. Listen for STEP_TRANSITION_REQUESTED
 * 2. Verify parent shape exists and is valid
 * 3. Create new layer for child step
 * 4. Lock parent layer(s)
 * 5. Update current step in store
 * 6. Emit STEP_TRANSITION_COMPLETED
 *
 * This flow replaces StepOrchestrator.transitionToNextStep() and createChildAreaStep()
 */

import { BaseFlow, type FlowDependencies } from './BaseFlow';
import type { LayerState } from '../../types/state';

/**
 * StepTransitionFlow - handles step changes and layer orchestration
 */
export class StepTransitionFlow extends BaseFlow {
  protected setupSubscriptions(): void {
    this.on('STEP_TRANSITION_REQUESTED', this.handleTransitionRequested);
    this.on('SAVE_REQUESTED', this.handleSaveRequested);
  }

  /**
   * Handle request to transition between steps
   */
  private handleTransitionRequested = (payload: {
    fromStep: number;
    toStep: number;
    parentShapeId?: string;
  }): void => {
    const { fromStep, toStep, parentShapeId } = payload;

    console.log(`[StepTransitionFlow] Transition requested: Step ${fromStep} -> Step ${toStep}`);

    // Step 1 -> Step 2: Enter child area editing mode
    if (fromStep === 1 && toStep === 2) {
      this.transitionToChildStep(parentShapeId);
      return;
    }

    // Step 2+ -> Step 1: Return to parent editing mode
    if (fromStep >= 2 && toStep === 1) {
      this.transitionToParentStep();
      return;
    }

    // Generic step transition (for future steps)
    console.warn(`[StepTransitionFlow] Unhandled transition: ${fromStep} -> ${toStep}`);
  };

  /**
   * Transition to child step (Step 1 -> Step 2)
   */
  private transitionToChildStep(parentShapeId?: string): void {
    if (!parentShapeId) {
      console.error('[StepTransitionFlow] Cannot transition to child step without parent shape');
      return;
    }

    // 1. Verify parent shape exists
    const parentShape = this.queryService.query({
      type: 'GET_SHAPE',
      payload: { shapeId: parentShapeId },
    });

    if (!parentShape) {
      console.error('[StepTransitionFlow] Parent shape not found:', parentShapeId);
      return;
    }

    // 2. Get current layer (will be locked)
    const currentLayer = this.queryService.query({
      type: 'GET_CURRENT_LAYER',
      payload: {},
    });

    if (!currentLayer) {
      console.error('[StepTransitionFlow] No current layer to lock');
      return;
    }

    // 3. Create new layer for child step
    const childLayerId = `layer_child_${Date.now()}`;
    const childLayer: LayerState = {
      id: childLayerId,
      stepId: 'child_area',
      label: 'Child Areas',
      order: 2,
      shapeIds: [],
      primaryShapeId: null,
      parentLayerId: currentLayer.id,
      areaId: parentShapeId, // Using shape ID as area identifier
      isLocked: false,
    };

    const createLayerResult = this.dispatch({
      type: 'LAYER_CREATE',
      payload: { layer: childLayer },
    });

    if (!createLayerResult.success) {
      console.error('[StepTransitionFlow] Failed to create child layer:', createLayerResult.error);
      return;
    }

    // 4. Lock the parent layer
    this.dispatch({
      type: 'LAYER_LOCK',
      payload: { layerId: currentLayer.id },
    });

    // 5. Set new layer as current
    this.dispatch({
      type: 'LAYER_SET_CURRENT',
      payload: { layerId: childLayerId },
    });

    // 6. Update step number
    this.dispatch({
      type: 'STEP_SET_CURRENT',
      payload: { step: 2 },
    });

    // 7. Mark as unsaved (new step)
    this.dispatch({
      type: 'STEP_SET_SAVED',
      payload: { isSaved: false },
    });

    // 8. Clear selection
    this.dispatch({
      type: 'SELECTION_DESELECT',
      payload: {},
    });

    // 9. Emit completion event
    this.emit({
      type: 'STEP_TRANSITION_COMPLETED',
      payload: {
        fromStep: 1,
        toStep: 2,
        layerId: childLayerId,
      },
    });

    console.log('[StepTransitionFlow] Transitioned to Step 2');
  }

  /**
   * Transition back to parent step (Step 2+ -> Step 1)
   */
  private transitionToParentStep(): void {
    // 1. Get current layer to find parent
    const currentLayer = this.queryService.query({
      type: 'GET_CURRENT_LAYER',
      payload: {},
    });

    if (!currentLayer || !currentLayer.parentLayerId) {
      console.error('[StepTransitionFlow] Cannot transition to parent - no parent layer');
      return;
    }

    const parentLayerId = currentLayer.parentLayerId;

    // 2. Unlock the parent layer
    this.dispatch({
      type: 'LAYER_UNLOCK',
      payload: { layerId: parentLayerId },
    });

    // 3. Set parent layer as current
    this.dispatch({
      type: 'LAYER_SET_CURRENT',
      payload: { layerId: parentLayerId },
    });

    // 4. Update step number back to 1
    this.dispatch({
      type: 'STEP_SET_CURRENT',
      payload: { step: 1 },
    });

    // 5. Clear selection
    this.dispatch({
      type: 'SELECTION_DESELECT',
      payload: {},
    });

    // 6. Emit completion event
    this.emit({
      type: 'STEP_TRANSITION_COMPLETED',
      payload: {
        fromStep: 2,
        toStep: 1,
        layerId: parentLayerId,
      },
    });

    console.log('[StepTransitionFlow] Transitioned back to Step 1');
  }

  /**
   * Handle save request
   */
  private handleSaveRequested = (payload: {
    step: number;
    layerId: string;
  }): void => {
    const { step, layerId } = payload;

    console.log(`[StepTransitionFlow] Save requested for Step ${step}`);

    // Get the layer's shapes
    const layer = this.queryService.query({
      type: 'GET_LAYER',
      payload: { layerId },
    });

    if (!layer) {
      console.error('[StepTransitionFlow] Layer not found:', layerId);
      return;
    }

    // Mark as saved
    this.dispatch({
      type: 'STEP_SET_SAVED',
      payload: { isSaved: true },
    });

    console.log(`[StepTransitionFlow] Step ${step} marked as saved`);
  };

  protected onStart(): void {
    console.log('[StepTransitionFlow] Started');
  }

  protected onStop(): void {
    console.log('[StepTransitionFlow] Stopped');
  }
}

/**
 * Factory function to create StepTransitionFlow
 */
export function createStepTransitionFlow(deps: FlowDependencies): StepTransitionFlow {
  return new StepTransitionFlow(deps);
}
