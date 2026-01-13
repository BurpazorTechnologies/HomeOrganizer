<script setup lang="ts">
/**
 * GridCanvas.vue
 *
 * Main canvas component that:
 * 1. Creates and sizes the Konva stage
 * 2. Initializes ManagerRegistry with dependencies
 * 3. Delegates event handling to EventManager (via ManagerRegistry)
 * 4. Emits events to parent (step changes, saves, etc.)
 *
 * Event handling is centralized in EventManager.
 * Debug concerns are available via DebugToolbar (can be used standalone or via GridCanvasWithDebug wrapper).
 */
import Konva from 'konva';
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { ManagerRegistry } from '@/Components/Grid/core/ManagerRegistry';
import type { StepInfo } from '@/Components/Grid/types/orchestration';
import DebugToolbar from '@/Components/Grid/debug/DebugToolbar.vue';
import { useDebugState } from '@/Components/Grid/debug/useDebugState';
import { localStorageService } from '@/Services/localStorage';

// ==================== Props & Emits ====================
interface Props {
    gridSize: number;
    snapToGrid: boolean;
    scale: number;
    isPanMode?: boolean;
}

interface Emits {
    (e: 'click', position: { x: number; y: number }): void;
    (e: 'stepChange', stepInfo: StepInfo): void;
    (e: 'zoomChange', zoom: number): void;
    (e: 'resize', width: number, height: number): void;
    (e: 'update:isPanMode', value: boolean): void;
    (e: 'layerChange', layers: any[]): void;
    (e: 'savedDataChange', savedData: any): void;
    (e: 'registryReady'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const containerRef = ref<HTMLDivElement | null>(null);

// Centralized manager registry - initialized once, provides type-safe access
let registry: ManagerRegistry | null = null;

// Debug state composable - provides aggregated state for DebugToolbar
// Subscribes to store for automatic updates, with manual refresh for Konva state
const { debugState, subscribeToStore, refresh: refreshDebugState } = useDebugState(() => registry);

// Konva stage reference (kept separate for direct access in watchers)
let stage: Konva.Stage | null = null;

// Debug toolbar state
const lastClickPosition = ref<{ x: number; y: number } | null>(null);
const savedData = ref<any>(null);

// ==================== Initialization ====================

function initializeCanvas(): void {
    if (!containerRef.value) {
        console.error('GridCanvas: Container ref is not available');
        return;
    }

    const width = containerRef.value.offsetWidth;
    const height = containerRef.value.offsetHeight;

    // Create Konva stage
    stage = new Konva.Stage({
        container: containerRef.value,
        width,
        height,
        draggable: props.isPanMode || false,
    });

    // Create grid layer
    const gridLayer = new Konva.Layer();
    stage.add(gridLayer);

    // Create and initialize manager registry
    registry = new ManagerRegistry({
        gridSize: props.gridSize,
        snapToGrid: props.snapToGrid,
        gridVisible: true,
    });

    // Set callbacks before initialization
    registry.setCallbacks({
        onZoomChange: (zoom) => {
            emit('zoomChange', zoom);
        },
        onStepChange: (stepInfo) => {
            emit('stepChange', stepInfo);
            emitLayerChange();
            emitSavedDataChange();
        },
        onDataChange: () => {
            emitSavedDataChange();
        },
        onTransform: () => {
            emitStepChange();
        },
        onZoomEnd: () => {
            // Ensure shapes are draggable after zoom (unless in pan mode)
            if (!props.isPanMode) {
                registry?.shapeManager.setShapesDraggable(true);
            }
        },
        onClick: (position) => {
            // Track last click position for debug toolbar
            lastClickPosition.value = position;
            emit('click', position);
        },
    });

    // Initialize all managers with EventManager callbacks
    // EventManager will handle all Konva events internally
    registry.initialize(stage, gridLayer, {
        getIsPanMode: () => props.isPanMode || false,
        setIsPanMode: (value: boolean) => emit('update:isPanMode', value),
        refreshDebugState: () => refreshDebugState(),
    });

    // Restore state from persistence
    registry.restoreState().then((restored) => {
        if (restored) {
            recenterToLayer();
        }
        emitStepChange();
        emitSavedDataChange();
    });

    // Subscribe debug state to store changes for automatic updates
    subscribeToStore();

    // Emit initial values
    emitStepChange();
    emit('zoomChange', registry.zoomManager.getCurrentZoom());
    emit('resize', stage.width(), stage.height());
    emit('registryReady');
}

// ==================== Event Emitters ====================

function emitStepChange(): void {
    if (!registry?.isInitialized) return;
    const stepInfo = registry.stepOrchestrator.getCurrentStepInfo();
    emit('stepChange', stepInfo);
    emitLayerChange();
    emitSavedDataChange();
}

function emitLayerChange(): void {
    if (!registry?.isInitialized) return;
    const layers = registry.layerManager.getAllLayers();
    emit('layerChange', layers);
}

async function emitSavedDataChange(): Promise<void> {
    if (!registry?.isInitialized) return;
    const data = await registry.persistenceManager.getCurrentData();
    savedData.value = data;
    emit('savedDataChange', data);
}

// ==================== Window Resize Handler ====================

function handleWindowResize(): void {
    if (!stage || !containerRef.value || !registry?.isInitialized) return;

    const newWidth = containerRef.value.offsetWidth;
    const newHeight = containerRef.value.offsetHeight;

    stage.width(newWidth);
    stage.height(newHeight);

    registry.gridManager.redrawGrid();
    emit('resize', newWidth, newHeight);
}

// ==================== Public Methods ====================

function zoomIn(): boolean {
    if (!registry?.isInitialized) return false;
    return registry.zoomManager.zoomIn();
}

function zoomOut(): boolean {
    if (!registry?.isInitialized) return false;
    return registry.zoomManager.zoomOut();
}

function resetZoom(): void {
    if (!registry?.isInitialized) return;
    registry.zoomManager.resetZoom();
    focusOnSelectedShape();
}

function getCurrentZoom(): number {
    if (!registry?.isInitialized) return 1.0;
    return registry.zoomManager.getCurrentZoom();
}

function focusOnSelectedShape(): void {
    if (!registry?.isInitialized) return;

    const stepInfo = registry.stepOrchestrator.getCurrentStepInfo();
    const selectedShapeId = stepInfo.selectedShapeId;
    if (!selectedShapeId) return;

    const shape = registry.shapeManager.getShape(selectedShapeId);
    if (!shape) return;

    registry.zoomManager.focusOnShape({
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
    });

    registry.gridManager.redrawGrid();
}

function recenterToLayer(): void {
    if (!registry?.isInitialized) return;

    const stepInfo = registry.stepOrchestrator.getCurrentStepInfo();
    const shapeIdToCenter = stepInfo.selectedShapeId || registry.layerManager.getCurrentPrimaryShapeId();

    if (!shapeIdToCenter) return;

    const shape = registry.shapeManager.getShape(shapeIdToCenter);
    if (!shape) return;

    registry.zoomManager.focusOnShape({
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
    });

    registry.gridManager.redrawGrid();
}

function saveAreaName(areaId: string, name: string): void {
    if (!registry?.isInitialized) return;
    registry.stepOrchestrator.saveAreaName(areaId, name);
}

function saveShapeLabel(shapeId: string, label: string): void {
    if (!registry?.isInitialized) return;
    registry.stepOrchestrator.saveShapeLabel(shapeId, label);
}

function getRegistry(): ManagerRegistry | null {
    return registry;
}

// Expose methods to parent component
defineExpose({
    zoomIn,
    zoomOut,
    resetZoom,
    getCurrentZoom,
    focusOnSelectedShape,
    recenterToLayer,
    saveAreaName,
    saveShapeLabel,
    getRegistry,
});

// ==================== Watchers ====================

watch(() => props.isPanMode, (newValue, oldValue) => {
    // Delegate pan mode changes to EventManager
    if (registry?.eventManager) {
        registry.eventManager.handlePanModeChange(newValue || false, oldValue || false);
    } else if (stage) {
        // Fallback if EventManager not available
        stage.draggable(newValue || false);
    }
});

// ==================== Lifecycle Hooks ====================

onMounted(() => {
    initializeCanvas();
    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('homeOrganizerDataChanged', handleLocalStorageChange);
    emitSavedDataChange();
});

onUnmounted(() => {
    window.removeEventListener('resize', handleWindowResize);
    window.removeEventListener('homeOrganizerDataChanged', handleLocalStorageChange);

    // Clean up registry (EventManager cleanup is handled internally)
    registry?.destroy();
    registry = null;
});

function handleLocalStorageChange(event: Event): void {
    const customEvent = event as CustomEvent;
    emit('savedDataChange', customEvent.detail);
}

// ==================== Debug Toolbar Handlers ====================

function handleDebugReset(): void {
    localStorageService.clear();
    window.location.reload();
}

function handleDebugClearMutations(): void {
    if (registry?.isInitialized) {
        registry.store.clearMutationHistory();
    }
}
</script>

<template>
    <div ref="containerRef" class="w-full h-full bg-white">
    </div>

    <!-- Debug Toolbar (dev mode only) -->
    <DebugToolbar
        :debug-state="debugState"
        :grid-size="gridSize"
        :last-click-position="lastClickPosition"
        :saved-data="savedData"
        @reset="handleDebugReset"
        @clear-mutations="handleDebugClearMutations"
        @refresh="refreshDebugState"
    />
</template>

<style scoped></style>
