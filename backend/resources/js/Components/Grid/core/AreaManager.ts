/**
 * AreaManager (Legacy Stub)
 *
 * DEPRECATED: Area semantics are now unified with shapes via ShapeState.
 * Area information is stored directly on shapes using:
 * - areaType: 'home' | 'area' | null
 * - childShapeIds: string[]
 * - depth: number
 * - parentShapeId: string | null
 *
 * This stub maintains backwards compatibility with PersistenceManager,
 * StepOrchestrator, and debug tools while they're migrated to the unified model.
 *
 * The actual area data is stored in GridStateStore.areas (legacy) and will be
 * fully replaced by the shape-based area semantics.
 */

import type { GridStateStore, AreaState } from '@/Components/Grid/core/state/GridStateStore';

export class AreaManager {
  private _store: GridStateStore | null = null;

  /**
   * Set the store reference
   */
  setStore(store: GridStateStore): void {
    this._store = store;
  }

  /**
   * Get all areas from the store
   */
  getAllAreas(): AreaState[] {
    if (!this._store) return [];
    const areas: AreaState[] = [];
    for (const area of this._store.state.areas.values()) {
      areas.push({ ...area, childIds: [...area.childIds] });
    }
    return areas;
  }

  /**
   * Get an area by ID
   */
  getArea(id: string): AreaState | undefined {
    return this._store?.getArea(id);
  }

  /**
   * Get an area by its associated shape ID
   */
  getAreaByShapeId(shapeId: string): AreaState | undefined {
    return this._store?.getAreaByShapeId(shapeId);
  }

  /**
   * Add an area
   */
  addArea(area: AreaState): void {
    this._store?.addArea(area);
  }

  /**
   * Update an area
   */
  updateArea(id: string, updates: Partial<Omit<AreaState, 'id'>>): void {
    this._store?.updateArea(id, updates);
  }

  /**
   * Remove an area
   */
  removeArea(id: string): void {
    this._store?.removeArea(id);
  }

  /**
   * Get the root area ID
   */
  getRootAreaId(): string | null {
    return this._store?.state.rootAreaId ?? null;
  }

  /**
   * Set the root area ID
   */
  setRootAreaId(id: string | null): void {
    this._store?.setRootAreaId(id);
  }

  /**
   * Get child areas for a parent area
   */
  getChildAreas(parentId: string): AreaState[] {
    if (!this._store) return [];
    const children: AreaState[] = [];
    for (const area of this._store.state.areas.values()) {
      if (area.parentId === parentId) {
        children.push({ ...area, childIds: [...area.childIds] });
      }
    }
    return children;
  }

  /**
   * Clear all areas
   */
  clear(): void {
    // Areas are cleared when store.clear() is called
  }

  /**
   * Create a home area (the root of the area hierarchy)
   * This is called when creating the first shape in Step 1
   */
  createHomeArea(areaId: string, shapeId: string, layerId: string): void {
    if (!this._store) return;

    const area: AreaState = {
      id: areaId,
      label: 'Home Area',
      type: 'home',
      shapeId,
      layerId,
      parentId: null,
      childIds: [],
      depth: 0,
    };

    this._store.addArea(area);
    this._store.setRootAreaId(areaId);
  }

  /**
   * Serialize area hierarchy for persistence
   * Returns data matching GridPersistenceData.areaHierarchy structure
   */
  serialize(): { areas: Array<{
    id: string;
    type: string;
    label: string;
    shapeId: string;
    layerId: string;
    parentId: string | null;
    childIds: string[];
    depth: number;
    metadata: Record<string, any>;
  }>; rootAreaId: string | null } {
    const areas = this.getAllAreas().map(area => ({
      id: area.id,
      type: area.type,
      label: area.label,
      shapeId: area.shapeId,
      layerId: area.layerId,
      parentId: area.parentId,
      childIds: [...area.childIds],
      depth: area.depth,
      metadata: area.metadata ?? {},
    }));

    return {
      areas,
      rootAreaId: this.getRootAreaId(),
    };
  }

  /**
   * Deserialize area hierarchy from persistence
   * Restores areas from saved data structure
   *
   * @param data - The saved areaHierarchy data
   * @param _shapeManager - ShapeManager reference (unused in stub, kept for API compatibility)
   */
  deserialize(
    data: { areas: Array<{
      id: string;
      type: string;
      label: string;
      shapeId: string;
      layerId: string;
      parentId: string | null;
      childIds: string[];
      depth: number;
      metadata?: Record<string, any>;
    }>; rootAreaId: string | null },
    _shapeManager: any
  ): void {
    if (!this._store || !data) return;

    // Restore each area
    for (const areaData of data.areas) {
      const area: AreaState = {
        id: areaData.id,
        type: areaData.type as AreaState['type'],
        label: areaData.label,
        shapeId: areaData.shapeId,
        layerId: areaData.layerId,
        parentId: areaData.parentId,
        childIds: [...areaData.childIds],
        depth: areaData.depth,
        metadata: areaData.metadata,
      };
      this._store.addArea(area);
    }

    // Restore root area ID
    if (data.rootAreaId) {
      this._store.setRootAreaId(data.rootAreaId);
    }
  }
}
