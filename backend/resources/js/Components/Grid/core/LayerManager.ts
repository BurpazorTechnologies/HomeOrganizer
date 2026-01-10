/**
 * LayerManager
 *
 * Manages layers in the grid system.
 * Each step has its own layer that contains shapes.
 */

import type { Layer } from '@/Components/Grid/types/layers';
import type { Step } from '@/Components/Grid/types/steps';

export class LayerManager {
  private layers: Map<string, Layer> = new Map();
  private currentLayerId: string | null = null;

  /**
   * Create a new layer for a step
   */
  createLayer(step: Step): Layer {
    const layerId = `layer_${step.order}`;

    const layer: Layer = {
      id: layerId,
      step,
      order: step.order,
      label: step.label,
      shapeIds: [],
      primaryShapeId: null,
    };

    this.layers.set(layerId, layer);
    this.currentLayerId = layerId;

    return layer;
  }

  /**
   * Get layer by ID
   */
  getLayer(layerId: string): Layer | null {
    return this.layers.get(layerId) || null;
  }

  /**
   * Get current layer
   */
  getCurrentLayer(): Layer | null {
    if (!this.currentLayerId) return null;
    return this.layers.get(this.currentLayerId) || null;
  }

  /**
   * Add shape to layer
   */
  addShapeToLayer(layerId: string, shapeId: string, isPrimary: boolean = false): void {
    const layer = this.layers.get(layerId);
    if (!layer) return;

    // Add to shape list if not already present
    if (!layer.shapeIds.includes(shapeId)) {
      layer.shapeIds.push(shapeId);
    }

    // Set as primary shape if specified (typically the first shape created)
    if (isPrimary || layer.primaryShapeId === null) {
      layer.primaryShapeId = shapeId;
    }
  }

  /**
   * Remove shape from layer
   */
  removeShapeFromLayer(layerId: string, shapeId: string): void {
    const layer = this.layers.get(layerId);
    if (!layer) return;

    // Remove from shape list
    layer.shapeIds = layer.shapeIds.filter(id => id !== shapeId);

    // Clear primary if it was the primary shape
    if (layer.primaryShapeId === shapeId) {
      layer.primaryShapeId = layer.shapeIds.length > 0 ? layer.shapeIds[0] : null;
    }
  }

  /**
   * Get primary shape ID for a layer
   */
  getPrimaryShapeId(layerId: string): string | null {
    const layer = this.layers.get(layerId);
    return layer?.primaryShapeId || null;
  }

  /**
   * Get primary shape ID for current layer
   */
  getCurrentPrimaryShapeId(): string | null {
    if (!this.currentLayerId) return null;
    return this.getPrimaryShapeId(this.currentLayerId);
  }

  /**
   * Switch to a different layer
   */
  setCurrentLayer(layerId: string): void {
    if (this.layers.has(layerId)) {
      this.currentLayerId = layerId;
    }
  }

  /**
   * Get all layers
   */
  getAllLayers(): Layer[] {
    return Array.from(this.layers.values()).sort((a, b) => a.order - b.order);
  }

  /**
   * Clear all layers
   */
  clear(): void {
    this.layers.clear();
    this.currentLayerId = null;
  }
}
