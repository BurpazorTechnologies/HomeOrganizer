<script setup lang="ts">
/**
 * Toolbar Component
 *
 * Shows the current step/mode and contextual actions for the grid editor.
 */
import { ref } from 'vue';
import type { Step } from '@/Components/Grid/types/steps';
import type { ToolbarAction } from '@/Components/Grid/types/orchestration';

interface Props {
  currentStep: Step;
  description?: string;
  actions?: ToolbarAction[];
}

const props = defineProps<Props>();

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
            @click="action.action"
          >
            {{ action.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Toolbar positioning */
</style>
