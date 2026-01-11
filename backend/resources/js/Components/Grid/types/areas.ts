/**
 * Area Type System
 *
 * Defines the hierarchical area structure for the home organizer.
 * Areas can be nested to represent floors, rooms, and sub-spaces.
 */

import type { Step } from './steps';

/**
 * Area Types
 */
export type AreaType =
  | 'home'    // Base area - the property boundary
  | 'floor'   // Floor grouping (future)
  | 'area'    // General area (dining, kitchen, etc.)
  | 'room';   // Sub-area / room

/**
 * Base Area Interface
 */
export interface Area {
  id: string;
  type: AreaType;
  label: string;
  shapeId: string;        // Reference to the shape in ShapeManager
  layerId: string;        // Reference to layer
  parentId: string | null; // Null for root (home area)
  childIds: string[];     // Nested areas
  depth: number;          // Nesting level (0 = home, 1 = first level, etc.)
  metadata?: {
    color?: { fill: string; stroke: string };
    order?: number;
    floor?: number;       // Which floor this area belongs to
    [key: string]: any;
  };
}

/**
 * Home Area - The root area
 */
export interface HomeArea extends Area {
  type: 'home';
  parentId: null;
  depth: 0;
}

/**
 * Area Hierarchy Configuration
 */
export const AREA_CONFIG = {
  MAX_NESTING_DEPTH: 5,           // Maximum nesting levels
  HOME_AREA_MAX_COUNT: 1,         // Only one home area per project
  AREA_TYPE_COLORS: {
    home: {
      fill: '#d1fae5',            // light green
      stroke: '#059669',          // green
    },
    floor: {
      fill: '#e0e7ff',            // light indigo
      stroke: '#6366f1',          // indigo
    },
    area: {
      fill: '#dbeafe',            // light blue
      stroke: '#2563eb',          // blue
    },
    room: {
      fill: '#fef3c7',            // light yellow
      stroke: '#f59e0b',          // orange
    },
  },
} as const;

/**
 * Helper function to create a new area
 */
export function createArea(
  id: string,
  type: AreaType,
  label: string,
  shapeId: string,
  layerId: string,
  parentId: string | null = null
): Area {
  const depth = parentId === null ? 0 : 1; // Will be calculated properly when hierarchy is implemented

  return {
    id,
    type,
    label,
    shapeId,
    layerId,
    parentId,
    childIds: [],
    depth,
    metadata: {
      color: AREA_CONFIG.AREA_TYPE_COLORS[type],
    },
  };
}

/**
 * Type guard for HomeArea
 */
export function isHomeArea(area: Area): area is HomeArea {
  return area.type === 'home' && area.parentId === null && area.depth === 0;
}
