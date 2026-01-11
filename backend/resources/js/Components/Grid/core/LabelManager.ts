import Konva from 'konva';

/**
 * LabelManager
 *
 * Manages text labels that appear below shapes showing their dimensions.
 * Example: "410x590"
 */
export class LabelManager {
    private stage: Konva.Stage;
    private layer: Konva.Layer;
    private labels: Map<string, Konva.Text> = new Map();
    private labelTypes: Map<string, 'dimension' | 'areaName'> = new Map();

    constructor(stage: Konva.Stage, layer: Konva.Layer) {
        this.stage = stage;
        this.layer = layer;
    }

    /**
     * Create or update a label for a shape
     */
    updateLabel(
        shapeId: string,
        dimensions: { x: number; y: number; width: number; height: number }
    ): void {
        // Don't overwrite area name labels
        if (this.labelTypes.get(shapeId) === 'areaName') {
            const label = this.labels.get(shapeId);
            if (label) {
                // Just update position (keep the area name text)
                const labelX = dimensions.x + dimensions.width / 2 - label.width() / 2;
                const labelY = dimensions.y + dimensions.height / 2 - label.height() / 2;
                label.position({ x: labelX, y: labelY });
                this.layer.batchDraw();
            }
            return;
        }

        const labelText = `${Math.round(dimensions.width)}x${Math.round(dimensions.height)}`;

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
            this.layer.add(label);
        } else {
            // Update existing label
            label.text(labelText);
        }

        // Position label below the shape (centered)
        const labelX = dimensions.x + dimensions.width / 2 - label.width() / 2;
        const labelY = dimensions.y + dimensions.height + 8; // 8px gap below shape

        label.position({ x: labelX, y: labelY });
        this.labelTypes.set(shapeId, 'dimension');
        this.layer.batchDraw();
    }

    /**
     * Update label to show area name (centered on shape)
     */
    updateAreaNameLabel(
        shapeId: string,
        areaName: string,
        dimensions: { x: number; y: number; width: number; height: number }
    ): void {
        let label = this.labels.get(shapeId);

        if (!label) {
            // Create new label
            label = new Konva.Text({
                id: `label_${shapeId}`,
                text: areaName,
                fontSize: 16,
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold',
                fill: '#1f2937', // gray-800
                align: 'center',
                verticalAlign: 'middle',
                listening: false,
            });

            this.labels.set(shapeId, label);
            this.layer.add(label);
        } else {
            // Update existing label to area name
            label.text(areaName);
            label.fontSize(16);
            label.fontStyle('bold');
            label.fill('#1f2937');
        }

        // Draw first to ensure text is measured
        this.layer.batchDraw();

        // Position label at center of shape (after text measurement)
        const labelWidth = label.width();
        const labelHeight = label.height();
        const labelX = dimensions.x + dimensions.width / 2 - labelWidth / 2;
        const labelY = dimensions.y + dimensions.height / 2 - labelHeight / 2;

        label.position({ x: labelX, y: labelY });
        this.labelTypes.set(shapeId, 'areaName');
        this.layer.batchDraw();
    }

    /**
     * Remove a label
     */
    removeLabel(shapeId: string): void {
        const label = this.labels.get(shapeId);
        if (label) {
            label.destroy();
            this.labels.delete(shapeId);
            this.labelTypes.delete(shapeId);
            this.layer.batchDraw();
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
        this.labels.forEach(label => label.destroy());
        this.labels.clear();
        this.labelTypes.clear();
        this.layer.batchDraw();
    }

    /**
     * Show a label
     */
    showLabel(shapeId: string): void {
        const label = this.labels.get(shapeId);
        if (label) {
            label.show();
            this.layer.batchDraw();
        }
    }

    /**
     * Hide a label
     */
    hideLabel(shapeId: string): void {
        const label = this.labels.get(shapeId);
        if (label) {
            label.hide();
            this.layer.batchDraw();
        }
    }
}
