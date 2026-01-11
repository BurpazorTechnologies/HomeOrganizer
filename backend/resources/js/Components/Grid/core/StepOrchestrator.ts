/**
 * StepOrchestrator
 *
 * Central coordinator for step-based behavior.
 * Uses declarative configuration instead of step classes.
 */

import type Konva from 'konva';
import type {
  ClickContext,
  ClickTarget,
  StepInfo,
  ManagerInstances,
  StepConfiguration,
  StepState,
} from '@/Components/Grid/types/orchestration';
import { STEPS } from '@/Components/Grid/types/steps';
import { SHAPE_COLORS } from '@/Components/Grid/types/constants';
import { StepHandlers } from '@/Components/Grid/steps/StepHandlers';

export class StepOrchestrator {
  private stepConfigs: Map<number, StepConfiguration> = new Map();
  private currentStepConfig: StepConfiguration;
  private currentState: StepState;
  private managers: ManagerInstances;
  private onStepChangeCallback?: (stepInfo: StepInfo) => void;

  constructor(managers: ManagerInstances) {
    this.managers = managers;

    // Configure all steps (declarative!)
    this.configureSteps();

    // Start with Step 1
    this.currentStepConfig = this.stepConfigs.get(1)!;
    this.currentState = {
      shapeIds: [],
      selectedShapeId: null,
      primaryShapeId: null,
    };

    this.enterStep(this.currentStepConfig);
  }

  /**
   * Centralized step configuration
   */
  private configureSteps(): void {
    // Step 1: Home Area
    this.stepConfigs.set(1, {
      step: STEPS.HOME_AREA,
      layerId: 'layer_1',
      shapeType: 'rectangle',
      shapeDefaults: {
        label: 'Home Area',
        fill: SHAPE_COLORS.HOME_AREA_FILL,
        stroke: SHAPE_COLORS.HOME_AREA_STROKE,
      },
      rules: {
        maxShapes: 1,              // Only ONE home area
        requiresSelection: false,
        canDelete: true,
      },
    });

    // Future: Step 2, 3, etc. will be added here or dynamically
  }

  /**
   * Enter a step - orchestrator controls layer creation
   */
  private enterStep(config: StepConfiguration): void {
    // Create layer for this step
    this.managers.layerManager.createLayer(config.step);

    // Emit to UI
    this.notifyStepChange();
  }

  /**
   * Exit a step - orchestrator controls cleanup
   */
  private exitStep(config: StepConfiguration): void {
    // Deselect shapes
    this.managers.shapeManager.deselectShape();
    this.managers.transformManager.detach();

    // Could archive or hide layer here if needed
  }

  /**
   * Handle click events - delegate to handler with config + state
   */
  handleClick(event: Konva.KonvaEventObject<MouseEvent>, stage: Konva.Stage): void {
    const context = this.buildClickContext(event, stage);

    // Delegate to step handler with configuration
    StepHandlers.handleClick(
      context,
      this.currentStepConfig,
      this.currentState,
      this.managers
    );

    this.notifyStepChange();
  }

  /**
   * Build click context from Konva event
   */
  private buildClickContext(
    event: Konva.KonvaEventObject<MouseEvent>,
    stage: Konva.Stage
  ): ClickContext {
    const pointer = stage.getPointerPosition();
    const target = event.target;

    let clickTarget: ClickTarget = 'other';
    let shapeId: string | undefined;

    if (target === stage) {
      clickTarget = 'canvas';
    } else if (target.getClassName() === 'Rect') {
      clickTarget = 'shape';
      shapeId = target.id();
    }

    return {
      target: clickTarget,
      position: pointer || { x: 0, y: 0 },
      shapeId,
      event,
    };
  }

  /**
   * Delete shape - orchestrator manages state
   */
  private deleteShape(shapeId: string): void {
    StepHandlers.deleteShape(
      shapeId,
      this.currentStepConfig,
      this.currentState,
      this.managers
    );

    this.notifyStepChange();
  }

  /**
   * Transition to next step (future)
   */
  transitionToNextStep(): void {
    const nextOrder = this.currentStepConfig.step.order + 1;
    const nextConfig = this.stepConfigs.get(nextOrder);

    if (nextConfig) {
      this.exitStep(this.currentStepConfig);
      this.currentStepConfig = nextConfig;
      this.currentState = {
        shapeIds: [],
        selectedShapeId: null,
        primaryShapeId: null,
      };
      this.enterStep(this.currentStepConfig);
    }
  }

  /**
   * Get current step information for UI
   */
  getCurrentStepInfo(): StepInfo {
    return {
      step: this.currentStepConfig.step,
      description: StepHandlers.getDescription(
        this.currentStepConfig,
        this.currentState
      ),
      actions: StepHandlers.getToolbarActions(
        this.currentStepConfig,
        this.currentState,
        {
          onDelete: (shapeId) => this.deleteShape(shapeId),
          onNextStep: () => this.transitionToNextStep(),
        }
      ),
      selectedShapeId: this.currentState.selectedShapeId,
    };
  }

  /**
   * Register callback for step changes
   */
  onStepChange(callback: (stepInfo: StepInfo) => void): void {
    this.onStepChangeCallback = callback;
  }

  /**
   * Notify listeners of step change
   */
  private notifyStepChange(): void {
    if (this.onStepChangeCallback) {
      this.onStepChangeCallback(this.getCurrentStepInfo());
    }
  }
}
