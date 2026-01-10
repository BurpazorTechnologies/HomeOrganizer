
import Konva from 'konva';
import type { VisibleBounds, GridConfig } from '@/Components/Grid/types/grid';
import { GRID_CONSTANTS } from '../types/constants';
export class GridManager {
  private layer: Konva.Layer;
  private stage: Konva.Stage;
  private config: GridConfig;

  constructor(stage: Konva.Stage, layer: Konva.Layer, config?: Partial<GridConfig>) {
    this.stage = stage;
    this.layer = layer;
    this.config = {
      size: config?.size ?? GRID_CONSTANTS.DEFAULT_GRID_SIZE,
      snapEnabled: config?.snapEnabled ?? true,
      visible: config?.visible ?? true,
    };
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
    const startX = Math.floor((-stagePos.x / stageScale) / this.config.size) * this.config.size;
    const endX = Math.ceil((stageWidth - stagePos.x) / stageScale / this.config.size) * this.config.size;
    const startY = Math.floor((-stagePos.y / stageScale) / this.config.size) * this.config.size;
    const endY = Math.ceil((stageHeight - stagePos.y) / stageScale / this.config.size) * this.config.size;

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

    for (let x = bounds.startX; x <= bounds.endX; x += this.config.size) {
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

    for (let y = bounds.startY; y <= bounds.endY; y += this.config.size) {
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
   * 
   * Redraw the entire grid
   *
   * This is the main method called when the grid needs to update
   * (e.g., after pan, zoom, or configuration change)
   */
  redrawGrid(): void {
    if (!this.config.visible) {
      this.clearGrid();
      return;
    }

    // Clear existing grid
    this.clearGrid();

    // Calculate visible bounds
    const bounds = this.getVisibleBounds();
    console.log(bounds);
    // Draw new grid lines
    this.drawVerticalLines(bounds);
    this.drawHorizontalLines(bounds);

    // Batch draw for performance
    this.layer.batchDraw();
  }
}