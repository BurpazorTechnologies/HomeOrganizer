<script setup lang="ts">
/**
 * Debug Widget - Development Only
 *
 * Shows grid system information for debugging during development.
 * This component only renders when running in dev mode (npm run dev).
 */
import { ref, computed } from 'vue';
import { localStorageService } from '@/Services/localStorage';

interface Props {
  gridSize: number;
  lastClickPosition: { x: number; y: number } | null;
  canvasWidth?: number;
  canvasHeight?: number;
  currentZoom?: number;
  selectedShapeId?: string | null;
  layers?: any[];
  savedData?: any; // Saved data from localStorage
  currentStep?: number; // Current step number
  parentAreaId?: string | null; // Current parent area (for Step 2+)
}

const props = defineProps<Props>();

// Check if we're in development mode
const isDev = import.meta.env.DEV;

// Collapse state
const isCollapsed = ref(false);

// Layer child node collapse state - track which layers have collapsed children
const layerChildrenCollapsed = ref<Record<string, boolean>>({});

// Saved data collapse state
const savedDataCollapsed = ref(false);

/**
 * Toggle collapse state
 */
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

/**
 * Toggle layer children collapse state
 */
const toggleLayerChildren = (layerId: string) => {
  layerChildrenCollapsed.value[layerId] = !layerChildrenCollapsed.value[layerId];
};

/**
 * Toggle saved data collapse state
 */
const toggleSavedData = () => {
  savedDataCollapsed.value = !savedDataCollapsed.value;
};

/**
 * Format JSON with proper indentation
 */
const formatJSON = (obj: any): string => {
  if (!obj) return '{}';
  return JSON.stringify(obj, null, 2);
};

/**
 * Get filtered localStorage data based on current context
 * - Shows empty if no shapes exist globally
 * - Shows only relevant data for current step/selection
 */
const getFilteredSavedData = computed(() => {
  const data = props.savedData;

  // If no data at all, show empty
  if (!data) {
    return null;
  }

  // Check if there are any shapes globally
  const hasHomeArea = data.homeArea?.shapes?.length > 0;
  const hasChildAreas = data.childAreas && Object.keys(data.childAreas).length > 0;

  if (!hasHomeArea && !hasChildAreas) {
    return null;
  }

  // Build filtered view based on current step
  const currentStep = props.currentStep || 1;
  const filtered: any = {
    currentStep,
    lastUpdated: data.lastUpdated,
  };

  // Step 1: Show home area data
  if (currentStep === 1 && data.homeArea) {
    filtered.homeArea = data.homeArea;
  }

  // Step 2+: Show child areas for current parent
  if (currentStep >= 2 && props.parentAreaId) {
    filtered.parentAreaId = props.parentAreaId;
    if (data.childAreas?.[props.parentAreaId]) {
      filtered.childAreas = {
        [props.parentAreaId]: data.childAreas[props.parentAreaId]
      };
    }
  }

  // If a specific shape is selected, show that shape's data
  if (props.selectedShapeId) {
    // Find the shape in home area
    if (data.homeArea?.shapes) {
      const homeShape = data.homeArea.shapes.find((s: any) => s.id === props.selectedShapeId);
      if (homeShape) {
        filtered.selectedShape = homeShape;
      }
    }

    // Find the shape in child areas
    if (data.childAreas) {
      for (const parentId of Object.keys(data.childAreas)) {
        const childArea = data.childAreas[parentId];
        const childShape = childArea.shapes?.find((s: any) => s.id === props.selectedShapeId);
        if (childShape) {
          filtered.selectedShape = childShape;
          filtered.selectedShapeParent = parentId;
          break;
        }
      }
    }
  }

  return filtered;
});

// Calculate grid coordinates from pixel position
const getGridCoordinates = (pixelX: number, pixelY: number) => {
  return {
    gridX: Math.floor(pixelX / props.gridSize),
    gridY: Math.floor(pixelY / props.gridSize)
  };
};

// Calculate grid area dimensions
const getGridAreaDimensions = () => {
  if (!props.canvasWidth || !props.canvasHeight) {
    return null;
  }

  const zoom = props.currentZoom || 1.0;

  // Adjust for zoom - when zoomed out, visible area is larger
  const visibleWidth = props.canvasWidth / zoom;
  const visibleHeight = props.canvasHeight / zoom;

  const gridSquaresX = Math.floor(visibleWidth / props.gridSize);
  const gridSquaresY = Math.floor(visibleHeight / props.gridSize);

  return {
    squaresX: gridSquaresX,
    squaresY: gridSquaresY,
    pixelsX: Math.round(visibleWidth),
    pixelsY: Math.round(visibleHeight),
  };
};
</script>

<template>
  <!-- Only render in development mode -->
  <div v-if="isDev" class="fixed top-2 right-2 bg-white shadow-md rounded z-50 border border-gray-200 transition-all duration-200"
       :class="isCollapsed ? 'p-1' : 'p-2'">
    <!-- Header with collapse button -->
    <div class="flex items-center justify-between gap-2 mb-1">
      <div class="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
        Debug Info
      </div>
      <button
        @click="toggleCollapse"
        class="text-gray-400 hover:text-gray-600 transition-colors"
        :title="isCollapsed ? 'Expand' : 'Collapse'"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-3 w-3 transition-transform duration-200"
          :class="{ 'rotate-180': isCollapsed }"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>

    <!-- Collapsible content -->
    <div v-show="!isCollapsed">
      <div class="space-y-1.5">
        <!-- Grid Size -->
        <div class="flex items-center justify-between gap-3">
          <span class="text-[10px] text-gray-600">Grid Size:</span>
          <span class="text-[10px] font-mono font-semibold text-gray-900">{{ gridSize }}px</span>
        </div>

        <!-- Selected Shape ID -->
        <div class="pt-1.5 border-t border-gray-100">
          <div class="text-[10px] text-gray-500 mb-0.5">Selected Shape:</div>
          <div v-if="selectedShapeId" class="text-[10px] font-mono font-semibold text-purple-600 break-all">
            {{ selectedShapeId }}
          </div>
          <div v-else class="text-[10px] text-gray-400 italic">
            No shape selected
          </div>
        </div>

        <!-- Grid Area Dimensions -->
        <div v-if="getGridAreaDimensions()" class="pt-1.5 border-t border-gray-100">
          <div class="text-[10px] text-gray-500 mb-0.5">Visible Grid Area:</div>
          <div class="space-y-0.5">
            <div class="flex items-center justify-between gap-3">
              <span class="text-[10px] text-gray-600">Width:</span>
              <span class="text-[10px] font-mono font-semibold text-green-600">
                {{ getGridAreaDimensions()?.squaresX }} squares
                <span class="text-gray-400">({{ getGridAreaDimensions()?.pixelsX }}px)</span>
              </span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-[10px] text-gray-600">Height:</span>
              <span class="text-[10px] font-mono font-semibold text-green-600">
                {{ getGridAreaDimensions()?.squaresY }} squares
                <span class="text-gray-400">({{ getGridAreaDimensions()?.pixelsY }}px)</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Layers -->
        <div v-if="layers && layers.length > 0" class="pt-1.5 border-t border-gray-100">
          <div class="text-[10px] text-gray-500 mb-0.5">Layers:</div>
          <div class="space-y-1">
            <div v-for="layer in layers" :key="layer.id" class="text-[10px]">
              <!-- Layer header (always visible) -->
              <div class="font-semibold text-orange-600">
                Layer {{ layer.order }}: {{ layer.label }}
              </div>

              <!-- Child nodes (collapsible) -->
              <div v-if="layer.shapeIds && layer.shapeIds.length > 0" class="ml-2 mt-0.5">
                <button
                  @click="toggleLayerChildren(layer.id)"
                  class="text-[9px] text-gray-500 hover:text-gray-700 flex items-center gap-0.5"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-2 w-2 transition-transform"
                    :class="{ 'rotate-90': !layerChildrenCollapsed[layer.id] }"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                  {{ layer.shapeIds.length }} shape{{ layer.shapeIds.length > 1 ? 's' : '' }}
                </button>

                <!-- Shape list -->
                <div v-show="!layerChildrenCollapsed[layer.id]" class="ml-3 mt-0.5 space-y-0.5">
                  <div
                    v-for="(shapeId, index) in layer.shapeIds"
                    :key="shapeId"
                    class="text-[9px] font-mono"
                    :class="shapeId === layer.primaryShapeId ? 'text-blue-600 font-semibold' : 'text-gray-600'"
                  >
                    <span class="text-gray-400">→</span>
                    {{ shapeId === layer.primaryShapeId ? '★ ' : '' }}{{ shapeId }}
                  </div>
                </div>
              </div>
              <div v-else class="ml-2 text-[9px] text-gray-400 italic">
                No shapes
              </div>
            </div>
          </div>
        </div>

        <!-- Saved Data (LocalStorage) - Filtered to current context -->
        <div class="pt-1.5 border-t border-gray-100">
          <div class="flex items-center justify-between mb-0.5">
            <div class="text-[10px] text-gray-500">
              LocalStorage Data:
              <span v-if="currentStep" class="text-purple-500">(Step {{ currentStep }})</span>
            </div>
            <button
              v-if="getFilteredSavedData"
              @click="toggleSavedData"
              class="text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3 w-3 transition-transform"
                :class="{ 'rotate-90': !savedDataCollapsed }"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div v-if="getFilteredSavedData" v-show="!savedDataCollapsed" class="mt-1">
            <pre class="text-[8px] font-mono text-gray-700 bg-gray-50 p-2 rounded border border-gray-200 overflow-auto max-h-48">{{ formatJSON(getFilteredSavedData) }}</pre>
          </div>
          <div v-else class="text-[9px] text-gray-400 italic mt-1">
            No saved data (empty)
          </div>
        </div>

        <!-- Last Click Position -->
        <div class="pt-1.5 border-t border-gray-100">
          <div class="text-[10px] text-gray-500 mb-0.5">Last Click:</div>
          <div v-if="lastClickPosition" class="space-y-0.5">
            <div class="flex items-center justify-between gap-3">
              <span class="text-[10px] text-gray-600">X:</span>
              <span class="text-[10px] font-mono font-semibold text-blue-600">
                {{ getGridCoordinates(lastClickPosition.x, lastClickPosition.y).gridX }}
                <span class="text-gray-400">({{ Math.round(lastClickPosition.x) }}px)</span>
              </span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-[10px] text-gray-600">Y:</span>
              <span class="text-[10px] font-mono font-semibold text-blue-600">
                {{ getGridCoordinates(lastClickPosition.x, lastClickPosition.y).gridY }}
                <span class="text-gray-400">({{ Math.round(lastClickPosition.y) }}px)</span>
              </span>
            </div>
          </div>
          <div v-else class="text-[10px] text-gray-400 italic">
            Click on canvas...
          </div>
        </div>
      </div>

      <!-- Dev mode indicator -->
      <div class="mt-2 pt-2 border-t border-gray-200">
        <div class="flex items-center gap-1.5">
          <div class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          <span class="text-[10px] text-gray-500">Dev Mode</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ensure widget stays on top and doesn't interfere with canvas */
</style>
