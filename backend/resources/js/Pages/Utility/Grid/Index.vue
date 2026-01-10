<script setup lang="ts">
import { ref } from 'vue';
import { Head } from '@inertiajs/vue3';
import GridCanvas from '@/Components/Grid/GridCanvas.vue';
import { GRID_CONSTANTS } from '@/Components/Grid/types/constants';

const gridSize = GRID_CONSTANTS.DEFAULT_GRID_SIZE;

// Canvas ref
const canvasRef = ref<InstanceType<typeof GridCanvas> | null>(null);

</script>

<template>

    <Head title="Grid Utility" />

    <div class="w-screen h-screen overflow-hidden bg-gray-100 relative">
        <GridCanvas ref="canvasRef" 
        :grid-size="gridSize"
        :scale="1"
        />
    </div>
</template>

<style scoped></style>
