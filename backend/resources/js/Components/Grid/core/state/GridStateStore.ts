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
 */

import { reactive, readonly, type DeepReadonly } from 'vue';
import type { Bounds } from '../utils/bounds';
import { createMutationTracker, type MutationTracker, type MutationRecord } from './MutationTracker';

// ==================== State Interfaces ====================

/**
 * Area type - semantic classification of a shape
 * Shapes with areaType set participate in the hierarchical area structure
 */
export type AreaType = 'home' | 'floor' | 'area' | 'room';

/**
 * Shape state - represents a single shape in the grid
 *
 * Shapes can optionally be "areas" - semantic containers with hierarchy.
 * When areaType is set (not null), the shape participates in the area hierarchy.
 * This eliminates the need for a separate AreaManager - areas ARE shapes.
 */
export interface ShapeState {
  id: string;
  type: 'rectangle' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  label: string;
  layerId: string;
  parentShapeId: string | null;  // Parent shape for bounds constraints
  zIndex: number;

  // Area semantics (optional - null means plain shape, not an area)
  areaType: AreaType | null;           // null = plain shape, set = area shape
  childShapeIds: string[];             // IDs of child shapes (for area hierarchy)
  depth: number;                       // Nesting level (0 = root, 1+= children)
  metadata?: Record<string, unknown>;  // Area metadata (colors, floor, etc.)
}

/**
 * Layer state - represents a Konva layer group
 */
export interface LayerState {
  id: string;
  stepId: string;
  order: number;
  label: string;
  shapeIds: string[];
  primaryShapeId: string | null;
  parentLayerId: string | null;
  areaId?: string;
  // Layer lock state - when locked, shapes in this layer cannot be interacted with
  isLocked: boolean;
}

/**
 * Area state - represents a hierarchical area
 */
export interface AreaState {
  id: string;
  type: 'home' | 'floor' | 'area' | 'room';
  label: string;
  shapeId: string;
  layerId: string;
  parentId: string | null;
  childIds: string[];
  depth: number;
  metadata?: Record<string, unknown>;
}

/**
 * Selection state - tracks what's currently selected
 */
export interface SelectionState {
  selectedShapeId: string | null;
  selectedLayerId: string | null;
  isParentSelected: boolean;
}

/**
 * Viewport state - tracks zoom and pan
 */
export interface ViewportState {
  zoom: number;
  pan: { x: number; y: number };
}

/**
 * Action types - only one action can be active at a time
 * This prevents bugs from multi-action conflicts
 */
export type ActionType = 'idle' | 'panning' | 'zooming' | 'dragging' | 'resizing' | 'creating';

/**
 * Action lock state - tracks which action is currently active
 */
export interface ActionLockState {
  currentAction: ActionType;
  lockedBy: string | null;  // ID of the element/manager that acquired the lock
}

/**
 * Grid configuration state - centralized grid settings
 * Previously duplicated across ShapeManager, TransformManager, GridManager
 */
export interface GridConfigState {
  gridSize: number;
  snapEnabled: boolean;
  gridVisible: boolean;
}

/**
 * Complete grid state
 */
export interface GridState {
  shapes: Map<string, ShapeState>;
  layers: Map<string, LayerState>;
  areas: Map<string, AreaState>;
  selection: SelectionState;
  viewport: ViewportState;
  gridConfig: GridConfigState;
  actionLock: ActionLockState;
  currentLayerId: string | null;
  currentStep: number;
  isSaved: boolean;
  rootAreaId: string | null;
  // NEW: Root shape ID for unified shape/area hierarchy
  // Will replace rootAreaId once migration to unified model is complete
  rootShapeId: string | null;
}

/**
 * Serialized format for persistence
 */
export interface SerializedGridState {
  version: string;
  shapes: ShapeState[];
  layers: LayerState[];
  areas: AreaState[];  // Legacy - will be empty after migration
  currentStep: number;
  rootAreaId: string | null;  // Legacy - use rootShapeId after migration
  rootShapeId: string | null;
}

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
}

// ==================== Store Factory ====================

/**
 * Create a new GridStateStore instance
 */
export function createGridStateStore(): GridStateStore {
  // Mutation tracker for debugging
  const tracker: MutationTracker = createMutationTracker(100);

  // Reactive state
  const state = reactive<GridState>({
    shapes: new Map(),
    layers: new Map(),
    areas: new Map(),
    selection: {
      selectedShapeId: null,
      selectedLayerId: null,
      isParentSelected: false,
    },
    viewport: {
      zoom: 1.0,
      pan: { x: 0, y: 0 },
    },
    gridConfig: {
      gridSize: 20,
      snapEnabled: true,
      gridVisible: true,
    },
    actionLock: {
      currentAction: 'idle',
      lockedBy: null,
    },
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
    },

    updateShape(id: string, updates: Partial<Omit<ShapeState, 'id'>>): void {
      const shape = state.shapes.get(id);
      if (shape) {
        const prevState = { ...shape };
        Object.assign(shape, updates);
        tracker.record('SHAPE/UPDATE', ['shapes', id], prevState, { ...shape });
        notify();
        notifyShapeChange(id);
      }
    },

    removeShape(id: string): void {
      const shape = state.shapes.get(id);
      if (shape) {
        tracker.record('SHAPE/REMOVE', ['shapes', id], { ...shape }, null);
        state.shapes.delete(id);
        // Clear selection if this was selected
        if (state.selection.selectedShapeId === id) {
          state.selection.selectedShapeId = null;
          state.selection.selectedLayerId = null;
          state.selection.isParentSelected = false;
        }
        notify();
        notifyShapeChange(id);
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
    },

    updateLayer(id: string, updates: Partial<Omit<LayerState, 'id'>>): void {
      const layer = state.layers.get(id);
      if (layer) {
        const prevState = { ...layer, shapeIds: [...layer.shapeIds] };
        Object.assign(layer, updates);
        tracker.record('LAYER/UPDATE', ['layers', id], prevState, { ...layer, shapeIds: [...layer.shapeIds] });
        notify();
      }
    },

    removeLayer(id: string): void {
      const layer = state.layers.get(id);
      if (layer) {
        tracker.record('LAYER/REMOVE', ['layers', id], { ...layer, shapeIds: [...layer.shapeIds] }, null);
        state.layers.delete(id);
        if (state.currentLayerId === id) {
          state.currentLayerId = null;
        }
        notify();
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
      }
    },

    unlockLayer(layerId: string): void {
      const layer = state.layers.get(layerId);
      if (layer && layer.isLocked) {
        const prev = layer.isLocked;
        layer.isLocked = false;
        tracker.record('LAYER/UNLOCK', ['layers', layerId, 'isLocked'], prev, false);
        notify();
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
    },

    updateArea(id: string, updates: Partial<Omit<AreaState, 'id'>>): void {
      const area = state.areas.get(id);
      if (area) {
        const prevState = { ...area, childIds: [...area.childIds] };
        Object.assign(area, updates);
        tracker.record('AREA/UPDATE', ['areas', id], prevState, { ...area, childIds: [...area.childIds] });
        notify();
      }
    },

    removeArea(id: string): void {
      const area = state.areas.get(id);
      if (area) {
        tracker.record('AREA/REMOVE', ['areas', id], { ...area, childIds: [...area.childIds] }, null);
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
    },

    // ==================== Unified Shape/Area Operations ====================

    setRootShapeId(id: string | null): void {
      const prev = state.rootShapeId;
      state.rootShapeId = id;
      tracker.record('SHAPE/SET_ROOT', ['rootShapeId'], prev, id);
      notify();
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
    },

    deselect(): void {
      const prev = { ...state.selection };
      state.selection.selectedShapeId = null;
      state.selection.selectedLayerId = null;
      state.selection.isParentSelected = false;
      tracker.record('SELECTION/DESELECT', ['selection'], prev, { ...state.selection });
      notify();
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
    },

    setIsSaved(saved: boolean): void {
      const prev = state.isSaved;
      state.isSaved = saved;
      tracker.record('STEP/SET_SAVED', ['isSaved'], prev, saved);
      notify();
    },

    // ==================== Viewport Operations ====================

    setZoom(zoom: number): void {
      const prev = state.viewport.zoom;
      state.viewport.zoom = zoom;
      tracker.record('VIEWPORT/SET_ZOOM', ['viewport', 'zoom'], prev, zoom);
      notify();
    },

    setPan(pan: { x: number; y: number }): void {
      const prev = { ...state.viewport.pan };
      state.viewport.pan = { ...pan };
      tracker.record('VIEWPORT/SET_PAN', ['viewport', 'pan'], prev, { ...pan });
      notify();
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
    },

    setSnapEnabled(enabled: boolean): void {
      const prev = state.gridConfig.snapEnabled;
      state.gridConfig.snapEnabled = enabled;
      tracker.record('GRID_CONFIG/SET_SNAP', ['gridConfig', 'snapEnabled'], prev, enabled);
      notify();
    },

    setGridVisible(visible: boolean): void {
      const prev = state.gridConfig.gridVisible;
      state.gridConfig.gridVisible = visible;
      tracker.record('GRID_CONFIG/SET_VISIBLE', ['gridConfig', 'gridVisible'], prev, visible);
      notify();
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
    },

    clear(): void {
      tracker.record('STORE/CLEAR', ['*'], {
        shapesCount: state.shapes.size,
        layersCount: state.layers.size,
        areasCount: state.areas.size,
      }, null);

      state.shapes.clear();
      state.layers.clear();
      state.areas.clear();
      state.selection = {
        selectedShapeId: null,
        selectedLayerId: null,
        isParentSelected: false,
      };
      state.viewport = {
        zoom: 1.0,
        pan: { x: 0, y: 0 },
      };
      state.gridConfig = {
        gridSize: 20,
        snapEnabled: true,
        gridVisible: true,
      };
      state.actionLock = {
        currentAction: 'idle',
        lockedBy: null,
      };
      state.currentLayerId = null;
      state.currentStep = 1;
      state.isSaved = false;
      state.rootAreaId = null;
      state.rootShapeId = null;
      notify();
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
        state.actionLock.currentAction = 'idle';
        state.actionLock.lockedBy = null;
        tracker.record('ACTION_LOCK/RELEASE', ['actionLock'], prev, { ...state.actionLock });
        if (import.meta.env.DEV) {
          console.log(`[ActionLock] Released by ${lockerId}`);
        }
        notify();
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
      state.actionLock.currentAction = 'idle';
      state.actionLock.lockedBy = null;
      tracker.record('ACTION_LOCK/FORCE_RELEASE', ['actionLock'], prev, { ...state.actionLock });
      notify();
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
  };

  return store;
}

// ==================== Type Exports ====================

export type { Bounds };
