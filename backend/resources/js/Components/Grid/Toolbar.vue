<script setup lang="ts">
/**
 * Toolbar Component
 *
 * Shows the current step/mode and contextual actions for the grid editor.
 */
import { ref } from 'vue';
import Swal from 'sweetalert2';
import type { Step } from '@/Components/Grid/types/steps';
import type { ToolbarAction } from '@/Components/Grid/types/orchestration';

interface Props {
  currentStep: Step;
  description?: string;
  actions?: ToolbarAction[];
  currentZoom?: number;
  isPanMode?: boolean;
}

interface Emits {
  (e: 'zoom-in'): void;
  (e: 'zoom-out'): void;
  (e: 'reset-zoom'): void;
  (e: 'toggle-pan'): void;
  (e: 'recenter'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Collapse state
const isCollapsed = ref(false);

/**
 * Toggle collapse state
 */
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

/**
 * Get button classes based on variant
 */
const getButtonClasses = (variant?: string) => {
  const baseClasses = 'px-2 py-1 text-xs font-medium rounded transition-colors duration-150';

  switch (variant) {
    case 'primary':
      return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed`;
    case 'danger':
      return `${baseClasses} bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed`;
    case 'secondary':
    default:
      return `${baseClasses} bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed`;
  }
};

/**
 * Compute zoom capabilities based on current zoom level
 */
const canZoomIn = () => {
  if (!props.currentZoom) return false;
  return props.currentZoom < 1.0;
};

const canZoomOut = () => {
  if (!props.currentZoom) return false;
  return props.currentZoom > 0.1;
};

const isZoomedOut = () => {
  if (!props.currentZoom) return false;
  return props.currentZoom < 1.0;
};

/**
 * Get zoom percentage
 */
const getZoomPercentage = () => {
  if (!props.currentZoom) return '100%';
  return `${Math.round(props.currentZoom * 100)}%`;
};

/**
 * Handle action click with feedback
 */
const handleActionClick = async (action: ToolbarAction, event: MouseEvent) => {
  const button = event.currentTarget as HTMLButtonElement;

  // Add click animation
  button.classList.add('scale-95');
  setTimeout(() => {
    button.classList.remove('scale-95');
  }, 150);

  // Execute action
  action.action();

  // Show toast notification
  if (action.id === 'save') {
    await Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Saved!',
      text: 'Your changes have been saved',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  } else if (action.id === 'delete') {
    await Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Deleted!',
      text: 'Shape has been removed',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  }
};
</script>

<template>
  <div class="fixed top-2 left-2 bg-white shadow-md rounded z-50 border border-gray-200 transition-all duration-200"
       :class="isCollapsed ? 'p-1' : 'p-2 min-w-[200px]'">
    <!-- Header with collapse button -->
    <div class="flex items-center justify-between gap-2 mb-1">
      <div class="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
        Toolbar
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
      <!-- Step Information -->
      <div class="border-t border-gray-200 pt-1.5">
        <div class="text-[10px] text-gray-600 mb-0.5">Step {{ currentStep.order }}:</div>
        <div class="text-xs font-semibold text-gray-900">
          {{ currentStep.label }}
        </div>
        <div v-if="currentStep.description" class="text-[10px] text-gray-500 mt-0.5">
          {{ currentStep.description }}
        </div>
      </div>

      <!-- Dynamic Description -->
      <div v-if="description" class="mt-2 pt-2 border-t border-gray-200">
        <div class="text-[10px] text-gray-600 italic">
          {{ description }}
        </div>
      </div>

      <!-- Toolbar Actions -->
      <div v-if="actions && actions.length > 0" class="mt-2 pt-2 border-t border-gray-200">
        <div class="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Actions
        </div>
        <div class="flex flex-col gap-1.5">
          <button
            v-for="action in actions"
            :key="action.id"
            :class="getButtonClasses(action.variant)"
            :disabled="action.disabled"
            @click="handleActionClick(action, $event)"
            class="transform transition-transform duration-150 active:scale-95"
          >
            {{ action.label }}
          </button>
        </div>
      </div>

      <!-- Zoom Controls -->
      <div class="mt-2 pt-2 border-t border-gray-200">
        <div class="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
          View Controls
        </div>
        <div class="flex items-center gap-1.5 mb-1.5">
          <!-- Move/Pan Button -->
          <button
            @click="emit('toggle-pan')"
            :class="isPanMode ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'"
            class="p-1 rounded transition-colors"
            title="Move/Pan Canvas"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-3 w-3"
              fill="currentColor"
              viewBox="0 0 384 384"
            >
              <path d="M192 0l-64 64h48v88H88V104L24 168l64 64v-48h88v88h-48l64 64 64-64h-48v-88h88v48l64-64-64-64v48h-88V64h48z"/>
            </svg>
          </button>
          <span class="text-[9px] text-gray-600">{{ isPanMode ? 'Pan Active' : 'Pan' }}</span>

          <!-- Recenter Button -->
          <button
            @click="emit('recenter')"
            class="ml-auto p-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
            title="Recenter - Jump back to the main shape in current layer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <div class="flex items-center gap-1.5">
          <!-- Zoom Out Button -->
          <button
            @click="emit('zoom-out')"
            :disabled="!canZoomOut()"
            class="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            title="Zoom Out"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-3 w-3 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
            </svg>
          </button>

          <!-- Zoom Percentage Display -->
          <div class="text-[10px] font-mono font-semibold text-gray-900 min-w-[32px] text-center">
            {{ getZoomPercentage() }}
          </div>

          <!-- Zoom In Button -->
          <button
            @click="emit('zoom-in')"
            :disabled="!canZoomIn()"
            class="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            title="Zoom In"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-3 w-3 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>

          <!-- Reset Zoom Button (only shows when zoomed out) -->
          <button
            v-if="isZoomedOut()"
            @click="emit('reset-zoom')"
            class="ml-1 px-1.5 py-0.5 text-[9px] rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
            title="Reset Zoom"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Toolbar positioning */
</style>
