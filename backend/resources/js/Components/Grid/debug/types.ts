/**
 * Debug State Type Definitions
 *
 * Types for the comprehensive debug toolbar that displays
 * all grid state in collapsible JSON format.
 */

import type { MutationRecord } from '../core/state/MutationTracker';
import type { AreaState, ActionLockState } from '../core/state/GridStateStore';
import type { Bounds } from '../core/utils/bounds';

// ==================== Layer Debug State ====================
// Note: This is separate from GridStateStore.LayerState because
// LayerManager returns Layer objects with Konva references that
// we need to serialize for display

export interface LayerDebugState {
  id: string;
  stepId: string;
  order: number;
  label: string;
  shapeIds: string[];
  primaryShapeId: string | null;
  parentLayerId: string | null;
  isLocked: boolean;  // When true, shapes in this layer cannot be interacted with
}

// ==================== Viewport State ====================

export interface ViewportDebugState {
  zoom: number;
  zoomPercentage: string;
  pan: { x: number; y: number };
  canZoomIn: boolean;
  canZoomOut: boolean;
  stageWidth: number;
  stageHeight: number;
}

// ==================== Selection State ====================

export interface SelectionDebugState {
  selectedShapeId: string | null;
  selectedLayerId: string | null;
  isParentSelected: boolean;
  transformerAttached: boolean;
  attachedNodeId: string | null;
}

// ==================== Shape Debug State ====================

/**
 * Coordinate info for a shape in different coordinate systems
 */
export interface ShapeCoordinateInfo {
  // World/Local coordinates (stored in GridStateStore, used for bounds checking)
  world: { x: number; y: number };
  // Screen coordinates (world * zoom + pan) - where shape appears on screen
  screen: { x: number; y: number };
}

/**
 * Size info for a shape in different coordinate systems
 */
export interface ShapeSizeInfo {
  // World/Local size (stored in GridStateStore)
  world: { width: number; height: number };
  // Screen size (world * zoom) - visual size on screen
  screen: { width: number; height: number };
}

/**
 * Parent bounds info for child shapes
 */
export interface ParentBoundsInfo {
  // Parent's world bounds
  world: { x: number; y: number; width: number; height: number };
  // Valid range for child's top-left corner (accounting for child size)
  validRange: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export interface ShapeDebugInfo {
  id: string;
  label: string;
  layerId: string;
  parentShapeId: string | null;
  // Comprehensive coordinate info
  coordinates: ShapeCoordinateInfo;
  size: ShapeSizeInfo;
  // Parent bounds (for child shapes only)
  parentBounds: ParentBoundsInfo | null;
  // Legacy position/size for backwards compatibility
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  // Konva node runtime state (critical for debugging)
  draggable: boolean;
  listening: boolean;
  visible: boolean;
  opacity: number;
  // Store state
  fill: string;
  stroke: string;
  zIndex: number;
}

// ==================== Konva Node State ====================

export interface KonvaNodeDebugInfo {
  id: string;
  draggable: boolean;
  listening: boolean;
  visible: boolean;
  opacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
}

// ==================== Step State ====================

export interface StepDebugState {
  currentNumber: number;
  stepId: string;
  description: string;
  isCreationMode: boolean;
  parentAreaId: string | null;
  parentShapeId: string | null;
  shapeIds: string[];
  primaryShapeId: string | null;
  isSaved: boolean;
}

// ==================== Grid Config State ====================

export interface GridConfigDebugState {
  gridSize: number;
  snapEnabled: boolean;
  gridVisible: boolean;
  clipBounds: Bounds | null;
}

// ==================== Coordinate Systems State ====================
// Helps debug coordinate transformation issues between pan/zoom

export interface CoordinateSystemsDebugState {
  // Stage transform (applied by pan/zoom)
  stagePosition: { x: number; y: number };  // Pan offset
  stageScale: { x: number; y: number };     // Zoom scale

  // Last pointer position in different coordinate systems
  lastPointer: {
    screen: { x: number; y: number } | null;  // Raw screen coordinates
    stage: { x: number; y: number } | null;   // Stage-relative (after pan)
    local: { x: number; y: number } | null;   // Local/world coordinates (after pan+zoom)
  };

  // Coordinate transformation helpers
  transformInfo: {
    // To convert screen -> local: (screen - pan) / zoom
    // To convert local -> screen: (local * zoom) + pan
    formula: string;
    example: string;
  };
}

// ==================== Complete Debug State ====================

export interface DebugState {
  // Timestamp for tracking updates
  timestamp: number;

  // Action lock (current action in progress)
  actionLock: ActionLockState;

  // Viewport/Zoom
  viewport: ViewportDebugState;

  // Coordinate systems (global vs local)
  coordinates: CoordinateSystemsDebugState;

  // Selection
  selection: SelectionDebugState;

  // Shapes (with runtime Konva state)
  shapes: ShapeDebugInfo[];

  // Layers
  layers: LayerDebugState[];

  // Areas
  areas: AreaState[];

  // Step
  step: StepDebugState;

  // Grid configuration
  gridConfig: GridConfigDebugState;

  // Konva nodes (runtime state)
  konvaNodes: KonvaNodeDebugInfo[];

  // Mutation history
  mutations: MutationRecord[];
}

// ==================== Debug Section Config ====================

export interface DebugSection {
  key: keyof DebugState;
  label: string;
  description: string;
  defaultExpanded: boolean;
}

export const DEBUG_SECTIONS: DebugSection[] = [
  {
    key: 'actionLock',
    label: 'Action Lock',
    description: 'Current action in progress (pan, zoom, drag, etc.)',
    defaultExpanded: true, // Important for debugging action conflicts
  },
  {
    key: 'viewport',
    label: 'Viewport',
    description: 'Zoom, pan, and canvas dimensions',
    defaultExpanded: false,
  },
  {
    key: 'coordinates',
    label: 'Coordinates',
    description: 'Global vs local coordinate systems (debug pan/zoom issues)',
    defaultExpanded: true, // Important for debugging coordinate issues
  },
  {
    key: 'selection',
    label: 'Selection',
    description: 'Currently selected shape and transformer state',
    defaultExpanded: false,
  },
  {
    key: 'shapes',
    label: 'Shapes',
    description: 'All shapes with positions, sizes, and draggable status',
    defaultExpanded: true, // Most useful for debugging
  },
  {
    key: 'layers',
    label: 'Layers',
    description: 'Layer hierarchy and shape assignments',
    defaultExpanded: false,
  },
  {
    key: 'areas',
    label: 'Areas',
    description: 'Area hierarchy (home, floors, rooms)',
    defaultExpanded: false,
  },
  {
    key: 'step',
    label: 'Step',
    description: 'Current workflow step and state',
    defaultExpanded: false,
  },
  {
    key: 'gridConfig',
    label: 'Grid Config',
    description: 'Grid size, snapping, and clipping bounds',
    defaultExpanded: false,
  },
  {
    key: 'konvaNodes',
    label: 'Konva Nodes',
    description: 'Runtime Konva node properties',
    defaultExpanded: false,
  },
  {
    key: 'mutations',
    label: 'Mutations',
    description: 'Recent state changes with source locations',
    defaultExpanded: false,
  },
];

// ==================== Debug Toolbar Events ====================

export interface DebugToolbarEmits {
  (e: 'reset'): void;
  (e: 'clearMutations'): void;
  (e: 'exportState'): void;
  (e: 'refresh'): void;
}
