<script setup lang="ts">
import { ref } from 'vue';
import { Head } from '@inertiajs/vue3';
import GridCanvas from '@/Components/Grid/GridCanvas.vue';
import DebugWidget from '@/Components/Grid/DebugWidget.vue';
import Toolbar from '@/Components/Grid/Toolbar.vue';
import { GRID_CONSTANTS } from '@/Components/Grid/types/constants';
import { DEFAULT_STEP, type Step } from '@/Components/Grid/types/steps';
import type { StepInfo, ToolbarAction } from '@/Components/Grid/types/orchestration';

const gridSize = GRID_CONSTANTS.DEFAULT_GRID_SIZE;

// Canvas ref
const canvasRef = ref<InstanceType<typeof GridCanvas> | null>(null);

// Debug state
const lastClickPosition = ref<{ x: number; y: number } | null>(null);

// Current step info
const currentStep = ref<Step>(DEFAULT_STEP);
const stepDescription = ref<string>('');
const stepActions = ref<ToolbarAction[]>([]);
const selectedShapeId = ref<string | null>(null);

// Zoom state
const currentZoom = ref<number>(1.0);

// Canvas dimensions for debug
const canvasWidth = ref<number>(0);
const canvasHeight = ref<number>(0);

// Pan mode state
const isPanMode = ref<boolean>(false);

// Handle canvas click
const handleCanvasClick = (position: { x: number; y: number }) => {
    lastClickPosition.value = position;
};

// Handle step changes from canvas
const handleStepChange = (stepInfo: StepInfo) => {
    currentStep.value = stepInfo.step;
    stepDescription.value = stepInfo.description;
    stepActions.value = stepInfo.actions;
    selectedShapeId.value = stepInfo.selectedShapeId || null;
};

// Handle zoom changes from canvas
const handleZoomChange = (zoom: number) => {
    currentZoom.value = zoom;
};

// Handle canvas resize for debug info
const handleCanvasResize = (width: number, height: number) => {
    canvasWidth.value = width;
    canvasHeight.value = height;
};

// Zoom control handlers
const handleZoomIn = () => {
    canvasRef.value?.zoomIn();
};

const handleZoomOut = () => {
    canvasRef.value?.zoomOut();
};

const handleResetZoom = () => {
    canvasRef.value?.resetZoom();
};

// Pan mode handlers
const handleTogglePan = () => {
    isPanMode.value = !isPanMode.value;
};

</script>

<template>

    <Head title="Grid Utility" />

    <div class="w-screen h-screen overflow-hidden bg-gray-100 relative">
        <!-- Toolbar - Shows current step and actions -->
        <Toolbar
            :current-step="currentStep"
            :description="stepDescription"
            :actions="stepActions"
            :current-zoom="currentZoom"
            :is-pan-mode="isPanMode"
            @zoom-in="handleZoomIn"
            @zoom-out="handleZoomOut"
            @reset-zoom="handleResetZoom"
            @toggle-pan="handleTogglePan"
        />

        <!-- Debug Widget - Only shows in development mode -->
        <DebugWidget
            :grid-size="gridSize"
            :last-click-position="lastClickPosition"
            :canvas-width="canvasWidth"
            :canvas-height="canvasHeight"
            :current-zoom="currentZoom"
            :selected-shape-id="selectedShapeId"
        />

        <!-- Main Canvas -->
        <GridCanvas
            ref="canvasRef"
            :grid-size="gridSize"
            :snap-to-grid="true"
            :scale="1"
            v-model:is-pan-mode="isPanMode"
            @click="handleCanvasClick"
            @step-change="handleStepChange"
            @zoom-change="handleZoomChange"
            @resize="handleCanvasResize"
        />
    </div>
</template>

<style scoped></style>
