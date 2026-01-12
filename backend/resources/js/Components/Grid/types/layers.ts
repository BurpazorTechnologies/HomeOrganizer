/**
 * Layer Types
 *
 * Type definitions for the layer system.
 * Each step has a paired shape layer + label layer.
 *
 * NOTE: For storable layer state, use LayerState from types/state/.
 * This file defines the runtime Layer type which includes Konva layer references.
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
 * Layer - Runtime layer with Konva references
 *
 * This is different from LayerState (types/state/):
 * - Layer = runtime type with Konva.Layer references (used by LayerManager)
 * - LayerState = storable state without Konva refs (used by GridStateStore)
 */
export interface Layer {
  /** Unique layer ID (e.g., 'layer_home', 'layer_home_child_123') */
  id: string;

  /** Step this layer belongs to */
  step: Step;

  /** Order for z-index layering */
  order: number;

  /** Display label */
  label: string;

  /** IDs of shapes in this layer */
  shapeIds: string[];

  /** Primary/main shape ID (first shape created in layer) */
  primaryShapeId: string | null;

  /** Parent layer ID for hierarchy (null = root layer) */
  parentLayerId: string | null;

  /** Konva layer for shapes (runtime only, not serialized) */
  konvaShapeLayer: Konva.Layer;

  /** Konva layer for labels (always rendered above shapes) */
  konvaLabelLayer: Konva.Layer;
}

// NOTE: LayerState has been moved to types/state/LayerState.ts
// Import it from there: import type { LayerState } from '../types/state';
