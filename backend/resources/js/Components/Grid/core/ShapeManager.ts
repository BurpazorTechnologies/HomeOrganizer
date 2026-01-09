/**
 * Shape Manager
 *
 * Manages the collection of shapes on the canvas.
 * Provides methods for CRUD operations and selection management.
 */

import type { Shape, RectangleShape, ShapeUpdate } from '../types/shapes';
import { ShapeFactory } from '../factories/ShapeFactory';
import { isValidId } from '../utils/idGenerator';

export class ShapeManager {
  private shapes: Map<string, Shape>;
  private selectedShapeId: string | null;
  private onShapesChange?: (shapes: Shape[]) => void;
  private onSelectionChange?: (id: string | null) => void;

  constructor() {
    this.shapes = new Map();
    this.selectedShapeId = null;
  }

  /**
   * Register callback for shape collection changes
   *
   * @param callback - Function to call when shapes change
   */
  onShapesUpdate(callback: (shapes: Shape[]) => void): void {
    this.onShapesChange = callback;
  }

  /**
   * Register callback for selection changes
   *
   * @param callback - Function to call when selection changes
   */
  onSelectionUpdate(callback: (id: string | null) => void): void {
    this.onSelectionChange = callback;
  }

  /**
   * Add a new shape to the collection
   *
   * @param shape - Shape to add
   * @returns The added shape
   * @throws Error if shape with same ID already exists
   */
  addShape(shape: Shape): Shape {
    if (this.shapes.has(shape.id)) {
      throw new Error(`Shape with ID ${shape.id} already exists`);
    }

    // Validate the shape
    ShapeFactory.validate(shape as RectangleShape);

    // Set z-index based on current count
    const shapeWithZIndex = {
      ...shape,
      zIndex: this.shapes.size,
    };

    this.shapes.set(shape.id, shapeWithZIndex);
    this.notifyShapesChange();

    return shapeWithZIndex;
  }

  /**
   * Create and add a new rectangle shape
   *
   * @param config - Shape configuration
   * @returns The created shape
   */
  createRectangle(config?: Parameters<typeof ShapeFactory.createRectangle>[0]): RectangleShape {
    const shape = ShapeFactory.createRectangle(config);
    this.addShape(shape);
    return shape;
  }

  /**
   * Create and add a rectangle at an indexed position
   *
   * @param config - Optional additional configuration
   * @returns The created shape
   */
  createRectangleAtNextPosition(config?: Parameters<typeof ShapeFactory.createRectangle>[0]): RectangleShape {
    const index = this.shapes.size;
    const shape = ShapeFactory.createRectangleAtIndex(index, config);
    this.addShape(shape);
    return shape;
  }

  /**
   * Remove a shape by ID
   *
   * @param id - ID of shape to remove
   * @returns True if shape was removed
   */
  removeShape(id: string): boolean {
    const existed = this.shapes.delete(id);

    if (existed) {
      // Deselect if this was the selected shape
      if (this.selectedShapeId === id) {
        this.deselectAll();
      }

      this.notifyShapesChange();
    }

    return existed;
  }

  /**
   * Remove the currently selected shape
   *
   * @returns True if a shape was removed
   */
  removeSelectedShape(): boolean {
    if (!this.selectedShapeId) {
      return false;
    }

    return this.removeShape(this.selectedShapeId);
  }

  /**
   * Update a shape with partial data
   *
   * @param id - ID of shape to update
   * @param updates - Partial shape data to update
   * @returns The updated shape
   * @throws Error if shape not found
   */
  updateShape(id: string, updates: ShapeUpdate): Shape {
    const shape = this.shapes.get(id);

    if (!shape) {
      throw new Error(`Shape with ID ${id} not found`);
    }

    const updatedShape = {
      ...shape,
      ...updates,
      id: shape.id, // Ensure ID cannot be changed
      type: shape.type, // Ensure type cannot be changed
      metadata: {
        ...shape.metadata,
        updatedAt: Date.now(),
      },
    };

    // Validate updated shape
    ShapeFactory.validate(updatedShape as RectangleShape);

    this.shapes.set(id, updatedShape);
    this.notifyShapesChange();

    return updatedShape;
  }

  /**
   * Get a shape by ID
   *
   * @param id - Shape ID
   * @returns The shape, or undefined if not found
   */
  getShape(id: string): Shape | undefined {
    return this.shapes.get(id);
  }

  /**
   * Get all shapes as an array
   *
   * @returns Array of all shapes, sorted by z-index
   */
  getAllShapes(): Shape[] {
    return Array.from(this.shapes.values()).sort((a, b) => a.zIndex - b.zIndex);
  }

  /**
   * Get the number of shapes
   *
   * @returns Shape count
   */
  getShapeCount(): number {
    return this.shapes.size;
  }

  /**
   * Check if a shape exists
   *
   * @param id - Shape ID to check
   * @returns True if shape exists
   */
  hasShape(id: string): boolean {
    return this.shapes.has(id);
  }

  /**
   * Clear all shapes
   */
  clearAllShapes(): void {
    this.shapes.clear();
    this.deselectAll();
    this.notifyShapesChange();
  }

  /**
   * Select a shape by ID
   *
   * @param id - Shape ID to select
   * @returns True if shape was selected
   */
  selectShape(id: string): boolean {
    if (!this.shapes.has(id)) {
      console.warn(`Cannot select shape: ID ${id} not found`);
      return false;
    }

    this.selectedShapeId = id;
    this.notifySelectionChange();
    return true;
  }

  /**
   * Deselect all shapes
   */
  deselectAll(): void {
    if (this.selectedShapeId !== null) {
      this.selectedShapeId = null;
      this.notifySelectionChange();
    }
  }

  /**
   * Get the currently selected shape ID
   *
   * @returns Selected shape ID, or null if none selected
   */
  getSelectedShapeId(): string | null {
    return this.selectedShapeId;
  }

  /**
   * Get the currently selected shape
   *
   * @returns Selected shape, or undefined if none selected
   */
  getSelectedShape(): Shape | undefined {
    return this.selectedShapeId ? this.shapes.get(this.selectedShapeId) : undefined;
  }

  /**
   * Check if a shape is selected
   *
   * @param id - Shape ID to check
   * @returns True if this shape is selected
   */
  isShapeSelected(id: string): boolean {
    return this.selectedShapeId === id;
  }

  /**
   * Move shape to front (highest z-index)
   *
   * @param id - Shape ID
   */
  bringToFront(id: string): void {
    const shape = this.shapes.get(id);
    if (!shape) return;

    const maxZIndex = Math.max(...this.getAllShapes().map(s => s.zIndex), 0);
    this.updateShape(id, { zIndex: maxZIndex + 1 });
  }

  /**
   * Move shape to back (lowest z-index)
   *
   * @param id - Shape ID
   */
  sendToBack(id: string): void {
    const shape = this.shapes.get(id);
    if (!shape) return;

    const minZIndex = Math.min(...this.getAllShapes().map(s => s.zIndex), 0);
    this.updateShape(id, { zIndex: minZIndex - 1 });
  }

  // ==================== Private Methods ====================

  /**
   * Notify registered callback of shapes change
   */
  private notifyShapesChange(): void {
    if (this.onShapesChange) {
      this.onShapesChange(this.getAllShapes());
    }
  }

  /**
   * Notify registered callback of selection change
   */
  private notifySelectionChange(): void {
    if (this.onSelectionChange) {
      this.onSelectionChange(this.selectedShapeId);
    }
  }
}
