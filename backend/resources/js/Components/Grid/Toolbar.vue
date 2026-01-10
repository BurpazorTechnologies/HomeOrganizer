<script setup lang="ts">
/**
 * Toolbar Component
 *
 * Shows the current step/mode and contextual actions for the grid editor.
 */
import type { Step } from '@/Components/Grid/types/steps';
import type { ToolbarAction } from '@/Components/Grid/types/orchestration';

interface Props {
  currentStep: Step;
  description?: string;
  actions?: ToolbarAction[];
}

const props = defineProps<Props>();

/**
 * Get button classes based on variant
 */
const getButtonClasses = (variant?: string) => {
  const baseClasses = 'px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-150';

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
  <div class="fixed top-4 left-4 bg-white shadow-lg rounded-lg p-4 z-50 border border-gray-200 min-w-[280px]">
    <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
      Toolbar Info
    </div>

    <!-- Step Information -->
    <div class="border-t border-gray-200 pt-2">
      <div class="text-sm text-gray-600 mb-1">Step {{ currentStep.order }}:</div>
      <div class="text-base font-semibold text-gray-900">
        {{ currentStep.label }}
      </div>
      <div v-if="currentStep.description" class="text-xs text-gray-500 mt-1">
        {{ currentStep.description }}
      </div>
    </div>

    <!-- Dynamic Description -->
    <div v-if="description" class="mt-3 pt-3 border-t border-gray-200">
      <div class="text-xs text-gray-600 italic">
        {{ description }}
      </div>
    </div>

    <!-- Toolbar Actions -->
    <div v-if="actions && actions.length > 0" class="mt-3 pt-3 border-t border-gray-200">
      <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Actions
      </div>
      <div class="flex flex-col gap-2">
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
</template>

<style scoped>
/* Toolbar positioning */
</style>
