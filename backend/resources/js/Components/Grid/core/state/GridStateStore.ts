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
 * Shape state - represents a single shape in the grid
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
  parentShapeId: string | null;  // KEY: Track parent relationship for bounds
  zIndex: number;
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
 * Complete grid state
 */
export interface GridState {
  shapes: Map<string, ShapeState>;
  layers: Map<string, LayerState>;
  areas: Map<string, AreaState>;
  selection: SelectionState;
  currentLayerId: string | null;
  currentStep: number;
  isSaved: boolean;
  rootAreaId: string | null;
}

/**
 * Serialized format for persistence
 */
export interface SerializedGridState {
  version: string;
  shapes: ShapeState[];
  layers: LayerState[];
  areas: AreaState[];
  currentStep: number;
  rootAreaId: string | null;
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

  // Area operations
  addArea(area: AreaState): void;
  updateArea(id: string, updates: Partial<Omit<AreaState, 'id'>>): void;
  removeArea(id: string): void;
  getArea(id: string): AreaState | undefined;
  getAreaByShapeId(shapeId: string): AreaState | undefined;
  setRootAreaId(id: string | null): void;

  // Selection operations
  select(shapeId: string, layerId: string, isParent?: boolean): void;
  deselect(): void;
  getSelectedShape(): ShapeState | undefined;

  // Step operations
  setCurrentStep(step: number): void;
  setIsSaved(saved: boolean): void;

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
    currentLayerId: null,
    currentStep: 1,
    isSaved: false,
    rootAreaId: null,
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
      tracker.record('LAYER/ADD', ['layers', layer.id], null, { ...layer });
      state.layers.set(layer.id, { ...layer });
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

      // Restore shapes
      for (const shape of data.shapes) {
        state.shapes.set(shape.id, { ...shape });
      }

      // Restore layers
      for (const layer of data.layers) {
        state.layers.set(layer.id, { ...layer });
      }

      // Restore areas
      for (const area of data.areas) {
        state.areas.set(area.id, { ...area });
      }

      // Restore metadata
      state.currentStep = data.currentStep;
      state.rootAreaId = data.rootAreaId;
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
      state.currentLayerId = null;
      state.currentStep = 1;
      state.isSaved = false;
      state.rootAreaId = null;
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
    },

    enableMutationTracking(): void {
      tracker.enable();
    },

    disableMutationTracking(): void {
      tracker.disable();
    },
  };

  return store;
}

// ==================== Type Exports ====================

export type { Bounds };
