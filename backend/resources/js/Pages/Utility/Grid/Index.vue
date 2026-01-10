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

// Handle canvas click
const handleCanvasClick = (position: { x: number; y: number }) => {
    lastClickPosition.value = position;
};

// Handle step changes from canvas
const handleStepChange = (stepInfo: StepInfo) => {
    currentStep.value = stepInfo.step;
    stepDescription.value = stepInfo.description;
    stepActions.value = stepInfo.actions;
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
        />

        <!-- Debug Widget - Only shows in development mode -->
        <DebugWidget
            :grid-size="gridSize"
            :last-click-position="lastClickPosition"
        />

        <!-- Main Canvas -->
        <GridCanvas
            ref="canvasRef"
            :grid-size="gridSize"
            :snap-to-grid="true"
            :scale="1"
            @click="handleCanvasClick"
            @step-change="handleStepChange"
        />
    </div>
</template>

<style scoped></style>
