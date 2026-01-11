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

    if (state.selectedShapeId) {
      return `${config.shapeDefaults.label} selected. Resize by dragging edges, or use toolbar actions`;
    }

    return `${config.shapeDefaults.label} created. Click it to select and see options`;
  }

  /**
   * Get toolbar actions based on config and state
   */
  static getToolbarActions(
    config: StepConfiguration,
    state: StepState,
    callbacks: {
      onDelete: (shapeId: string) => void;
      onNextStep: () => void;
    }
  ): ToolbarAction[] {
    if (!state.selectedShapeId) {
      return [];
    }

    const actions: ToolbarAction[] = [];

    // Delete action (if allowed)
    if (config.rules.canDelete) {
      actions.push({
        id: 'delete',
        label: 'Delete',
        variant: 'danger',
        action: () => callbacks.onDelete(state.selectedShapeId!),
      });
    }

    // Next step action (if primary shape exists)
    if (state.primaryShapeId) {
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
