/**
 * useDebugState Composable
 *
 * Aggregates state from all managers into a single DebugState object.
 * This is the data source for the DebugToolbar component.
 *
 * Automatically subscribes to store changes for reactive updates.
 */

import { ref, onUnmounted } from 'vue';
import type { ManagerRegistry } from '../core/ManagerRegistry';
import type {
  DebugState,
  ViewportDebugState,
  SelectionDebugState,
  ShapeDebugInfo,
  StepDebugState,
  GridConfigDebugState,
  KonvaNodeDebugInfo,
  LayerDebugState,
  CoordinateSystemsDebugState,
} from './types';
import type { AreaState, ActionLockState } from '../core/state/GridStateStore';
import type { MutationRecord } from '../core/state/MutationTracker';

/**
 * Create the useDebugState composable
 *
 * Subscribes to the store for automatic updates when state changes.
 */
export function useDebugState(getRegistry: () => ManagerRegistry | null) {
  const debugState = ref<DebugState | null>(null);
  let unsubscribe: (() => void) | null = null;

  /**
   * Refresh the debug state by querying all managers
   */
  function refresh(): void {
    const registry = getRegistry();
    if (!registry?.isInitialized) {
      debugState.value = null;
      return;
    }

    debugState.value = {
      timestamp: Date.now(),
      actionLock: buildActionLockState(registry),
      viewport: buildViewportState(registry),
      coordinates: buildCoordinatesState(registry),
      selection: buildSelectionState(registry),
      shapes: buildShapesState(registry),
      layers: buildLayersState(registry),
      areas: buildAreasState(registry),
      step: buildStepState(registry),
      gridConfig: buildGridConfigState(registry),
      konvaNodes: buildKonvaNodesState(registry),
      mutations: buildMutationsState(registry),
    };
  }

  /**
   * Subscribe to store changes for automatic updates
   * Call this after the registry is initialized
   */
  function subscribeToStore(): void {
    const registry = getRegistry();
    if (!registry?.isInitialized) return;

    // Unsubscribe from previous subscription if any
    if (unsubscribe) {
      unsubscribe();
    }

    // Subscribe to store changes
    unsubscribe = registry.store.subscribe(() => {
      refresh();
    });

    // Initial refresh
    refresh();
  }

  /**
   * Cleanup subscription
   */
  function cleanup(): void {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  }

  // Auto-cleanup on component unmount
  onUnmounted(() => {
    cleanup();
  });

  return {
    debugState,
    refresh,
    subscribeToStore,
    cleanup,
  };
}

// ==================== State Builders ====================

function buildActionLockState(registry: ManagerRegistry): ActionLockState {
  const store = registry.store;
  return store?.getActionLock?.() ?? { currentAction: 'idle', lockedBy: null };
}

function buildViewportState(registry: ManagerRegistry): ViewportDebugState {
  const store = registry.store;
  const zoomManager = registry.zoomManager;
  const stage = registry.stage;

  // Read viewport state from centralized store
  const viewport = store?.getViewport?.() ?? { zoom: 1.0, pan: { x: 0, y: 0 } };
  const zoom = viewport.zoom;

  return {
    zoom,
    zoomPercentage: `${Math.round(zoom * 100)}%`,
    pan: { x: Math.round(viewport.pan.x), y: Math.round(viewport.pan.y) },
    canZoomIn: zoomManager?.canZoomIn?.() ?? zoom < 1.0,
    canZoomOut: zoomManager?.canZoomOut?.() ?? zoom > 0.2,
    stageWidth: stage?.width?.() ?? 0,
    stageHeight: stage?.height?.() ?? 0,
  };
}

function buildCoordinatesState(registry: ManagerRegistry): CoordinateSystemsDebugState {
  const store = registry.store;
  const stage = registry.stage;

  // Get viewport state from store
  const viewport = store?.getViewport?.() ?? { zoom: 1.0, pan: { x: 0, y: 0 } };
  const zoom = viewport.zoom;
  const pan = viewport.pan;

  // Get stage position and scale (runtime Konva state)
  const stagePos = stage?.position?.() ?? { x: 0, y: 0 };
  const stageScale = stage?.scale?.() ?? { x: 1, y: 1 };

  // Get last pointer position if available
  let lastPointer = {
    screen: null as { x: number; y: number } | null,
    stage: null as { x: number; y: number } | null,
    local: null as { x: number; y: number } | null,
  };

  try {
    const pointerPos = stage?.getPointerPosition?.();
    if (pointerPos) {
      // Screen coordinates (raw from Konva)
      lastPointer.screen = {
        x: Math.round(pointerPos.x),
        y: Math.round(pointerPos.y),
      };

      // Stage coordinates (after applying inverse of stage position)
      // This is what Konva returns from getPointerPosition - it's already in stage space
      lastPointer.stage = {
        x: Math.round(pointerPos.x),
        y: Math.round(pointerPos.y),
      };

      // Local/world coordinates (after applying inverse of stage transform)
      // Formula: local = (screen - pan) / zoom
      const localX = (pointerPos.x - stagePos.x) / stageScale.x;
      const localY = (pointerPos.y - stagePos.y) / stageScale.y;
      lastPointer.local = {
        x: Math.round(localX * 100) / 100,
        y: Math.round(localY * 100) / 100,
      };
    }
  } catch {
    // Pointer position not available
  }

  // Create transform formula explanation
  const transformInfo = {
    formula: `local = (screen - pan) / zoom | screen = (local * zoom) + pan`,
    example: `pan=(${Math.round(pan.x)}, ${Math.round(pan.y)}), zoom=${zoom.toFixed(2)}`,
  };

  return {
    stagePosition: {
      x: Math.round(stagePos.x * 100) / 100,
      y: Math.round(stagePos.y * 100) / 100,
    },
    stageScale: {
      x: Math.round(stageScale.x * 100) / 100,
      y: Math.round(stageScale.y * 100) / 100,
    },
    lastPointer,
    transformInfo,
  };
}

function buildSelectionState(registry: ManagerRegistry): SelectionDebugState {
  const selectionManager = registry.selectionManager;
  const transformManager = registry.transformManager;

  const state = selectionManager?.getState?.() ?? {
    selectedShapeId: null,
    selectedLayerId: null,
    isParentSelected: false,
  };

  // Try to get transformer attachment status
  let transformerAttached = false;
  let attachedNodeId: string | null = null;

  try {
    // Check if transformer has nodes attached
    const transformer = (transformManager as any)?.transformer;
    if (transformer) {
      const nodes = transformer.nodes?.() ?? [];
      transformerAttached = nodes.length > 0;
      attachedNodeId = nodes[0]?.id?.() ?? null;
    }
  } catch {
    // Ignore errors accessing transformer
  }

  return {
    selectedShapeId: state.selectedShapeId,
    selectedLayerId: state.selectedLayerId,
    isParentSelected: state.isParentSelected,
    transformerAttached,
    attachedNodeId,
  };
}

function buildShapesState(registry: ManagerRegistry): ShapeDebugInfo[] {
  const shapeManager = registry.shapeManager;
  const store = registry.store;

  if (!shapeManager) return [];

  const shapes = shapeManager.getAllShapes?.() ?? [];

  return shapes.map((shape): ShapeDebugInfo => {
    const node = shapeManager.getShapeNode?.(shape.id);
    const storeShape = store?.getShape?.(shape.id);

    return {
      id: shape.id,
      label: shape.label || '',
      layerId: storeShape?.layerId ?? '',
      parentShapeId: storeShape?.parentShapeId ?? null,
      position: { x: shape.x, y: shape.y },
      size: { width: shape.width, height: shape.height },
      // Konva node runtime state
      draggable: node?.draggable?.() ?? false,
      listening: node?.listening?.() ?? false,
      visible: node?.visible?.() ?? true,
      opacity: node?.opacity?.() ?? 1,
      // Store state
      fill: shape.fill,
      stroke: shape.stroke,
      zIndex: shape.zIndex,
    };
  });
}

function buildLayersState(registry: ManagerRegistry): LayerDebugState[] {
  const layerManager = registry.layerManager;
  if (!layerManager) return [];

  const layers = layerManager.getAllLayers?.() ?? [];

  // Map Layer objects to LayerDebugState (exclude Konva references)
  return layers.map(layer => ({
    id: layer.id,
    stepId: layer.step?.id ?? '',
    order: layer.order,
    label: layer.label,
    shapeIds: [...layer.shapeIds],
    primaryShapeId: layer.primaryShapeId,
    parentLayerId: layer.parentLayerId,
    isLocked: layerManager.isLayerLocked?.(layer.id) ?? false,
  }));
}

function buildAreasState(registry: ManagerRegistry): AreaState[] {
  const areaManager = registry.areaManager;
  if (!areaManager) return [];

  // Try to get all areas
  const getAllAreas = (areaManager as any).getAllAreas?.bind(areaManager);
  if (getAllAreas) {
    const areas = getAllAreas() ?? [];
    return areas.map((area: AreaState) => ({
      ...area,
      childIds: [...area.childIds],
    }));
  }

  return [];
}

function buildStepState(registry: ManagerRegistry): StepDebugState {
  const stepOrchestrator = registry.stepOrchestrator;

  if (!stepOrchestrator) {
    return {
      currentNumber: 1,
      stepId: 'step_1',
      description: 'Unknown',
      isCreationMode: false,
      parentAreaId: null,
      parentShapeId: null,
      shapeIds: [],
      primaryShapeId: null,
      isSaved: false,
    };
  }

  const stepInfo = stepOrchestrator.getCurrentStepInfo?.();
  const currentState = (stepOrchestrator as any).currentState;

  return {
    currentNumber: stepInfo?.step?.order ?? 1,
    stepId: stepInfo?.step?.id ?? 'unknown',
    description: stepInfo?.description ?? '',
    isCreationMode: currentState?.isCreationMode ?? false,
    parentAreaId: stepInfo?.parentAreaId ?? null,
    parentShapeId: currentState?.parentShapeId ?? null,
    shapeIds: currentState?.shapeIds ?? [],
    primaryShapeId: currentState?.primaryShapeId ?? null,
    isSaved: currentState?.isSaved ?? false,
  };
}

function buildGridConfigState(registry: ManagerRegistry): GridConfigDebugState {
  const store = registry.store;
  const gridManager = registry.gridManager;

  // Read gridConfig from centralized store
  const gridConfig = store?.getGridConfig?.() ?? {
    gridSize: 20,
    snapEnabled: true,
    gridVisible: true,
  };

  // Try to get clip bounds from gridManager (runtime state)
  let clipBounds = null;
  try {
    clipBounds = (gridManager as any)?.clipBounds ?? null;
  } catch {
    // Ignore
  }

  return {
    gridSize: gridConfig.gridSize,
    snapEnabled: gridConfig.snapEnabled,
    gridVisible: gridConfig.gridVisible,
    clipBounds,
  };
}

function buildKonvaNodesState(registry: ManagerRegistry): KonvaNodeDebugInfo[] {
  const shapeManager = registry.shapeManager;
  if (!shapeManager) return [];

  const shapes = shapeManager.getAllShapes?.() ?? [];

  return shapes.map((shape): KonvaNodeDebugInfo => {
    const node = shapeManager.getShapeNode?.(shape.id);

    return {
      id: shape.id,
      draggable: node?.draggable?.() ?? false,
      listening: node?.listening?.() ?? false,
      visible: node?.visible?.() ?? true,
      opacity: node?.opacity?.() ?? 1,
      x: node?.x?.() ?? 0,
      y: node?.y?.() ?? 0,
      width: node?.width?.() ?? 0,
      height: node?.height?.() ?? 0,
      scaleX: node?.scaleX?.() ?? 1,
      scaleY: node?.scaleY?.() ?? 1,
    };
  });
}

function buildMutationsState(registry: ManagerRegistry): MutationRecord[] {
  const store = registry.store;
  if (!store) return [];

  return store.getMutationHistory?.(20) ?? [];
}
