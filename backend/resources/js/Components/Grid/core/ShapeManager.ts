import Konva from 'konva';
import type { Shape, RectangleShape } from '@/Components/Grid/types/shapes';
import { SHAPE_COLORS, GRID_CONSTANTS } from '@/Components/Grid/types/constants';
import type { LayerManager } from '@/Components/Grid/core/LayerManager';
import type { GridStateStore } from '@/Components/Grid/core/state/GridStateStore';
import type { BoundsService } from '@/Components/Grid/core/services/BoundsService';

/**
 * ShapeManager
 *
 * Manages all shapes on the canvas:
 * - Creates and tracks Konva node instances
 * - Handles shape rendering
 * - Syncs with GridStateStore for state
 * - Uses BoundsService for live drag/resize constraints
 * - Works with LayerManager to place shapes on correct layers
 *
 * Key change: dragBoundFunc now queries BoundsService for LIVE parent bounds,
 * eliminating the stale closure problem.
 */
export class ShapeManager {
    private stage: Konva.Stage;
    private shapes: Map<string, { data: Shape; node: Konva.Shape; layerId: string }> = new Map();
    private selectedShapeId: string | null = null;
    private gridSize: number;
    private snapEnabled: boolean;
    private getZoomScale: () => number;
    private layerManager: LayerManager | null = null;

    // NEW: Central state store and bounds service
    private store: GridStateStore | null = null;
    private boundsService: BoundsService | null = null;

    constructor(
        stage: Konva.Stage,
        options: {
            gridSize: number;
            snapEnabled: boolean;
            getZoomScale?: () => number;
            store?: GridStateStore;
            boundsService?: BoundsService;
        }
    ) {
        this.stage = stage;
        this.gridSize = options.gridSize;
        this.snapEnabled = options.snapEnabled;
        this.getZoomScale = options.getZoomScale || (() => 1.0);
        this.store = options.store || null;
        this.boundsService = options.boundsService || null;
    }

    /**
     * Set LayerManager reference
     */
    setLayerManager(layerManager: LayerManager): void {
        this.layerManager = layerManager;
    }

    /**
     * Create a new rectangle shape at the specified position
     * @param x - X coordinate
     * @param y - Y coordinate
     * @param options - Optional configuration including id for restoration from saved data
     */
    createRectangle(
        x: number,
        y: number,
        options?: {
            id?: string; // Optional ID for restoring saved shapes (preserves references)
            width?: number;
            height?: number;
            fill?: string;
            stroke?: string;
            strokeWidth?: number;
            label?: string;
            layerId?: string;
            parentShapeId?: string | null; // NEW: Track parent for live bounds
            parentBounds?: { // DEPRECATED: Only used as fallback if no boundsService
                x: number;
                y: number;
                width: number;
                height: number;
            };
        }
    ): RectangleShape {
        // Use provided ID (for restoration) or generate new one
        const id = options?.id || `shape_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Snap position to grid if enabled
        const snappedX = this.snapEnabled ? Math.round(x / this.gridSize) * this.gridSize : x;
        const snappedY = this.snapEnabled ? Math.round(y / this.gridSize) * this.gridSize : y;

        const shapeData: RectangleShape = {
            id,
            type: 'rectangle',
            x: snappedX,
            y: snappedY,
            width: options?.width || GRID_CONSTANTS.DEFAULT_SHAPE_WIDTH,
            height: options?.height || GRID_CONSTANTS.DEFAULT_SHAPE_HEIGHT,
            fill: options?.fill || SHAPE_COLORS.HOME_AREA_FILL,
            stroke: options?.stroke || SHAPE_COLORS.HOME_AREA_STROKE,
            strokeWidth: options?.strokeWidth || GRID_CONSTANTS.SHAPE_STROKE_WIDTH,
            label: options?.label || '',
            zIndex: this.shapes.size,
        };

        // Get the appropriate layer - use current layer if layerId not provided
        const layerId = options?.layerId || this.layerManager?.getCurrentLayer()?.id || 'layer_1';

        // Add to GridStateStore if available
        if (this.store) {
            const parentShapeId = options?.parentShapeId || null;

            this.store.addShape({
                id: shapeData.id,
                type: shapeData.type,
                x: shapeData.x,
                y: shapeData.y,
                width: shapeData.width,
                height: shapeData.height,
                fill: shapeData.fill,
                stroke: shapeData.stroke,
                strokeWidth: shapeData.strokeWidth,
                label: shapeData.label || '', // Ensure label is always a string
                layerId,
                parentShapeId, // Track parent relationship
                zIndex: shapeData.zIndex,
            });
        }

        // Create the dragBoundFunc that uses live bounds queries
        const dragBoundFunc = this.createDragBoundFunc(id, options?.parentBounds);

        // Create Konva rectangle
        const rect = new Konva.Rect({
            id: shapeData.id,
            x: shapeData.x,
            y: shapeData.y,
            width: shapeData.width,
            height: shapeData.height,
            fill: shapeData.fill,
            stroke: shapeData.stroke,
            strokeWidth: shapeData.strokeWidth,
            draggable: true,
            dragBoundFunc,
        });

        // Add drag end handler to update shape data and store
        rect.on('dragend', () => {
            const newX = rect.x();
            const newY = rect.y();

            // Update local shape data
            shapeData.x = newX;
            shapeData.y = newY;

            // Update store if available
            if (this.store) {
                this.store.updateShape(id, { x: newX, y: newY });
            }
        });

        const konvaLayer = this.layerManager?.getKonvaLayer(layerId);

        if (!konvaLayer) {
            console.error(`Layer ${layerId} not found!`);
            throw new Error(`Layer ${layerId} not found`);
        }

        // Store shape with layer reference
        this.shapes.set(id, { data: shapeData, node: rect, layerId });

        // Add to the correct Konva layer
        konvaLayer.add(rect);
        konvaLayer.batchDraw();

        return shapeData;
    }

    /**
     * Create a dragBoundFunc that uses live bounds from BoundsService
     * This is the KEY method that fixes the stale bounds problem
     */
    private createDragBoundFunc(
        shapeId: string,
        fallbackBounds?: { x: number; y: number; width: number; height: number } | null
    ): (pos: { x: number; y: number }) => { x: number; y: number } {
        return (pos: { x: number; y: number }) => {
            const shapeEntry = this.shapes.get(shapeId);
            if (!shapeEntry) return pos;

            const rect = shapeEntry.node as Konva.Rect;
            const shapeWidth = rect.width() * rect.scaleX();
            const shapeHeight = rect.height() * rect.scaleY();

            // Use BoundsService for live bounds (preferred)
            if (this.boundsService) {
                return this.boundsService.constrainDrag(
                    shapeId,
                    pos,
                    { width: shapeWidth, height: shapeHeight }
                );
            }

            // Fallback to static bounds (deprecated path)
            let newX = pos.x;
            let newY = pos.y;

            if (fallbackBounds) {
                newX = Math.max(fallbackBounds.x, Math.min(newX, fallbackBounds.x + fallbackBounds.width - shapeWidth));
                newY = Math.max(fallbackBounds.y, Math.min(newY, fallbackBounds.y + fallbackBounds.height - shapeHeight));
            } else {
                const zoomScale = this.getZoomScale();
                const stageWidth = this.stage.width() / zoomScale;
                const stageHeight = this.stage.height() / zoomScale;
                newX = Math.max(0, Math.min(newX, stageWidth - shapeWidth));
                newY = Math.max(0, Math.min(newY, stageHeight - shapeHeight));
            }

            if (this.snapEnabled) {
                newX = Math.round(newX / this.gridSize) * this.gridSize;
                newY = Math.round(newY / this.gridSize) * this.gridSize;
            }

            return { x: newX, y: newY };
        };
    }

    /**
     * Update shape dimensions (called during resize)
     */
    updateShapeDimensions(
        shapeId: string,
        dimensions: { x?: number; y?: number; width?: number; height?: number }
    ): void {
        const shape = this.shapes.get(shapeId);
        if (!shape) return;

        // Update local data
        if (dimensions.x !== undefined) shape.data.x = dimensions.x;
        if (dimensions.y !== undefined) shape.data.y = dimensions.y;
        if (dimensions.width !== undefined) shape.data.width = dimensions.width;
        if (dimensions.height !== undefined) shape.data.height = dimensions.height;

        // Update Konva node
        if (dimensions.x !== undefined) shape.node.x(dimensions.x);
        if (dimensions.y !== undefined) shape.node.y(dimensions.y);
        if (dimensions.width !== undefined) shape.node.width(dimensions.width);
        if (dimensions.height !== undefined) shape.node.height(dimensions.height);

        // Update store if available
        if (this.store) {
            this.store.updateShape(shapeId, dimensions);
        }

        // Redraw the shape's layer
        const konvaLayer = this.layerManager?.getKonvaLayer(shape.layerId);
        konvaLayer?.batchDraw();
    }

    /**
     * Get shape data by ID
     */
    getShape(shapeId: string): Shape | null {
        return this.shapes.get(shapeId)?.data || null;
    }

    /**
     * Get shape Konva node by ID
     */
    getShapeNode(shapeId: string): Konva.Shape | null {
        return this.shapes.get(shapeId)?.node || null;
    }

    /**
     * Get all shapes
     */
    getAllShapes(): Shape[] {
        return Array.from(this.shapes.values()).map(s => s.data);
    }

    /**
     * Select a shape
     */
    selectShape(shapeId: string): void {
        this.selectedShapeId = shapeId;
    }

    /**
     * Deselect current shape
     */
    deselectShape(): void {
        this.selectedShapeId = null;
    }

    /**
     * Get currently selected shape ID
     */
    getSelectedShapeId(): string | null {
        return this.selectedShapeId;
    }

    /**
     * Snap value to grid
     */
    snapToGrid(value: number): number {
        if (!this.snapEnabled) return value;
        return Math.round(value / this.gridSize) * this.gridSize;
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
     * Delete a specific shape
     */
    deleteShape(shapeId: string): void {
        const shape = this.shapes.get(shapeId);
        if (!shape) return;

        // Destroy the Konva node
        shape.node.destroy();

        // Remove from local map
        this.shapes.delete(shapeId);

        // Remove from store if available
        if (this.store) {
            this.store.removeShape(shapeId);
        }

        // Deselect if this was the selected shape
        if (this.selectedShapeId === shapeId) {
            this.selectedShapeId = null;
        }

        // Redraw the shape's layer
        const konvaLayer = this.layerManager?.getKonvaLayer(shape.layerId);
        konvaLayer?.batchDraw();
    }

    /**
     * Enable or disable dragging for all shapes
     * Used to disable shape dragging when pan mode is active
     */
    setShapesDraggable(draggable: boolean): void {
        this.shapes.forEach(({ node }) => {
            node.draggable(draggable);
        });
    }

    /**
     * Set the parent shape ID for a shape
     * This updates the store so BoundsService can query live parent bounds
     */
    setParentShapeId(shapeId: string, parentShapeId: string | null): void {
        if (this.store) {
            this.store.updateShape(shapeId, { parentShapeId });
        }
    }

    /**
     * Clear all shapes
     */
    clear(): void {
        // Get unique layer IDs before clearing
        const layerIds = new Set(Array.from(this.shapes.values()).map(s => s.layerId));

        this.shapes.forEach(({ node }) => node.destroy());
        this.shapes.clear();
        this.selectedShapeId = null;

        // Redraw all affected layers
        layerIds.forEach(layerId => {
            const konvaLayer = this.layerManager?.getKonvaLayer(layerId);
            konvaLayer?.batchDraw();
        });
    }
}
