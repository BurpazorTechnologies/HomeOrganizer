import Konva from 'konva';
import { TRANSFORMER_CONFIG, GRID_CONSTANTS } from '@/Components/Grid/types/constants';

/**
 * TransformManager
 *
 * Manages shape transformations (resize, rotate, etc.):
 * - Handles Konva Transformer for resize handles
 * - Provides grid snapping during transforms
 * - Emits events when shapes are transformed
 */
export class TransformManager {
    private stage: Konva.Stage;
    private layer: Konva.Layer;
    private transformer: Konva.Transformer;
    private gridSize: number;
    private snapEnabled: boolean;
    private onTransformCallback?: (shapeId: string, dimensions: {
        x: number;
        y: number;
        width: number;
        height: number;
    }) => void;

    constructor(
        stage: Konva.Stage,
        layer: Konva.Layer,
        options: {
            gridSize: number;
            snapEnabled: boolean;
        }
    ) {
        this.stage = stage;
        this.layer = layer;
        this.gridSize = options.gridSize;
        this.snapEnabled = options.snapEnabled;

        // Create transformer
        this.transformer = new Konva.Transformer({
            rotateEnabled: TRANSFORMER_CONFIG.ROTATE_ENABLED,
            enabledAnchors: [...TRANSFORMER_CONFIG.ENABLED_ANCHORS],
            borderStroke: TRANSFORMER_CONFIG.BORDER_STROKE,
            anchorFill: TRANSFORMER_CONFIG.ANCHOR_FILL,
            anchorStroke: TRANSFORMER_CONFIG.ANCHOR_STROKE,
            anchorSize: TRANSFORMER_CONFIG.ANCHOR_SIZE,
            keepRatio: false, // Allow free resize
            boundBoxFunc: (oldBox, newBox) => {
                // Enforce minimum size
                if (newBox.width < GRID_CONSTANTS.MIN_SHAPE_SIZE) {
                    newBox.width = GRID_CONSTANTS.MIN_SHAPE_SIZE;
                }
                if (newBox.height < GRID_CONSTANTS.MIN_SHAPE_SIZE) {
                    newBox.height = GRID_CONSTANTS.MIN_SHAPE_SIZE;
                }

                // Snap to grid if enabled
                if (this.snapEnabled) {
                    newBox.x = Math.round(newBox.x / this.gridSize) * this.gridSize;
                    newBox.y = Math.round(newBox.y / this.gridSize) * this.gridSize;
                    newBox.width = Math.round(newBox.width / this.gridSize) * this.gridSize;
                    newBox.height = Math.round(newBox.height / this.gridSize) * this.gridSize;
                }

                return newBox;
            },
        });

        this.layer.add(this.transformer);

        // Setup transform events
        this.setupTransformEvents();
    }

    /**
     * Setup transform event handlers
     */
    private setupTransformEvents(): void {
        this.transformer.on('transformend', () => {
            const nodes = this.transformer.nodes();
            if (nodes.length === 0) return;

            const shape = nodes[0];
            const shapeId = shape.id();

            // Get final dimensions
            const x = shape.x();
            const y = shape.y();
            const width = shape.width() * shape.scaleX();
            const height = shape.height() * shape.scaleY();

            // Reset scale to 1 (we store actual width/height, not scale)
            shape.scaleX(1);
            shape.scaleY(1);
            shape.width(width);
            shape.height(height);

            // Snap to grid if enabled
            const snappedX = this.snapEnabled ? Math.round(x / this.gridSize) * this.gridSize : x;
            const snappedY = this.snapEnabled ? Math.round(y / this.gridSize) * this.gridSize : y;
            const snappedWidth = this.snapEnabled ? Math.round(width / this.gridSize) * this.gridSize : width;
            const snappedHeight = this.snapEnabled ? Math.round(height / this.gridSize) * this.gridSize : height;

            shape.x(snappedX);
            shape.y(snappedY);
            shape.width(snappedWidth);
            shape.height(snappedHeight);

            // Notify callback
            if (this.onTransformCallback) {
                this.onTransformCallback(shapeId, {
                    x: snappedX,
                    y: snappedY,
                    width: snappedWidth,
                    height: snappedHeight,
                });
            }

            this.layer.batchDraw();
        });
    }

    /**
     * Attach transformer to a shape node
     */
    attachTo(node: Konva.Shape): void {
        this.transformer.nodes([node]);
        this.layer.batchDraw();
    }

    /**
     * Detach transformer from current shape
     */
    detach(): void {
        this.transformer.nodes([]);
        this.layer.batchDraw();
    }

    /**
     * Check if transformer is currently attached
     */
    isAttached(): boolean {
        return this.transformer.nodes().length > 0;
    }

    /**
     * Get the currently attached shape node
     */
    getAttachedNode(): Konva.Shape | null {
        const nodes = this.transformer.nodes();
        return nodes.length > 0 ? (nodes[0] as Konva.Shape) : null;
    }

    /**
     * Set callback for when shapes are transformed
     */
    onTransform(callback: (shapeId: string, dimensions: {
        x: number;
        y: number;
        width: number;
        height: number;
    }) => void): void {
        this.onTransformCallback = callback;
    }

    /**
     * Update grid size
     */
    updateGridSize(size: number): void {
        this.gridSize = size;
    }

    /**
     * Toggle snap to grid
     */
    toggleSnap(enabled: boolean): void {
        this.snapEnabled = enabled;
    }

    /**
     * Destroy transformer
     */
    destroy(): void {
        this.transformer.destroy();
    }
}
