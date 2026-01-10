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
