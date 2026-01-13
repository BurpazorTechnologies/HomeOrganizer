import Konva from 'konva';
import type { LayerManager } from '@/Components/Grid/core/LayerManager';
import type { GridStateStore } from '@/Components/Grid/core/state/GridStateStore';
import { GRID_CONSTANTS } from '@/Components/Grid/types/constants';

/**
 * LabelManager
 *
 * Manages text labels that appear on shapes showing their dimensions or names.
 * Labels are placed on the step's paired label layer (not a global overlay).
 *
 * Each shape's label is placed on the konvaLabelLayer of its parent layer,
 * ensuring proper opacity handling when layers become inactive.
 *
 * Font sizes are responsive to shape height with min/max constraints for readability.
 * The base font size is configurable via the store's baseFontSize setting.
 */
export class LabelManager {
    private layerManager: LayerManager;
    private store: GridStateStore | null = null;
    private labels: Map<string, Konva.Text> = new Map();
    private labelTypes: Map<string, 'dimension' | 'areaName'> = new Map();
    private labelLayerIds: Map<string, string> = new Map(); // shapeId -> layerId

    constructor(layerManager: LayerManager) {
        this.layerManager = layerManager;
    }

    /**
     * Set the store reference for accessing baseFontSize
     */
    setStore(store: GridStateStore): void {
        this.store = store;
    }

    /**
     * Calculate responsive font size based on shape height and user-configured base size
     * Returns a font size that scales with shape height but stays within readable bounds
     *
     * The baseFontSize from store acts as the starting point / maximum size.
     * Font size scales down for smaller shapes but respects LABEL_MIN_FONT_SIZE.
     */
    private calculateResponsiveFontSize(shapeHeight: number): number {
        const { LABEL_MIN_FONT_SIZE, LABEL_HEIGHT_RATIO } = GRID_CONSTANTS;

        // Get user-configured base font size (acts as the maximum)
        const baseFontSize = this.store?.getGridConfig()?.baseFontSize ?? GRID_CONSTANTS.LABEL_MAX_FONT_SIZE;

        // Calculate font size as percentage of shape height
        const calculatedSize = Math.round(shapeHeight * LABEL_HEIGHT_RATIO);

        // Clamp between min and baseFontSize (user-configured max)
        return Math.max(LABEL_MIN_FONT_SIZE, Math.min(baseFontSize, calculatedSize));
    }

    /**
     * Get the label layer for a shape
     * Uses stored layerId if exists, otherwise uses current layer
     */
    private getLabelLayer(shapeId?: string): Konva.Layer | null {
        // If we have a stored layer for this shape, use it
        if (shapeId) {
            const storedLayerId = this.labelLayerIds.get(shapeId);
            if (storedLayerId) {
                return this.layerManager.getKonvaLabelLayer(storedLayerId);
            }
        }

        // Otherwise use current layer
        const currentLayerId = this.layerManager.getCurrentLayerId();
        if (!currentLayerId) return null;
        return this.layerManager.getKonvaLabelLayer(currentLayerId);
    }

    /**
     * Create or update a label for a shape
     * @param shapeId - The shape ID
     * @param dimensions - Shape dimensions for positioning
     * @param layerId - Optional layer ID (defaults to current layer)
     */
    updateLabel(
        shapeId: string,
        dimensions: { x: number; y: number; width: number; height: number },
        layerId?: string
    ): void {
        // Don't overwrite area name labels - but update font size and position responsively
        if (this.labelTypes.get(shapeId) === 'areaName') {
            const label = this.labels.get(shapeId);
            if (label) {
                // Update font size responsively based on new shape height
                const fontSize = this.calculateResponsiveFontSize(dimensions.height);
                label.fontSize(fontSize);

                // Recalculate position after font size change
                const labelX = dimensions.x + dimensions.width / 2 - label.width() / 2;
                const labelY = dimensions.y + dimensions.height / 2 - label.height() / 2;
                label.position({ x: labelX, y: labelY });
                label.moveToTop();
                label.getLayer()?.batchDraw();
            }
            return;
        }

        const labelText = `${Math.round(dimensions.width)}x${Math.round(dimensions.height)}`;

        // Get or determine the layer for this label
        const targetLayerId = layerId || this.labelLayerIds.get(shapeId) || this.layerManager.getCurrentLayerId();
        if (!targetLayerId) {
            console.warn('LabelManager: No layer available for label');
            return;
        }

        const labelLayer = this.layerManager.getKonvaLabelLayer(targetLayerId);
        if (!labelLayer) {
            console.warn(`LabelManager: Label layer not found for ${targetLayerId}`);
            return;
        }

        // Check if label already exists
        let label = this.labels.get(shapeId);

        if (!label) {
            // Create new label
            label = new Konva.Text({
                id: `label_${shapeId}`,
                text: labelText,
                fontSize: 14,
                fontFamily: 'Arial, sans-serif',
                fill: '#374151', // gray-700
                align: 'center',
                listening: false, // Labels don't respond to events
            });

            this.labels.set(shapeId, label);
            this.labelLayerIds.set(shapeId, targetLayerId);
            labelLayer.add(label);
        } else {
            // Update existing label
            label.text(labelText);
        }

        // Position label below the shape (centered)
        const labelX = dimensions.x + dimensions.width / 2 - label.width() / 2;
        const labelY = dimensions.y + dimensions.height + 8; // 8px gap below shape

        label.position({ x: labelX, y: labelY });
        label.moveToTop();
        this.labelTypes.set(shapeId, 'dimension');
        labelLayer.batchDraw();
    }

    /**
     * Update label to show area name (centered on shape)
     * Font size scales responsively with shape height (min 12px, max 48px)
     *
     * @param shapeId - The shape ID
     * @param areaName - The area name to display
     * @param dimensions - Shape dimensions for positioning and font scaling
     * @param layerId - Optional layer ID (defaults to current layer)
     */
    updateAreaNameLabel(
        shapeId: string,
        areaName: string,
        dimensions: { x: number; y: number; width: number; height: number },
        layerId?: string
    ): void {
        // Get or determine the layer for this label
        const targetLayerId = layerId || this.labelLayerIds.get(shapeId) || this.layerManager.getCurrentLayerId();
        if (!targetLayerId) {
            console.warn('LabelManager: No layer available for area name label');
            return;
        }

        const labelLayer = this.layerManager.getKonvaLabelLayer(targetLayerId);
        if (!labelLayer) {
            console.warn(`LabelManager: Label layer not found for ${targetLayerId}`);
            return;
        }

        // Calculate responsive font size based on shape height
        const fontSize = this.calculateResponsiveFontSize(dimensions.height);

        let label = this.labels.get(shapeId);

        if (!label) {
            // Create new label with responsive font size
            label = new Konva.Text({
                id: `label_${shapeId}`,
                text: areaName,
                fontSize: fontSize,
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold',
                fill: '#1f2937', // gray-800
                align: 'center',
                verticalAlign: 'middle',
                listening: false,
            });

            this.labels.set(shapeId, label);
            this.labelLayerIds.set(shapeId, targetLayerId);
            labelLayer.add(label);
        } else {
            // Update existing label with responsive font size
            label.text(areaName);
            label.fontSize(fontSize);
            label.fontStyle('bold');
            label.fill('#1f2937');
        }

        // Draw first to ensure text is measured with new font size
        labelLayer.batchDraw();

        // Position label at center of shape (after text measurement)
        const labelWidth = label.width();
        const labelHeight = label.height();
        const labelX = dimensions.x + dimensions.width / 2 - labelWidth / 2;
        const labelY = dimensions.y + dimensions.height / 2 - labelHeight / 2;

        label.position({ x: labelX, y: labelY });
        label.moveToTop();
        this.labelTypes.set(shapeId, 'areaName');
        labelLayer.batchDraw();
    }

    /**
     * Remove a label
     */
    removeLabel(shapeId: string): void {
        const label = this.labels.get(shapeId);
        if (label) {
            const layer = label.getLayer();
            label.destroy();
            this.labels.delete(shapeId);
            this.labelTypes.delete(shapeId);
            this.labelLayerIds.delete(shapeId);
            layer?.batchDraw();
        }
    }

    /**
     * Get a label by shape ID
     */
    getLabel(shapeId: string): Konva.Text | null {
        return this.labels.get(shapeId) || null;
    }

    /**
     * Clear all labels
     */
    clearAll(): void {
        this.labels.forEach(label => {
            const layer = label.getLayer();
            label.destroy();
            layer?.batchDraw();
        });
        this.labels.clear();
        this.labelTypes.clear();
        this.labelLayerIds.clear();
    }

    /**
     * Show a label
     */
    showLabel(shapeId: string): void {
        const label = this.labels.get(shapeId);
        if (label) {
            label.show();
            label.moveToTop();
            label.getLayer()?.batchDraw();
        }
    }

    /**
     * Hide a label
     */
    hideLabel(shapeId: string): void {
        const label = this.labels.get(shapeId);
        if (label) {
            label.hide();
            label.getLayer()?.batchDraw();
        }
    }

    /**
     * Get the layer ID where a shape's label is stored
     */
    getLabelLayerId(shapeId: string): string | null {
        return this.labelLayerIds.get(shapeId) || null;
    }

    /**
     * Refresh all area name labels with the current baseFontSize
     * Called when user changes the base font size setting
     */
    refreshAllLabels(): void {
        if (!this.store) return;

        const shapes = this.store.state.shapes;
        const layersToRedraw = new Set<Konva.Layer>();

        for (const [shapeId, label] of this.labels) {
            // Only update area name labels (not dimension labels)
            if (this.labelTypes.get(shapeId) !== 'areaName') continue;

            const shape = shapes.get(shapeId);
            if (!shape) continue;

            // Recalculate font size with new baseFontSize
            const fontSize = this.calculateResponsiveFontSize(shape.height);
            label.fontSize(fontSize);

            // Recalculate position after font size change
            const labelWidth = label.width();
            const labelHeight = label.height();
            const labelX = shape.x + shape.width / 2 - labelWidth / 2;
            const labelY = shape.y + shape.height / 2 - labelHeight / 2;
            label.position({ x: labelX, y: labelY });

            const layer = label.getLayer();
            if (layer) layersToRedraw.add(layer);
        }

        // Batch redraw all affected layers
        for (const layer of layersToRedraw) {
            layer.batchDraw();
        }
    }
}
