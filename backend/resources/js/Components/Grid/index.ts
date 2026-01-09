/**
 * Grid System - Main Export
 *
 * Centralized exports for the entire grid system.
 * Import from this file to access any grid functionality.
 */

// Core Managers
export { GridManager } from './core/GridManager';
export { ZoomManager } from './core/ZoomManager';
export { ShapeManager } from './core/ShapeManager';
export { TransformManager } from './core/TransformManager';

// Factories
export { ShapeFactory } from './factories/ShapeFactory';

// Utilities
export * from './utils/idGenerator';
export * from './utils/coordinates';
export * from './utils/validation';

// Types
export type {
  Shape,
  RectangleShape,
  ShapeType,
  ShapeConfig,
  ShapeUpdate,
  Point,
  Dimensions,
  Bounds,
  ValidationResult,
} from './types/shapes';

export type {
  GridConfig,
  ViewportState,
  VisibleBounds,
  GridRenderSettings,
} from './types/grid';

// Constants
export { GRID_CONSTANTS, SHAPE_TYPES, SHAPE_COLORS, TRANSFORMER_CONFIG } from './types/constants';
