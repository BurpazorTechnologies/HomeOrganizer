/**
 * ID Generation Utilities
 *
 * Centralized unique ID generation for shapes and other entities.
 */

/**
 * Generate a unique ID with an optional prefix
 *
 * @param prefix - Optional prefix for the ID (default: 'id')
 * @returns A unique identifier string
 *
 * @example
 * generateUniqueId('shape') // => 'shape-1704931200000-abc123def'
 */
export function generateUniqueId(prefix: string = 'id'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate a unique shape ID
 *
 * @returns A unique shape identifier
 *
 * @example
 * generateShapeId() // => 'shape-1704931200000-abc123def'
 */
export function generateShapeId(): string {
  return generateUniqueId('shape');
}

/**
 * Validate ID format
 *
 * @param id - The ID to validate
 * @returns True if the ID matches expected format
 */
export function isValidId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }

  // Check for basic format: prefix-timestamp-random
  const parts = id.split('-');
  return parts.length === 3 && parts.every(part => part.length > 0);
}

/**
 * Extract timestamp from generated ID
 *
 * @param id - The ID to parse
 * @returns Timestamp in milliseconds, or null if invalid
 */
export function getIdTimestamp(id: string): number | null {
  if (!isValidId(id)) {
    return null;
  }

  const parts = id.split('-');
  const timestamp = parseInt(parts[1], 10);

  return isNaN(timestamp) ? null : timestamp;
}
