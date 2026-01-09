/**
 * Shape Factory
 *
 * Responsible for creating validated shape instances with proper defaults.
 * This is the ONLY way shapes should be created in the system.
 */

import type { RectangleShape, ShapeConfig } from '../types/shapes';
import { SHAPE_TYPES, SHAPE_COLORS, GRID_CONSTANTS } from '../types/constants';
import { generateShapeId } from '../utils/idGenerator';
import { validateShapeConfig, validateRectangle } from '../utils/validation';

export class ShapeFactory {
  /**
   * Create a new rectangle shape
   *
   * @param config - Optional configuration for the rectangle
   * @returns A fully configured rectangle shape
   * @throws Error if configuration is invalid
   *
   * @example
   * const shape = ShapeFactory.createRectangle({
   *   x: 100,
   *   y: 100,
   *   width: 200,
   *   height: 150
   * });
   */
  static createRectangle(config: ShapeConfig = {}): RectangleShape {
    // Validate configuration
    const validation = validateShapeConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid shape configuration: ${validation.errors.join(', ')}`);
    }

    // Apply defaults
    const shape: RectangleShape = {
      // Core properties
      id: generateShapeId(),
      type: SHAPE_TYPES.RECTANGLE,

      // Position (default to origin if not specified)
      x: config.x ?? 0,
      y: config.y ?? 0,

      // Dimensions (use constants for defaults)
      width: config.width ?? GRID_CONSTANTS.DEFAULT_SHAPE_WIDTH,
      height: config.height ?? GRID_CONSTANTS.DEFAULT_SHAPE_HEIGHT,

      // Visual properties (use color constants)
      fill: config.fill ?? SHAPE_COLORS.DEFAULT_FILL,
      stroke: config.stroke ?? SHAPE_COLORS.DEFAULT_STROKE,
      strokeWidth: config.strokeWidth ?? GRID_CONSTANTS.SHAPE_STROKE_WIDTH,

      // Optional properties
      label: config.label,

      // Z-index (layering)
      zIndex: 0,

      // Metadata
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };

    // Final validation of complete shape
    const shapeValidation = validateRectangle(shape);
    if (!shapeValidation.valid) {
      throw new Error(`Created shape is invalid: ${shapeValidation.errors.join(', ')}`);
    }

    return shape;
  }

  /**
   * Create a shape with automatic positioning
   *
   * Places the shape at a default location offset by index
   * Useful for toolbar "Add Shape" buttons
   *
   * @param index - Index for automatic positioning
   * @param config - Optional additional configuration
   * @returns A new rectangle shape
   */
  static createRectangleAtIndex(index: number, config: ShapeConfig = {}): RectangleShape {
    const offset = 50; // pixels to offset each new shape
    const startX = 100;
    const startY = 100;

    return this.createRectangle({
      ...config,
      x: config.x ?? startX + index * offset,
      y: config.y ?? startY + index * offset,
    });
  }

  /**
   * Clone an existing shape with a new ID
   *
   * @param shape - Shape to clone
   * @param offset - Optional position offset for the clone
   * @returns A new shape with the same properties
   */
  static cloneShape(shape: RectangleShape, offset?: { x: number; y: number }): RectangleShape {
    const cloned: RectangleShape = {
      ...shape,
      id: generateShapeId(),
      x: shape.x + (offset?.x ?? 20),
      y: shape.y + (offset?.y ?? 20),
      metadata: {
        ...shape.metadata,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };

    return cloned;
  }

  /**
   * Validate a shape object
   *
   * @param shape - Shape to validate
   * @returns True if shape is valid
   * @throws Error if shape is invalid
   */
  static validate(shape: RectangleShape): boolean {
    const validation = validateRectangle(shape);
    if (!validation.valid) {
      throw new Error(`Shape validation failed: ${validation.errors.join(', ')}`);
    }
    return true;
  }
}
