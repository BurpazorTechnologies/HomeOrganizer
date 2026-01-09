<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  snapToGrid: boolean;
  scale: number;
}

interface Emits {
  (e: 'update:snapToGrid', value: boolean): void;
  (e: 'addShape'): void;
  (e: 'zoomIn'): void;
  (e: 'zoomOut'): void;
  (e: 'resetView'): void;
  (e: 'deleteSelected'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const zoomPercentage = computed(() => Math.round(props.scale * 100));

const toggleSnap = () => {
  emit('update:snapToGrid', !props.snapToGrid);
};
</script>

<template>
  <div class="fixed top-4 left-4 bg-white shadow-lg rounded-lg p-4 z-50 flex flex-col gap-3">
    <div class="text-sm font-semibold text-gray-700 mb-2">Grid Controls</div>

    <!-- Add Shape Button -->
    <button
      @click="emit('addShape')"
      class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
      title="Add Rectangle (Ctrl+N)"
    >
      + Add Rectangle
    </button>

    <!-- Zoom Controls -->
    <div class="flex flex-col gap-2">
      <div class="text-xs text-gray-600 font-medium">Zoom: {{ zoomPercentage }}%</div>
      <div class="flex gap-2">
        <button
          @click="emit('zoomIn')"
          class="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors text-sm"
          title="Zoom In (+)"
        >
          +
        </button>
        <button
          @click="emit('zoomOut')"
          class="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors text-sm"
          title="Zoom Out (-)"
        >
          -
        </button>
      </div>
      <button
        @click="emit('resetView')"
        class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors text-xs"
        title="Reset View (Ctrl+0)"
      >
        Reset View
      </button>
    </div>

    <!-- Divider -->
    <div class="border-t border-gray-200"></div>

    <!-- Grid Snap Toggle -->
    <label class="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        :checked="snapToGrid"
        @change="toggleSnap"
        class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
      />
      <span class="text-sm text-gray-700">Snap to Grid</span>
    </label>

    <!-- Divider -->
    <div class="border-t border-gray-200"></div>

    <!-- Delete Button -->
    <button
      @click="emit('deleteSelected')"
      class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
      title="Delete Selected (Delete)"
    >
      Delete Selected
    </button>

    <!-- Keyboard Shortcuts Info -->
    <div class="mt-2 pt-2 border-t border-gray-200">
      <div class="text-xs text-gray-500 space-y-1">
        <div><kbd class="text-xs bg-gray-100 px-1 rounded">Delete</kbd> Remove</div>
        <div><kbd class="text-xs bg-gray-100 px-1 rounded">Esc</kbd> Deselect</div>
        <div><kbd class="text-xs bg-gray-100 px-1 rounded">+/-</kbd> Zoom</div>
        <div><kbd class="text-xs bg-gray-100 px-1 rounded">Drag</kbd> Pan</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
kbd {
  font-family: monospace;
}
</style>
