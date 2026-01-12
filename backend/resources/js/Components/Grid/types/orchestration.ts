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
 * Note: event is optional to support event-driven clicks via EventBus
 */
export interface ClickContext {
  target: ClickTarget;
  position: { x: number; y: number };
  shapeId?: string;
  event?: Konva.KonvaEventObject<MouseEvent>;
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
  pendingAreaName?: { areaId: string; shapeId: string } | null;
  selectedShapeName?: string | null;
  parentAreaId?: string | null; // Parent area ID for Step 2+
}

/**
 * Manager instances passed to steps
 * All managers are typed as 'any' here to avoid circular imports.
 * The actual types are defined in their respective manager files.
 */
export interface ManagerInstances {
  shapeManager: any;
  transformManager: any;
  labelManager: any;
  gridManager: any;
  layerManager: any;
  areaManager: any;
  selectionManager: any;
  zoomManager?: any; // For zoom operations
  persistenceManager?: any; // For save/load operations
  boundsService?: any; // For live bounds queries
}

/**
 * Parent context for nested area creation
 */
export interface ParentContext {
  parentAreaId: string;
  parentShapeId: string;
  parentLayerId: string;  // Layer ID of the parent layer (for hierarchy)
  parentBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
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
    requiresExplicitCreate?: boolean;  // Requires "Create Area" button click before creating
  };
  parentContext?: ParentContext;       // Parent context for nested areas
}

/**
 * Step Runtime State - tracks current state during execution
 */
export interface StepState {
  shapeIds: string[];                  // All shapes in this step
  selectedShapeId: string | null;      // Currently selected shape
  primaryShapeId: string | null;       // Main shape (for recentering)
  isSaved: boolean;                    // Whether the current work has been saved
  parentAreaId?: string | null;        // Parent area ID for nested areas
  parentShapeId?: string | null;       // Parent shape ID for nested areas
  pendingAreaName?: {                  // Pending area name input
    areaId: string;
    shapeId: string;
  } | null;
  isCreationMode?: boolean;            // Whether we're in explicit creation mode (waiting for click to create)
  deletedLastChild?: boolean;          // Flag to track if last child was deleted (for transition on save)
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
