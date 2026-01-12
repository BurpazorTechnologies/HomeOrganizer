/**
 * LayerState - Canonical layer state type
 *
 * Single source of truth for layer state in the grid system.
 * Represents the serializable/storable layer data.
 *
 * NOTE: This does NOT include Konva layer references.
 * Konva.Layer instances are managed by LayerManager at runtime.
 * See types/layers.ts for the runtime Layer type with Konva refs.
 */

/**
 * Layer state - represents a layer's storable data
 */
export interface LayerState {
  /** Unique identifier (e.g., 'layer_home_area', 'layer_home_area_child_123') */
  id: string;

  /** ID of the step this layer belongs to */
  stepId: string;

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

  /** Optional area ID reference (legacy field) */
  areaId?: string;

  /** Lock state - when true, shapes in this layer cannot be interacted with */
  isLocked: boolean;
}

/**
 * Partial layer update - for updating layers without full replacement
 */
export type LayerStateUpdate = Partial<Omit<LayerState, 'id'>>;
