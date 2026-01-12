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
}
