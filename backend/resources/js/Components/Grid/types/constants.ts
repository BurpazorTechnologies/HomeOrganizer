/**
 * Grid System Constants
 *
 * Centralized configuration for the entire grid system.
 * Modify these values to change grid behavior globally.
 */
export const GRID_CONSTANTS = {
  // Grid visual settings
  DEFAULT_GRID_SIZE: 20,        // pixels between grid lines
  MIN_GRID_SIZE: 10,            // minimum grid spacing
  MAX_GRID_SIZE: 100,           // maximum grid spacing
  GRID_LINE_COLOR: '#ddd',      // color of grid lines

  // Zoom settings
  DEFAULT_ZOOM: 1.0,            // 100%
  MIN_ZOOM: 0.33,               // 33% - maximum zoom out
  MAX_ZOOM: 5.0,                // 500% - maximum zoom in
  ZOOM_STEP: 1.2,               // multiplier for zoom in/out
  ZOOM_WHEEL_SENSITIVITY: 1.05, // mouse wheel zoom sensitivity

  // Shape settings
  MIN_SHAPE_SIZE: 40,           // minimum width/height in pixels
  DEFAULT_SHAPE_WIDTH: 100,
  DEFAULT_SHAPE_HEIGHT: 100,
  SHAPE_STROKE_WIDTH: 2,

  // Canvas bounds (semi-infinite limits)
  CANVAS_MIN_X: -10000,
  CANVAS_MAX_X: 10000,
  CANVAS_MIN_Y: -10000,
  CANVAS_MAX_Y: 10000,

  // Performance settings
  MAX_GRID_LINES: 1000,         // prevent rendering too many lines

  // Nesting limits
  MAX_NESTING_DEPTH: 50,        // maximum container nesting
} as const;

/**
 * Shape type definitions
 */
export const SHAPE_TYPES = {
  RECTANGLE: 'rectangle',
  // CIRCLE: 'circle',
  // POLYGON: 'polygon',
  // CUSTOM: 'custom',
} as const;

/**
 * Default colors for shapes
 */
export const SHAPE_COLORS = {
  DEFAULT_FILL: '#e0f2fe',      // light blue fill
  DEFAULT_STROKE: '#0284c7',    // blue stroke
  SELECTED_STROKE: '#0369a1',   // darker blue when selected
  HOVER_FILL: '#bfdbfe',        // darker fill on hover
  HOME_AREA_FILL: '#d1fae5',    // light green for home area (Step 1)
  HOME_AREA_STROKE: '#059669',  // green stroke for home area
  AREA_FILL: '#dbeafe',         // light blue for general areas
  AREA_STROKE: '#2563eb',       // blue stroke for areas
  ROOM_FILL: '#fef3c7',         // light yellow for rooms
  ROOM_STROKE: '#f59e0b',       // orange stroke for rooms
} as const;

/**
 * Transformer (resize handles) settings
 */
export const TRANSFORMER_CONFIG = {
  ROTATE_ENABLED: false,        // disable rotation for MVP
  ENABLED_ANCHORS: [
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
    'top-center',
    'middle-right',
    'middle-left',
    'bottom-center',
  ],
  BORDER_STROKE: '#0284c7',
  ANCHOR_FILL: '#0284c7',
  ANCHOR_STROKE: '#ffffff',
  ANCHOR_SIZE: 8,
} as const;

/**
 * Event throttle/debounce settings (milliseconds)
 */
export const EVENT_TIMING = {
  WHEEL_THROTTLE: 16,           // ~60fps
  RESIZE_DEBOUNCE: 100,
  DRAG_THROTTLE: 16,
} as const;
