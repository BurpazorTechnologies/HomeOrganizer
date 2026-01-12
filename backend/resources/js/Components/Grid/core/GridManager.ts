/**
 * GridManager
 *
 * Manages the visual grid overlay on the canvas.
 * Draws grid lines based on current zoom/pan and clip bounds.
 *
 * Key change: Grid configuration is now read from GridStateStore (single source of truth).
 * Local state only maintains runtime-only values (clipBounds, Konva layer reference).
 *
 * Event-driven architecture (Phase 2):
 * - Subscribes to ZOOM_CHANGED, PAN_CHANGED events to auto-redraw
 * - Subscribes to GRID_CONFIG_CHANGED to respond to config updates
 */

import Konva from 'konva';
import { GRID_CONSTANTS } from '@/Components/Grid/types/constants';
import type { VisibleBounds, GridConfig } from '@/Components/Grid/types/grid';
import type { GridStateStore } from '@/Components/Grid/core/state/GridStateStore';
import type { EventBus, Unsubscribe } from '@/Components/Grid/core/events';

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class GridManager {
  private layer: Konva.Layer;
  private stage: Konva.Stage;
  private clipBounds: Bounds | null = null;

  // Store reference for grid config (single source of truth)
  private store: GridStateStore | null = null;

  // EventBus for event-driven updates
  private eventBus: EventBus | null = null;
  private eventUnsubscribers: Unsubscribe[] = [];

  // Fallback values used only during initialization before store is set
  private _fallbackGridSize: number;
  private _fallbackSnapEnabled: boolean;
  private _fallbackVisible: boolean;

  constructor(stage: Konva.Stage, layer: Konva.Layer, config?: Partial<GridConfig>) {
    this.stage = stage;
    this.layer = layer;

    // Store initial config as fallbacks (used until store is wired up)
    this._fallbackGridSize = config?.size ?? GRID_CONSTANTS.DEFAULT_GRID_SIZE;
    this._fallbackSnapEnabled = config?.snapEnabled ?? true;
    this._fallbackVisible = config?.visible ?? true;
  }

  /**
   * Set the GridStateStore reference (for grid config)
   */
  setStore(store: GridStateStore): void {
    this.store = store;
  }

  /**
   * Set the EventBus and subscribe to relevant events
   * When events are received, the grid will auto-redraw
   */
  setEventBus(eventBus: EventBus): void {
    // Clear any existing subscriptions
    this.clearEventSubscriptions();

    this.eventBus = eventBus;

    // Subscribe to events that require grid redraw
    // Note: ZOOM_CHANGED is currently still handled by ManagerRegistry for backwards compat
    // These subscriptions provide direct event-driven updates when wired up
    this.eventUnsubscribers.push(
      eventBus.on('GRID_SIZE_CHANGED', () => this.redrawGrid()),
      eventBus.on('GRID_VISIBLE_CHANGED', () => this.redrawGrid()),
      eventBus.on('GRID_CONFIG_CHANGED', () => this.redrawGrid()),
    );
  }

  /**
   * Clear event subscriptions (used during cleanup or when switching EventBus)
   */
  private clearEventSubscriptions(): void {
    this.eventUnsubscribers.forEach(unsub => unsub());
    this.eventUnsubscribers = [];
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.clearEventSubscriptions();
    this.eventBus = null;
    this.store = null;
    this.clearGrid();
  }

  /**
   * Get grid size from store (single source of truth)
   */
  private get gridSize(): number {
    return this.store?.state.gridConfig.gridSize ?? this._fallbackGridSize;
  }

  /**
   * Get snap enabled from store (single source of truth)
   */
  private get snapEnabled(): boolean {
    return this.store?.state.gridConfig.snapEnabled ?? this._fallbackSnapEnabled;
  }

  /**
   * Get grid visible from store (single source of truth)
   */
  private get visible(): boolean {
    return this.store?.state.gridConfig.gridVisible ?? this._fallbackVisible;
  }

  /**
   * Get grid size (public accessor for external use)
   */
  getGridSize(): number {
    return this.gridSize;
  }

  /**
   * Get clip bounds (for debugging)
   */
  getClipBounds(): Bounds | null {
    return this.clipBounds;
  }
  /**
   * Clear all grid lines from the layer
   */
  clearGrid(): void {
    this.layer.destroyChildren();
  }

  /**
   * Calculate the visible bounds in world coordinates
   *
   * Determines which part of the infinite grid is currently visible
   * based on stage position and scale
   *
   * @returns Visible bounds with start/end X and Y coordinates
   */
  getVisibleBounds(): VisibleBounds {
    const stageWidth = this.stage.width();
    const stageHeight = this.stage.height();
    const stagePos = this.stage.position();
    const stageScale = this.stage.scaleX();

    // Calculate visible area in world coordinates
    const startX = Math.floor((-stagePos.x / stageScale) / this.gridSize) * this.gridSize;
    const endX = Math.ceil((stageWidth - stagePos.x) / stageScale / this.gridSize) * this.gridSize;
    const startY = Math.floor((-stagePos.y / stageScale) / this.gridSize) * this.gridSize;
    const endY = Math.ceil((stageHeight - stagePos.y) / stageScale / this.gridSize) * this.gridSize;

    return { startX, endX, startY, endY };
  }

  /**
   * Draw vertical grid lines
   *
   * @param bounds - The visible bounds to draw within
   */
  drawVerticalLines(bounds: VisibleBounds): void {
    const stageScale = this.stage.scaleX();
    const lineWidth = 1 / stageScale; // Maintain consistent line width regardless of zoom

    let lineCount = 0;
    const maxLines = GRID_CONSTANTS.MAX_GRID_LINES / 2; // Half for vertical, half for horizontal

    for (let x = bounds.startX; x <= bounds.endX; x += this.gridSize) {
      if (lineCount >= maxLines) {
        console.warn('Maximum vertical grid lines reached, skipping remaining lines');
        break;
      }

      const line = new Konva.Line({
        points: [x, bounds.startY, x, bounds.endY],
        stroke: GRID_CONSTANTS.GRID_LINE_COLOR,
        strokeWidth: lineWidth,
        listening: false, // Grid lines don't respond to events
        perfectDrawEnabled: false, // Performance optimization
      });

      this.layer.add(line);
      lineCount++;
    }
  }

  /**
   * Draw horizontal grid lines
   *
   * @param bounds - The visible bounds to draw within
   */
  drawHorizontalLines(bounds: VisibleBounds): void {
    const stageScale = this.stage.scaleX();
    const lineWidth = 1 / stageScale;

    let lineCount = 0;
    const maxLines = GRID_CONSTANTS.MAX_GRID_LINES / 2;

    for (let y = bounds.startY; y <= bounds.endY; y += this.gridSize) {
      if (lineCount >= maxLines) {
        console.warn('Maximum horizontal grid lines reached, skipping remaining lines');
        break;
      }

      const line = new Konva.Line({
        points: [bounds.startX, y, bounds.endX, y],
        stroke: GRID_CONSTANTS.GRID_LINE_COLOR,
        strokeWidth: lineWidth,
        listening: false,
        perfectDrawEnabled: false,
      });

      this.layer.add(line);
      lineCount++;
    }
  }

  /**
   * Set clip bounds to limit grid drawing to a specific area
   *
   * @param bounds - The bounding box to clip grid to, or null to remove clipping
   */
  setClipBounds(bounds: Bounds | null): void {
    this.clipBounds = bounds;
    this.redrawGrid();
  }

  /**
   * Clear clip bounds and restore full grid
   */
  clearClipBounds(): void {
    this.clipBounds = null;
    this.redrawGrid();
  }

  /**
   *
   * Redraw the entire grid
   *
   * This is the main method called when the grid needs to update
   * (e.g., after pan, zoom, or configuration change)
   */
  redrawGrid(): void {
    if (!this.visible) {
      this.clearGrid();
      return;
    }

    // Clear existing grid
    this.clearGrid();

    // Calculate visible bounds
    let bounds = this.getVisibleBounds();

    // Apply clipping if set - use FULL clip bounds, not intersection
    // This ensures the grid fills the entire parent shape regardless of zoom/pan
    if (this.clipBounds) {
      // Convert clip bounds to VisibleBounds format
      // Snap to grid size for proper alignment
      bounds = {
        startX: Math.floor(this.clipBounds.x / this.gridSize) * this.gridSize,
        endX: Math.ceil((this.clipBounds.x + this.clipBounds.width) / this.gridSize) * this.gridSize,
        startY: Math.floor(this.clipBounds.y / this.gridSize) * this.gridSize,
        endY: Math.ceil((this.clipBounds.y + this.clipBounds.height) / this.gridSize) * this.gridSize,
      };
    }

    // Draw new grid lines
    this.drawVerticalLines(bounds);
    this.drawHorizontalLines(bounds);

    // Batch draw for performance
    this.layer.batchDraw();
  }
}