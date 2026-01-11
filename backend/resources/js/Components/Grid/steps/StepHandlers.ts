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
      // In Step 2+, if requiresExplicitCreate is set and we're NOT in creation mode,
      // clicking canvas should select parent (regardless of how many child shapes exist)
      if (config.rules.requiresExplicitCreate && !state.isCreationMode && config.parentContext) {
        this.selectParent(state, managers);
        return;
      }

      // Check if can create more shapes
      if (state.shapeIds.length < config.rules.maxShapes) {
        // If we have parent context, validate click is within parent bounds
        if (config.parentContext) {
          if (!this.isPositionWithinBounds(context.position, config.parentContext.parentBounds)) {
            // Click outside parent bounds - select parent instead of ignoring
            this.selectParent(state, managers);
            return;
          }
        }
        this.createShape(context.position, config, state, managers);
        // Disable creation mode after creating one shape
        state.isCreationMode = false;
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
        // Disable creation mode when selecting a shape
        state.isCreationMode = false;
      }
    }
  }

  /**
   * Select parent shape (for Step 2 when clicking outside child shapes)
   */
  private static selectParent(
    state: StepState,
    managers: ManagerInstances
  ): void {
    if (!state.parentShapeId) {
      console.log('selectParent: No parent shape ID in state');
      return;
    }

    const parentNode = managers.shapeManager.getShapeNode(state.parentShapeId);
    if (!parentNode) {
      console.log('selectParent: Parent node not found for ID:', state.parentShapeId);
      return;
    }

    // Deselect any currently selected child shape and detach transformer
    managers.shapeManager.deselectShape();
    managers.transformManager.detach();

    // Visual feedback: add a subtle highlight stroke to parent
    parentNode.strokeWidth(4);
    parentNode.dash([10, 5]);
    parentNode.getLayer()?.batchDraw();

    // Set parent as "selected" in state
    state.selectedShapeId = state.parentShapeId;

    console.log('Parent shape selected - click "Create Area" to add child shapes');
  }

  /**
   * Check if a position is within given bounds
   */
  private static isPositionWithinBounds(
    position: { x: number; y: number },
    bounds: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      position.x >= bounds.x &&
      position.x <= bounds.x + bounds.width &&
      position.y >= bounds.y &&
      position.y <= bounds.y + bounds.height
    );
  }

  /**
   * Check if a new shape would overlap with existing shapes
   */
  private static wouldOverlap(
    newShape: { x: number; y: number; width: number; height: number },
    existingShapeIds: string[],
    managers: ManagerInstances
  ): boolean {
    for (const shapeId of existingShapeIds) {
      const existingShape = managers.shapeManager.getShape(shapeId);
      if (!existingShape) continue;

      // Check for overlap using AABB (Axis-Aligned Bounding Box) collision
      const overlap = !(
        newShape.x + newShape.width <= existingShape.x ||
        newShape.x >= existingShape.x + existingShape.width ||
        newShape.y + newShape.height <= existingShape.y ||
        newShape.y >= existingShape.y + existingShape.height
      );

      if (overlap) {
        return true;
      }
    }

    return false;
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
    const parentBounds = config.parentContext?.parentBounds;

    // Check for overlaps if there are existing shapes
    if (state.shapeIds.length > 0) {
      const defaultWidth = config.shapeDefaults.width || 200;
      const defaultHeight = config.shapeDefaults.height || 200;

      const wouldOverlap = this.wouldOverlap(
        {
          x: position.x,
          y: position.y,
          width: defaultWidth,
          height: defaultHeight,
        },
        state.shapeIds,
        managers
      );

      if (wouldOverlap) {
        console.warn('Cannot create shape - would overlap with existing shape');
        return;
      }
    }

    const shape = managers.shapeManager.createRectangle(
      position.x,
      position.y,
      {
        fill: config.shapeDefaults.fill,
        stroke: config.shapeDefaults.stroke,
        label: config.shapeDefaults.label,
        width: config.shapeDefaults.width,
        height: config.shapeDefaults.height,
        parentBounds,
        layerId: config.layerId,
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

    // Create area in AreaManager - CRITICAL: Home area must be root
    if (config.parentContext) {
      // Creating a child area
      const areaId = `area_${Date.now()}`;
      managers.areaManager.createChildArea(
        areaId,
        'area',
        shape.id,
        config.layerId,
        config.parentContext.parentAreaId
      );
    } else {
      // Creating the HOME AREA - This is the ROOT of the entire hierarchy
      const homeAreaId = 'home_area_root';
      managers.areaManager.createHomeArea(homeAreaId, shape.id, config.layerId);
      console.log(`Created HOME AREA (root) with ID: ${homeAreaId}, shapeId: ${shape.id}`);
    }

    // Show dimension label initially (will be replaced when user adds a name)
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
    // If we were previously selecting the parent, reset its visual state
    if (state.parentShapeId && state.selectedShapeId === state.parentShapeId) {
      const parentNode = managers.shapeManager.getShapeNode(state.parentShapeId);
      if (parentNode) {
        parentNode.strokeWidth(2); // Reset to default
        parentNode.dash([]); // Remove dashed line
        parentNode.getLayer()?.batchDraw();
      }
    }

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
    // Step 2+ with parent context
    if (config.parentContext) {
      if (state.isCreationMode) {
        return `Click inside the parent area to create a new ${config.shapeDefaults.label.toLowerCase()}`;
      }

      if (state.shapeIds.length === 0) {
        return `Click "Create Area" to start adding ${config.shapeDefaults.label.toLowerCase()}s`;
      }

      if (state.selectedShapeId === state.parentShapeId) {
        return `Parent selected. Click "Create Area" to add more ${config.shapeDefaults.label.toLowerCase()}s`;
      }

      if (state.selectedShapeId) {
        return `${config.shapeDefaults.label} selected. Edit label, resize, or click outside to select parent`;
      }

      return `Click a shape to edit it, or click outside to select parent`;
    }

    // Step 1 (Home Area)
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
   * Save the current step (persist via PersistenceManager)
   */
  static async saveStep(
    config: StepConfiguration,
    state: StepState,
    managers: ManagerInstances
  ): Promise<void> {
    const pm = managers.persistenceManager;

    if (!pm) {
      console.error('StepHandlers: PersistenceManager not available');
      return;
    }

    // Check if there are ANY shapes globally across all layers
    const allLayers = managers.layerManager.getAllLayers();
    const hasAnyShapes = allLayers.some((layer: any) => layer.shapeIds && layer.shapeIds.length > 0);

    // If no shapes exist globally, clear everything
    if (!hasAnyShapes) {
      await pm.clear();
      state.isSaved = true;
      console.log('No shapes in any layer - cleared all saved data');
      return;
    }

    // Step 1 (Home Area) - save home area data using LayerManager for consistency
    if (config.step.order === 1) {
      const layer = managers.layerManager.getLayer(config.layerId);
      if (layer && layer.shapeIds.length > 0) {
        await pm.saveHomeArea(
          config.step.id,
          config.layerId,
          layer.shapeIds,
          layer.primaryShapeId
        );
      }
    }

    // Step 2+ (Child Areas) - save child shapes within parent context
    if (config.step.order >= 2 && config.parentContext) {
      const parentAreaId = state.parentAreaId || 'unknown';

      // First, ensure home area is still saved (from layer 1)
      const layer1 = managers.layerManager.getLayer('layer_1');
      if (layer1 && layer1.shapeIds.length > 0) {
        await pm.saveHomeArea(
          'step_home_area',
          'layer_1',
          layer1.shapeIds,
          layer1.primaryShapeId
        );
      }

      // Then save child areas using LayerManager for consistency
      const layer2 = managers.layerManager.getLayer(config.layerId);
      if (layer2 && layer2.shapeIds.length > 0) {
        await pm.saveChildAreas(
          parentAreaId,
          state.parentShapeId || '',
          config.step.id,
          config.layerId,
          layer2.shapeIds,
          config.step.order
        );
      }
    }

    // Always save area hierarchy
    await pm.saveAreaHierarchy();

    // Mark as saved
    state.isSaved = true;
  }

  /**
   * Load saved home area via PersistenceManager
   */
  static async loadHomeArea(
    config: StepConfiguration,
    state: StepState,
    managers: ManagerInstances
  ): Promise<boolean> {
    const pm = managers.persistenceManager;

    if (!pm) {
      console.error('StepHandlers: PersistenceManager not available');
      return false;
    }

    // Clear existing shapes (make a copy first to avoid mutation issues)
    const shapesToDelete = [...state.shapeIds];
    shapesToDelete.forEach(id => {
      this.deleteShape(id, config, state, managers);
    });

    // Load via PersistenceManager
    const loaded = await pm.loadHomeArea(
      config.layerId,
      (shape: any, isPrimary: boolean) => {
        // Callback for each shape created
        state.shapeIds.push(shape.id);

        if (isPrimary) {
          state.primaryShapeId = shape.id;

          // Only create HOME AREA if not already restored from hierarchy
          // (AreaManager.deserialize() is called first in restoreState)
          const homeAreaId = 'home_area_root';
          const existingArea = managers.areaManager.getArea(homeAreaId);
          if (!existingArea) {
            managers.areaManager.createHomeArea(homeAreaId, shape.id, config.layerId);
            console.log(`Created HOME AREA (root) with ID: ${homeAreaId}, shapeId: ${shape.id}`);
          } else {
            console.log(`HOME AREA already exists from deserialization, shapeId: ${shape.id}`);
          }
        }
      }
    );

    if (loaded) {
      state.isSaved = true;
    }

    return loaded;
  }

  /**
   * Load saved child areas via PersistenceManager
   */
  static async loadChildAreas(
    config: StepConfiguration,
    state: StepState,
    managers: ManagerInstances
  ): Promise<boolean> {
    const pm = managers.persistenceManager;

    if (!pm) {
      console.error('StepHandlers: PersistenceManager not available');
      return false;
    }

    if (!state.parentAreaId) {
      console.log('No parent area ID in state');
      return false;
    }

    // Clear existing shapes in this step (make a copy first to avoid mutation issues)
    const shapesToDelete = [...state.shapeIds];
    shapesToDelete.forEach(id => {
      this.deleteShape(id, config, state, managers);
    });

    // Get parent bounds from config
    const parentBounds = config.parentContext ? {
      x: config.parentContext.parentBounds.x,
      y: config.parentContext.parentBounds.y,
      width: config.parentContext.parentBounds.width,
      height: config.parentContext.parentBounds.height,
    } : { x: 0, y: 0, width: 1000, height: 1000 };

    // Load via PersistenceManager
    const loaded = await pm.loadChildAreas(
      state.parentAreaId,
      config.layerId,
      parentBounds,
      (shape: any, isPrimary: boolean) => {
        // Callback for each shape created
        state.shapeIds.push(shape.id);

        if (isPrimary) {
          state.primaryShapeId = shape.id;
        }
      }
    );

    if (loaded) {
      state.isSaved = true;
    }

    return loaded;
  }

  /**
   * Save area name
   */
  static saveAreaName(
    areaId: string,
    name: string,
    state: StepState,
    managers: ManagerInstances
  ): void {
    managers.areaManager.setAreaName(areaId, name);

    const area = managers.areaManager.getArea(areaId);
    if (!area) return;

    const shape = managers.shapeManager.getShape(area.shapeId);
    if (!shape) return;

    managers.labelManager.updateAreaNameLabel(area.shapeId, name, {
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
    });

    state.pendingAreaName = null;
  }

  /**
   * Save shape label/name
   */
  static saveShapeLabel(
    shapeId: string,
    label: string,
    state: StepState,
    managers: ManagerInstances
  ): void {
    const shape = managers.shapeManager.getShape(shapeId);
    if (!shape) return;

    // Update the shape's label property
    shape.label = label;

    // Update the visual label on canvas
    if (label.trim()) {
      // Show area name label (centered on shape)
      managers.labelManager.updateAreaNameLabel(shapeId, label, {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
      });
    } else {
      // If empty, remove existing label and show dimensions instead
      managers.labelManager.removeLabel(shapeId);
      managers.labelManager.updateLabel(shapeId, {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
      });
    }
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
      onEnableCreationMode?: () => void;
    }
  ): ToolbarAction[] {
    const actions: ToolbarAction[] = [];

    // Delete action (if allowed and shape is selected, but NOT parent)
    if (config.rules.canDelete && state.selectedShapeId && state.selectedShapeId !== state.parentShapeId) {
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

    // Create Area button (Step 1 only) - show only when saved AND selected
    if (config.step.order === 1) {
      const shouldShow = state.primaryShapeId && state.isSaved && state.selectedShapeId;

      if (shouldShow) {
        actions.push({
          id: 'create_area',
          label: 'Create Area',
          variant: 'primary',
          disabled: false,
          action: () => callbacks.onNextStep(),
        });
      }
    }

    // Create Area button (Step 2+) - show when parent is selected
    if (config.step.order >= 2 && config.parentContext) {
      // Show when parent shape is selected OR no shapes exist yet
      const isParentSelected = state.selectedShapeId === state.parentShapeId;
      const noChildShapes = state.shapeIds.length === 0;

      if (isParentSelected || noChildShapes) {
        actions.push({
          id: 'create_child_area',
          label: 'Create Area',
          variant: 'primary',
          disabled: false,
          action: () => callbacks.onEnableCreationMode?.(),
        });
      }
    }

    return actions;
  }
}
