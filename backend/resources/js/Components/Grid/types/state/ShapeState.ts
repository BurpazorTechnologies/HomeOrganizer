/**
 * ShapeState - Canonical shape state type
 *
 * Single source of truth for shape state in the grid system.
 * Shapes can optionally be "areas" (semantic containers with hierarchy).
 */

// Import and re-export AreaType from AreaState for convenience
import type { AreaType } from './AreaState';
export type { AreaType };

/**
 * Shape type - currently only rectangle, future: circle, polygon, etc.
 */
export type ShapeType = 'rectangle' | 'circle';

/**
 * Shape state - represents a single shape in the grid
 *
 * Shapes can optionally be "areas" - semantic containers with hierarchy.
 * When areaType is set (not null), the shape participates in the area hierarchy.
 * This eliminates the need for a separate AreaManager - areas ARE shapes.
 */
export interface ShapeState {
  /** Unique identifier */
  id: string;

  /** Shape type (rectangle, circle, etc.) */
  type: ShapeType;

  /** X position in world coordinates */
  x: number;

  /** Y position in world coordinates */
  y: number;

  /** Width of the shape */
  width: number;

  /** Height of the shape */
  height: number;

  /** Fill color */
  fill: string;

  /** Stroke/border color */
  stroke: string;

  /** Stroke/border width */
  strokeWidth: number;

  /** Display label for the shape */
  label: string;

  /** ID of the layer this shape belongs to */
  layerId: string;

  /** Parent shape ID for bounds constraints (null = no parent) */
  parentShapeId: string | null;

  /** Z-index for layering order */
  zIndex: number;

  // ==================== Area Semantics ====================
  // These fields are optional - null/empty means plain shape, not an area

  /** Area type classification (null = plain shape, set = area shape) */
  areaType: AreaType | null;

  /** IDs of child shapes (for area hierarchy) */
  childShapeIds: string[];

  /** Nesting level (0 = root, 1+ = children) */
  depth: number;

  /** Optional metadata (colors, floor, custom properties) */
  metadata?: Record<string, unknown>;
}

/**
 * Partial shape update - for updating shapes without full replacement
 */
export type ShapeStateUpdate = Partial<Omit<ShapeState, 'id'>>;
