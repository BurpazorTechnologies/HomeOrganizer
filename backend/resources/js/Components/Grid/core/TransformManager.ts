import Konva from 'konva';
import { TRANSFORMER_CONFIG, GRID_CONSTANTS } from '@/Components/Grid/types/constants';
import type { BoundsService } from '@/Components/Grid/core/services/BoundsService';
import type { GridStateStore } from '@/Components/Grid/core/state/GridStateStore';
import type { EventBus } from '@/Components/Grid/core/events';

/**
 * TransformManager
 *
 * Manages shape transformations (resize, rotate, etc.):
 * - Handles Konva Transformer for resize handles
 * - Provides grid snapping during transforms
 * - Emits SHAPE_TRANSFORM_ENDED events via EventBus when shapes are transformed
 * - Uses BoundsService for live parent bounds (never stale)
 * - Reads gridSize/snapEnabled from store (single source of truth)
 */
export class TransformManager {
    private stage: Konva.Stage;
    private layer: Konva.Layer;
    private transformer: Konva.Transformer;
    private boundsService: BoundsService | null = null;
    private store: GridStateStore | null = null;
    private eventBus: EventBus | null = null;

    // Fallback values (used if store not available)
    private _fallbackGridSize: number;
    private _fallbackSnapEnabled: boolean;

    constructor(
        stage: Konva.Stage,
        layer: Konva.Layer,
        options: {
            gridSize: number;
            snapEnabled: boolean;
            boundsService?: BoundsService;
            store?: GridStateStore;
        }
    ) {
        this.stage = stage;
        this.layer = layer;
        this._fallbackGridSize = options.gridSize;
        this._fallbackSnapEnabled = options.snapEnabled;
        this.boundsService = options.boundsService || null;
        this.store = options.store || null;

        // Create transformer (Note: uses gridSize/snapEnabled getters below)
        // NOTE: boundBoxFunc is removed because it has coordinate system issues after pan/zoom.
        // Constraints are enforced in the transformend handler instead, which uses world coordinates.
        this.transformer = new Konva.Transformer({
            rotateEnabled: TRANSFORMER_CONFIG.ROTATE_ENABLED,
            enabledAnchors: [...TRANSFORMER_CONFIG.ENABLED_ANCHORS],
            borderStroke: TRANSFORMER_CONFIG.BORDER_STROKE,
            anchorFill: TRANSFORMER_CONFIG.ANCHOR_FILL,
            anchorStroke: TRANSFORMER_CONFIG.ANCHOR_STROKE,
            anchorSize: TRANSFORMER_CONFIG.ANCHOR_SIZE,
            keepRatio: false, // Allow free resize
            boundBoxFunc: (oldBox, newBox) => {
                // Only enforce minimum size during transform
                // Parent bounds constraints are applied in transformend handler
                // because boundBoxFunc receives coordinates in screen space which
                // doesn't align with world coordinates after pan/zoom
                if (newBox.width < GRID_CONSTANTS.MIN_SHAPE_SIZE) {
                    newBox.width = GRID_CONSTANTS.MIN_SHAPE_SIZE;
                }
                if (newBox.height < GRID_CONSTANTS.MIN_SHAPE_SIZE) {
                    newBox.height = GRID_CONSTANTS.MIN_SHAPE_SIZE;
                }
                return newBox;
            },
        });

        this.layer.add(this.transformer);

        // Setup transform events
        this.setupTransformEvents();
    }

    /**
     * Get current grid size from store (single source of truth)
     */
    private get gridSize(): number {
        return this.store?.getGridConfig()?.gridSize ?? this._fallbackGridSize;
    }

    /**
     * Get current snap enabled state from store (single source of truth)
     */
    private get snapEnabled(): boolean {
        return this.store?.getGridConfig()?.snapEnabled ?? this._fallbackSnapEnabled;
    }

    /**
     * Setup transform event handlers
     */
    private setupTransformEvents(): void {
        // Handle transform during resize (real-time constraints)
        // This fires continuously while user is resizing
        this.transformer.on('transform', () => {
            const nodes = this.transformer.nodes();
            if (nodes.length === 0) return;

            const shape = nodes[0];
            const shapeId = shape.id();

            // Get current dimensions (accounting for Konva's scale transform)
            const x = shape.x();
            const y = shape.y();
            const width = shape.width() * shape.scaleX();
            const height = shape.height() * shape.scaleY();

            // Constrain within parent bounds if this is a child shape
            if (this.boundsService) {
                const parentBounds = this.boundsService.getParentBounds(shapeId);
                if (parentBounds) {
                    // Calculate constrained position
                    let newX = x;
                    let newY = y;
                    let newWidth = width;
                    let newHeight = height;

                    // Constrain position (top-left corner)
                    newX = Math.max(parentBounds.x, newX);
                    newY = Math.max(parentBounds.y, newY);

                    // Constrain size to fit within parent
                    const maxWidth = parentBounds.x + parentBounds.width - newX;
                    const maxHeight = parentBounds.y + parentBounds.height - newY;
                    newWidth = Math.min(newWidth, maxWidth);
                    newHeight = Math.min(newHeight, maxHeight);

                    // Enforce minimum size
                    newWidth = Math.max(newWidth, GRID_CONSTANTS.MIN_SHAPE_SIZE);
                    newHeight = Math.max(newHeight, GRID_CONSTANTS.MIN_SHAPE_SIZE);

                    // Apply constraints if changed
                    if (newX !== x || newY !== y || newWidth !== width || newHeight !== height) {
                        // Reset scale and apply constrained dimensions
                        shape.scaleX(1);
                        shape.scaleY(1);
                        shape.x(newX);
                        shape.y(newY);
                        shape.width(newWidth);
                        shape.height(newHeight);
                    }
                }
            }
        });

        this.transformer.on('transformend', () => {
            const nodes = this.transformer.nodes();
            if (nodes.length === 0) return;

            const shape = nodes[0];
            const shapeId = shape.id();

            // Get final dimensions (accounting for Konva's scale transform)
            const x = shape.x();
            const y = shape.y();
            const width = shape.width() * shape.scaleX();
            const height = shape.height() * shape.scaleY();

            // Reset scale to 1 (we store actual width/height, not scale)
            shape.scaleX(1);
            shape.scaleY(1);
            shape.width(width);
            shape.height(height);

            // Use BoundsService for consistent snapping (DRY principle)
            // This centralizes snapping logic and ensures consistent behavior
            // between drag/resize preview (boundBoxFunc) and final position
            let finalBounds = { x, y, width, height };
            if (this.boundsService) {
                finalBounds = this.boundsService.constrainResize(
                    shapeId,
                    { x, y, width, height },
                    { width: GRID_CONSTANTS.MIN_SHAPE_SIZE, height: GRID_CONSTANTS.MIN_SHAPE_SIZE }
                );
            } else if (this.snapEnabled) {
                // Fallback: manual snapping if BoundsService not available
                finalBounds = {
                    x: Math.round(x / this.gridSize) * this.gridSize,
                    y: Math.round(y / this.gridSize) * this.gridSize,
                    width: Math.round(width / this.gridSize) * this.gridSize,
                    height: Math.round(height / this.gridSize) * this.gridSize,
                };
            }

            // Apply final bounds to shape
            shape.x(finalBounds.x);
            shape.y(finalBounds.y);
            shape.width(finalBounds.width);
            shape.height(finalBounds.height);

            // Emit transform ended event via EventBus
            if (this.eventBus) {
                this.eventBus.emit({
                    type: 'SHAPE_TRANSFORM_ENDED',
                    payload: {
                        shapeId,
                        dimensions: finalBounds,
                    },
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
     * Set the EventBus for event-driven communication
     */
    setEventBus(eventBus: EventBus): void {
        this.eventBus = eventBus;
    }

    /**
     * Update grid size (writes to store - single source of truth)
     */
    updateGridSize(size: number): void {
        if (this.store) {
            this.store.setGridSize(size);
        } else {
            this._fallbackGridSize = size;
        }
    }

    /**
     * Toggle snap to grid (writes to store - single source of truth)
     */
    toggleSnap(enabled: boolean): void {
        if (this.store) {
            this.store.setSnapEnabled(enabled);
        } else {
            this._fallbackSnapEnabled = enabled;
        }
    }

    /**
     * Set BoundsService for live parent bounds queries
     */
    setBoundsService(boundsService: BoundsService): void {
        this.boundsService = boundsService;
    }

    /**
     * Destroy transformer
     */
    destroy(): void {
        this.transformer.destroy();
    }
}
