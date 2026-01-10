/**
 * Orchestration Types
 *
 * Type definitions for the step-based orchestration system.
 */

import type Konva from 'konva';
import type { Step } from './steps';

/**
 * Click target type
 */
export type ClickTarget = 'canvas' | 'shape' | 'other';

/**
 * Click context - information about where the user clicked
 */
export interface ClickContext {
  target: ClickTarget;
  position: { x: number; y: number };
  shapeId?: string;
  event: Konva.KonvaEventObject<MouseEvent>;
}

/**
 * Toolbar action definition
 */
export interface ToolbarAction {
  id: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  action: () => void;
}

/**
 * Step state information exposed to UI
 */
export interface StepInfo {
  step: Step;
  description: string;
  actions: ToolbarAction[];
  selectedShapeId?: string | null;
}

/**
 * Manager instances passed to steps
 */
export interface ManagerInstances {
  shapeManager: any; // Will be typed properly when we import
  transformManager: any;
  labelManager: any;
  gridManager: any;
  layerManager: any;
}

/**
 * Step behavior interface - what each step must implement
 */
export interface StepBehavior {
  /**
   * Called when entering this step
   */
  onEnter(): void;

  /**
   * Called when exiting this step
   */
  onExit(): void;

  /**
   * Handle click events
   */
  handleClick(context: ClickContext): void;

  /**
   * Get the step configuration
   */
  getStepConfig(): Step;

  /**
   * Get human-readable description of current state
   */
  getDescription(): string;

  /**
   * Get toolbar actions for current state
   */
  getToolbarActions(): ToolbarAction[];

  /**
   * Get current step info for UI
   */
  getStepInfo(): StepInfo;
}
