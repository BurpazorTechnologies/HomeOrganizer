/**
 * Step Handlers
 *
 * Stateless handlers for step behavior.
 * All logic is driven by configuration + state passed as parameters.
 */

import type {
  ClickContext,
  StepConfiguration,
  StepState,
  ToolbarAction,
  ManagerInstances,
} from '@/Components/Grid/types/orchestration';
import { localStorageService } from '@/Services/localStorage';

export class StepHandlers {
  /**
   * Handle click based on config and state
   */
  static handleClick(
    context: ClickContext,
    config: StepConfiguration,
    state: StepState,
    managers: ManagerInstances
  ): void {
    // Clicked on canvas
    if (context.target === 'canvas') {
      // Check if can create more shapes
      if (state.shapeIds.length < config.rules.maxShapes) {
        this.createShape(context.position, config, state, managers);
      } else {
        // Deselect if clicking empty space
        managers.shapeManager.deselectShape();
        managers.transformManager.detach();
        state.selectedShapeId = null;
      }
      return;
    }

    // Clicked on a shape
    if (context.target === 'shape' && context.shapeId) {
      if (state.shapeIds.includes(context.shapeId)) {
        this.selectShape(context.shapeId, state, managers);
      }
    }
  }

  /**
   * Create shape based on configuration
   */
  private static createShape(
    position: { x: number; y: number },
    config: StepConfiguration,
    state: StepState,
    managers: ManagerInstances
  ): void {
    const shape = managers.shapeManager.createRectangle(
      position.x,
      position.y,
      {
        fill: config.shapeDefaults.fill,
        stroke: config.shapeDefaults.stroke,
        label: config.shapeDefaults.label,
        width: config.shapeDefaults.width,
        height: config.shapeDefaults.height,
      }
    );

    // Update state
    state.shapeIds.push(shape.id);
    if (!state.primaryShapeId) {
      state.primaryShapeId = shape.id;
    }

    // Add to layer
    managers.layerManager.addShapeToLayer(
      config.layerId,
      shape.id,
      state.primaryShapeId === shape.id
    );

    // Create label
    managers.labelManager.updateLabel(shape.id, {
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
    });

    // Auto-select
    this.selectShape(shape.id, state, managers);
  }

  /**
   * Select shape
   */
  private static selectShape(
    shapeId: string,
    state: StepState,
    managers: ManagerInstances
  ): void {
    state.selectedShapeId = shapeId;
    managers.shapeManager.selectShape(shapeId);
    const node = managers.shapeManager.getShapeNode(shapeId);
    if (node) {
      managers.transformManager.attachTo(node);
    }
  }

  /**
   * Delete shape
   */
  static deleteShape(
    shapeId: string,
    config: StepConfiguration,
    state: StepState,
    managers: ManagerInstances
  ): void {
    // Remove from state
    state.shapeIds = state.shapeIds.filter(id => id !== shapeId);
    if (state.primaryShapeId === shapeId) {
      state.primaryShapeId = state.shapeIds.length > 0 ? state.shapeIds[0] : null;
    }
    if (state.selectedShapeId === shapeId) {
      state.selectedShapeId = null;
    }

    // Remove from managers
    managers.shapeManager.deleteShape(shapeId);
    managers.labelManager.removeLabel(shapeId);
    managers.transformManager.detach();
    managers.layerManager.removeShapeFromLayer(config.layerId, shapeId);
  }

  /**
   * Get description based on config and state
   */
  static getDescription(config: StepConfiguration, state: StepState): string {
    if (state.shapeIds.length === 0) {
      return `Click anywhere on the grid to create your ${config.shapeDefaults.label.toLowerCase()}`;
    }

    if (state.isSaved) {
      if (state.selectedShapeId) {
        return `${config.shapeDefaults.label} saved. You can now create areas within this space`;
      }
      return `${config.shapeDefaults.label} saved. Click it to select`;
    }

    if (state.selectedShapeId) {
      return `${config.shapeDefaults.label} selected. Resize by dragging edges, then save`;
    }

    return `${config.shapeDefaults.label} created. Click it to select and save`;
  }

  /**
   * Save the current step (persist to localStorage)
   */
  static saveStep(
    config: StepConfiguration,
    state: StepState,
    managers: ManagerInstances
  ): void {
    // If no shapes, save null to clear localStorage
    if (state.shapeIds.length === 0) {
      localStorageService.saveHomeArea(null as any);
      state.isSaved = true;
      console.log('Saved empty state to localStorage (cleared)');
      return;
    }

    // Prepare data to save
    const homeAreaData = {
      stepId: config.step.id,
      layerId: config.layerId,
      shapes: state.shapeIds.map(id => {
        const shape = managers.shapeManager.getShape(id);
        return {
          id: shape.id,
          type: shape.type,
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height,
          fill: shape.fill,
          stroke: shape.stroke,
          label: shape.label,
        };
      }),
      primaryShapeId: state.primaryShapeId,
    };

    // Save to localStorage
    localStorageService.saveHomeArea(homeAreaData);

    // Mark as saved
    state.isSaved = true;

    console.log('Saved to localStorage:', homeAreaData);
  }

  /**
   * Load saved home area from localStorage
   */
  static loadHomeArea(
    config: StepConfiguration,
    state: StepState,
    managers: ManagerInstances
  ): boolean {
    const savedData = localStorageService.getHomeArea();

    if (!savedData || !savedData.shapes || savedData.shapes.length === 0) {
      console.log('No saved home area found');
      return false;
    }

    // Clear existing shapes
    state.shapeIds.forEach(id => {
      this.deleteShape(id, config, state, managers);
    });

    // Recreate shapes from saved data
    savedData.shapes.forEach((shapeData, index) => {
      const shape = managers.shapeManager.createRectangle(
        shapeData.x,
        shapeData.y,
        {
          fill: shapeData.fill,
          stroke: shapeData.stroke,
          label: shapeData.label,
          width: shapeData.width,
          height: shapeData.height,
        }
      );

      // Update state
      state.shapeIds.push(shape.id);

      // Add to layer
      const isPrimary = shapeData.id === savedData.primaryShapeId || index === 0;
      if (isPrimary) {
        state.primaryShapeId = shape.id;
      }

      managers.layerManager.addShapeToLayer(
        config.layerId,
        shape.id,
        isPrimary
      );

      // Create label
      managers.labelManager.updateLabel(shape.id, {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
      });
    });

    // Mark as saved
    state.isSaved = true;

    console.log('Loaded home area from localStorage:', savedData);
    return true;
  }

  /**
   * Get toolbar actions based on config and state
   */
  static getToolbarActions(
    config: StepConfiguration,
    state: StepState,
    callbacks: {
      onDelete: (shapeId: string) => void;
      onSave: () => void;
      onNextStep: () => void;
    }
  ): ToolbarAction[] {
    const actions: ToolbarAction[] = [];

    // Delete action (if allowed and shape is selected)
    if (config.rules.canDelete && state.selectedShapeId) {
      actions.push({
        id: 'delete',
        label: 'Delete',
        variant: 'danger',
        action: () => callbacks.onDelete(state.selectedShapeId!),
      });
    }

    // Save action - ALWAYS available so users can save current state anytime
    actions.push({
      id: 'save',
      label: 'Save',
      variant: 'primary',
      action: () => callbacks.onSave(),
    });

    // Next step action (if saved and has primary shape)
    if (state.primaryShapeId && state.isSaved) {
      actions.push({
        id: 'next_step',
        label: 'Create Area',
        variant: 'primary',
        disabled: true, // Future feature
        action: () => callbacks.onNextStep(),
      });
    }

    return actions;
  }
}
