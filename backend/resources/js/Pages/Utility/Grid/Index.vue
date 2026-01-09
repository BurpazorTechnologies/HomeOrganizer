<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Head } from '@inertiajs/vue3';
import GridCanvas from '@/Components/Grid/GridCanvas.vue';
import Toolbar from '@/Components/Grid/Toolbar.vue';

// Import modular grid system
import { ShapeFactory, GRID_CONSTANTS } from '@/Components/Grid';
import type { Shape } from '@/Components/Grid/types/shapes';

// State
const shapes = ref<Shape[]>([]);
const selectedShapeId = ref<string | null>(null);
const snapToGrid = ref(true);
const scale = ref(1);
const gridSize = GRID_CONSTANTS.DEFAULT_GRID_SIZE;

// Canvas ref
const canvasRef = ref<InstanceType<typeof GridCanvas> | null>(null);

// Add a new shape using the ShapeFactory
const addShape = () => {
  const newShape = ShapeFactory.createRectangleAtIndex(shapes.value.length);
  shapes.value.push(newShape);
};

// Zoom controls
const zoomIn = () => {
  const newScale = Math.min(scale.value * 1.2, 5);
  scale.value = newScale;
};

const zoomOut = () => {
  const newScale = Math.max(scale.value / 1.2, 0.1);
  scale.value = newScale;
};

const resetView = () => {
  canvasRef.value?.resetView();
};

const deleteSelected = () => {
  canvasRef.value?.deleteSelectedShape();
};

// Keyboard shortcuts
const handleKeydown = (e: KeyboardEvent) => {
  // Delete selected shape
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShapeId.value) {
    e.preventDefault();
    deleteSelected();
  }

  // Deselect
  if (e.key === 'Escape') {
    selectedShapeId.value = null;
  }

  // Zoom in
  if (e.key === '+' || e.key === '=') {
    e.preventDefault();
    zoomIn();
  }

  // Zoom out
  if (e.key === '-' || e.key === '_') {
    e.preventDefault();
    zoomOut();
  }

  // Reset view
  if (e.ctrlKey && e.key === '0') {
    e.preventDefault();
    resetView();
  }

  // Add shape
  if (e.ctrlKey && e.key === 'n') {
    e.preventDefault();
    addShape();
  }
};

// Lifecycle
onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <Head title="Grid Utility" />

  <div class="w-screen h-screen overflow-hidden bg-gray-100 relative">
    <!-- Page Title -->
    <div class="absolute top-4 right-4 bg-white shadow-lg rounded-lg px-4 py-2 z-50">
      <h1 class="text-lg font-bold text-gray-800">Grid Utility - Canvas Editor</h1>
      <p class="text-xs text-gray-600 mt-1">
        Shapes: {{ shapes.length }} | Selected: {{ selectedShapeId ? 'Yes' : 'None' }}
      </p>
    </div>

    <!-- Toolbar -->
    <Toolbar
      :snap-to-grid="snapToGrid"
      :scale="scale"
      @update:snap-to-grid="snapToGrid = $event"
      @add-shape="addShape"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @reset-view="resetView"
      @delete-selected="deleteSelected"
    />

    <!-- Canvas -->
    <GridCanvas
      ref="canvasRef"
      v-model:shapes="shapes"
      v-model:selected-shape-id="selectedShapeId"
      v-model:scale="scale"
      :grid-size="gridSize"
      :snap-to-grid="snapToGrid"
    />
  </div>
</template>

<style scoped>
/* Full screen canvas layout */
</style>
