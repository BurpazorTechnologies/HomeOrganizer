/**
 * BaseStep Abstract Class
 *
 * Base class that all step implementations must extend.
 * Provides common functionality and enforces the step behavior contract.
 */

import type { Step } from '@/Components/Grid/types/steps';
import type {
  StepBehavior,
  ClickContext,
  ToolbarAction,
  StepInfo,
  ManagerInstances,
} from '@/Components/Grid/types/orchestration';

export abstract class BaseStep implements StepBehavior {
  protected managers: ManagerInstances;
  protected stepConfig: Step;

  constructor(stepConfig: Step, managers: ManagerInstances) {
    this.stepConfig = stepConfig;
    this.managers = managers;
  }

  /**
   * Called when entering this step
   * Override to add custom enter behavior
   */
  onEnter(): void {
    // Default: no-op, override in subclass if needed
  }

  /**
   * Called when exiting this step
   * Override to add custom exit behavior
   */
  onExit(): void {
    // Default: no-op, override in subclass if needed
  }

  /**
   * Handle click events - MUST be implemented by subclass
   */
  abstract handleClick(context: ClickContext): void;

  /**
   * Get the step configuration
   */
  getStepConfig(): Step {
    return this.stepConfig;
  }

  /**
   * Get human-readable description - MUST be implemented by subclass
   */
  abstract getDescription(): string;

  /**
   * Get toolbar actions - MUST be implemented by subclass
   */
  abstract getToolbarActions(): ToolbarAction[];

  /**
   * Get complete step info for UI
   */
  getStepInfo(): StepInfo {
    return {
      step: this.getStepConfig(),
      description: this.getDescription(),
      actions: this.getToolbarActions(),
      selectedShapeId: this.managers.shapeManager?.getSelectedShapeId() || null,
    };
  }

  /**
   * Helper: Deselect current shape
   */
  protected deselectShape(): void {
    this.managers.shapeManager?.deselectShape();
    this.managers.transformManager?.detach();
  }

  /**
   * Helper: Select a shape by ID
   */
  protected selectShape(shapeId: string): void {
    this.managers.shapeManager?.selectShape(shapeId);
    const shapeNode = this.managers.shapeManager?.getShapeNode(shapeId);
    if (shapeNode) {
      this.managers.transformManager?.attachTo(shapeNode);
    }
  }

  /**
   * Helper: Delete a shape by ID
   */
  protected deleteShape(shapeId: string): void {
    // Delete from shape manager (handles Konva node destruction)
    this.managers.shapeManager?.deleteShape(shapeId);

    // Remove the label
    this.managers.labelManager?.removeLabel(shapeId);

    // Detach transformer
    this.managers.transformManager?.detach();
  }
}
