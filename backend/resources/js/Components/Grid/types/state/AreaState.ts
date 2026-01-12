/**
 * AreaState - Canonical area state type
 *
 * Single source of truth for area state in the grid system.
 * Areas represent hierarchical containers (home > floor > area > room).
 *
 * NOTE: This is a legacy type being migrated to unified shape/area model.
 * New code should use ShapeState with areaType set instead.
 */

/**
 * Area type - semantic classification of an area/shape
 */
export type AreaType = 'home' | 'floor' | 'area' | 'room';

/**
 * Area state - represents a hierarchical area
 *
 * @deprecated Prefer using ShapeState with areaType for new code.
 * This type is kept for backwards compatibility during migration.
 */
export interface AreaState {
  /** Unique identifier */
  id: string;

  /** Area type classification */
  type: AreaType;

  /** Display label */
  label: string;

  /** Reference to the associated shape */
  shapeId: string;

  /** Reference to the layer containing this area */
  layerId: string;

  /** Parent area ID (null for root/home area) */
  parentId: string | null;

  /** IDs of child areas */
  childIds: string[];

  /** Nesting depth (0 = home, 1+ = children) */
  depth: number;

  /** Optional metadata (colors, floor number, custom properties) */
  metadata?: Record<string, unknown>;
}

/**
 * Partial area update - for updating areas without full replacement
 */
export type AreaStateUpdate = Partial<Omit<AreaState, 'id'>>;
