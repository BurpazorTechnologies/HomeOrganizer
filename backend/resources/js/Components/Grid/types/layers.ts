/**
 * Layer Types
 *
 * Type definitions for the layer system.
 * Each step has a paired shape layer + label layer.
 *
 * Layer naming convention (based on step.id):
 * - Root layer: layer_{step.id} + layer_{step.id}_labels
 *   Example: layer_home_area + layer_home_area_labels
 * - Child layers: layer_{parentPath}_child_{areaId} + _labels
 *   Example: layer_home_area_child_123 + layer_home_area_child_123_labels
 */

import type { Step } from './steps';
import type Konva from 'konva';

/**
 * Layer definition - each layer has paired shape and label Konva layers
 */
export interface Layer {
  id: string;                      // Unique layer ID (e.g., 'layer_home', 'layer_home_child_123')
  step: Step;
  order: number;
  label: string;                   // Display label
  shapeIds: string[];
  primaryShapeId: string | null;   // The main/first shape created in this layer
  parentLayerId: string | null;    // Parent layer ID for hierarchy
  konvaShapeLayer: Konva.Layer;    // Layer for shapes
  konvaLabelLayer: Konva.Layer;    // Paired layer for labels (always above shapes)
}

/**
 * Layer manager state
 */
export interface LayerState {
  layers: Map<string, Layer>;
  currentLayerId: string | null;
}
