<script setup lang="ts">
import Konva from 'konva';
import { ref, onMounted } from 'vue';
import { GridManager } from '@/Components/Grid/core/GridManager';
import { ShapeManager } from '@/Components/Grid/core/ShapeManager';
import { TransformManager } from '@/Components/Grid/core/TransformManager';
import { LabelManager } from '@/Components/Grid/core/LabelManager';
import { StepOrchestrator } from '@/Components/Grid/core/StepOrchestrator';
import type { StepInfo } from '@/Components/Grid/types/orchestration';
// ==================== Props & Emits ====================
interface Props {
    gridSize: number;
    snapToGrid: boolean;
    scale: number;
}

interface Emits {
    (e: 'click', position: { x: number; y: number }): void;
    (e: 'stepChange', stepInfo: StepInfo): void;
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

// Step orchestrator
let stepOrchestrator: StepOrchestrator | null = null;

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
        draggable: false,
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

    // Shape Manager
    shapeManager = new ShapeManager(stage, shapeLayer, {
        gridSize: props.gridSize,
        snapEnabled: props.snapToGrid,
    });

    // Transform Manager
    transformManager = new TransformManager(stage, shapeLayer, {
        gridSize: props.gridSize,
        snapEnabled: props.snapToGrid,
    });

    // Label Manager
    labelManager = new LabelManager(stage, shapeLayer);

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
    });

    // Listen to step changes and emit to parent
    stepOrchestrator.onStepChange((stepInfo) => {
        emit('stepChange', stepInfo);
    });

    // Setup event handlers
    setupEventHandlers();

    // Emit initial step info
    emitStepChange();
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
}

// ==================== Window Resize Handler ====================
function handleWindowResize(): void {
    if (!stage || !containerRef.value) return;

    stage.width(containerRef.value.offsetWidth);
    stage.height(containerRef.value.offsetHeight);

    gridManager?.redrawGrid();
}

// ==================== Lifecycle Hooks ====================
onMounted(() => {
    initializeCanvas();
    window.addEventListener('resize', handleWindowResize);
});
</script>

<template>
    <div ref="containerRef" class="w-full h-full bg-white">

    </div>
</template>

<style scoped></style>
