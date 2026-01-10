/**
 * StepOrchestrator
 *
 * Central coordinator for step-based behavior.
 * Manages step transitions and delegates events to the current step.
 */

import type Konva from 'konva';
import type { BaseStep } from '@/Components/Grid/steps/BaseStep';
import type { ClickContext, ClickTarget, StepInfo, ManagerInstances } from '@/Components/Grid/types/orchestration';
import { Step1LotArea } from '@/Components/Grid/steps/Step1LotArea';

export class StepOrchestrator {
  private currentStep: BaseStep;
  private stepHistory: BaseStep[] = [];
  private managers: ManagerInstances;
  private onStepChangeCallback?: (stepInfo: StepInfo) => void;

  constructor(managers: ManagerInstances) {
    this.managers = managers;

    // Initialize with Step 1
    this.currentStep = new Step1LotArea(managers);
    this.currentStep.onEnter();
  }

  /**
   * Handle click events - delegate to current step
   */
  handleClick(event: Konva.KonvaEventObject<MouseEvent>, stage: Konva.Stage): void {
    const context = this.buildClickContext(event, stage);
    this.currentStep.handleClick(context);

    // Notify listeners that step state may have changed
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
   * Transition to a new step
   */
  transitionToStep(nextStep: BaseStep): void {
    // Exit current step
    this.currentStep.onExit();

    // Store in history
    this.stepHistory.push(this.currentStep);

    // Enter new step
    this.currentStep = nextStep;
    this.currentStep.onEnter();

    // Notify listeners
    this.notifyStepChange();
  }

  /**
   * Get current step information for UI
   */
  getCurrentStepInfo(): StepInfo {
    return this.currentStep.getStepInfo();
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

  /**
   * Get current step instance
   */
  getCurrentStep(): BaseStep {
    return this.currentStep;
  }

  /**
   * Go back to previous step (if exists)
   */
  goToPreviousStep(): boolean {
    if (this.stepHistory.length === 0) {
      return false;
    }

    const previousStep = this.stepHistory.pop()!;
    this.currentStep.onExit();
    this.currentStep = previousStep;
    this.currentStep.onEnter();
    this.notifyStepChange();

    return true;
  }
}
