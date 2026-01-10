<script setup lang="ts">
import { ref } from 'vue';
import { Head } from '@inertiajs/vue3';
import GridCanvas from '@/Components/Grid/GridCanvas.vue';
import DebugWidget from '@/Components/Grid/DebugWidget.vue';
import { GRID_CONSTANTS } from '@/Components/Grid/types/constants';

const gridSize = GRID_CONSTANTS.DEFAULT_GRID_SIZE;

// Canvas ref
const canvasRef = ref<InstanceType<typeof GridCanvas> | null>(null);

// Debug state
const lastClickPosition = ref<{ x: number; y: number } | null>(null);

// Handle canvas click
const handleCanvasClick = (position: { x: number; y: number }) => {
    lastClickPosition.value = position;
};

</script>

<template>

    <Head title="Grid Utility" />

    <div class="w-screen h-screen overflow-hidden bg-gray-100 relative">
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
        />
    </div>
</template>

<style scoped></style>
