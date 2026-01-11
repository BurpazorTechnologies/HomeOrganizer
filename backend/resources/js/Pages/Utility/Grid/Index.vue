<script setup lang="ts">
import { ref } from 'vue';
import { Head } from '@inertiajs/vue3';
import GridCanvas from '@/Components/Grid/GridCanvas.vue';
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
const pendingAreaName = ref<{ areaId: string; shapeId: string } | null>(null);
const selectedShapeName = ref<string | null>(null);

// Zoom state
const currentZoom = ref<number>(1.0);

// Canvas dimensions for debug
const canvasWidth = ref<number>(0);
const canvasHeight = ref<number>(0);

// Pan mode state
const isPanMode = ref<boolean>(false);

// Layer state
const layers = ref<any[]>([]);

// Saved data state
const savedData = ref<any>(null);

// Handle canvas click
const handleCanvasClick = (position: { x: number; y: number }) => {
    lastClickPosition.value = position;
};

// Handle layer changes from canvas
const handleLayerChange = (layersData: any[]) => {
    layers.value = layersData;
};

// Handle saved data changes from canvas
const handleSavedDataChange = (data: any) => {
    savedData.value = data;
};

// Parent area ID for Step 2+
const parentAreaId = ref<string | null>(null);

// Handle step changes from canvas
const handleStepChange = (stepInfo: StepInfo) => {
    currentStep.value = stepInfo.step;
    stepDescription.value = stepInfo.description;
    stepActions.value = stepInfo.actions;
    selectedShapeId.value = stepInfo.selectedShapeId || null;
    pendingAreaName.value = stepInfo.pendingAreaName || null;
    selectedShapeName.value = stepInfo.selectedShapeName || null;
    parentAreaId.value = stepInfo.parentAreaId || null;
};

// Handle area name save
const handleSaveAreaName = (payload: { areaId: string; name: string }) => {
    canvasRef.value?.saveAreaName(payload.areaId, payload.name);
};

// Handle shape label save
const handleSaveShapeLabel = (payload: { shapeId: string; label: string }) => {
    canvasRef.value?.saveShapeLabel(payload.shapeId, payload.label);
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

// Recenter handler
const handleRecenter = () => {
    canvasRef.value?.recenterToLayer();
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
            :pending-area-name="pendingAreaName"
            :selected-shape-id="selectedShapeId"
            :selected-shape-name="selectedShapeName"
            @zoom-in="handleZoomIn"
            @zoom-out="handleZoomOut"
            @reset-zoom="handleResetZoom"
            @toggle-pan="handleTogglePan"
            @recenter="handleRecenter"
            @save-area-name="handleSaveAreaName"
            @save-shape-label="handleSaveShapeLabel"
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
            @layer-change="handleLayerChange"
            @saved-data-change="handleSavedDataChange"
        />
    </div>
</template>

<style scoped></style>
