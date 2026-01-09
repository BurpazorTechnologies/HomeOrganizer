/**
 * Transform Manager
 *
 * Manages the Konva Transformer for selected shapes.
 * Handles resize handles and transformation controls.
 */

import Konva from 'konva';
import { TRANSFORMER_CONFIG } from '../types/constants';

export class TransformManager {
  private transformer: Konva.Transformer;
  private layer: Konva.Layer;
  private onTransformEnd?: (nodeId: string, attrs: { x: number; y: number; width: number; height: number }) => void;

  constructor(layer: Konva.Layer) {
    this.layer = layer;

    // Create transformer with configuration
    this.transformer = new Konva.Transformer({
      rotateEnabled: TRANSFORMER_CONFIG.ROTATE_ENABLED,
      enabledAnchors: TRANSFORMER_CONFIG.ENABLED_ANCHORS,
      borderStroke: TRANSFORMER_CONFIG.BORDER_STROKE,
      anchorFill: TRANSFORMER_CONFIG.ANCHOR_FILL,
      anchorStroke: TRANSFORMER_CONFIG.ANCHOR_STROKE,
      anchorSize: TRANSFORMER_CONFIG.ANCHOR_SIZE,
      boundBoxFunc: (oldBox, newBox) => {
        // Prevent negative dimensions
        if (newBox.width < 40 || newBox.height < 40) {
          return oldBox;
        }
        return newBox;
      },
    });

    this.layer.add(this.transformer);
  }

  /**
   * Register callback for transform end events
   *
   * @param callback - Function to call when transformation ends
   */
  onTransform(callback: (nodeId: string, attrs: { x: number; y: number; width: number; height: number }) => void): void {
    this.onTransformEnd = callback;
  }

  /**
   * Attach transformer to a shape node
   *
   * @param node - Konva node to attach to
   */
  attach(node: Konva.Node): void {
    this.transformer.nodes([node]);
    this.layer.batchDraw();

    // Setup transform end handler
    node.off('transformend'); // Remove any existing handler
    node.on('transformend', () => {
      this.handleTransformEnd(node);
    });
  }

  /**
   * Detach transformer from all nodes
   */
  detach(): void {
    this.transformer.nodes([]);
    this.layer.batchDraw();
  }

  /**
   * Update transformer (refresh after changes)
   */
  update(): void {
    this.transformer.forceUpdate();
    this.layer.batchDraw();
  }

  /**
   * Get the current attached nodes
   *
   * @returns Array of attached nodes
   */
  getAttachedNodes(): Konva.Node[] {
    return this.transformer.nodes();
  }

  /**
   * Check if transformer is attached to any node
   *
   * @returns True if transformer is active
   */
  isActive(): boolean {
    return this.transformer.nodes().length > 0;
  }

  /**
   * Destroy the transformer
   */
  destroy(): void {
    this.transformer.destroy();
  }

  // ==================== Private Methods ====================

  /**
   * Handle transform end event
   */
  private handleTransformEnd(node: Konva.Node): void {
    if (!this.onTransformEnd) return;

    // Get shape element (typically a Konva.Rect)
    const shape = node as Konva.Rect;

    // Reset scale to 1 and adjust dimensions
    const scaleX = shape.scaleX();
    const scaleY = shape.scaleY();

    shape.scaleX(1);
    shape.scaleY(1);

    const newWidth = Math.max(40, shape.width() * scaleX);
    const newHeight = Math.max(40, shape.height() * scaleY);

    shape.width(newWidth);
    shape.height(newHeight);

    // Notify callback with new attributes
    this.onTransformEnd(shape.id(), {
      x: shape.x(),
      y: shape.y(),
      width: newWidth,
      height: newHeight,
    });

    // Update transformer
    this.update();
  }
}
