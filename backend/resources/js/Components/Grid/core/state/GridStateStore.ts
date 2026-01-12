/**
 * GridStateStore
 *
 * Central reactive store for all grid state.
 * Single source of truth for shapes, layers, areas, and selection.
 *
 * Key design principles:
 * - All state mutations go through the store
 * - State is reactive (Vue 3 reactivity)
 * - Managers read from store, don't maintain duplicate state
 * - Serialization/deserialization happens here
 * - ALL mutations are tracked via MutationTracker for debugging
 * - Events are emitted after mutations (via optional EventBus)
 */

import { reactive, readonly, type DeepReadonly } from 'vue';
import type { Bounds } from '../utils/bounds';
import { createMutationTracker, type MutationTracker, type MutationRecord } from './MutationTracker';

// Import EventBus types
import type { EventBus, GridEvent } from '../events';

// Import command types
import type { GridCommand, CommandResult } from '../commands';

// Import canonical state types from types/state/
import type {
  ShapeState,
  LayerState,
  AreaState,
  SelectionState,
  ViewportState,
  GridConfigState,
  ActionLockState,
  ActionType,
  AreaType,
  GridState,
  SerializedGridState,
} from '../../types/state';

// Import default values
import {
  DEFAULT_SELECTION_STATE,
  DEFAULT_VIEWPORT_STATE,
  DEFAULT_GRID_CONFIG_STATE,
  DEFAULT_ACTION_LOCK_STATE,
} from '../../types/state';

// Re-export all state types for backwards compatibility
// This allows existing code to import from GridStateStore without changes
export type {
  ShapeState,
  LayerState,
  AreaState,
  SelectionState,
  ViewportState,
  GridConfigState,
  ActionLockState,
  ActionType,
  AreaType,
  GridState,
  SerializedGridState,
};

// ==================== Store Type ====================

export interface GridStateStore {
  // Readonly state access
  readonly state: DeepReadonly<GridState>;

  // Shape operations
  addShape(shape: ShapeState): void;
  updateShape(id: string, updates: Partial<Omit<ShapeState, 'id'>>): void;
  removeShape(id: string): void;
  getShape(id: string): ShapeState | undefined;
  getShapeBounds(id: string): Bounds | null;
  getChildShapes(parentShapeId: string): ShapeState[];

  // Layer operations
  addLayer(layer: LayerState): void;
  updateLayer(id: string, updates: Partial<Omit<LayerState, 'id'>>): void;
  removeLayer(id: string): void;
  getLayer(id: string): LayerState | undefined;
  setCurrentLayer(id: string | null): void;
  addShapeToLayer(layerId: string, shapeId: string, isPrimary?: boolean): void;
  removeShapeFromLayer(layerId: string, shapeId: string): void;

  // Layer lock operations
  lockLayer(layerId: string): void;
  unlockLayer(layerId: string): void;
  isLayerLocked(layerId: string): boolean;
  getLockedLayerIds(): string[];

  // Area operations (legacy - will be removed after Phase E migration)
  addArea(area: AreaState): void;
  updateArea(id: string, updates: Partial<Omit<AreaState, 'id'>>): void;
  removeArea(id: string): void;
  getArea(id: string): AreaState | undefined;
  getAreaByShapeId(shapeId: string): AreaState | undefined;
  setRootAreaId(id: string | null): void;

  // Unified shape/area operations (NEW - replaces separate AreaManager)
  setRootShapeId(id: string | null): void;
  getRootShapeId(): string | null;
  getAreaShapes(): ShapeState[];  // Get all shapes with areaType set
  getShapesByAreaType(areaType: AreaType): ShapeState[];
  addChildShapeId(parentId: string, childId: string): void;
  removeChildShapeId(parentId: string, childId: string): void;

  // Selection operations
  select(shapeId: string, layerId: string, isParent?: boolean): void;
  deselect(): void;
  getSelectedShape(): ShapeState | undefined;

  // Step operations
  setCurrentStep(step: number): void;
  setIsSaved(saved: boolean): void;

  // Viewport operations
  setZoom(zoom: number): void;
  setPan(pan: { x: number; y: number }): void;
  setViewport(viewport: Partial<ViewportState>): void;
  getViewport(): ViewportState;

  // Grid config operations
  setGridSize(size: number): void;
  setSnapEnabled(enabled: boolean): void;
  setGridVisible(visible: boolean): void;
  setGridConfig(config: Partial<GridConfigState>): void;
  getGridConfig(): GridConfigState;

  // Parent relationship queries
  getParentShape(childShapeId: string): ShapeState | undefined;
  getParentBounds(childShapeId: string): Bounds | null;

  // Serialization
  serialize(): SerializedGridState;
  deserialize(data: SerializedGridState): void;
  clear(): void;

  // Subscriptions
  subscribe(listener: (state: GridState) => void): () => void;
  onShapeChange(shapeId: string, listener: (shape: ShapeState | undefined) => void): () => void;

  // Mutation tracking (for debugging)
  getMutationHistory(limit?: number): MutationRecord[];
  clearMutationHistory(): void;
  enableMutationTracking(): void;
  disableMutationTracking(): void;

  // Action lock operations (single action at a time)
  acquireActionLock(action: ActionType, lockerId: string): boolean;
  releaseActionLock(lockerId: string): void;
  forceReleaseActionLock(): void;
  getCurrentAction(): ActionType;
  isActionAllowed(action: ActionType): boolean;
  getActionLock(): ActionLockState;

  // Command dispatch (CQRS pattern)
  /**
   * Dispatch a command to mutate state.
   * This is the preferred way to modify state - all commands go through handlers.
   *
   * @example
   * store.dispatch({ type: 'SHAPE_CREATE', payload: { shape } });
   * store.dispatch({ type: 'LAYER_LOCK', payload: { layerId: 'layer1' } });
   */
  dispatch(command: GridCommand): CommandResult<unknown>;
}

// ==================== Store Factory ====================

/**
 * Options for creating a GridStateStore
 */
export interface GridStateStoreOptions {
  /** Optional EventBus for emitting events after mutations */
  eventBus?: EventBus;
}

/**
 * Create a new GridStateStore instance
 * @param options Optional configuration including EventBus
 */
export function createGridStateStore(options: GridStateStoreOptions = {}): GridStateStore {
  // Optional event bus for event-driven architecture
  const eventBus = options.eventBus;

  // Mutation tracker for debugging
  const tracker: MutationTracker = createMutationTracker(100);

  // Reactive state - using imported defaults from types/state/
  const state = reactive<GridState>({
    shapes: new Map(),
    layers: new Map(),
    areas: new Map(),
    selection: { ...DEFAULT_SELECTION_STATE },
    viewport: { ...DEFAULT_VIEWPORT_STATE, pan: { ...DEFAULT_VIEWPORT_STATE.pan } },
    gridConfig: { ...DEFAULT_GRID_CONFIG_STATE },
    actionLock: { ...DEFAULT_ACTION_LOCK_STATE },
    currentLayerId: null,
    currentStep: 1,
    isSaved: false,
    rootAreaId: null,
    rootShapeId: null,
  });

  // Subscription management
  const listeners = new Set<(state: GridState) => void>();
  const shapeListeners = new Map<string, Set<(shape: ShapeState | undefined) => void>>();

  function notify(): void {
    listeners.forEach(listener => listener(state));
  }

  function notifyShapeChange(shapeId: string): void {
    const shape = state.shapes.get(shapeId);
    shapeListeners.get(shapeId)?.forEach(listener => listener(shape));
  }

  /**
   * Emit an event if EventBus is configured
   */
  function emit(event: GridEvent): void {
    if (eventBus) {
      eventBus.emit(event);
    }
  }

  // Store implementation
  const store: GridStateStore = {
    get state() {
      return readonly(state) as DeepReadonly<GridState>;
    },

    // ==================== Shape Operations ====================

    addShape(shape: ShapeState): void {
      tracker.record('SHAPE/ADD', ['shapes', shape.id], null, { ...shape });
      state.shapes.set(shape.id, { ...shape });
      notify();
      notifyShapeChange(shape.id);
      emit({ type: 'SHAPE_CREATED', payload: { shapeId: shape.id, shape: { ...shape } } });
    },

    updateShape(id: string, updates: Partial<Omit<ShapeState, 'id'>>): void {
      const shape = state.shapes.get(id);
      if (shape) {
        const prevState = { ...shape };
        Object.assign(shape, updates);
        tracker.record('SHAPE/UPDATE', ['shapes', id], prevState, { ...shape });
        notify();
        notifyShapeChange(id);
        emit({ type: 'SHAPE_UPDATED', payload: { shapeId: id, updates, previousState: prevState } });
      }
    },

    removeShape(id: string): void {
      const shape = state.shapes.get(id);
      if (shape) {
        const deletedShape = { ...shape };
        tracker.record('SHAPE/REMOVE', ['shapes', id], deletedShape, null);
        state.shapes.delete(id);
        // Clear selection if this was selected
        if (state.selection.selectedShapeId === id) {
          state.selection.selectedShapeId = null;
          state.selection.selectedLayerId = null;
          state.selection.isParentSelected = false;
        }
        notify();
        notifyShapeChange(id);
        emit({ type: 'SHAPE_DELETED', payload: { shapeId: id, shape: deletedShape } });
      }
    },

    getShape(id: string): ShapeState | undefined {
      return state.shapes.get(id);
    },

    getShapeBounds(id: string): Bounds | null {
      const shape = state.shapes.get(id);
      if (!shape) return null;
      return {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
      };
    },

    getChildShapes(parentShapeId: string): ShapeState[] {
      const children: ShapeState[] = [];
      for (const shape of state.shapes.values()) {
        if (shape.parentShapeId === parentShapeId) {
          children.push(shape);
        }
      }
      return children;
    },

    // ==================== Layer Operations ====================

    addLayer(layer: LayerState): void {
      // Ensure isLocked has a default value
      const layerWithDefaults: LayerState = {
        ...layer,
        isLocked: layer.isLocked ?? false,
      };
      tracker.record('LAYER/ADD', ['layers', layer.id], null, { ...layerWithDefaults });
      state.layers.set(layer.id, layerWithDefaults);
      notify();
      emit({ type: 'LAYER_CREATED', payload: { layerId: layer.id, layer: { ...layerWithDefaults } } });
    },

    updateLayer(id: string, updates: Partial<Omit<LayerState, 'id'>>): void {
      const layer = state.layers.get(id);
      if (layer) {
        const prevState = { ...layer, shapeIds: [...layer.shapeIds] };
        Object.assign(layer, updates);
        tracker.record('LAYER/UPDATE', ['layers', id], prevState, { ...layer, shapeIds: [...layer.shapeIds] });
        notify();
        emit({ type: 'LAYER_UPDATED', payload: { layerId: id, updates, previousState: prevState } });
      }
    },

    removeLayer(id: string): void {
      const layer = state.layers.get(id);
      if (layer) {
        const deletedLayer = { ...layer, shapeIds: [...layer.shapeIds] };
        tracker.record('LAYER/REMOVE', ['layers', id], deletedLayer, null);
        state.layers.delete(id);
        if (state.currentLayerId === id) {
          state.currentLayerId = null;
        }
        notify();
        emit({ type: 'LAYER_DELETED', payload: { layerId: id, layer: deletedLayer } });
      }
    },

    getLayer(id: string): LayerState | undefined {
      return state.layers.get(id);
    },

    setCurrentLayer(id: string | null): void {
      const prev = state.currentLayerId;
      state.currentLayerId = id;
      tracker.record('LAYER/SET_CURRENT', ['currentLayerId'], prev, id);
      notify();
      emit({ type: 'CURRENT_LAYER_CHANGED', payload: { layerId: id, previousLayerId: prev } });
    },

    addShapeToLayer(layerId: string, shapeId: string, isPrimary = false): void {
      const layer = state.layers.get(layerId);
      if (layer) {
        const prevShapeIds = [...layer.shapeIds];
        const prevPrimary = layer.primaryShapeId;
        if (!layer.shapeIds.includes(shapeId)) {
          layer.shapeIds.push(shapeId);
        }
        if (isPrimary) {
          layer.primaryShapeId = shapeId;
        }
        tracker.record('LAYER/ADD_SHAPE', ['layers', layerId, 'shapeIds'],
          { shapeIds: prevShapeIds, primaryShapeId: prevPrimary },
          { shapeIds: [...layer.shapeIds], primaryShapeId: layer.primaryShapeId }
        );
        notify();
        emit({ type: 'LAYER_SHAPE_ADDED', payload: { layerId, shapeId, isPrimary } });
      }
    },

    removeShapeFromLayer(layerId: string, shapeId: string): void {
      const layer = state.layers.get(layerId);
      if (layer) {
        const prevShapeIds = [...layer.shapeIds];
        const prevPrimary = layer.primaryShapeId;
        layer.shapeIds = layer.shapeIds.filter(id => id !== shapeId);
        if (layer.primaryShapeId === shapeId) {
          layer.primaryShapeId = layer.shapeIds[0] || null;
        }
        tracker.record('LAYER/REMOVE_SHAPE', ['layers', layerId, 'shapeIds'],
          { shapeIds: prevShapeIds, primaryShapeId: prevPrimary },
          { shapeIds: [...layer.shapeIds], primaryShapeId: layer.primaryShapeId }
        );
        notify();
        emit({ type: 'LAYER_SHAPE_REMOVED', payload: { layerId, shapeId } });
      }
    },

    // ==================== Layer Lock Operations ====================

    lockLayer(layerId: string): void {
      const layer = state.layers.get(layerId);
      if (layer && !layer.isLocked) {
        const prev = layer.isLocked;
        layer.isLocked = true;
        tracker.record('LAYER/LOCK', ['layers', layerId, 'isLocked'], prev, true);
        notify();
        emit({ type: 'LAYER_LOCKED', payload: { layerId } });
      }
    },

    unlockLayer(layerId: string): void {
      const layer = state.layers.get(layerId);
      if (layer && layer.isLocked) {
        const prev = layer.isLocked;
        layer.isLocked = false;
        tracker.record('LAYER/UNLOCK', ['layers', layerId, 'isLocked'], prev, false);
        notify();
        emit({ type: 'LAYER_UNLOCKED', payload: { layerId } });
      }
    },

    isLayerLocked(layerId: string): boolean {
      const layer = state.layers.get(layerId);
      return layer?.isLocked ?? false;
    },

    getLockedLayerIds(): string[] {
      const lockedIds: string[] = [];
      for (const [id, layer] of state.layers) {
        if (layer.isLocked) {
          lockedIds.push(id);
        }
      }
      return lockedIds;
    },

    // ==================== Area Operations ====================

    addArea(area: AreaState): void {
      tracker.record('AREA/ADD', ['areas', area.id], null, { ...area, childIds: [...area.childIds] });
      state.areas.set(area.id, { ...area });
      notify();
      emit({ type: 'AREA_CREATED', payload: { areaId: area.id, area: { ...area, childIds: [...area.childIds] } } });
    },

    updateArea(id: string, updates: Partial<Omit<AreaState, 'id'>>): void {
      const area = state.areas.get(id);
      if (area) {
        const prevState = { ...area, childIds: [...area.childIds] };
        Object.assign(area, updates);
        tracker.record('AREA/UPDATE', ['areas', id], prevState, { ...area, childIds: [...area.childIds] });
        notify();
        emit({ type: 'AREA_UPDATED', payload: { areaId: id, updates, previousState: prevState } });
      }
    },

    removeArea(id: string): void {
      const area = state.areas.get(id);
      if (area) {
        const deletedArea = { ...area, childIds: [...area.childIds] };
        tracker.record('AREA/REMOVE', ['areas', id], deletedArea, null);
        // Remove from parent's childIds
        if (area.parentId) {
          const parent = state.areas.get(area.parentId);
          if (parent) {
            parent.childIds = parent.childIds.filter(cid => cid !== id);
          }
        }
        state.areas.delete(id);
        if (state.rootAreaId === id) {
          state.rootAreaId = null;
        }
        notify();
        emit({ type: 'AREA_DELETED', payload: { areaId: id, area: deletedArea } });
      }
    },

    getArea(id: string): AreaState | undefined {
      return state.areas.get(id);
    },

    getAreaByShapeId(shapeId: string): AreaState | undefined {
      for (const area of state.areas.values()) {
        if (area.shapeId === shapeId) {
          return area;
        }
      }
      return undefined;
    },

    setRootAreaId(id: string | null): void {
      const prev = state.rootAreaId;
      state.rootAreaId = id;
      tracker.record('AREA/SET_ROOT', ['rootAreaId'], prev, id);
      notify();
      emit({ type: 'ROOT_AREA_CHANGED', payload: { rootAreaId: id, previousRootAreaId: prev } });
    },

    // ==================== Unified Shape/Area Operations ====================

    setRootShapeId(id: string | null): void {
      const prev = state.rootShapeId;
      state.rootShapeId = id;
      tracker.record('SHAPE/SET_ROOT', ['rootShapeId'], prev, id);
      notify();
      emit({ type: 'ROOT_SHAPE_CHANGED', payload: { rootShapeId: id, previousRootShapeId: prev } });
    },

    getRootShapeId(): string | null {
      return state.rootShapeId;
    },

    getAreaShapes(): ShapeState[] {
      const areaShapes: ShapeState[] = [];
      for (const shape of state.shapes.values()) {
        if (shape.areaType !== null) {
          areaShapes.push(shape);
        }
      }
      return areaShapes;
    },

    getShapesByAreaType(areaType: AreaType): ShapeState[] {
      const shapes: ShapeState[] = [];
      for (const shape of state.shapes.values()) {
        if (shape.areaType === areaType) {
          shapes.push(shape);
        }
      }
      return shapes;
    },

    addChildShapeId(parentId: string, childId: string): void {
      const parent = state.shapes.get(parentId);
      if (parent) {
        const prevChildIds = [...parent.childShapeIds];
        if (!parent.childShapeIds.includes(childId)) {
          parent.childShapeIds.push(childId);
          tracker.record('SHAPE/ADD_CHILD', ['shapes', parentId, 'childShapeIds'], prevChildIds, [...parent.childShapeIds]);
          notify();
          emit({ type: 'SHAPE_CHILD_ADDED', payload: { parentId, childId } });
        }
      }
    },

    removeChildShapeId(parentId: string, childId: string): void {
      const parent = state.shapes.get(parentId);
      if (parent) {
        const prevChildIds = [...parent.childShapeIds];
        parent.childShapeIds = parent.childShapeIds.filter(id => id !== childId);
        tracker.record('SHAPE/REMOVE_CHILD', ['shapes', parentId, 'childShapeIds'], prevChildIds, [...parent.childShapeIds]);
        notify();
        emit({ type: 'SHAPE_CHILD_REMOVED', payload: { parentId, childId } });
      }
    },

    // ==================== Selection Operations ====================

    select(shapeId: string, layerId: string, isParent = false): void {
      const prev = { ...state.selection };
      state.selection.selectedShapeId = shapeId;
      state.selection.selectedLayerId = layerId;
      state.selection.isParentSelected = isParent;
      tracker.record('SELECTION/SELECT', ['selection'], prev, { ...state.selection });
      notify();
      emit({ type: 'SELECTION_CHANGED', payload: { selection: { ...state.selection }, previousSelection: prev } });
    },

    deselect(): void {
      const prev = { ...state.selection };
      state.selection.selectedShapeId = null;
      state.selection.selectedLayerId = null;
      state.selection.isParentSelected = false;
      tracker.record('SELECTION/DESELECT', ['selection'], prev, { ...state.selection });
      notify();
      emit({ type: 'SELECTION_CLEARED', payload: { previousSelection: prev } });
    },

    getSelectedShape(): ShapeState | undefined {
      if (!state.selection.selectedShapeId) return undefined;
      return state.shapes.get(state.selection.selectedShapeId);
    },

    // ==================== Step Operations ====================

    setCurrentStep(step: number): void {
      const prev = state.currentStep;
      state.currentStep = step;
      tracker.record('STEP/SET_CURRENT', ['currentStep'], prev, step);
      notify();
      emit({ type: 'STEP_CHANGED', payload: { step, previousStep: prev } });
    },

    setIsSaved(saved: boolean): void {
      const prev = state.isSaved;
      state.isSaved = saved;
      tracker.record('STEP/SET_SAVED', ['isSaved'], prev, saved);
      notify();
      emit({ type: 'SAVED_STATE_CHANGED', payload: { isSaved: saved, previousIsSaved: prev } });
    },

    // ==================== Viewport Operations ====================

    setZoom(zoom: number): void {
      const prev = state.viewport.zoom;
      state.viewport.zoom = zoom;
      tracker.record('VIEWPORT/SET_ZOOM', ['viewport', 'zoom'], prev, zoom);
      notify();
      emit({ type: 'ZOOM_CHANGED', payload: { zoom, previousZoom: prev } });
    },

    setPan(pan: { x: number; y: number }): void {
      const prev = { ...state.viewport.pan };
      state.viewport.pan = { ...pan };
      tracker.record('VIEWPORT/SET_PAN', ['viewport', 'pan'], prev, { ...pan });
      notify();
      emit({ type: 'PAN_CHANGED', payload: { pan: { ...pan }, previousPan: prev } });
    },

    setViewport(viewport: Partial<ViewportState>): void {
      const prev = { ...state.viewport, pan: { ...state.viewport.pan } };
      if (viewport.zoom !== undefined) {
        state.viewport.zoom = viewport.zoom;
      }
      if (viewport.pan !== undefined) {
        state.viewport.pan = { ...viewport.pan };
      }
      tracker.record('VIEWPORT/SET', ['viewport'], prev, { ...state.viewport, pan: { ...state.viewport.pan } });
      notify();
      emit({ type: 'VIEWPORT_CHANGED', payload: { viewport: { ...state.viewport, pan: { ...state.viewport.pan } }, previousViewport: prev } });
    },

    getViewport(): ViewportState {
      return {
        zoom: state.viewport.zoom,
        pan: { ...state.viewport.pan },
      };
    },

    // ==================== Grid Config Operations ====================

    setGridSize(size: number): void {
      const prev = state.gridConfig.gridSize;
      state.gridConfig.gridSize = size;
      tracker.record('GRID_CONFIG/SET_SIZE', ['gridConfig', 'gridSize'], prev, size);
      notify();
      emit({ type: 'GRID_SIZE_CHANGED', payload: { gridSize: size, previousGridSize: prev } });
    },

    setSnapEnabled(enabled: boolean): void {
      const prev = state.gridConfig.snapEnabled;
      state.gridConfig.snapEnabled = enabled;
      tracker.record('GRID_CONFIG/SET_SNAP', ['gridConfig', 'snapEnabled'], prev, enabled);
      notify();
      emit({ type: 'SNAP_ENABLED_CHANGED', payload: { snapEnabled: enabled, previousSnapEnabled: prev } });
    },

    setGridVisible(visible: boolean): void {
      const prev = state.gridConfig.gridVisible;
      state.gridConfig.gridVisible = visible;
      tracker.record('GRID_CONFIG/SET_VISIBLE', ['gridConfig', 'gridVisible'], prev, visible);
      notify();
      emit({ type: 'GRID_VISIBLE_CHANGED', payload: { gridVisible: visible, previousGridVisible: prev } });
    },

    setGridConfig(config: Partial<GridConfigState>): void {
      const prev = { ...state.gridConfig };
      if (config.gridSize !== undefined) {
        state.gridConfig.gridSize = config.gridSize;
      }
      if (config.snapEnabled !== undefined) {
        state.gridConfig.snapEnabled = config.snapEnabled;
      }
      if (config.gridVisible !== undefined) {
        state.gridConfig.gridVisible = config.gridVisible;
      }
      tracker.record('GRID_CONFIG/SET', ['gridConfig'], prev, { ...state.gridConfig });
      notify();
      emit({ type: 'GRID_CONFIG_CHANGED', payload: { config: { ...state.gridConfig }, previousConfig: prev } });
    },

    getGridConfig(): GridConfigState {
      return { ...state.gridConfig };
    },

    // ==================== Parent Relationship Queries ====================

    getParentShape(childShapeId: string): ShapeState | undefined {
      const child = state.shapes.get(childShapeId);
      if (!child?.parentShapeId) return undefined;
      return state.shapes.get(child.parentShapeId);
    },

    getParentBounds(childShapeId: string): Bounds | null {
      const parent = this.getParentShape(childShapeId);
      if (!parent) return null;
      return {
        x: parent.x,
        y: parent.y,
        width: parent.width,
        height: parent.height,
      };
    },

    // ==================== Serialization ====================

    serialize(): SerializedGridState {
      return {
        version: '2.0',
        shapes: Array.from(state.shapes.values()),
        layers: Array.from(state.layers.values()),
        areas: Array.from(state.areas.values()),
        currentStep: state.currentStep,
        rootAreaId: state.rootAreaId,
        rootShapeId: state.rootShapeId,
      };
    },

    deserialize(data: SerializedGridState): void {
      tracker.record('STORE/DESERIALIZE', ['*'], {
        shapesCount: state.shapes.size,
        layersCount: state.layers.size,
        areasCount: state.areas.size,
      }, {
        shapesCount: data.shapes.length,
        layersCount: data.layers.length,
        areasCount: data.areas.length,
      });

      // Clear existing state
      state.shapes.clear();
      state.layers.clear();
      state.areas.clear();
      state.selection = {
        selectedShapeId: null,
        selectedLayerId: null,
        isParentSelected: false,
      };

      // Restore shapes (ensure new area fields have defaults for legacy data)
      for (const shape of data.shapes) {
        state.shapes.set(shape.id, {
          ...shape,
          // Ensure area fields have defaults for legacy data without them
          areaType: shape.areaType ?? null,
          childShapeIds: shape.childShapeIds ?? [],
          depth: shape.depth ?? 0,
          metadata: shape.metadata ?? undefined,
        });
      }

      // Restore layers (ensure isLocked has a default for legacy data)
      for (const layer of data.layers) {
        state.layers.set(layer.id, {
          ...layer,
          isLocked: layer.isLocked ?? false,
        });
      }

      // Restore areas
      for (const area of data.areas) {
        state.areas.set(area.id, { ...area });
      }

      // Restore metadata
      state.currentStep = data.currentStep;
      state.rootAreaId = data.rootAreaId;
      state.rootShapeId = data.rootShapeId ?? null;  // Handle legacy data
      state.isSaved = true;
      state.currentLayerId = null;

      notify();
      emit({ type: 'STORE_DESERIALIZED', payload: { shapesCount: data.shapes.length, layersCount: data.layers.length, areasCount: data.areas.length } });
    },

    clear(): void {
      const prevCounts = {
        previousShapesCount: state.shapes.size,
        previousLayersCount: state.layers.size,
        previousAreasCount: state.areas.size,
      };
      tracker.record('STORE/CLEAR', ['*'], {
        shapesCount: state.shapes.size,
        layersCount: state.layers.size,
        areasCount: state.areas.size,
      }, null);

      state.shapes.clear();
      state.layers.clear();
      state.areas.clear();
      state.selection = { ...DEFAULT_SELECTION_STATE };
      state.viewport = { ...DEFAULT_VIEWPORT_STATE, pan: { ...DEFAULT_VIEWPORT_STATE.pan } };
      state.gridConfig = { ...DEFAULT_GRID_CONFIG_STATE };
      state.actionLock = { ...DEFAULT_ACTION_LOCK_STATE };
      state.currentLayerId = null;
      state.currentStep = 1;
      state.isSaved = false;
      state.rootAreaId = null;
      state.rootShapeId = null;
      notify();
      emit({ type: 'STORE_CLEARED', payload: prevCounts });
    },

    // ==================== Subscriptions ====================

    subscribe(listener: (state: GridState) => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    onShapeChange(shapeId: string, listener: (shape: ShapeState | undefined) => void): () => void {
      if (!shapeListeners.has(shapeId)) {
        shapeListeners.set(shapeId, new Set());
      }
      shapeListeners.get(shapeId)!.add(listener);
      return () => shapeListeners.get(shapeId)?.delete(listener);
    },

    // ==================== Mutation Tracking ====================

    getMutationHistory(limit?: number): MutationRecord[] {
      return tracker.getHistory(limit);
    },

    clearMutationHistory(): void {
      tracker.clear();
      notify(); // Notify subscribers so debug toolbar updates
    },

    enableMutationTracking(): void {
      tracker.enable();
    },

    disableMutationTracking(): void {
      tracker.disable();
    },

    // ==================== Action Lock Operations ====================

    /**
     * Attempt to acquire an action lock
     * @param action - The action type to acquire
     * @param lockerId - Identifier for who is acquiring the lock
     * @returns true if lock was acquired, false if another action is in progress
     */
    acquireActionLock(action: ActionType, lockerId: string): boolean {
      // If already idle, acquire the lock
      if (state.actionLock.currentAction === 'idle') {
        const prev = { ...state.actionLock };
        state.actionLock.currentAction = action;
        state.actionLock.lockedBy = lockerId;
        tracker.record('ACTION_LOCK/ACQUIRE', ['actionLock'], prev, { ...state.actionLock });
        if (import.meta.env.DEV) {
          console.log(`[ActionLock] Acquired: ${action} by ${lockerId}`);
        }
        notify();
        emit({ type: 'ACTION_LOCK_ACQUIRED', payload: { action, lockerId } });
        return true;
      }

      // If same locker is trying to acquire same action, allow (re-entrant)
      if (state.actionLock.lockedBy === lockerId && state.actionLock.currentAction === action) {
        return true;
      }

      // Another action is in progress
      if (import.meta.env.DEV) {
        console.warn(`[ActionLock] Denied: ${action} by ${lockerId} - currently ${state.actionLock.currentAction} by ${state.actionLock.lockedBy}`);
      }
      return false;
    },

    /**
     * Release an action lock
     * @param lockerId - The identifier that acquired the lock (must match)
     */
    releaseActionLock(lockerId: string): void {
      if (state.actionLock.lockedBy === lockerId) {
        const prev = { ...state.actionLock };
        const prevAction = state.actionLock.currentAction;
        state.actionLock.currentAction = 'idle';
        state.actionLock.lockedBy = null;
        tracker.record('ACTION_LOCK/RELEASE', ['actionLock'], prev, { ...state.actionLock });
        if (import.meta.env.DEV) {
          console.log(`[ActionLock] Released by ${lockerId}`);
        }
        notify();
        emit({ type: 'ACTION_LOCK_RELEASED', payload: { action: prevAction, lockerId } });
      } else if (import.meta.env.DEV && state.actionLock.lockedBy !== null) {
        console.warn(`[ActionLock] Release denied: ${lockerId} tried to release lock held by ${state.actionLock.lockedBy}`);
      }
    },

    /**
     * Force release the action lock (emergency use only)
     */
    forceReleaseActionLock(): void {
      const prev = { ...state.actionLock };
      if (import.meta.env.DEV) {
        console.warn(`[ActionLock] Force release: was ${prev.currentAction} by ${prev.lockedBy}`);
      }
      const prevAction = state.actionLock.currentAction;
      const prevLockerId = state.actionLock.lockedBy;
      state.actionLock.currentAction = 'idle';
      state.actionLock.lockedBy = null;
      tracker.record('ACTION_LOCK/FORCE_RELEASE', ['actionLock'], prev, { ...state.actionLock });
      notify();
      emit({ type: 'ACTION_LOCK_RELEASED', payload: { action: prevAction, lockerId: prevLockerId ?? 'force-release' } });
    },

    /**
     * Get the current action type
     */
    getCurrentAction(): ActionType {
      return state.actionLock.currentAction;
    },

    /**
     * Check if an action is allowed (either idle or same action by same locker)
     */
    isActionAllowed(action: ActionType): boolean {
      return state.actionLock.currentAction === 'idle' || state.actionLock.currentAction === action;
    },

    /**
     * Get the full action lock state
     */
    getActionLock(): ActionLockState {
      return { ...state.actionLock };
    },

    // ==================== Command Dispatch ====================

    /**
     * Dispatch a command to mutate state.
     * Routes the command to the appropriate handler.
     */
    dispatch(command: GridCommand): CommandResult<unknown> {
      // Import executeCommand dynamically to avoid circular dependency
      // The handlers module imports GridStateStore type, so we need late binding
      const { executeCommand } = require('../commands');
      return executeCommand(command, store);
    },
  };

  return store;
}

// ==================== Type Exports ====================

export type { Bounds };
