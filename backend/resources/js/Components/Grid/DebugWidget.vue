<script setup lang="ts">
/**
 * Debug Widget - Development Only
 *
 * Shows grid system information for debugging during development.
 * This component only renders when running in dev mode (npm run dev).
 */

interface Props {
  gridSize: number;
  lastClickPosition: { x: number; y: number } | null;
}

const props = defineProps<Props>();

// Check if we're in development mode
const isDev = import.meta.env.DEV;

// Calculate grid coordinates from pixel position
const getGridCoordinates = (pixelX: number, pixelY: number) => {
  return {
    gridX: Math.floor(pixelX / props.gridSize),
    gridY: Math.floor(pixelY / props.gridSize)
  };
};
</script>

<template>
  <!-- Only render in development mode -->
  <div v-if="isDev" class="fixed top-4 right-4 bg-white shadow-lg rounded-lg p-4 z-50 border border-gray-200">
    <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
      Debug Info
    </div>

    <div class="space-y-2">
      <!-- Grid Size -->
      <div class="flex items-center justify-between gap-4">
        <span class="text-sm text-gray-600">Grid Size:</span>
        <span class="text-sm font-mono font-semibold text-gray-900">{{ gridSize }}px</span>
      </div>

      <!-- Last Click Position -->
      <div class="pt-2 border-t border-gray-100">
        <div class="text-xs text-gray-500 mb-1">Last Click:</div>
        <div v-if="lastClickPosition" class="space-y-1">
          <div class="flex items-center justify-between gap-4">
            <span class="text-xs text-gray-600">X:</span>
            <span class="text-xs font-mono font-semibold text-blue-600">
              {{ getGridCoordinates(lastClickPosition.x, lastClickPosition.y).gridX }}
              <span class="text-gray-400">({{ Math.round(lastClickPosition.x) }}px)</span>
            </span>
          </div>
          <div class="flex items-center justify-between gap-4">
            <span class="text-xs text-gray-600">Y:</span>
            <span class="text-xs font-mono font-semibold text-blue-600">
              {{ getGridCoordinates(lastClickPosition.x, lastClickPosition.y).gridY }}
              <span class="text-gray-400">({{ Math.round(lastClickPosition.y) }}px)</span>
            </span>
          </div>
        </div>
        <div v-else class="text-xs text-gray-400 italic">
          Click on canvas...
        </div>
      </div>
    </div>

    <!-- Dev mode indicator -->
    <div class="mt-3 pt-3 border-t border-gray-200">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span class="text-xs text-gray-500">Development Mode</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ensure widget stays on top and doesn't interfere with canvas */
</style>
