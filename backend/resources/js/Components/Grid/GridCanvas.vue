<script setup lang="ts">
import Konva from 'konva';
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { GridManager } from '@/Components/Grid/core/GridManager';
import { ShapeManager } from '@/Components/Grid/core/ShapeManager';
import { TransformManager } from '@/Components/Grid/core/TransformManager';
import { LabelManager } from '@/Components/Grid/core/LabelManager';
import { StepOrchestrator } from '@/Components/Grid/core/StepOrchestrator';
import { ZoomManager } from '@/Components/Grid/core/ZoomManager';
import { LayerManager } from '@/Components/Grid/core/LayerManager';
import { EVENT_TIMING } from '@/Components/Grid/types/constants';
import type { StepInfo } from '@/Components/Grid/types/orchestration';
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
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const containerRef = ref<HTMLDivElement | null>(null);

// Konva instances
let stage: Konva.Stage | null = null;
let gridLayer: Konva.Layer | null = null;
let shapeLayer: Konva.Layer | null = null;

// Manager instances
let gridManager: GridManager | null = null;
let shapeManager: ShapeManager | null = null;
let transformManager: TransformManager | null = null;
let labelManager: LabelManager | null = null;
let zoomManager: ZoomManager | null = null;
let layerManager: LayerManager | null = null;

// Step orchestrator
let stepOrchestrator: StepOrchestrator | null = null;

// Wheel zoom throttle
let wheelTimeout: NodeJS.Timeout | null = null;

// Middle mouse button pan state
let isMiddleButtonPanActive = false;
let previousPanModeState = false;

function initializeCanvas(): void {
    if (!containerRef.value) {
        console.error('Container ref is not available');
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

    // Create layers
    gridLayer = new Konva.Layer();
    shapeLayer = new Konva.Layer();

    stage.add(gridLayer);
    stage.add(shapeLayer);

    // Initialize managers
    initializeManagers();
}

function initializeManagers(): void {
    if (!stage || !gridLayer || !shapeLayer) return;

    // Grid Manager
    gridManager = new GridManager(stage, gridLayer, {
        size: props.gridSize,
        snapEnabled: props.snapToGrid,
        visible: true,
    });

    gridManager?.redrawGrid();

    // Zoom Manager (initialize early so we can pass getZoomScale to other managers)
    zoomManager = new ZoomManager(stage);

    // Shape Manager - pass zoom scale getter for drag boundary calculation
    shapeManager = new ShapeManager(stage, shapeLayer, {
        gridSize: props.gridSize,
        snapEnabled: props.snapToGrid,
        getZoomScale: () => zoomManager?.getCurrentZoom() || 1.0,
    });

    // Transform Manager
    transformManager = new TransformManager(stage, shapeLayer, {
        gridSize: props.gridSize,
        snapEnabled: props.snapToGrid,
    });

    // Label Manager
    labelManager = new LabelManager(stage, shapeLayer);

    // Layer Manager
    layerManager = new LayerManager();

    // Listen to zoom changes and emit to parent
    zoomManager.onZoomChange((zoom) => {
        emit('zoomChange', zoom);
        // Redraw grid when zoom changes
        gridManager?.redrawGrid();
    });

    // Handle shape transforms
    transformManager.onTransform((shapeId, dimensions) => {
        shapeManager?.updateShapeDimensions(shapeId, dimensions);
        // Update label when shape is transformed
        labelManager?.updateLabel(shapeId, dimensions);
        // Notify step change (actions may update based on shape state)
        emitStepChange();
    });

    // Step Orchestrator - Initialize with all managers
    stepOrchestrator = new StepOrchestrator({
        shapeManager,
        transformManager,
        labelManager,
        gridManager,
        layerManager,
    });

    // Listen to step changes and emit to parent
    stepOrchestrator.onStepChange((stepInfo) => {
        emit('stepChange', stepInfo);
    });

    // Setup event handlers
    setupEventHandlers();

    // Emit initial step info
    emitStepChange();
    // Emit initial zoom level
    emit('zoomChange', zoomManager.getCurrentZoom());
    // Emit initial canvas size
    emit('resize', stage.width(), stage.height());
}

/**
 * Emit step change event to parent
 */
function emitStepChange(): void {
    if (!stepOrchestrator) return;
    const stepInfo = stepOrchestrator.getCurrentStepInfo();
    emit('stepChange', stepInfo);
}

/**
 * Setup event handlers for the stage
 */
function setupEventHandlers(): void {
    if (!stage || !stepOrchestrator || !shapeLayer) return;

    // Click event - delegate to step orchestrator
    stage.on('click', (e) => {
        const pointer = stage!.getPointerPosition();
        if (!pointer) return;

        // Emit the click position (world coordinates) for debug
        emit('click', {
            x: pointer.x,
            y: pointer.y
        });

        // Delegate to step orchestrator
        stepOrchestrator!.handleClick(e, stage!);
    });

    // Listen to drag events to update labels
    shapeLayer.on('dragend', (e) => {
        const target = e.target;
        if (target.getClassName() === 'Rect') {
            const shapeId = target.id();
            const shape = shapeManager!.getShape(shapeId);
            if (shape) {
                // Update label position after drag
                labelManager?.updateLabel(shapeId, {
                    x: shape.x,
                    y: shape.y,
                    width: shape.width,
                    height: shape.height,
                });
            }
            // Notify step change (to update toolbar if needed)
            emitStepChange();
        }
    });

    // Mouse wheel zoom with throttle
    stage.on('wheel', (e) => {
        e.evt.preventDefault();

        // Clear existing timeout
        if (wheelTimeout) {
            clearTimeout(wheelTimeout);
        }

        // Throttle wheel events
        wheelTimeout = setTimeout(() => {
            const delta = e.evt.deltaY;
            zoomManager?.zoomWheel(delta);
        }, EVENT_TIMING.WHEEL_THROTTLE);
    });

    // Middle mouse button pan - activate on hold
    stage.on('mousedown', (e) => {
        // Check if middle mouse button (button 1)
        if (e.evt.button === 1) {
            e.evt.preventDefault();

            // Store previous pan mode state
            previousPanModeState = props.isPanMode || false;

            // Activate temporary pan mode
            isMiddleButtonPanActive = true;
            stage!.draggable(true);

            // Emit to parent to update toolbar button state
            emit('update:isPanMode', true);
        }
    });

    // Middle mouse button pan - deactivate on release
    stage.on('mouseup', (e) => {
        // Check if middle mouse button (button 1)
        if (e.evt.button === 1 && isMiddleButtonPanActive) {
            e.evt.preventDefault();

            // Deactivate temporary pan mode
            isMiddleButtonPanActive = false;
            stage!.draggable(previousPanModeState);

            // Emit to parent to restore previous state
            emit('update:isPanMode', previousPanModeState);
        }
    });
}

// ==================== Window Resize Handler ====================
function handleWindowResize(): void {
    if (!stage || !containerRef.value) return;

    const newWidth = containerRef.value.offsetWidth;
    const newHeight = containerRef.value.offsetHeight;

    stage.width(newWidth);
    stage.height(newHeight);

    gridManager?.redrawGrid();

    // Emit resize event
    emit('resize', newWidth, newHeight);
}

// ==================== Public Methods (exposed to parent) ====================
/**
 * Zoom in
 */
function zoomIn(): boolean {
    return zoomManager?.zoomIn() || false;
}

/**
 * Zoom out
 */
function zoomOut(): boolean {
    return zoomManager?.zoomOut() || false;
}

/**
 * Reset zoom to default
 */
function resetZoom(): void {
    zoomManager?.resetZoom();
    // Refocus on selected shape after reset
    focusOnSelectedShape();
}

/**
 * Get current zoom level
 */
function getCurrentZoom(): number {
    return zoomManager?.getCurrentZoom() || 1.0;
}

/**
 * Focus on the currently selected shape (centers it in viewport)
 */
function focusOnSelectedShape(): void {
    if (!shapeManager || !zoomManager || !stepOrchestrator || !gridManager) return;

    // Get the selected shape ID from step orchestrator
    const stepInfo = stepOrchestrator.getCurrentStepInfo();
    const selectedShapeId = stepInfo.selectedShapeId;

    if (!selectedShapeId) return;

    // Get the shape data
    const shape = shapeManager.getShape(selectedShapeId);
    if (!shape) return;

    // Focus on the shape
    zoomManager.focusOnShape({
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
    });

    // Redraw grid to account for the new stage position
    gridManager.redrawGrid();
}

/**
 * Recenter to the current layer's primary shape
 * Used when user pans too far and needs to find their way back
 */
function recenterToLayer(): void {
    if (!shapeManager || !zoomManager || !layerManager || !gridManager) return;

    // Get the primary shape ID from current layer
    const primaryShapeId = layerManager.getCurrentPrimaryShapeId();
    if (!primaryShapeId) return;

    // Get the shape data
    const shape = shapeManager.getShape(primaryShapeId);
    if (!shape) return;

    // Focus on the primary shape
    zoomManager.focusOnShape({
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
    });

    // Redraw grid to account for the new stage position
    gridManager.redrawGrid();
}

// Expose methods to parent component
defineExpose({
    zoomIn,
    zoomOut,
    resetZoom,
    getCurrentZoom,
    focusOnSelectedShape,
    recenterToLayer,
});

// ==================== Watch Pan Mode ====================
watch(() => props.isPanMode, (newValue, oldValue) => {
    if (stage) {
        stage.draggable(newValue || false);
    }

    // Disable shape dragging when pan mode is active
    if (shapeManager) {
        shapeManager.setShapesDraggable(!newValue);
    }

    // When pan mode is disabled, refocus on selected shape
    if (oldValue === true && newValue === false) {
        focusOnSelectedShape();
    }
});

// ==================== Lifecycle Hooks ====================
onMounted(() => {
    initializeCanvas();
    window.addEventListener('resize', handleWindowResize);
});

onUnmounted(() => {
    // Clean up wheel timeout
    if (wheelTimeout) {
        clearTimeout(wheelTimeout);
    }
    window.removeEventListener('resize', handleWindowResize);
});
</script>

<template>
    <div ref="containerRef" class="w-full h-full bg-white">

    </div>
</template>

<style scoped></style>
