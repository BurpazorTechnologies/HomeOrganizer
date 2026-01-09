/**
 * Validation Utilities
 *
 * Functions for validating shapes, dimensions, and configurations.
 */

import type { RectangleShape, ValidationResult, ShapeConfig } from '../types/shapes';
import { GRID_CONSTANTS, SHAPE_TYPES } from '../types/constants';

/**
 * Validate rectangle dimensions
 *
 * @param width - Rectangle width
 * @param height - Rectangle height
 * @param minSize - Minimum allowed size (default from constants)
 * @returns Validation result
 */
export function validateDimensions(
  width: number,
  height: number,
  minSize: number = GRID_CONSTANTS.MIN_SHAPE_SIZE
): ValidationResult {
  const errors: string[] = [];

  if (typeof width !== 'number' || isNaN(width)) {
    errors.push('Width must be a valid number');
  } else if (width < minSize) {
    errors.push(`Width must be at least ${minSize}px`);
  }

  if (typeof height !== 'number' || isNaN(height)) {
    errors.push('Height must be a valid number');
  } else if (height < minSize) {
    errors.push(`Height must be at least ${minSize}px`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate position coordinates
 *
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns Validation result
 */
export function validatePosition(x: number, y: number): ValidationResult {
  const errors: string[] = [];

  if (typeof x !== 'number' || isNaN(x)) {
    errors.push('X coordinate must be a valid number');
  } else if (x < GRID_CONSTANTS.CANVAS_MIN_X || x > GRID_CONSTANTS.CANVAS_MAX_X) {
    errors.push(`X coordinate must be between ${GRID_CONSTANTS.CANVAS_MIN_X} and ${GRID_CONSTANTS.CANVAS_MAX_X}`);
  }

  if (typeof y !== 'number' || isNaN(y)) {
    errors.push('Y coordinate must be a valid number');
  } else if (y < GRID_CONSTANTS.CANVAS_MIN_Y || y > GRID_CONSTANTS.CANVAS_MAX_Y) {
    errors.push(`Y coordinate must be between ${GRID_CONSTANTS.CANVAS_MIN_Y} and ${GRID_CONSTANTS.CANVAS_MAX_Y}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a complete rectangle shape
 *
 * @param shape - Rectangle shape to validate
 * @returns Validation result
 */
export function validateRectangle(shape: Partial<RectangleShape>): ValidationResult {
  const errors: string[] = [];

  // Validate type
  if (shape.type !== SHAPE_TYPES.RECTANGLE) {
    errors.push(`Invalid shape type: ${shape.type}`);
  }

  // Validate ID
  if (!shape.id || typeof shape.id !== 'string') {
    errors.push('Shape must have a valid ID');
  }

  // Validate position
  if (shape.x !== undefined && shape.y !== undefined) {
    const positionValidation = validatePosition(shape.x, shape.y);
    if (!positionValidation.valid) {
      errors.push(...positionValidation.errors);
    }
  }

  // Validate dimensions
  if (shape.width !== undefined && shape.height !== undefined) {
    const dimensionValidation = validateDimensions(shape.width, shape.height);
    if (!dimensionValidation.valid) {
      errors.push(...dimensionValidation.errors);
    }
  }

  // Validate colors
  if (shape.fill && !isValidColor(shape.fill)) {
    errors.push(`Invalid fill color: ${shape.fill}`);
  }

  if (shape.stroke && !isValidColor(shape.stroke)) {
    errors.push(`Invalid stroke color: ${shape.stroke}`);
  }

  // Validate stroke width
  if (shape.strokeWidth !== undefined) {
    if (typeof shape.strokeWidth !== 'number' || shape.strokeWidth < 0) {
      errors.push('Stroke width must be a non-negative number');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate shape configuration for creation
 *
 * @param config - Shape configuration
 * @returns Validation result
 */
export function validateShapeConfig(config: ShapeConfig): ValidationResult {
  const errors: string[] = [];

  // Position is optional for config (will use defaults)
  if (config.x !== undefined || config.y !== undefined) {
    const x = config.x ?? 0;
    const y = config.y ?? 0;
    const positionValidation = validatePosition(x, y);
    if (!positionValidation.valid) {
      errors.push(...positionValidation.errors);
    }
  }

  // Dimensions are optional (will use defaults)
  if (config.width !== undefined || config.height !== undefined) {
    const width = config.width ?? GRID_CONSTANTS.DEFAULT_SHAPE_WIDTH;
    const height = config.height ?? GRID_CONSTANTS.DEFAULT_SHAPE_HEIGHT;
    const dimensionValidation = validateDimensions(width, height);
    if (!dimensionValidation.valid) {
      errors.push(...dimensionValidation.errors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a string is a valid CSS color
 *
 * @param color - Color string to validate
 * @returns True if valid color format
 */
function isValidColor(color: string): boolean {
  // Basic validation for hex colors and CSS color names
  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  const rgbPattern = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
  const rgbaPattern = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/;

  return (
    hexPattern.test(color) ||
    rgbPattern.test(color) ||
    rgbaPattern.test(color) ||
    CSS.supports('color', color) // Check if browser recognizes it
  );
}

/**
 * Validate zoom level
 *
 * @param scale - Zoom scale to validate
 * @returns Validation result
 */
export function validateZoom(scale: number): ValidationResult {
  const errors: string[] = [];

  if (typeof scale !== 'number' || isNaN(scale)) {
    errors.push('Zoom scale must be a valid number');
  } else if (scale < GRID_CONSTANTS.MIN_ZOOM || scale > GRID_CONSTANTS.MAX_ZOOM) {
    errors.push(`Zoom must be between ${GRID_CONSTANTS.MIN_ZOOM} and ${GRID_CONSTANTS.MAX_ZOOM}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
