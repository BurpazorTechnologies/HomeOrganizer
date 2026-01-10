/**
 * Step 1: Lot Area Creation
 *
 * First step where user creates the lot area (property boundary).
 * Only ONE lot area can exist at a time.
 *
 * Click Behaviors:
 * - Click empty canvas + no lot exists → Create lot area
 * - Click empty canvas + lot exists → Deselect
 * - Click lot area shape → Select it (show resize handles)
 *
 * Toolbar Actions (when lot selected):
 * - Delete: Remove the lot area
 * - Create Floor: Transition to Step 2 (future)
 */

import { BaseStep } from './BaseStep';
import type { ClickContext, ToolbarAction } from '@/Components/Grid/types/orchestration';
import type { RectangleShape } from '@/Components/Grid/types/shapes';
import { STEPS } from '@/Components/Grid/types/steps';

export class Step1LotArea extends BaseStep {
  private lotAreaShape: RectangleShape | null = null;

  constructor(managers: any) {
    super(STEPS.LOT_AREA, managers);
  }

  /**
   * Handle click events for Step 1
   */
  handleClick(context: ClickContext): void {
    // Case 1: Clicked on empty canvas
    if (context.target === 'canvas') {
      if (!this.lotAreaShape) {
        // Create the lot area (only once!)
        this.createLotArea(context.position);
      } else {
        // Deselect if clicking empty space
        this.deselectShape();
      }
      return;
    }

    // Case 2: Clicked on a shape
    if (context.target === 'shape' && context.shapeId) {
      // Check if it's the lot area shape
      if (context.shapeId === this.lotAreaShape?.id) {
        this.selectShape(context.shapeId);
      }
    }
  }

  /**
   * Get current description based on state
   */
  getDescription(): string {
    if (!this.lotAreaShape) {
      return 'Click anywhere on the grid to create your lot area';
    }

    const selectedShapeId = this.managers.shapeManager?.getSelectedShapeId();
    if (selectedShapeId === this.lotAreaShape.id) {
      return 'Lot area selected. Resize by dragging edges, or use toolbar actions';
    }

    return 'Lot area created. Click it to select and see options';
  }

  /**
   * Get toolbar actions based on current state
   */
  getToolbarActions(): ToolbarAction[] {
    // No actions if lot area doesn't exist
    if (!this.lotAreaShape) {
      return [];
    }

    const selectedShapeId = this.managers.shapeManager?.getSelectedShapeId();

    // Only show actions if lot area is selected
    if (selectedShapeId !== this.lotAreaShape.id) {
      return [];
    }

    return [
      {
        id: 'delete_lot',
        label: 'Delete',
        variant: 'danger',
        action: () => this.deleteLotArea(),
      },
      {
        id: 'create_floor',
        label: 'Create Floor',
        variant: 'primary',
        disabled: true, // Future feature
        action: () => {
          console.log('Create Floor - Coming soon!');
        },
      },
    ];
  }

  /**
   * Create the lot area shape
   */
  private createLotArea(position: { x: number; y: number }): void {
    // Use color from step config
    const color = this.stepConfig.color!;

    this.lotAreaShape = this.managers.shapeManager.createRectangle(
      position.x,
      position.y,
      {
        fill: color.fill,
        stroke: color.stroke,
        label: 'Lot Area',
      }
    );

    // Create label for the shape
    this.managers.labelManager?.updateLabel(this.lotAreaShape.id, {
      x: this.lotAreaShape.x,
      y: this.lotAreaShape.y,
      width: this.lotAreaShape.width,
      height: this.lotAreaShape.height,
    });

    // Auto-select the newly created shape
    this.selectShape(this.lotAreaShape.id);
  }

  /**
   * Delete the lot area
   */
  private deleteLotArea(): void {
    if (!this.lotAreaShape) return;

    this.deleteShape(this.lotAreaShape.id);
    this.lotAreaShape = null;
  }

  /**
   * Called when exiting Step 1
   */
  onExit(): void {
    // Deselect when leaving this step
    this.deselectShape();
  }
}
