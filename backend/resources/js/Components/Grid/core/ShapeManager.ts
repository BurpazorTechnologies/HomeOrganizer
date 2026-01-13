import Konva from 'konva';
import type { Shape, RectangleShape } from '@/Components/Grid/types/shapes';
import { SHAPE_COLORS, GRID_CONSTANTS } from '@/Components/Grid/types/constants';
import type { LayerManager } from '@/Components/Grid/core/LayerManager';
import type { GridStateStore, AreaType, ShapeState } from '@/Components/Grid/core/state/GridStateStore';
import type { BoundsService } from '@/Components/Grid/core/services/BoundsService';
import type { EventBus, Unsubscribe } from '@/Components/Grid/core/events';

/**
 * ShapeManager
 *
 * Manages all shapes on the canvas:
 * - Creates and tracks Konva node instances
 * - Handles shape rendering
 * - Syncs with GridStateStore for state
 * - Uses BoundsService for live drag/resize constraints
 * - Works with LayerManager to place shapes on correct layers
 *
 * Key change: dragBoundFunc now queries BoundsService for LIVE parent bounds,
 * eliminating the stale closure problem.
 *
 * Event-driven architecture (Phase 2):
 * - Store emits SHAPE_CREATED, SHAPE_UPDATED, SHAPE_DELETED events
 * - ShapeManager can subscribe to ZOOM_CHANGED to validate child bounds
 */
export class ShapeManager {
    private stage: Konva.Stage;
    private shapes: Map<string, { data: Shape; node: Konva.Shape; layerId: string }> = new Map();
    private getZoomScale: () => number;
    private layerManager: LayerManager | null = null;

    // Central state store and bounds service
    private store: GridStateStore | null = null;
    private boundsService: BoundsService | null = null;

    // EventBus for event-driven updates
    private eventBus: EventBus | null = null;
    private eventUnsubscribers: Unsubscribe[] = [];

    // Fallback values (used if store not available during initialization)
    private _fallbackGridSize: number;
    private _fallbackSnapEnabled: boolean;

    // Reference to SelectionManager for selection queries (avoid duplicating selection state)
    private selectionManager: { getSelectedShapeId: () => string | null; deselect: () => void } | null = null;

    constructor(
        stage: Konva.Stage,
        options: {
            gridSize: number;
            snapEnabled: boolean;
            getZoomScale?: () => number;
            store?: GridStateStore;
            boundsService?: BoundsService;
        }
    ) {
        this.stage = stage;
        this._fallbackGridSize = options.gridSize;
        this._fallbackSnapEnabled = options.snapEnabled;
        this.getZoomScale = options.getZoomScale || (() => 1.0);
        this.store = options.store || null;
        this.boundsService = options.boundsService || null;
    }

    /**
     * Get current grid size from store (single source of truth)
     */
    private get gridSize(): number {
        return this.store?.getGridConfig()?.gridSize ?? this._fallbackGridSize;
    }

    /**
     * Get current snap enabled state from store (single source of truth)
     */
    private get snapEnabled(): boolean {
        return this.store?.getGridConfig()?.snapEnabled ?? this._fallbackSnapEnabled;
    }

    /**
     * Set LayerManager reference
     */
    setLayerManager(layerManager: LayerManager): void {
        this.layerManager = layerManager;
    }

    /**
     * Set SelectionManager reference (for selection state queries)
     * This avoids duplicating selection state in ShapeManager
     */
    setSelectionManager(selectionManager: { getSelectedShapeId: () => string | null; deselect: () => void }): void {
        this.selectionManager = selectionManager;
    }

    /**
     * Set the EventBus and subscribe to relevant events
     * Note: Currently ZOOM_CHANGED validation is handled by ManagerRegistry for backwards compat
     * This provides a hook for future direct event-driven updates
     */
    setEventBus(eventBus: EventBus): void {
        // Clear any existing subscriptions
        this.clearEventSubscriptions();

        this.eventBus = eventBus;

        // Future: Subscribe to events that affect shapes
        // Currently zoom validation is handled by ManagerRegistry callback
        // These subscriptions would enable direct event-driven validation:
        // this.eventUnsubscribers.push(
        //     eventBus.on('ZOOM_CHANGED', () => this.validateChildShapeBounds()),
        // );
    }

    /**
     * Clear event subscriptions (used during cleanup or when switching EventBus)
     */
    private clearEventSubscriptions(): void {
        this.eventUnsubscribers.forEach(unsub => unsub());
        this.eventUnsubscribers = [];
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        this.clearEventSubscriptions();
        this.eventBus = null;
        this.clear();
    }

    /**
     * Create a new rectangle shape at the specified position
     * @param x - X coordinate
     * @param y - Y coordinate
     * @param options - Optional configuration including id for restoration from saved data
     */
    createRectangle(
        x: number,
        y: number,
        options?: {
            id?: string; // Optional ID for restoring saved shapes (preserves references)
            width?: number;
            height?: number;
            fill?: string;
            stroke?: string;
            strokeWidth?: number;
            label?: string;
            layerId?: string;
            parentShapeId?: string | null; // Track parent for live bounds
            parentBounds?: { // DEPRECATED: Only used as fallback if no boundsService
                x: number;
                y: number;
                width: number;
                height: number;
            };
            // NEW: Area semantics (unified shape/area model)
            areaType?: AreaType | null;        // null = plain shape, set = area shape
            childShapeIds?: string[];          // IDs of child shapes
            depth?: number;                    // Nesting level (0 = root)
            metadata?: Record<string, unknown>; // Area metadata
        }
    ): RectangleShape {
        // Use provided ID (for restoration) or generate new one
        const id = options?.id || `shape_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Get shape dimensions
        const shapeWidth = options?.width || GRID_CONSTANTS.DEFAULT_SHAPE_WIDTH;
        const shapeHeight = options?.height || GRID_CONSTANTS.DEFAULT_SHAPE_HEIGHT;

        // Snap position to grid if enabled
        let snappedX = this.snapEnabled ? Math.round(x / this.gridSize) * this.gridSize : x;
        let snappedY = this.snapEnabled ? Math.round(y / this.gridSize) * this.gridSize : y;

        // CRITICAL: Constrain initial position within parent bounds
        // This ensures child shapes are always created/loaded within their parent
        if (options?.parentShapeId && this.store) {
            const parentShape = this.store.getShape(options.parentShapeId);
            if (parentShape) {
                const parentBounds = {
                    x: parentShape.x,
                    y: parentShape.y,
                    width: parentShape.width,
                    height: parentShape.height,
                };

                // Calculate constrained position
                const minX = parentBounds.x;
                const minY = parentBounds.y;
                const maxX = parentBounds.x + parentBounds.width - shapeWidth;
                const maxY = parentBounds.y + parentBounds.height - shapeHeight;

                const constrainedX = Math.max(minX, Math.min(snappedX, maxX));
                const constrainedY = Math.max(minY, Math.min(snappedY, maxY));

                // Re-snap after constraining if position changed
                if (constrainedX !== snappedX || constrainedY !== snappedY) {
                    console.log('[ShapeManager] Constrained initial position within parent bounds:', {
                        shapeId: id,
                        original: { x: snappedX, y: snappedY },
                        constrained: { x: constrainedX, y: constrainedY },
                        parentBounds,
                    });
                    snappedX = this.snapEnabled ? Math.round(constrainedX / this.gridSize) * this.gridSize : constrainedX;
                    snappedY = this.snapEnabled ? Math.round(constrainedY / this.gridSize) * this.gridSize : constrainedY;
                    // Re-constrain after snapping (snap might push outside bounds)
                    snappedX = Math.max(minX, Math.min(snappedX, maxX));
                    snappedY = Math.max(minY, Math.min(snappedY, maxY));
                }
            }
        } else if (options?.parentBounds) {
            // Fallback: Use static parentBounds if parentShapeId not available (deprecated path)
            const parentBounds = options.parentBounds;
            const minX = parentBounds.x;
            const minY = parentBounds.y;
            const maxX = parentBounds.x + parentBounds.width - shapeWidth;
            const maxY = parentBounds.y + parentBounds.height - shapeHeight;

            const constrainedX = Math.max(minX, Math.min(snappedX, maxX));
            const constrainedY = Math.max(minY, Math.min(snappedY, maxY));

            if (constrainedX !== snappedX || constrainedY !== snappedY) {
                console.log('[ShapeManager] Constrained initial position (fallback parentBounds):', {
                    shapeId: id,
                    original: { x: snappedX, y: snappedY },
                    constrained: { x: constrainedX, y: constrainedY },
                    parentBounds,
                });
                snappedX = this.snapEnabled ? Math.round(constrainedX / this.gridSize) * this.gridSize : constrainedX;
                snappedY = this.snapEnabled ? Math.round(constrainedY / this.gridSize) * this.gridSize : constrainedY;
                snappedX = Math.max(minX, Math.min(snappedX, maxX));
                snappedY = Math.max(minY, Math.min(snappedY, maxY));
            }
        }

        const shapeData: RectangleShape = {
            id,
            type: 'rectangle',
            x: snappedX,
            y: snappedY,
            width: shapeWidth,
            height: shapeHeight,
            fill: options?.fill || SHAPE_COLORS.HOME_AREA_FILL,
            stroke: options?.stroke || SHAPE_COLORS.HOME_AREA_STROKE,
            strokeWidth: options?.strokeWidth || GRID_CONSTANTS.SHAPE_STROKE_WIDTH,
            label: options?.label || '',
            zIndex: this.shapes.size,
        };

        // Get the appropriate layer - use current layer if layerId not provided
        const layerId = options?.layerId || this.layerManager?.getCurrentLayer()?.id || 'layer_1';

        // Add to GridStateStore if available
        if (this.store) {
            const parentShapeId = options?.parentShapeId || null;

            this.store.addShape({
                id: shapeData.id,
                type: shapeData.type,
                x: shapeData.x,
                y: shapeData.y,
                width: shapeData.width,
                height: shapeData.height,
                fill: shapeData.fill,
                stroke: shapeData.stroke,
                strokeWidth: shapeData.strokeWidth,
                label: shapeData.label || '', // Ensure label is always a string
                layerId,
                parentShapeId, // Track parent relationship
                zIndex: shapeData.zIndex,
                // Area semantics (defaults for plain shapes)
                areaType: options?.areaType ?? null,
                childShapeIds: options?.childShapeIds ?? [],
                depth: options?.depth ?? 0,
                metadata: options?.metadata,
            });

            // If this shape has a parent, update parent's childShapeIds
            if (parentShapeId && options?.areaType) {
                this.store.addChildShapeId(parentShapeId, shapeData.id);
            }
        }

        // Create Konva rectangle
        // NOTE: dragBoundFunc is DISABLED - constraints are enforced via dragmove/dragend handlers
        // This is more reliable as dragBoundFunc has issues with pan/zoom coordinate transforms
        // The dragmove handler enforces constraints during drag, dragend finalizes position
        const rect = new Konva.Rect({
            id: shapeData.id,
            x: shapeData.x,
            y: shapeData.y,
            width: shapeData.width,
            height: shapeData.height,
            fill: shapeData.fill,
            stroke: shapeData.stroke,
            strokeWidth: shapeData.strokeWidth,
            draggable: true,
            // dragBoundFunc - DISABLED: Using dragmove/dragend for constraints instead
        });

        // DEBUG: Add mousedown handler to verify shape is receiving events
        rect.on('mousedown', () => {
            console.log('[mousedown] Shape clicked for drag:', {
                shapeId: id,
                draggable: rect.draggable(),
                listening: rect.listening(),
                position: { x: rect.x(), y: rect.y() },
            });
        });

        // Add dragmove handler for bounds enforcement as backup to dragBoundFunc
        // This handles edge cases where dragBoundFunc might not work correctly
        rect.on('dragmove', () => {
            if (!this.boundsService) return;

            const parentBounds = this.boundsService.getParentBounds(id);

            if (parentBounds) {
                const x = rect.x();
                const y = rect.y();
                const shapeWidth = rect.width() * rect.scaleX();
                const shapeHeight = rect.height() * rect.scaleY();

                // DEBUG: Log every dragmove with stage info
                const stagePos = this.stage.position();
                const stageScale = this.stage.scaleX();
                console.log('[dragmove] Shape position check:', {
                    shapeId: id,
                    currentPos: { x, y },
                    stagePosition: stagePos,
                    stageScale,
                    shapeSize: { width: shapeWidth, height: shapeHeight },
                    parentBounds,
                    constraints: {
                        minX: parentBounds.x,
                        minY: parentBounds.y,
                        maxX: parentBounds.x + parentBounds.width - shapeWidth,
                        maxY: parentBounds.y + parentBounds.height - shapeHeight,
                    },
                });

                const minX = parentBounds.x;
                const minY = parentBounds.y;
                const maxX = parentBounds.x + parentBounds.width - shapeWidth;
                const maxY = parentBounds.y + parentBounds.height - shapeHeight;

                const isOutside = x < minX || y < minY || x > maxX || y > maxY;

                if (isOutside) {
                    let constrainedX = Math.max(minX, Math.min(x, maxX));
                    let constrainedY = Math.max(minY, Math.min(y, maxY));

                    if (this.snapEnabled) {
                        constrainedX = Math.round(constrainedX / this.gridSize) * this.gridSize;
                        constrainedY = Math.round(constrainedY / this.gridSize) * this.gridSize;
                        constrainedX = Math.max(minX, Math.min(constrainedX, maxX));
                        constrainedY = Math.max(minY, Math.min(constrainedY, maxY));
                    }

                    rect.x(constrainedX);
                    rect.y(constrainedY);
                }
            }
        });

        // Add drag end handler to update shape data and store
        rect.on('dragend', () => {
            let newX = rect.x();
            let newY = rect.y();

            // CRITICAL: Enforce parent bounds constraint FIRST
            // This ensures shape stays within parent even if dragBoundFunc was bypassed
            if (this.boundsService) {
                const parentBounds = this.boundsService.getParentBounds(id);
                if (parentBounds) {
                    const shapeWidth = rect.width() * rect.scaleX();
                    const shapeHeight = rect.height() * rect.scaleY();

                    const minX = parentBounds.x;
                    const minY = parentBounds.y;
                    const maxX = parentBounds.x + parentBounds.width - shapeWidth;
                    const maxY = parentBounds.y + parentBounds.height - shapeHeight;

                    newX = Math.max(minX, Math.min(newX, maxX));
                    newY = Math.max(minY, Math.min(newY, maxY));
                }
            }

            // Then apply grid snapping
            if (this.snapEnabled) {
                const snappedX = Math.round(newX / this.gridSize) * this.gridSize;
                const snappedY = Math.round(newY / this.gridSize) * this.gridSize;
                newX = snappedX;
                newY = snappedY;

                // Re-constrain after snapping (snap might push outside bounds)
                if (this.boundsService) {
                    const parentBounds = this.boundsService.getParentBounds(id);
                    if (parentBounds) {
                        const shapeWidth = rect.width() * rect.scaleX();
                        const shapeHeight = rect.height() * rect.scaleY();

                        const minX = parentBounds.x;
                        const minY = parentBounds.y;
                        const maxX = parentBounds.x + parentBounds.width - shapeWidth;
                        const maxY = parentBounds.y + parentBounds.height - shapeHeight;

                        newX = Math.max(minX, Math.min(newX, maxX));
                        newY = Math.max(minY, Math.min(newY, maxY));
                    }
                }
            }

            // Update Konva node position if changed
            if (newX !== rect.x() || newY !== rect.y()) {
                rect.x(newX);
                rect.y(newY);
            }

            console.log('[ShapeManager] dragend', {
                shapeId: id,
                finalPosition: { x: newX, y: newY },
            });

            // Update local shape data
            shapeData.x = newX;
            shapeData.y = newY;

            // Update store if available
            if (this.store) {
                this.store.updateShape(id, { x: newX, y: newY });
            }
        });

        const konvaLayer = this.layerManager?.getKonvaLayer(layerId);

        if (!konvaLayer) {
            console.error(`Layer ${layerId} not found!`);
            throw new Error(`Layer ${layerId} not found`);
        }

        // Store shape with layer reference
        this.shapes.set(id, { data: shapeData, node: rect, layerId });

        // Add to the correct Konva layer
        konvaLayer.add(rect);
        konvaLayer.batchDraw();

        return shapeData;
    }

    // NOTE: dragBoundFunc has been REMOVED because it has coordinate system issues after pan/zoom.
    // Constraints are now enforced via dragmove/dragend handlers which work reliably
    // because they use world coordinates from the store (single source of truth).

    /**
     * Update shape dimensions (called during resize)
     */
    updateShapeDimensions(
        shapeId: string,
        dimensions: { x?: number; y?: number; width?: number; height?: number }
    ): void {
        const shape = this.shapes.get(shapeId);
        if (!shape) return;

        // Update local data
        if (dimensions.x !== undefined) shape.data.x = dimensions.x;
        if (dimensions.y !== undefined) shape.data.y = dimensions.y;
        if (dimensions.width !== undefined) shape.data.width = dimensions.width;
        if (dimensions.height !== undefined) shape.data.height = dimensions.height;

        // Update Konva node
        if (dimensions.x !== undefined) shape.node.x(dimensions.x);
        if (dimensions.y !== undefined) shape.node.y(dimensions.y);
        if (dimensions.width !== undefined) shape.node.width(dimensions.width);
        if (dimensions.height !== undefined) shape.node.height(dimensions.height);

        // Update store if available
        if (this.store) {
            this.store.updateShape(shapeId, dimensions);
        }

        // Redraw the shape's layer
        const konvaLayer = this.layerManager?.getKonvaLayer(shape.layerId);
        konvaLayer?.batchDraw();
    }

    /**
     * Get shape data by ID
     */
    getShape(shapeId: string): Shape | null {
        return this.shapes.get(shapeId)?.data || null;
    }

    /**
     * Get shape Konva node by ID
     */
    getShapeNode(shapeId: string): Konva.Shape | null {
        return this.shapes.get(shapeId)?.node || null;
    }

    /**
     * Get all shapes
     */
    getAllShapes(): Shape[] {
        return Array.from(this.shapes.values()).map(s => s.data);
    }

    /**
     * Get currently selected shape ID
     * Delegates to SelectionManager (single source of truth for selection)
     */
    getSelectedShapeId(): string | null {
        return this.selectionManager?.getSelectedShapeId() ?? null;
    }

    /**
     * Snap value to grid
     */
    snapToGrid(value: number): number {
        if (!this.snapEnabled) return value;
        return Math.round(value / this.gridSize) * this.gridSize;
    }

    /**
     * Update grid size (writes to store - single source of truth)
     */
    updateGridSize(size: number): void {
        if (this.store) {
            this.store.setGridSize(size);
        } else {
            this._fallbackGridSize = size;
        }
    }

    /**
     * Toggle snap to grid (writes to store - single source of truth)
     */
    toggleSnap(enabled: boolean): void {
        if (this.store) {
            this.store.setSnapEnabled(enabled);
        } else {
            this._fallbackSnapEnabled = enabled;
        }
    }

    /**
     * Delete a specific shape
     */
    deleteShape(shapeId: string): void {
        const shape = this.shapes.get(shapeId);
        if (!shape) return;

        // Destroy the Konva node
        shape.node.destroy();

        // Remove from local map
        this.shapes.delete(shapeId);

        // Remove from store if available
        if (this.store) {
            this.store.removeShape(shapeId);
        }

        // Deselect if this was the selected shape (delegate to SelectionManager)
        if (this.selectionManager?.getSelectedShapeId() === shapeId) {
            this.selectionManager.deselect();
        }

        // Redraw the shape's layer
        const konvaLayer = this.layerManager?.getKonvaLayer(shape.layerId);
        konvaLayer?.batchDraw();
    }

    /**
     * Enable or disable dragging for all shapes
     * Used to disable shape dragging when pan mode is active
     */
    setShapesDraggable(draggable: boolean): void {
        this.shapes.forEach(({ node }) => {
            node.draggable(draggable);
        });
    }

    /**
     * Set the parent shape ID for a shape
     * This updates the store so BoundsService can query live parent bounds
     */
    setParentShapeId(shapeId: string, parentShapeId: string | null): void {
        if (this.store) {
            this.store.updateShape(shapeId, { parentShapeId });
        }
    }

    /**
     * Validate and constrain all child shapes within their parent bounds
     * Call this after zoom changes to ensure shapes haven't escaped their containers
     *
     * @returns Array of shape IDs that were constrained (for label updates)
     */
    validateChildShapeBounds(): Array<{ shapeId: string; x: number; y: number; width: number; height: number }> {
        if (!this.boundsService || !this.store) return [];

        const layersToRedraw = new Set<string>();
        const constrainedShapes: Array<{ shapeId: string; x: number; y: number; width: number; height: number }> = [];

        this.shapes.forEach(({ data, node, layerId }, shapeId) => {
            // Only validate shapes that have a parent
            const storeShape = this.store!.getShape(shapeId);
            if (!storeShape?.parentShapeId) return;

            const parentBounds = this.boundsService!.getParentBounds(shapeId);
            if (!parentBounds) return;

            const shapeWidth = node.width() * node.scaleX();
            const shapeHeight = node.height() * node.scaleY();
            const currentX = node.x();
            const currentY = node.y();

            // Calculate constrained position
            const constrainedX = Math.max(
                parentBounds.x,
                Math.min(currentX, parentBounds.x + parentBounds.width - shapeWidth)
            );
            const constrainedY = Math.max(
                parentBounds.y,
                Math.min(currentY, parentBounds.y + parentBounds.height - shapeHeight)
            );

            // If position changed, update it
            if (constrainedX !== currentX || constrainedY !== currentY) {
                console.log(`[ShapeManager] Constraining shape ${shapeId} from (${currentX}, ${currentY}) to (${constrainedX}, ${constrainedY})`);

                // Update Konva node
                node.x(constrainedX);
                node.y(constrainedY);

                // Update local data
                data.x = constrainedX;
                data.y = constrainedY;

                // Update store
                this.store!.updateShape(shapeId, { x: constrainedX, y: constrainedY });

                layersToRedraw.add(layerId);

                // Track for label updates
                constrainedShapes.push({
                    shapeId,
                    x: constrainedX,
                    y: constrainedY,
                    width: shapeWidth,
                    height: shapeHeight,
                });
            }
        });

        // Redraw affected layers
        layersToRedraw.forEach(layerId => {
            const konvaLayer = this.layerManager?.getKonvaLayer(layerId);
            konvaLayer?.batchDraw();
        });

        return constrainedShapes;
    }

    /**
     * Clear all shapes
     */
    clear(): void {
        // Get unique layer IDs before clearing
        const layerIds = new Set(Array.from(this.shapes.values()).map(s => s.layerId));

        this.shapes.forEach(({ node }) => node.destroy());
        this.shapes.clear();

        // Clear selection via SelectionManager
        this.selectionManager?.deselect();

        // Redraw all affected layers
        layerIds.forEach(layerId => {
            const konvaLayer = this.layerManager?.getKonvaLayer(layerId);
            konvaLayer?.batchDraw();
        });
    }

    /**
     * Reinstantiate all Konva shape nodes after pan/zoom operations.
     * This completely rebuilds all shapes from the store (source of truth),
     * ensuring correct coordinate handling regardless of pan/zoom state.
     *
     * The method:
     * 1. Saves shape data from store (source of truth)
     * 2. Destroys all existing Konva nodes
     * 3. Recreates Konva nodes with WORLD coordinates from store
     * 4. Uses dragmove/dragend handlers for constraints (NOT dragBoundFunc)
     * 5. Sets draggable state based on options or preserves existing state
     *
     * IMPORTANT: This does NOT use dragBoundFunc because it has coordinate
     * system issues after pan/zoom. Instead, dragmove/dragend handlers
     * enforce constraints using world coordinates from the store.
     *
     * @param options - Optional configuration
     * @param options.forceDraggable - If provided, all shapes will have this draggable state
     * @param options.onStart - Callback when reinstantiation starts (for loading overlay)
     * @param options.onComplete - Callback when reinstantiation completes (for hiding overlay)
     * @returns Promise that resolves when reinstantiation is complete
     */
    async reinstantiateShapes(options?: {
        forceDraggable?: boolean;
        onStart?: () => void;
        onComplete?: () => void;
    }): Promise<void> {
        if (!this.store || !this.layerManager) {
            console.warn('[ShapeManager] Cannot reinstantiate: store or layerManager not available');
            return;
        }

        // Notify start of reinstantiation (for loading overlay)
        options?.onStart?.();

        console.log('[ShapeManager] Starting shape reinstantiation...', options);

        // Collect current state to preserve (query SelectionManager for selection)
        const selectedId = this.selectionManager?.getSelectedShapeId() ?? null;
        const shapeDraggableStates = new Map<string, boolean>();

        // Store draggable state for each shape before destroying (only if not forcing)
        if (options?.forceDraggable === undefined) {
            this.shapes.forEach(({ node }, shapeId) => {
                shapeDraggableStates.set(shapeId, node.draggable());
            });
        }

        // Get all shape data from store (source of truth - WORLD coordinates)
        const storeShapes: ShapeState[] = Array.from(this.store.state.shapes.values()) as ShapeState[];

        // Get unique layer IDs for redraw
        const layerIds = new Set(Array.from(this.shapes.values()).map(s => s.layerId));

        // Step 1: Destroy all existing Konva nodes
        this.shapes.forEach(({ node }) => {
            node.destroy();
        });
        this.shapes.clear();

        // Step 2: Recreate shapes from store data (WORLD coordinates)
        // Sort by zIndex to maintain proper ordering (parent shapes first)
        const sortedShapes = storeShapes.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

        for (const shapeData of sortedShapes) {
            const layerId = shapeData.layerId || this.layerManager.getCurrentLayer()?.id || 'layer_1';
            const konvaLayer = this.layerManager.getKonvaLayer(layerId);

            if (!konvaLayer) {
                console.warn(`[ShapeManager] Layer ${layerId} not found for shape ${shapeData.id}`);
                continue;
            }

            // Determine draggable state:
            // 1. If forceDraggable is provided, use it
            // 2. Otherwise, use preserved state or default to true
            const draggableState = options?.forceDraggable !== undefined
                ? options.forceDraggable
                : (shapeDraggableStates.get(shapeData.id) ?? true);

            // Create new Konva rectangle with WORLD coordinates from store
            // NOTE: NO dragBoundFunc - constraints are handled by dragmove/dragend
            const rect = new Konva.Rect({
                id: shapeData.id,
                x: shapeData.x,  // WORLD coordinate
                y: shapeData.y,  // WORLD coordinate
                width: shapeData.width,
                height: shapeData.height,
                fill: shapeData.fill,
                stroke: shapeData.stroke,
                strokeWidth: shapeData.strokeWidth,
                draggable: draggableState,
                // NO dragBoundFunc - it has coordinate issues after pan/zoom
            });

            // Capture shapeId for closure
            const shapeId = shapeData.id;

            // dragmove handler - constrain position during drag
            // Uses WORLD coordinates (shape coords match parent bounds from store)
            rect.on('dragmove', () => {
                if (!this.boundsService) return;

                const parentBounds = this.boundsService.getParentBounds(shapeId);

                if (parentBounds) {
                    // All coordinates are in WORLD space
                    const x = rect.x();
                    const y = rect.y();
                    const shapeWidth = rect.width() * rect.scaleX();
                    const shapeHeight = rect.height() * rect.scaleY();

                    const minX = parentBounds.x;
                    const minY = parentBounds.y;
                    const maxX = parentBounds.x + parentBounds.width - shapeWidth;
                    const maxY = parentBounds.y + parentBounds.height - shapeHeight;

                    const isOutside = x < minX || y < minY || x > maxX || y > maxY;

                    if (isOutside) {
                        let constrainedX = Math.max(minX, Math.min(x, maxX));
                        let constrainedY = Math.max(minY, Math.min(y, maxY));

                        if (this.snapEnabled) {
                            constrainedX = Math.round(constrainedX / this.gridSize) * this.gridSize;
                            constrainedY = Math.round(constrainedY / this.gridSize) * this.gridSize;
                            constrainedX = Math.max(minX, Math.min(constrainedX, maxX));
                            constrainedY = Math.max(minY, Math.min(constrainedY, maxY));
                        }

                        rect.x(constrainedX);
                        rect.y(constrainedY);
                    }
                }
                // Root shapes (no parent) have no constraints - they can exist anywhere
            });

            // dragend handler - finalize position and sync to store
            rect.on('dragend', () => {
                let newX = rect.x();
                let newY = rect.y();

                // Enforce parent bounds constraint
                if (this.boundsService) {
                    const parentBounds = this.boundsService.getParentBounds(shapeId);
                    if (parentBounds) {
                        const shapeWidth = rect.width() * rect.scaleX();
                        const shapeHeight = rect.height() * rect.scaleY();

                        const minX = parentBounds.x;
                        const minY = parentBounds.y;
                        const maxX = parentBounds.x + parentBounds.width - shapeWidth;
                        const maxY = parentBounds.y + parentBounds.height - shapeHeight;

                        newX = Math.max(minX, Math.min(newX, maxX));
                        newY = Math.max(minY, Math.min(newY, maxY));
                    }
                }

                // Apply grid snapping
                if (this.snapEnabled) {
                    newX = Math.round(newX / this.gridSize) * this.gridSize;
                    newY = Math.round(newY / this.gridSize) * this.gridSize;

                    // Re-constrain after snapping
                    if (this.boundsService) {
                        const parentBounds = this.boundsService.getParentBounds(shapeId);
                        if (parentBounds) {
                            const shapeWidth = rect.width() * rect.scaleX();
                            const shapeHeight = rect.height() * rect.scaleY();

                            const minX = parentBounds.x;
                            const minY = parentBounds.y;
                            const maxX = parentBounds.x + parentBounds.width - shapeWidth;
                            const maxY = parentBounds.y + parentBounds.height - shapeHeight;

                            newX = Math.max(minX, Math.min(newX, maxX));
                            newY = Math.max(minY, Math.min(newY, maxY));
                        }
                    }
                }

                // Update Konva node position if changed
                if (newX !== rect.x() || newY !== rect.y()) {
                    rect.x(newX);
                    rect.y(newY);
                }

                // Sync to store (source of truth)
                if (this.store) {
                    this.store.updateShape(shapeId, { x: newX, y: newY });
                }
            });

            // Store the recreated shape
            this.shapes.set(shapeData.id, {
                data: {
                    id: shapeData.id,
                    type: shapeData.type as 'rectangle',
                    x: shapeData.x,
                    y: shapeData.y,
                    width: shapeData.width,
                    height: shapeData.height,
                    fill: shapeData.fill,
                    stroke: shapeData.stroke,
                    strokeWidth: shapeData.strokeWidth,
                    label: shapeData.label || '',
                    zIndex: shapeData.zIndex || 0,
                },
                node: rect,
                layerId,
            });

            // Add to Konva layer
            konvaLayer.add(rect);
        }

        // Note: Selection state is preserved in SelectionManager
        console.log('[ShapeManager] Selection preserved:', selectedId);

        // Redraw all affected layers
        layerIds.forEach(layerId => {
            const konvaLayer = this.layerManager?.getKonvaLayer(layerId);
            konvaLayer?.batchDraw();
        });

        console.log(`[ShapeManager] Reinstantiation complete. ${sortedShapes.length} shapes recreated.`);

        // Notify completion (for hiding loading overlay)
        options?.onComplete?.();
    }

    // ==================== Area Methods (Unified Shape/Area Model) ====================

    /**
     * Create an area shape - a shape with semantic meaning in the hierarchy
     * This is a convenience method that wraps createRectangle with area semantics
     */
    createAreaShape(
        x: number,
        y: number,
        areaType: AreaType,
        options?: {
            id?: string;
            width?: number;
            height?: number;
            fill?: string;
            stroke?: string;
            strokeWidth?: number;
            label?: string;
            layerId?: string;
            parentShapeId?: string | null;
            depth?: number;
            metadata?: Record<string, unknown>;
        }
    ): RectangleShape {
        // Calculate depth based on parent if not provided
        let depth = options?.depth ?? 0;
        if (options?.parentShapeId && depth === 0 && this.store) {
            const parentShape = this.store.getShape(options.parentShapeId);
            if (parentShape) {
                depth = parentShape.depth + 1;
            }
        }

        return this.createRectangle(x, y, {
            ...options,
            areaType,
            depth,
            childShapeIds: [],
        });
    }

    /**
     * Get all area shapes (shapes with areaType set)
     */
    getAreaShapes(): Shape[] {
        if (!this.store) return [];
        return this.store.getAreaShapes().map(storeShape => {
            const localShape = this.shapes.get(storeShape.id);
            return localShape?.data || storeShape as unknown as Shape;
        });
    }

    /**
     * Get shapes by area type
     */
    getShapesByAreaType(areaType: AreaType): Shape[] {
        if (!this.store) return [];
        return this.store.getShapesByAreaType(areaType).map(storeShape => {
            const localShape = this.shapes.get(storeShape.id);
            return localShape?.data || storeShape as unknown as Shape;
        });
    }

    /**
     * Get child shapes of a parent shape
     */
    getChildShapes(parentShapeId: string): Shape[] {
        if (!this.store) return [];
        return this.store.getChildShapes(parentShapeId).map(storeShape => {
            const localShape = this.shapes.get(storeShape.id);
            return localShape?.data || storeShape as unknown as Shape;
        });
    }

    /**
     * Get the root shape (home area shape)
     */
    getRootShape(): Shape | null {
        if (!this.store) return null;
        const rootShapeId = this.store.getRootShapeId();
        if (!rootShapeId) return null;
        return this.getShape(rootShapeId);
    }

    /**
     * Set the root shape ID
     */
    setRootShapeId(shapeId: string | null): void {
        if (this.store) {
            this.store.setRootShapeId(shapeId);
        }
    }

    /**
     * Update area-specific properties of a shape
     */
    updateAreaProperties(
        shapeId: string,
        updates: {
            areaType?: AreaType | null;
            depth?: number;
            metadata?: Record<string, unknown>;
        }
    ): void {
        if (this.store) {
            this.store.updateShape(shapeId, updates);
        }
    }

    /**
     * Get shape's area type
     */
    getShapeAreaType(shapeId: string): AreaType | null {
        if (!this.store) return null;
        const shape = this.store.getShape(shapeId);
        return shape?.areaType ?? null;
    }

    /**
     * Check if a shape is an area shape
     */
    isAreaShape(shapeId: string): boolean {
        return this.getShapeAreaType(shapeId) !== null;
    }

    /**
     * Get shape depth in hierarchy
     */
    getShapeDepth(shapeId: string): number {
        if (!this.store) return 0;
        const shape = this.store.getShape(shapeId);
        return shape?.depth ?? 0;
    }
}
