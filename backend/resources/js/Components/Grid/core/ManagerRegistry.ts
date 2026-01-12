import Konva from 'konva';
import { GridManager } from '@/Components/Grid/core/GridManager';
import { ShapeManager } from '@/Components/Grid/core/ShapeManager';
import { TransformManager } from '@/Components/Grid/core/TransformManager';
import { LabelManager } from '@/Components/Grid/core/LabelManager';
import { ZoomManager } from '@/Components/Grid/core/ZoomManager';
import { LayerManager } from '@/Components/Grid/core/LayerManager';
import { AreaManager } from '@/Components/Grid/core/AreaManager';
import { PersistenceManager } from '@/Components/Grid/core/PersistenceManager';
import { SelectionManager } from '@/Components/Grid/core/SelectionManager';
import { StepOrchestrator } from '@/Components/Grid/core/StepOrchestrator';
import { EventManager } from '@/Components/Grid/core/EventManager';
import { createGridStateStore, type GridStateStore } from '@/Components/Grid/core/state/GridStateStore';
import { createBoundsService, type BoundsService } from '@/Components/Grid/core/services/BoundsService';

/**
 * ManagerRegistry
 *
 * Centralizes all manager initialization and provides type-safe access.
 * Ensures all required managers are initialized before use.
 *
 * Usage:
 * 1. Create registry with stage and config
 * 2. Call initialize() to create all managers
 * 3. Access managers via getters (throws if not initialized)
 */

export interface ManagerRegistryConfig {
  gridSize: number;
  snapToGrid: boolean;
  gridVisible?: boolean;
}

export interface ManagerRegistryCallbacks {
  onZoomChange?: (zoom: number) => void;
  onStepChange?: (stepInfo: any) => void;
  onDataChange?: () => void;
  onTransform?: (shapeId: string, dimensions: any) => void;
  onZoomEnd?: () => void; // Called after zoom completes - use for reinstantiation
  onClick?: (position: { x: number; y: number }) => void;
}

/**
 * EventManager callbacks provided by the component
 * These are wired up during initialization
 */
export interface EventManagerExternalCallbacks {
  getIsPanMode: () => boolean;
  setIsPanMode: (value: boolean) => void;
  refreshDebugState: () => void;
}

export class ManagerRegistry {
  private _stage: Konva.Stage | null = null;
  private _gridLayer: Konva.Layer | null = null;

  // Central state and services (NEW)
  private _store: GridStateStore | null = null;
  private _boundsService: BoundsService | null = null;

  // Manager instances
  private _gridManager: GridManager | null = null;
  private _shapeManager: ShapeManager | null = null;
  private _transformManager: TransformManager | null = null;
  private _labelManager: LabelManager | null = null;
  private _zoomManager: ZoomManager | null = null;
  private _layerManager: LayerManager | null = null;
  private _areaManager: AreaManager | null = null;
  private _persistenceManager: PersistenceManager | null = null;
  private _selectionManager: SelectionManager | null = null;
  private _stepOrchestrator: StepOrchestrator | null = null;
  private _eventManager: EventManager | null = null;

  private _isInitialized = false;
  private _eventManagerExternalCallbacks: EventManagerExternalCallbacks | null = null;
  private _config: ManagerRegistryConfig;
  private _callbacks: ManagerRegistryCallbacks = {};

  constructor(config: ManagerRegistryConfig) {
    this._config = config;
  }

  /**
   * Check if the registry has been initialized
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Initialize all managers with the given stage and grid layer
   * @param stage - Konva stage instance
   * @param gridLayer - Konva layer for grid
   * @param eventManagerCallbacks - Optional callbacks for EventManager (pan mode, debug refresh)
   * @throws Error if already initialized
   */
  initialize(
    stage: Konva.Stage,
    gridLayer: Konva.Layer,
    eventManagerCallbacks?: EventManagerExternalCallbacks
  ): void {
    if (this._isInitialized) {
      throw new Error('ManagerRegistry: Already initialized. Call destroy() first.');
    }

    this._stage = stage;
    this._gridLayer = gridLayer;
    this._eventManagerExternalCallbacks = eventManagerCallbacks || null;

    // Initialize in dependency order
    this._initializeManagers();
    this._wireUpCallbacks();
    this._isInitialized = true;
  }

  /**
   * Set callbacks before or after initialization
   */
  setCallbacks(callbacks: ManagerRegistryCallbacks): void {
    this._callbacks = { ...this._callbacks, ...callbacks };

    // If already initialized, wire up the new callbacks
    if (this._isInitialized) {
      this._wireUpCallbacks();
    }
  }

  /**
   * Initialize all managers in dependency order
   */
  private _initializeManagers(): void {
    if (!this._stage || !this._gridLayer) {
      throw new Error('ManagerRegistry: Stage and gridLayer are required');
    }

    // 0. Create central state store FIRST (foundation for everything)
    this._store = createGridStateStore();

    // Initialize store with config values
    this._store.setGridConfig({
      gridSize: this._config.gridSize,
      snapEnabled: this._config.snapToGrid,
      gridVisible: this._config.gridVisible ?? true,
    });

    // 1. Grid Manager - depends on store for grid config
    this._gridManager = new GridManager(this._stage, this._gridLayer, {
      size: this._config.gridSize,
      snapEnabled: this._config.snapToGrid,
      visible: this._config.gridVisible ?? true,
    });
    this._gridManager.setStore(this._store);
    this._gridManager.redrawGrid();

    // 2. Zoom Manager - depends on stage and store
    this._zoomManager = new ZoomManager(this._stage, {
      store: this._store,
    });

    // 3. Create BoundsService - depends on store and zoom
    // Now reads gridConfig from store instead of local config
    this._boundsService = createBoundsService(this._store, {
      getZoomScale: () => this._zoomManager?.getCurrentZoom() || 1.0,
      getGridSize: () => this._store?.state.gridConfig.gridSize ?? this._config.gridSize,
      getSnapEnabled: () => this._store?.state.gridConfig.snapEnabled ?? this._config.snapToGrid,
    });

    // Update canvas bounds from stage
    this._boundsService.updateCanvasFromStage(this._stage.width(), this._stage.height());

    // 4. Layer Manager - depends on stage, store
    this._layerManager = new LayerManager(this._stage);
    this._layerManager.setStore(this._store);

    // 5. Shape Manager - depends on stage, zoom manager, store, boundsService
    this._shapeManager = new ShapeManager(this._stage, {
      gridSize: this._config.gridSize,
      snapEnabled: this._config.snapToGrid,
      getZoomScale: () => this._zoomManager?.getCurrentZoom() || 1.0,
      store: this._store,
      boundsService: this._boundsService,
    });
    this._shapeManager.setLayerManager(this._layerManager);

    // 6. Area Manager - depends on store
    this._areaManager = new AreaManager();
    this._areaManager.setStore(this._store);

    // 7. Transform Manager - depends on stage, layer manager, boundsService, store
    const transformOverlayLayer = this._layerManager.getTransformOverlayLayer();
    this._transformManager = new TransformManager(this._stage, transformOverlayLayer, {
      gridSize: this._config.gridSize,
      snapEnabled: this._config.snapToGrid,
      boundsService: this._boundsService,
      store: this._store,
    });

    // 8. Label Manager - depends on layer manager
    this._labelManager = new LabelManager(this._layerManager);

    // 9. Selection Manager - depends on shape manager, transform manager, store
    this._selectionManager = new SelectionManager();
    this._selectionManager.setStore(this._store);
    this._selectionManager.setManagers({
      shapeManager: this._shapeManager,
      transformManager: this._transformManager,
    });

    // Wire ShapeManager to SelectionManager (for selection queries)
    this._shapeManager.setSelectionManager(this._selectionManager);

    // 10. Persistence Manager - depends on shape, layer, area, label managers, store
    this._persistenceManager = new PersistenceManager();
    this._persistenceManager.setManagers({
      shapeManager: this._shapeManager,
      layerManager: this._layerManager,
      areaManager: this._areaManager,
      labelManager: this._labelManager,
    });
    this._persistenceManager.setStore(this._store);

    // 11. Step Orchestrator - depends on all managers
    this._stepOrchestrator = new StepOrchestrator({
      shapeManager: this._shapeManager,
      transformManager: this._transformManager,
      labelManager: this._labelManager,
      gridManager: this._gridManager,
      layerManager: this._layerManager,
      areaManager: this._areaManager,
      selectionManager: this._selectionManager,
      zoomManager: this._zoomManager,
      persistenceManager: this._persistenceManager,
      boundsService: this._boundsService,
    });

    // 12. Event Manager - centralizes all Konva event handling
    // Only initialize if external callbacks are provided
    if (this._eventManagerExternalCallbacks) {
      this._eventManager = new EventManager(
        this._stage,
        this._store,
        {
          // Zoom callbacks
          onZoomWheel: (delta) => {
            this._zoomManager?.zoomWheel(delta);
          },
          onZoomEnd: () => {
            this._callbacks.onZoomEnd?.();
          },

          // Pan callbacks
          onPanStart: () => {
            this._shapeManager?.setShapesDraggable(false);
          },
          onPanEnd: async (newPan, isPanMode) => {
            await this._stepOrchestrator?.handlePanEnd(newPan, isPanMode);
          },
          onPanModeExit: async (currentPan) => {
            await this._stepOrchestrator?.handlePanModeExit(currentPan);
          },

          // Click callbacks
          onClick: (e, position) => {
            this._callbacks.onClick?.(position);
            this._stepOrchestrator?.handleClick(e, this._stage!);
          },

          // Shape drag callbacks
          onShapeDragStart: (_shapeId) => {
            // Shape drag start is handled by the event manager acquiring the lock
          },
          onShapeDragEnd: (shapeId) => {
            const shape = this._shapeManager?.getShape(shapeId);
            if (shape) {
              this._labelManager?.updateLabel(shapeId, {
                x: shape.x,
                y: shape.y,
                width: shape.width,
                height: shape.height,
              });
            }
            // Emit step change to update UI
            if (this._callbacks.onStepChange && this._stepOrchestrator) {
              const stepInfo = this._stepOrchestrator.getCurrentStepInfo();
              this._callbacks.onStepChange(stepInfo);
            }
          },

          // External callbacks from component
          getIsPanMode: this._eventManagerExternalCallbacks.getIsPanMode,
          setIsPanMode: this._eventManagerExternalCallbacks.setIsPanMode,
          refreshDebugState: this._eventManagerExternalCallbacks.refreshDebugState,
        }
      );

      // Initialize event bindings
      this._eventManager.initialize();
    }
  }

  /**
   * Wire up callbacks to managers
   */
  private _wireUpCallbacks(): void {
    // Zoom changes - ALWAYS set up internal handlers, even if no external callback
    if (this._zoomManager) {
      this._zoomManager.onZoomChange((zoom) => {
        // External callback
        this._callbacks.onZoomChange?.(zoom);

        // Redraw grid
        this._gridManager?.redrawGrid();

        // CRITICAL: Validate child shapes are within parent bounds after zoom
        // This prevents shapes from "escaping" their containers during zoom
        const constrainedShapes = this._shapeManager?.validateChildShapeBounds() || [];

        // Update labels for any shapes that were constrained
        constrainedShapes.forEach(({ shapeId, x, y, width, height }) => {
          this._labelManager?.updateLabel(shapeId, { x, y, width, height });
        });

        // Call zoom end callback - use for reinstantiation
        this._callbacks.onZoomEnd?.();
      });
    }

    // Step changes
    if (this._callbacks.onStepChange && this._stepOrchestrator) {
      this._stepOrchestrator.onStepChange((stepInfo) => {
        this._callbacks.onStepChange?.(stepInfo);
      });
    }

    // Persistence data changes
    if (this._callbacks.onDataChange && this._persistenceManager) {
      this._persistenceManager.onDataChange(() => {
        this._callbacks.onDataChange?.();
      });
    }

    // Transform changes
    if (this._callbacks.onTransform && this._transformManager && this._shapeManager && this._labelManager) {
      this._transformManager.onTransform((shapeId, dimensions) => {
        this._shapeManager?.updateShapeDimensions(shapeId, dimensions);
        this._labelManager?.updateLabel(shapeId, dimensions);
        this._callbacks.onTransform?.(shapeId, dimensions);
      });
    }
  }

  // ==================== Type-safe Getters ====================
  // These throw if accessed before initialization

  private _assertInitialized(): void {
    if (!this._isInitialized) {
      throw new Error('ManagerRegistry: Not initialized. Call initialize() first.');
    }
  }

  get stage(): Konva.Stage {
    this._assertInitialized();
    return this._stage!;
  }

  get gridLayer(): Konva.Layer {
    this._assertInitialized();
    return this._gridLayer!;
  }

  get gridManager(): GridManager {
    this._assertInitialized();
    return this._gridManager!;
  }

  get shapeManager(): ShapeManager {
    this._assertInitialized();
    return this._shapeManager!;
  }

  get transformManager(): TransformManager {
    this._assertInitialized();
    return this._transformManager!;
  }

  get labelManager(): LabelManager {
    this._assertInitialized();
    return this._labelManager!;
  }

  get zoomManager(): ZoomManager {
    this._assertInitialized();
    return this._zoomManager!;
  }

  get layerManager(): LayerManager {
    this._assertInitialized();
    return this._layerManager!;
  }

  get areaManager(): AreaManager {
    this._assertInitialized();
    return this._areaManager!;
  }

  get persistenceManager(): PersistenceManager {
    this._assertInitialized();
    return this._persistenceManager!;
  }

  get selectionManager(): SelectionManager {
    this._assertInitialized();
    return this._selectionManager!;
  }

  get stepOrchestrator(): StepOrchestrator {
    this._assertInitialized();
    return this._stepOrchestrator!;
  }

  get store(): GridStateStore {
    this._assertInitialized();
    return this._store!;
  }

  get boundsService(): BoundsService {
    this._assertInitialized();
    return this._boundsService!;
  }

  get eventManager(): EventManager | null {
    this._assertInitialized();
    return this._eventManager;
  }

  // ==================== Utility Methods ====================

  /**
   * Restore state from persistence
   */
  async restoreState(): Promise<boolean> {
    this._assertInitialized();
    const restored = await this._stepOrchestrator!.restoreState();

    // CRITICAL: After restoration, validate child shapes are within parent bounds
    // This handles cases where saved data might have shapes at invalid positions
    if (restored) {
      const constrainedShapes = this._shapeManager!.validateChildShapeBounds() || [];
      constrainedShapes.forEach(({ shapeId, x, y, width, height }) => {
        this._labelManager?.updateLabel(shapeId, { x, y, width, height });
      });
    }

    return restored;
  }

  /**
   * Destroy all managers and reset state
   */
  destroy(): void {
    // Clear managers in reverse order
    this._eventManager?.destroy();
    this._eventManager = null;
    this._stepOrchestrator = null;
    this._persistenceManager = null;
    this._selectionManager = null;
    this._labelManager = null;
    this._transformManager = null;
    this._areaManager = null;
    this._shapeManager = null;
    this._layerManager?.clear();
    this._layerManager = null;
    this._zoomManager = null;
    this._gridManager = null;

    // Clear central state and services
    this._store?.clear();
    this._store = null;
    this._boundsService = null;

    this._stage = null;
    this._gridLayer = null;
    this._eventManagerExternalCallbacks = null;
    this._isInitialized = false;
  }
}
