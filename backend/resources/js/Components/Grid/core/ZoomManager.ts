/**
 * Zoom Manager
 *
 * Manages all zoom operations including zoom in/out, zoom to point,
 * and zoom level constraints.
 */

import Konva from 'konva';
import type { Point } from '../types/shapes';
import { GRID_CONSTANTS } from '../types/constants';
import { validateZoom } from '../utils/validation';

export class ZoomManager {
  private stage: Konva.Stage;
  private currentScale: number;
  private onZoomChange?: (scale: number) => void;

  constructor(stage: Konva.Stage, initialScale: number = GRID_CONSTANTS.DEFAULT_ZOOM) {
    this.stage = stage;
    this.currentScale = initialScale;
    this.stage.scale({ x: initialScale, y: initialScale });
  }

  /**
   * Register a callback for zoom level changes
   *
   * @param callback - Function to call when zoom changes
   */
  onZoom(callback: (scale: number) => void): void {
    this.onZoomChange = callback;
  }

  /**
   * Get the current zoom level
   *
   * @returns Current zoom scale (1.0 = 100%)
   */
  getZoomLevel(): number {
    return this.currentScale;
  }

  /**
   * Get zoom percentage
   *
   * @returns Zoom level as percentage (e.g., 150 for 150%)
   */
  getZoomPercentage(): number {
    return Math.round(this.currentScale * 100);
  }

  /**
   * Set the zoom level to a specific value
   *
   * @param scale - New zoom scale
   * @param center - Optional center point for zooming (defaults to stage center)
   * @returns The actual scale applied (after clamping)
   */
  setZoomLevel(scale: number, center?: Point): number {
    // Validate and clamp zoom level
    const validation = validateZoom(scale);
    if (!validation.valid) {
      console.warn(`Invalid zoom level: ${validation.errors.join(', ')}`);
      return this.currentScale;
    }

    const clampedScale = this.clampZoom(scale);

    // Determine zoom center point
    const zoomCenter = center ?? this.getStageCenterPoint();

    this.applyZoom(clampedScale, zoomCenter);

    return this.currentScale;
  }

  /**
   * Zoom in by the configured step amount
   *
   * @param center - Optional center point for zooming
   * @returns New zoom level
   */
  zoomIn(center?: Point): number {
    const newScale = this.currentScale * GRID_CONSTANTS.ZOOM_STEP;
    return this.setZoomLevel(newScale, center);
  }

  /**
   * Zoom out by the configured step amount
   *
   * @param center - Optional center point for zooming
   * @returns New zoom level
   */
  zoomOut(center?: Point): number {
    const newScale = this.currentScale / GRID_CONSTANTS.ZOOM_STEP;
    return this.setZoomLevel(newScale, center);
  }

  /**
   * Zoom to a specific point (used for mouse wheel zooming)
   *
   * @param pointerPosition - Screen position to zoom towards
   * @param delta - Wheel delta (positive = zoom in, negative = zoom out)
   * @returns New zoom level
   */
  zoomToPoint(pointerPosition: Point, delta: number): number {
    const direction = delta > 0 ? -1 : 1; // Invert for natural scrolling
    const scaleBy = GRID_CONSTANTS.ZOOM_WHEEL_SENSITIVITY;

    const newScale = direction > 0
      ? this.currentScale * scaleBy
      : this.currentScale / scaleBy;

    const clampedScale = this.clampZoom(newScale);

    // Calculate the point in world coordinates
    const oldScale = this.currentScale;
    const mousePointTo = {
      x: (pointerPosition.x - this.stage.x()) / oldScale,
      y: (pointerPosition.y - this.stage.y()) / oldScale,
    };

    // Apply zoom
    this.stage.scale({ x: clampedScale, y: clampedScale });

    // Adjust position to keep zoom centered on pointer
    const newPos = {
      x: pointerPosition.x - mousePointTo.x * clampedScale,
      y: pointerPosition.y - mousePointTo.y * clampedScale,
    };
    this.stage.position(newPos);

    this.currentScale = clampedScale;
    this.notifyZoomChange();

    return this.currentScale;
  }

  /**
   * Reset zoom to 100%
   *
   * @returns The reset zoom level
   */
  resetZoom(): number {
    return this.setZoomLevel(GRID_CONSTANTS.DEFAULT_ZOOM);
  }

  /**
   * Reset view completely (zoom and position)
   */
  resetView(): void {
    this.stage.position({ x: 0, y: 0 });
    this.setZoomLevel(GRID_CONSTANTS.DEFAULT_ZOOM);
  }

  /**
   * Check if can zoom in further
   *
   * @returns True if zoom in is possible
   */
  canZoomIn(): boolean {
    return this.currentScale < GRID_CONSTANTS.MAX_ZOOM;
  }

  /**
   * Check if can zoom out further
   *
   * @returns True if zoom out is possible
   */
  canZoomOut(): boolean {
    return this.currentScale > GRID_CONSTANTS.MIN_ZOOM;
  }

  // ==================== Private Methods ====================

  /**
   * Clamp zoom to valid range
   */
  private clampZoom(scale: number): number {
    return Math.max(
      GRID_CONSTANTS.MIN_ZOOM,
      Math.min(GRID_CONSTANTS.MAX_ZOOM, scale)
    );
  }

  /**
   * Get the center point of the stage in screen coordinates
   */
  private getStageCenterPoint(): Point {
    return {
      x: this.stage.width() / 2,
      y: this.stage.height() / 2,
    };
  }

  /**
   * Apply zoom with center point preservation
   */
  private applyZoom(scale: number, center: Point): void {
    const oldScale = this.currentScale;

    // Calculate world point at center
    const worldPoint = {
      x: (center.x - this.stage.x()) / oldScale,
      y: (center.y - this.stage.y()) / oldScale,
    };

    // Apply new scale
    this.stage.scale({ x: scale, y: scale });

    // Adjust position to keep center point fixed
    const newPos = {
      x: center.x - worldPoint.x * scale,
      y: center.y - worldPoint.y * scale,
    };
    this.stage.position(newPos);

    this.currentScale = scale;
    this.notifyZoomChange();
  }

  /**
   * Notify registered callback of zoom change
   */
  private notifyZoomChange(): void {
    if (this.onZoomChange) {
      this.onZoomChange(this.currentScale);
    }
  }
}
