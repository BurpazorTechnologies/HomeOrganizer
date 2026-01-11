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
 * Step Configuration - declarative definition of what each step does
 */
export interface StepConfiguration {
  step: Step;                          // Step metadata (order, label, etc.)
  layerId: string;                     // Which layer to use
  shapeType: 'rectangle' | 'circle';   // What shapes can be created
  shapeDefaults: {                     // Default shape properties
    label: string;
    fill?: string;
    stroke?: string;
    width?: number;
    height?: number;
  };
  rules: {
    maxShapes: number;                 // How many shapes allowed (1 for home, Infinity for rooms)
    requiresSelection: boolean;        // Must select before creating more?
    canDelete: boolean;                // Can delete shapes?
  };
}

/**
 * Step Runtime State - tracks current state during execution
 */
export interface StepState {
  shapeIds: string[];                  // All shapes in this step
  selectedShapeId: string | null;      // Currently selected shape
  primaryShapeId: string | null;       // Main shape (for recentering)
}

/**
 * Step behavior interface - what each step must implement
 * @deprecated Use StepConfiguration and StepHandlers instead
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
