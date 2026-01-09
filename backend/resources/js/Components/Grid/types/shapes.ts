/**
 * Shape Type Definitions
 *
 * Core interfaces for the shape system.
 */

import type { SHAPE_TYPES } from './constants';

/**
 * Base point in 2D space
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Rectangle dimensions
 */
export interface Dimensions {
  width: number;
  height: number;
}

/**
 * Bounding box
 */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Shape type union
 */
export type ShapeType = typeof SHAPE_TYPES[keyof typeof SHAPE_TYPES];

/**
 * Base shape interface - all shapes extend this
 */
export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;              // world coordinates
  y: number;
  zIndex: number;         // layering order
  metadata?: {
    createdAt?: number;
    updatedAt?: number;
    createdBy?: string;
  };
}

/**
 * Rectangle shape
 */
export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  label?: string;
  // Future: rotation, corner radius, etc.
}

/**
 * Union of all shape types
 */
export type Shape = RectangleShape;
// Future: | CircleShape | PolygonShape | CustomShape

/**
 * Shape creation configuration
 */
export interface ShapeConfig {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  label?: string;
}

/**
 * Shape update payload (partial updates allowed)
 */
export type ShapeUpdate = Partial<Omit<Shape, 'id' | 'type'>>;

/**
 * Shape validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
