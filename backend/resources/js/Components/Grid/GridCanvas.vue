<script setup lang="ts">
/**
 * Grid Canvas Component
 *
 * Main canvas component that orchestrates all grid managers.
 * This component is now much simpler and delegates to specialized managers.
 */

import { ref, onMounted, onUnmounted, watch } from 'vue';
import Konva from 'konva';

// Import our modular grid system
import { GridManager } from './core/GridManager';
import { ZoomManager } from './core/ZoomManager';
import { ShapeManager } from './core/ShapeManager';
import { TransformManager } from './core/TransformManager';
import type { Shape } from './types/shapes';

// ==================== Props & Emits ====================

interface Props {
  shapes: Shape[];
  selectedShapeId: string | null;
  gridSize: number;
  snapToGrid: boolean;
  scale: number;
}

interface Emits {
  (e: 'update:shapes', shapes: Shape[]): void;
  (e: 'update:selectedShapeId', id: string | null): void;
  (e: 'update:scale', scale: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// ==================== Component State ====================

const containerRef = ref<HTMLDivElement | null>(null);

// Konva instances
let stage: Konva.Stage | null = null;
let gridLayer: Konva.Layer | null = null;
let shapeLayer: Konva.Layer | null = null;

// Manager instances
let gridManager: GridManager | null = null;
let zoomManager: ZoomManager | null = null;
let shapeManager: ShapeManager | null = null;
let transformManager: TransformManager | null = null;

// Flag to prevent circular updates
let isSyncing = false;

// ==================== Core Functions ====================

/**
 * Initialize the Konva stage and all managers
 */
function initializeCanvas(): void {
  if (!containerRef.value) {
    console.error('Container ref is not available');
    return;
  }

  const width = containerRef.value.offsetWidth;
  const height = containerRef.value.offsetHeight;

  // Create Konva stage
  stage = new Konva.Stage({
    container: containerRef.value,
    width,
    height,
    draggable: true,
  });

  // Create layers
  gridLayer = new Konva.Layer();
  shapeLayer = new Konva.Layer();

  stage.add(gridLayer);
  stage.add(shapeLayer);

  // Initialize managers
  initializeManagers();

  // Setup event handlers
  setupEventHandlers();

  // Initial render
  renderAllShapes();
  gridManager?.redrawGrid();
}

/**
 * Initialize all manager instances
 */
function initializeManagers(): void {
  if (!stage || !gridLayer || !shapeLayer) return;

  // Grid Manager
  gridManager = new GridManager(stage, gridLayer, {
    size: props.gridSize,
    snapEnabled: props.snapToGrid,
    visible: true,
  });

  // Zoom Manager
  zoomManager = new ZoomManager(stage, props.scale);
  zoomManager.onZoom((newScale) => {
    emit('update:scale', newScale);
    gridManager?.redrawGrid();
  });

  // Shape Manager
  shapeManager = new ShapeManager();
  shapeManager.onShapesUpdate((shapes) => {
    if (!isSyncing) {
      isSyncing = true;
      emit('update:shapes', shapes);
      isSyncing = false;
    }
  });
  shapeManager.onSelectionUpdate((id) => {
    emit('update:selectedShapeId', id);
    updateTransformer();
  });

  // Transform Manager
  transformManager = new TransformManager(shapeLayer);
  transformManager.onTransform((nodeId, attrs) => {
    handleShapeTransform(nodeId, attrs);
  });

  // Note: shapes will be loaded via the watcher, not here
  // This prevents duplicate shape errors on initialization
}

/**
 * Setup event handlers for the stage
 */
function setupEventHandlers(): void {
  if (!stage) return;

  // Click event - for deselection
  stage.on('click', handleStageClick);

  // Wheel event - for zooming
  stage.on('wheel', handleWheel);

  // Drag event - redraw grid during pan
  stage.on('dragmove', () => {
    gridManager?.redrawGrid();
  });
}

// ==================== Event Handlers ====================

/**
 * Handle stage click (for deselection)
 */
function handleStageClick(e: Konva.KonvaEventObject<MouseEvent>): void {
  // Only deselect if clicking on the stage itself (not a shape)
  if (e.target === stage) {
    shapeManager?.deselectAll();
  }
}

/**
 * Handle mouse wheel for zooming
 */
function handleWheel(e: Konva.KonvaEventObject<WheelEvent>): void {
  e.evt.preventDefault();

  const pointer = stage?.getPointerPosition();
  if (!pointer || !zoomManager) return;

  zoomManager.zoomToPoint(pointer, e.evt.deltaY);
}

/**
 * Handle shape transformation end
 */
function handleShapeTransform(
  nodeId: string,
  attrs: { x: number; y: number; width: number; height: number }
): void {
  // Apply grid snapping if enabled
  const snappedAttrs = gridManager?.isSnapEnabled()
    ? {
        x: gridManager.snapValue(attrs.x),
        y: gridManager.snapValue(attrs.y),
        width: gridManager.snapValue(attrs.width),
        height: gridManager.snapValue(attrs.height),
      }
    : attrs;

  // Update shape in manager
  shapeManager?.updateShape(nodeId, snappedAttrs);
}

// ==================== Shape Rendering ====================

/**
 * Create a Konva shape from a Shape object
 */
function createKonvaShape(shape: Shape): Konva.Rect {
  const rect = new Konva.Rect({
    id: shape.id,
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: shape.height,
    fill: shape.fill,
    stroke: shape.stroke,
    strokeWidth: shape.strokeWidth,
    draggable: true,
  });

  // Click handler - select shape
  rect.on('click', () => {
    shapeManager?.selectShape(shape.id);
  });

  // Drag handlers - with grid snapping
  rect.on('dragmove', () => {
    if (gridManager?.isSnapEnabled()) {
      const snapped = gridManager.snapPoint(rect.x(), rect.y());
      rect.position(snapped);
    }
  });

  rect.on('dragend', () => {
    shapeManager?.updateShape(shape.id, {
      x: rect.x(),
      y: rect.y(),
    });
  });

  return rect;
}

/**
 * Render all shapes on the canvas
 */
function renderAllShapes(): void {
  if (!shapeLayer || !shapeManager) return;

  // Clear existing shapes
  shapeLayer.destroyChildren();

  // Re-add transformer (it was destroyed with children)
  if (transformManager) {
    transformManager.destroy();
    transformManager = new TransformManager(shapeLayer);
    transformManager.onTransform((nodeId, attrs) => {
      handleShapeTransform(nodeId, attrs);
    });
  }

  // Render each shape
  const shapes = shapeManager.getAllShapes();
  shapes.forEach(shape => {
    const konvaShape = createKonvaShape(shape);
    shapeLayer!.add(konvaShape);
  });

  shapeLayer.batchDraw();
  updateTransformer();
}

/**
 * Update transformer for selected shape
 */
function updateTransformer(): void {
  if (!transformManager || !shapeLayer || !shapeManager) return;

  const selectedId = shapeManager.getSelectedShapeId();

  if (selectedId) {
    const node = shapeLayer.findOne(`#${selectedId}`);
    if (node) {
      transformManager.attach(node);
    }
  } else {
    transformManager.detach();
  }
}

// ==================== Window Resize Handler ====================

function handleWindowResize(): void {
  if (!stage || !containerRef.value) return;

  stage.width(containerRef.value.offsetWidth);
  stage.height(containerRef.value.offsetHeight);
  gridManager?.redrawGrid();
}

// ==================== Watchers ====================

// Watch for shape changes from parent
watch(() => props.shapes, (newShapes) => {
  if (!shapeManager || isSyncing) return;

  isSyncing = true;

  // Sync shapes from parent to manager
  // Clear and re-add all shapes
  shapeManager.clearAllShapes();

  newShapes.forEach(shape => {
    try {
      shapeManager!.addShape(shape);
    } catch (error) {
      console.error('Error syncing shape:', error);
    }
  });

  renderAllShapes();

  isSyncing = false;
}, { deep: true, immediate: true });

// Watch for selection changes from parent
watch(() => props.selectedShapeId, (newId) => {
  if (newId !== shapeManager?.getSelectedShapeId()) {
    if (newId) {
      shapeManager?.selectShape(newId);
    } else {
      shapeManager?.deselectAll();
    }
  }
});

// Watch for grid size changes
watch(() => props.gridSize, (newSize) => {
  gridManager?.updateConfig({ size: newSize });
});

// Watch for snap toggle
watch(() => props.snapToGrid, (newSnap) => {
  gridManager?.updateConfig({ snapEnabled: newSnap });
});

// Watch for scale changes from parent
watch(() => props.scale, (newScale) => {
  if (zoomManager && Math.abs(newScale - zoomManager.getZoomLevel()) > 0.001) {
    zoomManager.setZoomLevel(newScale);
    gridManager?.redrawGrid();
  }
});

// ==================== Lifecycle Hooks ====================

onMounted(() => {
  initializeCanvas();
  window.addEventListener('resize', handleWindowResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize);
  stage?.destroy();
});

// ==================== Exposed Methods ====================

defineExpose({
  /**
   * Add a new shape (called from parent/toolbar)
   */
  addShape: (shape: Shape) => {
    shapeManager?.addShape(shape);
    renderAllShapes();
  },

  /**
   * Delete the currently selected shape
   */
  deleteSelectedShape: () => {
    if (shapeManager?.removeSelectedShape()) {
      renderAllShapes();
    }
  },

  /**
   * Reset view to default position and zoom
   */
  resetView: () => {
    zoomManager?.resetView();
    gridManager?.redrawGrid();
  },

  /**
   * Zoom in
   */
  zoomIn: () => {
    zoomManager?.zoomIn();
  },

  /**
   * Zoom out
   */
  zoomOut: () => {
    zoomManager?.zoomOut();
  },

  /**
   * Get current managers (for debugging)
   */
  getManagers: () => ({
    gridManager,
    zoomManager,
    shapeManager,
    transformManager,
  }),
});
</script>

<template>
  <div ref="containerRef" class="w-full h-full bg-white"></div>
</template>

<style scoped>
/* Canvas container fills parent */
div {
  cursor: grab;
}

div:active {
  cursor: grabbing;
}
</style>
