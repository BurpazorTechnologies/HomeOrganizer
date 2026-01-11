import Konva from 'konva';
import type { Shape, RectangleShape } from '@/Components/Grid/types/shapes';
import { SHAPE_COLORS, GRID_CONSTANTS } from '@/Components/Grid/types/constants';

/**
 * ShapeManager
 *
 * Manages all shapes on the canvas:
 * - Creates and tracks shape instances
 * - Handles shape rendering
 * - Manages shape state and selection
 */
export class ShapeManager {
    private stage: Konva.Stage;
    private layer: Konva.Layer;
    private shapes: Map<string, { data: Shape; node: Konva.Shape }> = new Map();
    private selectedShapeId: string | null = null;
    private gridSize: number;
    private snapEnabled: boolean;
    private getZoomScale: () => number;

    constructor(
        stage: Konva.Stage,
        layer: Konva.Layer,
        options: {
            gridSize: number;
            snapEnabled: boolean;
            getZoomScale?: () => number;
        }
    ) {
        this.stage = stage;
        this.layer = layer;
        this.gridSize = options.gridSize;
        this.snapEnabled = options.snapEnabled;
        this.getZoomScale = options.getZoomScale || (() => 1.0);
    }

    /**
     * Create a new rectangle shape at the specified position
     */
    createRectangle(
        x: number,
        y: number,
        options?: {
            width?: number;
            height?: number;
            fill?: string;
            stroke?: string;
            label?: string;
        }
    ): RectangleShape {
        const id = `shape_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

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
            strokeWidth: GRID_CONSTANTS.SHAPE_STROKE_WIDTH,
            label: options?.label || '',
            zIndex: this.shapes.size,
        };

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
            // Constrain dragging to canvas bounds with grid snapping
            dragBoundFunc: (pos) => {
                const zoomScale = this.getZoomScale();

                // Calculate visible area based on zoom
                const stageWidth = this.stage.width() / zoomScale;
                const stageHeight = this.stage.height() / zoomScale;

                // Get shape dimensions
                const shapeWidth = rect.width() * rect.scaleX();
                const shapeHeight = rect.height() * rect.scaleY();

                // Calculate bounds
                let newX = pos.x;
                let newY = pos.y;

                // Constrain to canvas boundaries (accounting for zoom)
                newX = Math.max(0, Math.min(newX, stageWidth - shapeWidth));
                newY = Math.max(0, Math.min(newY, stageHeight - shapeHeight));

                // Apply grid snapping if enabled
                if (this.snapEnabled) {
                    newX = Math.round(newX / this.gridSize) * this.gridSize;
                    newY = Math.round(newY / this.gridSize) * this.gridSize;
                }

                return { x: newX, y: newY };
            },
        });

        // Add drag end handler to update shape data
        rect.on('dragend', () => {
            const newX = rect.x();
            const newY = rect.y();

            // Update shape data
            shapeData.x = newX;
            shapeData.y = newY;
        });

        // Store shape
        this.shapes.set(id, { data: shapeData, node: rect });

        // Add to layer
        this.layer.add(rect);
        this.layer.batchDraw();

        return shapeData;
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

        // Update data
        if (dimensions.x !== undefined) shape.data.x = dimensions.x;
        if (dimensions.y !== undefined) shape.data.y = dimensions.y;
        if (dimensions.width !== undefined) shape.data.width = dimensions.width;
        if (dimensions.height !== undefined) shape.data.height = dimensions.height;

        // Update Konva node
        if (dimensions.x !== undefined) shape.node.x(dimensions.x);
        if (dimensions.y !== undefined) shape.node.y(dimensions.y);
        if (dimensions.width !== undefined) shape.node.width(dimensions.width);
        if (dimensions.height !== undefined) shape.node.height(dimensions.height);

        this.layer.batchDraw();
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

        // Remove from map
        this.shapes.delete(shapeId);

        // Deselect if this was the selected shape
        if (this.selectedShapeId === shapeId) {
            this.selectedShapeId = null;
        }

        this.layer.batchDraw();
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
     * Clear all shapes
     */
    clear(): void {
        this.shapes.forEach(({ node }) => node.destroy());
        this.shapes.clear();
        this.selectedShapeId = null;
        this.layer.batchDraw();
    }
}
