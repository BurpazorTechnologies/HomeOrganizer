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

  private _isInitialized = false;
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
   * @throws Error if already initialized
   */
  initialize(stage: Konva.Stage, gridLayer: Konva.Layer): void {
    if (this._isInitialized) {
      throw new Error('ManagerRegistry: Already initialized. Call destroy() first.');
    }

    this._stage = stage;
    this._gridLayer = gridLayer;

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

    // 1. Grid Manager - no dependencies
    this._gridManager = new GridManager(this._stage, this._gridLayer, {
      size: this._config.gridSize,
      snapEnabled: this._config.snapToGrid,
      visible: this._config.gridVisible ?? true,
    });
    this._gridManager.redrawGrid();

    // 2. Zoom Manager - depends on stage
    this._zoomManager = new ZoomManager(this._stage);

    // 3. Create BoundsService - depends on store and zoom
    this._boundsService = createBoundsService(this._store, {
      getZoomScale: () => this._zoomManager?.getCurrentZoom() || 1.0,
      getGridSize: () => this._config.gridSize,
      getSnapEnabled: () => this._config.snapToGrid,
    });

    // Update canvas bounds from stage
    this._boundsService.updateCanvasFromStage(this._stage.width(), this._stage.height());

    // 4. Layer Manager - depends on stage
    this._layerManager = new LayerManager(this._stage);

    // 5. Shape Manager - depends on stage, zoom manager, store, boundsService
    this._shapeManager = new ShapeManager(this._stage, {
      gridSize: this._config.gridSize,
      snapEnabled: this._config.snapToGrid,
      getZoomScale: () => this._zoomManager?.getCurrentZoom() || 1.0,
      store: this._store,
      boundsService: this._boundsService,
    });
    this._shapeManager.setLayerManager(this._layerManager);

    // 6. Area Manager - no dependencies
    this._areaManager = new AreaManager();

    // 7. Transform Manager - depends on stage, layer manager, boundsService
    const transformOverlayLayer = this._layerManager.getTransformOverlayLayer();
    this._transformManager = new TransformManager(this._stage, transformOverlayLayer, {
      gridSize: this._config.gridSize,
      snapEnabled: this._config.snapToGrid,
      boundsService: this._boundsService,
    });

    // 8. Label Manager - depends on layer manager
    this._labelManager = new LabelManager(this._layerManager);

    // 9. Selection Manager - depends on shape manager, transform manager
    this._selectionManager = new SelectionManager();
    this._selectionManager.setManagers({
      shapeManager: this._shapeManager,
      transformManager: this._transformManager,
    });

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
      persistenceManager: this._persistenceManager,
      boundsService: this._boundsService,
    });
  }

  /**
   * Wire up callbacks to managers
   */
  private _wireUpCallbacks(): void {
    // Zoom changes
    if (this._callbacks.onZoomChange && this._zoomManager) {
      this._zoomManager.onZoomChange((zoom) => {
        this._callbacks.onZoomChange?.(zoom);
        this._gridManager?.redrawGrid();
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

  // ==================== Utility Methods ====================

  /**
   * Restore state from persistence
   */
  async restoreState(): Promise<boolean> {
    this._assertInitialized();
    return this._stepOrchestrator!.restoreState();
  }

  /**
   * Destroy all managers and reset state
   */
  destroy(): void {
    // Clear managers in reverse order
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
    this._isInitialized = false;
  }
}
