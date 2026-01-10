<script setup lang="ts">
import Konva from 'konva';
import { ref, onMounted } from 'vue';
import type { Shape } from '@/Components/Grid/types/shapes';
import { GridManager } from '@/Components/Grid/core/GridManager';
// ==================== Props & Emits ====================
interface Props {
    gridSize: number;
    snapToGrid: boolean;
    scale: number;
}

interface Emits {
    (e: 'click', position: { x: number; y: number }): void;
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

    // Setup event handlers
    setupEventHandlers();
}

/**
 * Setup event handlers for the stage
 */
function setupEventHandlers(): void {
    if (!stage) return;

    // Click event - track click position
    stage.on('click', (e) => {
        const pointer = stage!.getPointerPosition();
        if (pointer) {
            // Emit the click position (world coordinates)
            emit('click', {
                x: pointer.x,
                y: pointer.y
            });
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
