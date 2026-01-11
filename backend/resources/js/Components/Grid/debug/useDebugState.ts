/**
 * useDebugState Composable
 *
 * Aggregates state from all managers into a single DebugState object.
 * This is the data source for the DebugToolbar component.
 */

import { ref } from 'vue';
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
} from './types';
import type { AreaState } from '../core/state/GridStateStore';
import type { MutationRecord } from '../core/state/MutationTracker';

/**
 * Create the useDebugState composable
 */
export function useDebugState(getRegistry: () => ManagerRegistry | null) {
  const debugState = ref<DebugState | null>(null);

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
      viewport: buildViewportState(registry),
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

  return {
    debugState,
    refresh,
  };
}

// ==================== State Builders ====================

function buildViewportState(registry: ManagerRegistry): ViewportDebugState {
  const zoomManager = registry.zoomManager;
  const stage = (registry as any)._stage;

  const zoom = zoomManager?.getCurrentZoom?.() ?? 1.0;
  const position = stage?.position?.() ?? { x: 0, y: 0 };

  return {
    zoom,
    zoomPercentage: `${Math.round(zoom * 100)}%`,
    pan: { x: Math.round(position.x), y: Math.round(position.y) },
    canZoomIn: zoom < 1.0,
    canZoomOut: zoom > 0.2,
    stageWidth: stage?.width?.() ?? 0,
    stageHeight: stage?.height?.() ?? 0,
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
  const gridManager = registry.gridManager;

  // Try to get clip bounds
  let clipBounds = null;
  try {
    clipBounds = (gridManager as any)?.clipBounds ?? null;
  } catch {
    // Ignore
  }

  return {
    gridSize: (gridManager as any)?.gridSize ?? 20,
    snapEnabled: true, // TODO: Read from store when migrated
    gridVisible: true,
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
