/**
 * ZoomManager
 *
 * Manages canvas zoom functionality with constraints:
 * - Default zoom: 1.0 (100%)
 * - Min zoom: 0.25 (25%)
 * - Max zoom: 2.0 (200%)
 * - Uses FIXED INCREMENTS (e.g., 0.25) for clean zoom levels: 25%, 50%, 75%, 100%, 125%, etc.
 *
 * State is stored in GridStateStore for centralized state management.
 *
 * Event-driven architecture:
 * - Store emits ZOOM_CHANGED events after zoom mutations
 * - Other managers subscribe to these events via EventBus
 */

import type Konva from 'konva';
import { GRID_CONSTANTS } from '@/Components/Grid/types/constants';
import type { GridStateStore } from '@/Components/Grid/core/state/GridStateStore';
import type { EventBus } from '@/Components/Grid/core/events';

export interface ZoomManagerConfig {
  store: GridStateStore;
  /** Optional EventBus for event-driven communication */
  eventBus?: EventBus;
}

export class ZoomManager {
  private stage: Konva.Stage;
  private store: GridStateStore;
  private eventBus?: EventBus;

  constructor(stage: Konva.Stage, config: ZoomManagerConfig) {
    this.stage = stage;
    this.store = config.store;
    this.eventBus = config.eventBus;
  }

  /**
   * Get current zoom level from store
   */
  getCurrentZoom(): number {
    return this.store.state.viewport.zoom;
  }

  /**
   * Zoom out (decrease scale by fixed increment)
   */
  zoomOut(): boolean {
    const currentZoom = this.getCurrentZoom();
    if (currentZoom <= GRID_CONSTANTS.MIN_ZOOM) {
      return false; // Already at minimum
    }

    // FIXED INCREMENT: subtract step (e.g., 1.0 - 0.25 = 0.75)
    const newZoom = currentZoom - GRID_CONSTANTS.ZOOM_STEP;
    const clampedZoom = Math.max(newZoom, GRID_CONSTANTS.MIN_ZOOM);

    // Round to avoid floating point issues (e.g., 0.7500000001)
    const roundedZoom = Math.round(clampedZoom * 100) / 100;

    this.setZoom(roundedZoom);
    return true;
  }

  /**
   * Zoom in (increase scale by fixed increment)
   */
  zoomIn(): boolean {
    const currentZoom = this.getCurrentZoom();
    if (currentZoom >= GRID_CONSTANTS.MAX_ZOOM) {
      return false; // Already at maximum
    }

    // FIXED INCREMENT: add step (e.g., 0.75 + 0.25 = 1.0)
    const newZoom = currentZoom + GRID_CONSTANTS.ZOOM_STEP;
    const clampedZoom = Math.min(newZoom, GRID_CONSTANTS.MAX_ZOOM);

    // Round to avoid floating point issues
    const roundedZoom = Math.round(clampedZoom * 100) / 100;

    this.setZoom(roundedZoom);
    return true;
  }

  /**
   * Reset zoom to default (1.0)
   */
  resetZoom(): void {
    this.setZoom(GRID_CONSTANTS.DEFAULT_ZOOM);
  }

  /**
   * Zoom based on mouse wheel delta
   * @param delta - Positive for zoom out, negative for zoom in
   */
  zoomWheel(delta: number): boolean {
    if (delta > 0) {
      // Scroll down - zoom out
      return this.zoomOut();
    } else if (delta < 0) {
      // Scroll up - zoom in
      return this.zoomIn();
    }
    return false;
  }

  /**
   * Set zoom to specific value
   */
  private setZoom(zoom: number): void {
    // Clamp between min and max
    const clampedZoom = Math.max(
      GRID_CONSTANTS.MIN_ZOOM,
      Math.min(zoom, GRID_CONSTANTS.MAX_ZOOM)
    );

    // Update store (this tracks the mutation)
    this.store.setZoom(clampedZoom);

    // Apply to stage
    this.stage.scale({ x: clampedZoom, y: clampedZoom });
    this.stage.batchDraw();

    // Note: ZOOM_CHANGED event is emitted by store.setZoom() above
    // Subscribers should listen to EventBus for zoom changes
  }

  /**
   * Check if can zoom in
   */
  canZoomIn(): boolean {
    return this.getCurrentZoom() < GRID_CONSTANTS.MAX_ZOOM;
  }

  /**
   * Check if can zoom out
   */
  canZoomOut(): boolean {
    return this.getCurrentZoom() > GRID_CONSTANTS.MIN_ZOOM;
  }

  /**
   * Get zoom as percentage
   */
  getZoomPercentage(): number {
    return Math.round(this.getCurrentZoom() * 100);
  }

  /**
   * Focus on a specific shape by centering it in the viewport
   * @param shape - Shape with x, y, width, height properties
   */
  focusOnShape(shape: { x: number; y: number; width: number; height: number }): void {
    const currentZoom = this.getCurrentZoom();

    // Calculate the center of the shape
    const shapeCenterX = shape.x + shape.width / 2;
    const shapeCenterY = shape.y + shape.height / 2;

    // Calculate the center of the stage viewport
    const stageCenterX = this.stage.width() / 2;
    const stageCenterY = this.stage.height() / 2;

    // Calculate the offset needed to center the shape
    const offsetX = stageCenterX - shapeCenterX * currentZoom;
    const offsetY = stageCenterY - shapeCenterY * currentZoom;

    // Update store with new pan position
    this.store.setPan({ x: offsetX, y: offsetY });

    // Apply the position to stage
    this.stage.position({ x: offsetX, y: offsetY });
    this.stage.batchDraw();
  }

  /**
   * Get current pan position from store
   */
  getPan(): { x: number; y: number } {
    return this.store.getViewport().pan;
  }

  /**
   * Set pan position
   */
  setPan(pan: { x: number; y: number }): void {
    this.store.setPan(pan);
    this.stage.position(pan);
    this.stage.batchDraw();
  }
}
