/**
 * LayerManager
 *
 * Manages layers in the grid system with proper hierarchy support.
 * Each layer has paired shape + label Konva layers.
 *
 * Layer naming convention (based on step.id):
 * - Root layer: layer_{step.id} (e.g., layer_home_area)
 * - Child layers: layer_{parentPath}_child_{areaId}
 *
 * Each layer has a paired label layer with "_labels" suffix:
 * - layer_home_area + layer_home_area_labels
 * - layer_home_area_child_123 + layer_home_area_child_123_labels
 *
 * Non-active layers are rendered with reduced opacity for visual hierarchy.
 */

import Konva from 'konva';
import type { Layer } from '@/Components/Grid/types/layers';
import type { Step } from '@/Components/Grid/types/steps';

const INACTIVE_LAYER_OPACITY = 0.4;
const ACTIVE_LAYER_OPACITY = 1.0;

export class LayerManager {
  private layers: Map<string, Layer> = new Map();
  private currentLayerId: string | null = null;
  private stage: Konva.Stage;
  private transformOverlayLayer: Konva.Layer; // For transform controls (always on top)

  constructor(stage: Konva.Stage) {
    this.stage = stage;

    // Create transform overlay layer (always stays on top for transform handles)
    this.transformOverlayLayer = new Konva.Layer({ id: 'transform_overlay' });
    this.stage.add(this.transformOverlayLayer);
  }

  /**
   * Generate layer ID based on hierarchy
   * @param step - The step this layer is for
   * @param parentLayerId - Parent layer ID (null for root layer)
   * @param areaId - Area ID for child layers
   */
  private generateLayerId(step: Step, parentLayerId: string | null, areaId?: string): string {
    // Root layer uses step.id (e.g., "layer_home_area")
    if (!parentLayerId) {
      return `layer_${step.id}`;
    }

    // Child layers append to parent path
    if (areaId) {
      const parentPath = parentLayerId.replace('layer_', '');
      return `layer_${parentPath}_child_${areaId}`;
    }

    // Fallback: use step id with order
    return `layer_${step.id}_${step.order}`;
  }

  /**
   * Create a new layer pair (shape + label) for a step
   */
  createLayer(step: Step, parentLayerId: string | null = null, areaId?: string): Layer {
    const layerId = this.generateLayerId(step, parentLayerId, areaId);

    // Check if layer already exists
    const existingLayer = this.layers.get(layerId);
    if (existingLayer) {
      this.setCurrentLayer(layerId);
      return existingLayer;
    }

    // Create paired Konva layers (shape layer first, then label layer on top)
    const konvaShapeLayer = new Konva.Layer({ id: layerId });
    const konvaLabelLayer = new Konva.Layer({ id: `${layerId}_label` });

    // Add to stage in correct order
    this.stage.add(konvaShapeLayer);
    this.stage.add(konvaLabelLayer);

    const layer: Layer = {
      id: layerId,
      step,
      order: step.order,
      label: step.label,
      shapeIds: [],
      primaryShapeId: null,
      parentLayerId,
      konvaShapeLayer,
      konvaLabelLayer,
    };

    this.layers.set(layerId, layer);
    this.setCurrentLayer(layerId);

    // Ensure proper z-ordering: label layers always above shape layers
    this.reorderLayers();

    return layer;
  }

  /**
   * Reorder all layers to ensure proper z-index:
   * - Shape layers by order
   * - Each label layer immediately after its shape layer
   * - Active layer and its labels on top
   * - Transform overlay always on very top
   */
  private reorderLayers(): void {
    const sortedLayers = Array.from(this.layers.values()).sort((a, b) => {
      // Sort by order, then by parent hierarchy
      if (a.order !== b.order) return a.order - b.order;
      // Same order - sort by ID for consistency
      return a.id.localeCompare(b.id);
    });

    // Move layers to correct positions
    sortedLayers.forEach(layer => {
      layer.konvaShapeLayer.moveToTop();
      layer.konvaLabelLayer.moveToTop();
    });

    // Move current layer to top
    if (this.currentLayerId) {
      const currentLayer = this.layers.get(this.currentLayerId);
      if (currentLayer) {
        currentLayer.konvaShapeLayer.moveToTop();
        currentLayer.konvaLabelLayer.moveToTop();
      }
    }

    // Transform overlay always stays on very top (for transform handles)
    this.transformOverlayLayer.moveToTop();
  }

  /**
   * Get layer by ID
   */
  getLayer(layerId: string): Layer | null {
    return this.layers.get(layerId) || null;
  }

  /**
   * Get Konva shape layer by layer ID
   */
  getKonvaLayer(layerId: string): Konva.Layer | null {
    const layer = this.layers.get(layerId);
    return layer?.konvaShapeLayer || null;
  }

  /**
   * Get Konva label layer by layer ID
   */
  getKonvaLabelLayer(layerId: string): Konva.Layer | null {
    const layer = this.layers.get(layerId);
    return layer?.konvaLabelLayer || null;
  }

  /**
   * Get current layer
   */
  getCurrentLayer(): Layer | null {
    if (!this.currentLayerId) return null;
    return this.layers.get(this.currentLayerId) || null;
  }

  /**
   * Get current Konva shape layer
   */
  getCurrentKonvaLayer(): Konva.Layer | null {
    if (!this.currentLayerId) return null;
    return this.getKonvaLayer(this.currentLayerId);
  }

  /**
   * Get current Konva label layer
   */
  getCurrentKonvaLabelLayer(): Konva.Layer | null {
    if (!this.currentLayerId) return null;
    return this.getKonvaLabelLayer(this.currentLayerId);
  }

  /**
   * Switch to a different layer and update visual states
   */
  setCurrentLayer(layerId: string): void {
    if (!this.layers.has(layerId)) return;

    const previousLayerId = this.currentLayerId;
    this.currentLayerId = layerId;

    // Update visual states for all layers
    this.updateLayerVisuals(previousLayerId);
    this.reorderLayers();
  }

  /**
   * Update layer visuals (opacity) based on active state
   */
  private updateLayerVisuals(previousLayerId: string | null): void {
    this.layers.forEach((layer, id) => {
      const isActive = id === this.currentLayerId;
      const isParentOfActive = this.isParentOfCurrentLayer(id);

      let opacity = INACTIVE_LAYER_OPACITY;
      if (isActive) {
        opacity = ACTIVE_LAYER_OPACITY;
      } else if (isParentOfActive) {
        // Parent layers are semi-transparent but more visible than others
        opacity = 0.5;
      }

      layer.konvaShapeLayer.opacity(opacity);
      layer.konvaLabelLayer.opacity(opacity);
      layer.konvaShapeLayer.batchDraw();
      layer.konvaLabelLayer.batchDraw();
    });
  }

  /**
   * Check if a layer is a parent of the current layer
   */
  private isParentOfCurrentLayer(layerId: string): boolean {
    if (!this.currentLayerId) return false;

    let currentLayer = this.layers.get(this.currentLayerId);
    while (currentLayer?.parentLayerId) {
      if (currentLayer.parentLayerId === layerId) return true;
      currentLayer = this.layers.get(currentLayer.parentLayerId);
    }
    return false;
  }

  /**
   * Add shape to layer
   */
  addShapeToLayer(layerId: string, shapeId: string, isPrimary: boolean = false): void {
    const layer = this.layers.get(layerId);
    if (!layer) return;

    if (!layer.shapeIds.includes(shapeId)) {
      layer.shapeIds.push(shapeId);
    }

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

    layer.shapeIds = layer.shapeIds.filter(id => id !== shapeId);

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
   * Get all layers
   */
  getAllLayers(): Layer[] {
    return Array.from(this.layers.values()).sort((a, b) => a.order - b.order);
  }

  /**
   * Get child layers of a parent
   */
  getChildLayers(parentLayerId: string): Layer[] {
    return Array.from(this.layers.values())
      .filter(layer => layer.parentLayerId === parentLayerId)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Clear all layers (but keep transform overlay)
   */
  clear(): void {
    this.layers.forEach(layer => {
      layer.konvaShapeLayer.destroy();
      layer.konvaLabelLayer.destroy();
    });
    this.layers.clear();
    this.currentLayerId = null;
    // Note: transform overlay is kept - it just needs its children cleared
    this.transformOverlayLayer.destroyChildren();
  }

  /**
   * Get layer hierarchy path (for display/debug)
   */
  getLayerPath(layerId: string): string[] {
    const path: string[] = [];
    let currentLayer = this.layers.get(layerId);

    while (currentLayer) {
      path.unshift(currentLayer.label);
      currentLayer = currentLayer.parentLayerId
        ? this.layers.get(currentLayer.parentLayerId)
        : undefined;
    }

    return path;
  }

  /**
   * Get transform overlay layer (for transform handles - always stays on top)
   * This is separate from step layers and is used only by TransformManager
   */
  getTransformOverlayLayer(): Konva.Layer {
    return this.transformOverlayLayer;
  }

  /**
   * Get current layer ID
   */
  getCurrentLayerId(): string | null {
    return this.currentLayerId;
  }
}
