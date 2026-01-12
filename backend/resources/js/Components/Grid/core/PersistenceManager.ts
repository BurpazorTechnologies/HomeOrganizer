/**
 * PersistenceManager
 *
 * Manages saving and loading grid data from different data sources.
 * Currently supports localStorage, designed to be extensible for API backends.
 *
 * Responsibilities:
 * - Serialize grid state (shapes, areas, hierarchy) for storage
 * - Deserialize stored data back into grid state
 * - Manage which storage adapter to use (localStorage, API, etc.)
 * - Handle data migration between versions
 */

import { localStorageService, type SavedData, type ShapeData, type ChildAreaData } from '@/Services/localStorage';
import type { Shape } from '@/Components/Grid/types/shapes';
import type { GridStateStore } from '@/Components/Grid/core/state/GridStateStore';

/**
 * Storage adapter interface - implement this for different backends
 */
export interface StorageAdapter {
  save(data: GridPersistenceData): Promise<void>;
  load(): Promise<GridPersistenceData | null>;
  clear(): Promise<void>;
}

/**
 * Normalized grid persistence data structure
 * This is the format we use internally, adapters convert to/from their format
 */
export interface GridPersistenceData {
  version: string;
  lastUpdated: string;
  currentStep: number;
  homeArea: {
    stepId: string;
    layerId: string;
    shapes: ShapeData[];
    primaryShapeId: string | null;
  } | null;
  childAreas: Record<string, ChildAreaData>;
  areaHierarchy: {
    areas: Array<{
      id: string;
      type: string;
      label: string;
      shapeId: string;
      layerId: string;
      parentId: string | null;
      childIds: string[];
      depth: number;
      metadata: Record<string, any>;
    }>;
    rootAreaId: string | null;
  } | null;
}

/**
 * LocalStorage adapter - stores data in browser localStorage
 */
class LocalStorageAdapter implements StorageAdapter {
  async save(data: GridPersistenceData): Promise<void> {
    const savedData: Partial<SavedData> = {
      version: data.version,
      currentStep: data.currentStep,
    };

    if (data.homeArea) {
      savedData.homeArea = data.homeArea;
    }

    if (Object.keys(data.childAreas).length > 0) {
      savedData.childAreas = data.childAreas;
    }

    if (data.areaHierarchy && data.areaHierarchy.rootAreaId) {
      savedData.areas = {
        areas: data.areaHierarchy.areas,
        rootAreaId: data.areaHierarchy.rootAreaId,
      };
    }

    localStorageService.saveData(savedData);
  }

  async load(): Promise<GridPersistenceData | null> {
    const data = localStorageService.getData();
    if (!data) return null;

    return {
      version: data.version || '1.0',
      lastUpdated: data.lastUpdated || new Date().toISOString(),
      currentStep: data.currentStep || 1,
      homeArea: data.homeArea || null,
      childAreas: data.childAreas || {},
      areaHierarchy: data.areas || null,
    };
  }

  async clear(): Promise<void> {
    localStorageService.clear();
  }
}

/**
 * Manager instances interface for type safety
 */
interface ManagerInstances {
  shapeManager: any;
  layerManager: any;
  areaManager: any;
  labelManager: any;
}

/**
 * PersistenceManager - Main class for managing grid persistence
 *
 * Now integrates with GridStateStore for centralized state management.
 * Uses parentShapeId for BoundsService live bounds instead of static parentBounds.
 */
export class PersistenceManager {
  private adapter: StorageAdapter;
  private managers: ManagerInstances | null = null;
  private store: GridStateStore | null = null;
  private onDataChangeCallbacks: Array<(data: GridPersistenceData | null) => void> = [];

  constructor(adapter?: StorageAdapter) {
    this.adapter = adapter || new LocalStorageAdapter();
  }

  /**
   * Set manager references (called after managers are initialized)
   */
  setManagers(managers: ManagerInstances): void {
    this.managers = managers;
  }

  /**
   * Set GridStateStore reference for centralized state
   */
  setStore(store: GridStateStore): void {
    this.store = store;
  }

  /**
   * Register callback for data changes
   */
  onDataChange(callback: (data: GridPersistenceData | null) => void): void {
    this.onDataChangeCallbacks.push(callback);
  }

  /**
   * Notify all listeners of data change
   */
  private notifyDataChange(data: GridPersistenceData | null): void {
    this.onDataChangeCallbacks.forEach(cb => cb(data));
  }

  /**
   * Save home area (Step 1)
   */
  async saveHomeArea(
    stepId: string,
    layerId: string,
    shapeIds: string[],
    primaryShapeId: string | null
  ): Promise<void> {
    if (!this.managers) {
      console.error('PersistenceManager: managers not set');
      return;
    }

    const shapes = this.serializeShapes(shapeIds);

    const existingData = await this.adapter.load() || this.createEmptyData();

    existingData.homeArea = {
      stepId,
      layerId,
      shapes,
      primaryShapeId,
    };
    existingData.currentStep = 1;
    existingData.lastUpdated = new Date().toISOString();

    await this.adapter.save(existingData);
    this.notifyDataChange(existingData);

    console.log('PersistenceManager: Saved home area', existingData.homeArea);
  }

  /**
   * Save child areas (Step 2+)
   */
  async saveChildAreas(
    parentAreaId: string,
    parentShapeId: string,
    stepId: string,
    layerId: string,
    shapeIds: string[],
    currentStep: number
  ): Promise<void> {
    if (!this.managers) {
      console.error('PersistenceManager: managers not set');
      return;
    }

    const shapes = this.serializeShapes(shapeIds);

    const existingData = await this.adapter.load() || this.createEmptyData();

    existingData.childAreas[parentAreaId] = {
      parentAreaId,
      parentShapeId,
      stepId,
      layerId,
      shapes,
    };
    existingData.currentStep = currentStep;
    existingData.lastUpdated = new Date().toISOString();

    await this.adapter.save(existingData);
    this.notifyDataChange(existingData);

    console.log('PersistenceManager: Saved child areas for parent', parentAreaId, existingData.childAreas[parentAreaId]);
  }

  /**
   * Save area hierarchy
   */
  async saveAreaHierarchy(): Promise<void> {
    if (!this.managers) {
      console.error('PersistenceManager: managers not set');
      return;
    }

    const hierarchyData = this.managers.areaManager.serialize();

    const existingData = await this.adapter.load() || this.createEmptyData();
    existingData.areaHierarchy = hierarchyData;
    existingData.lastUpdated = new Date().toISOString();

    await this.adapter.save(existingData);
    this.notifyDataChange(existingData);

    console.log('PersistenceManager: Saved area hierarchy', hierarchyData);
  }

  /**
   * Load home area and recreate shapes
   */
  async loadHomeArea(
    layerId: string,
    onShapeCreated: (shape: Shape, isPrimary: boolean) => void
  ): Promise<boolean> {
    if (!this.managers) {
      console.error('PersistenceManager: managers not set');
      return false;
    }

    const data = await this.adapter.load();
    if (!data?.homeArea?.shapes?.length) {
      console.log('PersistenceManager: No saved home area found');
      return false;
    }

    const homeArea = data.homeArea;

    // Recreate each shape
    for (let i = 0; i < homeArea.shapes.length; i++) {
      const shapeData = homeArea.shapes[i] as any; // Cast to access potential area fields
      const isPrimary = shapeData.id === homeArea.primaryShapeId || i === 0;

      const shape = this.managers.shapeManager.createRectangle(
        shapeData.x,
        shapeData.y,
        {
          id: shapeData.id, // PRESERVE original ID for referential integrity
          fill: shapeData.fill,
          stroke: shapeData.stroke,
          strokeWidth: shapeData.strokeWidth,
          label: shapeData.label,
          width: shapeData.width,
          height: shapeData.height,
          layerId,
          // Unified model: restore area fields if present
          areaType: shapeData.areaType ?? (isPrimary ? 'home' : null),
          childShapeIds: shapeData.childShapeIds ?? [],
          depth: shapeData.depth ?? 0,
          parentShapeId: shapeData.parentShapeId ?? null,
        }
      );

      // Add to layer (pass shapeManager to apply lock state if layer is locked)
      this.managers.layerManager.addShapeToLayer(layerId, shape.id, isPrimary, this.managers.shapeManager);

      // Create label - if shape has a saved label, use area name label; otherwise dimension label
      if (shapeData.label && shapeData.label.trim()) {
        this.managers.labelManager.updateAreaNameLabel(shape.id, shapeData.label, {
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height,
        });
      } else {
        this.managers.labelManager.updateLabel(shape.id, {
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height,
        });
      }

      // Notify callback
      onShapeCreated(shape, isPrimary);
    }

    console.log('PersistenceManager: Loaded home area', homeArea);
    return true;
  }

  /**
   * Load child areas for a specific parent
   *
   * Updated to use parentShapeId for BoundsService live bounds queries.
   * No longer uses setShapeDragBounds (deprecated).
   */
  async loadChildAreas(
    parentAreaId: string,
    layerId: string,
    parentBounds: { x: number; y: number; width: number; height: number },
    onShapeCreated: (shape: Shape, isPrimary: boolean) => void,
    parentShapeId?: string // NEW: For BoundsService live bounds
  ): Promise<boolean> {
    if (!this.managers) {
      console.error('PersistenceManager: managers not set');
      return false;
    }

    const data = await this.adapter.load();
    const childAreaData = data?.childAreas?.[parentAreaId];

    if (!childAreaData?.shapes?.length) {
      console.log('PersistenceManager: No saved child areas for parent', parentAreaId);
      return false;
    }

    // Get parentShapeId from childAreaData if not provided
    const effectiveParentShapeId = parentShapeId || childAreaData.parentShapeId;

    // Recreate each shape
    for (let i = 0; i < childAreaData.shapes.length; i++) {
      const shapeData = childAreaData.shapes[i] as any; // Cast to access potential area fields
      const isPrimary = i === 0;

      // Get parent depth for calculating child depth
      const parentDepth = effectiveParentShapeId
        ? (this.store?.getShape(effectiveParentShapeId)?.depth ?? 0)
        : 0;

      const shape = this.managers.shapeManager.createRectangle(
        shapeData.x,
        shapeData.y,
        {
          id: shapeData.id, // PRESERVE original ID for referential integrity
          fill: shapeData.fill,
          stroke: shapeData.stroke,
          strokeWidth: shapeData.strokeWidth,
          label: shapeData.label,
          width: shapeData.width,
          height: shapeData.height,
          layerId,
          parentBounds, // Fallback for legacy code paths (deprecated)
          parentShapeId: effectiveParentShapeId, // For BoundsService live bounds (preferred)
          // Unified model: restore area fields if present
          areaType: shapeData.areaType ?? 'area',
          childShapeIds: shapeData.childShapeIds ?? [],
          depth: shapeData.depth ?? (parentDepth + 1),
        }
      );

      // Note: setShapeDragBounds is no longer needed - BoundsService queries
      // live parent bounds via parentShapeId relationship in GridStateStore

      // Debug: Verify shape is in store with correct parentShapeId
      if (this.store) {
        const storedShape = this.store.getShape(shape.id);
        const parentInStore = effectiveParentShapeId ? this.store.getShape(effectiveParentShapeId) : null;
        console.log(`[PersistenceManager] Child shape created:`, {
          childId: shape.id,
          childParentShapeId: storedShape?.parentShapeId,
          parentId: effectiveParentShapeId,
          parentFound: !!parentInStore,
          parentBounds: parentInStore ? { x: parentInStore.x, y: parentInStore.y, width: parentInStore.width, height: parentInStore.height } : null,
        });
      }

      // Add to layer (pass shapeManager to apply lock state if layer is locked)
      this.managers.layerManager.addShapeToLayer(layerId, shape.id, isPrimary, this.managers.shapeManager);

      // Create child area in AreaManager (only if not already restored from hierarchy)
      const childAreaId = `area_${shape.id}`;
      if (!this.managers.areaManager.getArea(childAreaId)) {
        this.managers.areaManager.createChildArea(
          childAreaId,
          'area',
          shape.id,
          layerId,
          parentAreaId,
          shapeData.label
        );
      }

      // Create label - if shape has a saved label, use area name label; otherwise dimension label
      if (shapeData.label && shapeData.label.trim()) {
        this.managers.labelManager.updateAreaNameLabel(shape.id, shapeData.label, {
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height,
        });
      } else {
        this.managers.labelManager.updateLabel(shape.id, {
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height,
        });
      }

      // Notify callback
      onShapeCreated(shape, isPrimary);
    }

    console.log('PersistenceManager: Loaded child areas for parent', parentAreaId, childAreaData);
    return true;
  }

  /**
   * Check if there are any shapes saved globally
   */
  async hasAnyShapes(): Promise<boolean> {
    const data = await this.adapter.load();
    if (!data) return false;

    const hasHomeShapes = (data.homeArea?.shapes?.length || 0) > 0;
    const hasChildShapes = Object.values(data.childAreas || {}).some(
      area => (area.shapes?.length || 0) > 0
    );

    return hasHomeShapes || hasChildShapes;
  }

  /**
   * Get current saved data (for debug display)
   */
  async getCurrentData(): Promise<GridPersistenceData | null> {
    return this.adapter.load();
  }

  /**
   * Get saved step number
   */
  async getSavedStep(): Promise<number> {
    const data = await this.adapter.load();
    return data?.currentStep || 1;
  }

  /**
   * Get saved parent area ID (for Step 2+)
   */
  async getSavedParentAreaId(): Promise<string | null> {
    const data = await this.adapter.load();
    if (!data?.childAreas) return null;

    // Get the first parent area ID that has saved children
    const parentIds = Object.keys(data.childAreas);
    return parentIds.length > 0 ? parentIds[0] : null;
  }

  /**
   * Clear all saved data
   */
  async clear(): Promise<void> {
    await this.adapter.clear();
    this.notifyDataChange(null);
    console.log('PersistenceManager: Cleared all data');
  }

  /**
   * Serialize shapes from IDs
   * Updated to include unified area fields for Phase E migration
   */
  private serializeShapes(shapeIds: string[]): ShapeData[] {
    if (!this.managers) return [];

    return shapeIds.map(id => {
      const shape = this.managers!.shapeManager.getShape(id);
      if (!shape) {
        console.warn('PersistenceManager: Shape not found', id);
        return null;
      }

      // Get area fields from store if available
      const storeShape = this.store?.getShape(id);

      return {
        id: shape.id,
        type: shape.type,
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        fill: shape.fill,
        stroke: shape.stroke,
        strokeWidth: shape.strokeWidth,
        label: shape.label || '',
        zIndex: shape.zIndex,
        // Unified model: include area fields
        areaType: storeShape?.areaType ?? null,
        childShapeIds: storeShape?.childShapeIds ?? [],
        depth: storeShape?.depth ?? 0,
        parentShapeId: storeShape?.parentShapeId ?? null,
      };
    }).filter(Boolean) as ShapeData[];
  }

  /**
   * Create empty persistence data structure
   */
  private createEmptyData(): GridPersistenceData {
    return {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      currentStep: 1,
      homeArea: null,
      childAreas: {},
      areaHierarchy: null,
    };
  }
}
