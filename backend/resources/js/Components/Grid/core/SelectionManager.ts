import Konva from 'konva';
import type { GridStateStore, SelectionState } from '@/Components/Grid/core/state/GridStateStore';

// Re-export SelectionState for consumers who import from SelectionManager
export type { SelectionState } from '@/Components/Grid/core/state/GridStateStore';

/**
 * SelectionManager
 *
 * Centralizes all selection logic and state management.
 * Responsible for:
 * - Tracking the currently selected shape/node (via GridStateStore)
 * - Attaching/detaching visual feedback (transformer, highlights)
 * - Managing selection state transitions
 * - Exposing selection-related functions for other managers
 *
 * Key change: Selection state is now backed by GridStateStore (single source of truth).
 * Local state only tracks visual-only concerns (stroke widths, dashes for restoration).
 */

export interface SelectionCallbacks {
  onSelectionChange?: (state: SelectionState) => void;
}

export class SelectionManager {
  // Store reference for selection state (single source of truth)
  private store: GridStateStore | null = null;

  private shapeManager: any;
  private transformManager: any;
  private callbacks: SelectionCallbacks = {};

  // Visual state storage for restoration (local only - not persisted)
  private originalStrokeWidths: Map<string, number> = new Map();
  private originalDashes: Map<string, number[]> = new Map();

  constructor() {
    // Managers and store will be set via setManagers() and setStore()
  }

  /**
   * Set the GridStateStore reference (for selection state)
   */
  setStore(store: GridStateStore): void {
    this.store = store;
  }

  /**
   * Set manager references (called after all managers are created)
   */
  setManagers(managers: {
    shapeManager: any;
    transformManager: any;
  }): void {
    this.shapeManager = managers.shapeManager;
    this.transformManager = managers.transformManager;
  }

  /**
   * Register callbacks for selection events
   */
  onSelectionChange(callback: (state: SelectionState) => void): void {
    this.callbacks.onSelectionChange = callback;
  }

  /**
   * Get current selection state from store (single source of truth)
   */
  getState(): SelectionState {
    if (this.store) {
      return { ...this.store.state.selection };
    }
    // Fallback for when store isn't set yet
    return {
      selectedShapeId: null,
      selectedLayerId: null,
      isParentSelected: false,
    };
  }

  /**
   * Get the currently selected shape ID from store (single source of truth)
   */
  getSelectedShapeId(): string | null {
    return this.store?.state.selection.selectedShapeId ?? null;
  }

  /**
   * Check if a specific shape is selected
   */
  isSelected(shapeId: string): boolean {
    return this.store?.state.selection.selectedShapeId === shapeId;
  }

  /**
   * Check if a parent shape is currently selected
   */
  isParentSelected(): boolean {
    return this.store?.state.selection.isParentSelected ?? false;
  }

  /**
   * Select a shape (regular selection with transformer)
   */
  select(shapeId: string, layerId: string): void {
    // Clear previous selection visuals
    this.clearSelectionVisuals();

    // Update state via store (single source of truth)
    if (this.store) {
      this.store.select(shapeId, layerId, false);
    }

    // Apply selection visuals
    this.shapeManager?.selectShape(shapeId);
    const node = this.shapeManager?.getShapeNode(shapeId);
    if (node) {
      this.transformManager?.attachTo(node);
    }

    this.notifyChange();
  }

  /**
   * Select a parent shape (special visual state - no transformer, highlighted border)
   */
  selectAsParent(shapeId: string, layerId: string): void {
    // Clear previous selection
    this.clearSelectionVisuals();

    // Store original visual state
    const parentNode = this.shapeManager?.getShapeNode(shapeId);
    if (parentNode) {
      this.originalStrokeWidths.set(shapeId, parentNode.strokeWidth());
      this.originalDashes.set(shapeId, parentNode.dash() || []);

      // Apply parent selection visual
      parentNode.strokeWidth(4);
      parentNode.dash([10, 5]);
      parentNode.getLayer()?.batchDraw();
    }

    // Update state via store (single source of truth)
    if (this.store) {
      this.store.select(shapeId, layerId, true); // isParent = true
    }

    // Deselect in shape manager and detach transformer
    this.shapeManager?.deselectShape();
    this.transformManager?.detach();

    this.notifyChange();
  }

  /**
   * Deselect the currently selected shape
   */
  deselect(): void {
    this.clearSelectionVisuals();

    // Update state via store (single source of truth)
    if (this.store) {
      this.store.deselect();
    }

    this.shapeManager?.deselectShape();
    this.transformManager?.detach();

    this.notifyChange();
  }

  /**
   * Clear selection visuals (restore original states)
   */
  private clearSelectionVisuals(): void {
    // Restore original stroke widths and dashes for any modified shapes
    this.originalStrokeWidths.forEach((strokeWidth, shapeId) => {
      const node = this.shapeManager?.getShapeNode(shapeId);
      if (node) {
        node.strokeWidth(strokeWidth);
        const originalDash = this.originalDashes.get(shapeId) || [];
        node.dash(originalDash);
        node.getLayer()?.batchDraw();
      }
    });

    this.originalStrokeWidths.clear();
    this.originalDashes.clear();
  }

  /**
   * Reset parent visual state (when transitioning away from parent selection)
   */
  resetParentVisual(parentShapeId: string): void {
    const parentNode = this.shapeManager?.getShapeNode(parentShapeId);
    if (parentNode) {
      const originalStrokeWidth = this.originalStrokeWidths.get(parentShapeId) || 2;
      const originalDash = this.originalDashes.get(parentShapeId) || [];

      parentNode.strokeWidth(originalStrokeWidth);
      parentNode.dash(originalDash);
      parentNode.getLayer()?.batchDraw();

      this.originalStrokeWidths.delete(parentShapeId);
      this.originalDashes.delete(parentShapeId);
    }
  }

  /**
   * Notify listeners of selection change
   */
  private notifyChange(): void {
    if (this.callbacks.onSelectionChange) {
      this.callbacks.onSelectionChange(this.getState());
    }
  }

  /**
   * Clear all state (for full reset)
   */
  clear(): void {
    this.clearSelectionVisuals();

    // Clear state via store (single source of truth)
    if (this.store) {
      this.store.deselect();
    }

    this.notifyChange();
  }
}
