/**
 * AreaManager
 *
 * Manages hierarchical area relationships and metadata.
 * Tracks parent-child relationships, validates boundaries, and handles persistence.
 */

import type { Area, AreaType } from '@/Components/Grid/types/areas';
import type { ShapeManager } from '@/Components/Grid/core/ShapeManager';

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AreaHierarchyData {
  areas: Area[];
  rootAreaId: string;
}

export class AreaManager {
  private areas: Map<string, Area> = new Map();
  private areasByShapeId: Map<string, string> = new Map();
  private rootAreaId: string | null = null;

  /**
   * Create root home area
   */
  createHomeArea(id: string, shapeId: string, layerId: string): Area {
    const area: Area = {
      id,
      type: 'home',
      label: 'Home Area',
      shapeId,
      layerId,
      parentId: null,
      childIds: [],
      depth: 0,
      metadata: {},
    };

    this.areas.set(id, area);
    this.areasByShapeId.set(shapeId, id);
    this.rootAreaId = id;

    return area;
  }

  /**
   * Create child area with parent context
   */
  createChildArea(
    id: string,
    type: AreaType,
    shapeId: string,
    layerId: string,
    parentId: string,
    label?: string
  ): Area {
    const parent = this.areas.get(parentId);
    if (!parent) {
      throw new Error(`Parent area ${parentId} not found`);
    }

    const area: Area = {
      id,
      type,
      label: label || `${type} ${parent.childIds.length + 1}`,
      shapeId,
      layerId,
      parentId,
      childIds: [],
      depth: parent.depth + 1,
      metadata: {},
    };

    this.areas.set(id, area);
    this.areasByShapeId.set(shapeId, id);

    // Add to parent's children
    parent.childIds.push(id);

    return area;
  }

  /**
   * Get area by ID
   */
  getArea(areaId: string): Area | null {
    return this.areas.get(areaId) || null;
  }

  /**
   * Find area by shape ID
   */
  findAreaByShapeId(shapeId: string): string | null {
    return this.areasByShapeId.get(shapeId) || null;
  }

  /**
   * Get parent area
   */
  getParentArea(areaId: string): Area | null {
    const area = this.areas.get(areaId);
    if (!area || !area.parentId) return null;
    return this.areas.get(area.parentId) || null;
  }

  /**
   * Get all children of an area
   */
  getChildAreas(parentId: string): Area[] {
    const parent = this.areas.get(parentId);
    if (!parent) return [];

    return parent.childIds
      .map(id => this.areas.get(id))
      .filter((area): area is Area => area !== undefined);
  }

  /**
   * Get area bounds from ShapeManager
   */
  getAreaBounds(areaId: string, shapeManager: any): Bounds | null {
    const area = this.areas.get(areaId);
    if (!area) return null;

    const shape = shapeManager.getShape(area.shapeId);
    if (!shape) return null;

    return {
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
    };
  }

  /**
   * Validate if child bounds are within parent bounds
   */
  isWithinParentBounds(
    parentId: string,
    childBounds: Bounds,
    shapeManager: any
  ): boolean {
    const parentBounds = this.getAreaBounds(parentId, shapeManager);
    if (!parentBounds) return false;

    return (
      childBounds.x >= parentBounds.x &&
      childBounds.y >= parentBounds.y &&
      childBounds.x + childBounds.width <= parentBounds.x + parentBounds.width &&
      childBounds.y + childBounds.height <= parentBounds.y + parentBounds.height
    );
  }

  /**
   * Set area name
   */
  setAreaName(areaId: string, name: string): void {
    const area = this.areas.get(areaId);
    if (area) {
      area.label = name;
    }
  }

  /**
   * Get root area
   */
  getRootArea(): Area | null {
    if (!this.rootAreaId) return null;
    return this.areas.get(this.rootAreaId) || null;
  }

  /**
   * Get hierarchy as tree
   */
  getHierarchyTree(): AreaHierarchyNode | null {
    const root = this.getRootArea();
    if (!root) return null;

    const buildTree = (area: Area): AreaHierarchyNode => {
      return {
        area,
        children: this.getChildAreas(area.id).map(child => buildTree(child)),
      };
    };

    return buildTree(root);
  }

  /**
   * Serialize for localStorage
   */
  serialize(): AreaHierarchyData {
    return {
      areas: Array.from(this.areas.values()),
      rootAreaId: this.rootAreaId || '',
    };
  }

  /**
   * Deserialize from localStorage
   */
  deserialize(data: AreaHierarchyData, shapeManager: any): void {
    this.areas.clear();
    this.areasByShapeId.clear();

    // Restore areas
    data.areas.forEach(area => {
      this.areas.set(area.id, area);
      this.areasByShapeId.set(area.shapeId, area.id);
    });

    this.rootAreaId = data.rootAreaId;
  }

  /**
   * Clear all areas
   */
  clear(): void {
    this.areas.clear();
    this.areasByShapeId.clear();
    this.rootAreaId = null;
  }

  /**
   * Get all areas
   */
  getAllAreas(): Area[] {
    return Array.from(this.areas.values());
  }
}

interface AreaHierarchyNode {
  area: Area;
  children: AreaHierarchyNode[];
}
