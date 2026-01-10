/**
 * ZoomManager
 *
 * Manages canvas zoom functionality with constraints:
 * - Default zoom: 1.0 (100%, cannot zoom in beyond this)
 * - Can only zoom OUT from default
 * - Once zoomed out, can zoom back IN to default (1.0)
 * - Min zoom: defined in constants (e.g., 0.1 = 10%)
 */

import type Konva from 'konva';
import { GRID_CONSTANTS } from '@/Components/Grid/types/constants';

export class ZoomManager {
  private stage: Konva.Stage;
  private currentZoom: number = GRID_CONSTANTS.DEFAULT_ZOOM;
  private onZoomChangeCallback?: (zoom: number) => void;

  constructor(stage: Konva.Stage) {
    this.stage = stage;
  }

  /**
   * Get current zoom level
   */
  getCurrentZoom(): number {
    return this.currentZoom;
  }

  /**
   * Zoom out (decrease scale)
   */
  zoomOut(): boolean {
    if (this.currentZoom <= GRID_CONSTANTS.MIN_ZOOM) {
      return false; // Already at minimum
    }

    // Calculate new zoom level
    const newZoom = this.currentZoom / GRID_CONSTANTS.ZOOM_STEP;
    const clampedZoom = Math.max(newZoom, GRID_CONSTANTS.MIN_ZOOM);

    this.setZoom(clampedZoom);
    return true;
  }

  /**
   * Zoom in (increase scale, up to default of 1.0)
   */
  zoomIn(): boolean {
    if (this.currentZoom >= GRID_CONSTANTS.DEFAULT_ZOOM) {
      return false; // Cannot zoom in beyond default
    }

    // Calculate new zoom level
    const newZoom = this.currentZoom * GRID_CONSTANTS.ZOOM_STEP;
    const clampedZoom = Math.min(newZoom, GRID_CONSTANTS.DEFAULT_ZOOM);

    this.setZoom(clampedZoom);
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
    // Clamp between min and default
    const clampedZoom = Math.max(
      GRID_CONSTANTS.MIN_ZOOM,
      Math.min(zoom, GRID_CONSTANTS.DEFAULT_ZOOM)
    );

    this.currentZoom = clampedZoom;

    // Apply to stage
    this.stage.scale({ x: clampedZoom, y: clampedZoom });
    this.stage.batchDraw();

    // Notify callback
    if (this.onZoomChangeCallback) {
      this.onZoomChangeCallback(clampedZoom);
    }
  }

  /**
   * Check if can zoom in
   */
  canZoomIn(): boolean {
    return this.currentZoom < GRID_CONSTANTS.DEFAULT_ZOOM;
  }

  /**
   * Check if can zoom out
   */
  canZoomOut(): boolean {
    return this.currentZoom > GRID_CONSTANTS.MIN_ZOOM;
  }

  /**
   * Register callback for zoom changes
   */
  onZoomChange(callback: (zoom: number) => void): void {
    this.onZoomChangeCallback = callback;
  }

  /**
   * Get zoom as percentage
   */
  getZoomPercentage(): number {
    return Math.round(this.currentZoom * 100);
  }
}
