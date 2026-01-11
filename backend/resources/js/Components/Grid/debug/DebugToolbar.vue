<script setup lang="ts">
/**
 * DebugToolbar Component
 *
 * Comprehensive debug toolbar displaying all grid state in collapsible JSON sections.
 * Only renders in development mode.
 *
 * Features:
 * - Draggable positioning
 * - Quick info section (grid size, selected shape, visible area, last click)
 * - 9 collapsible state sections with JSON
 * - Formatted JSON with syntax highlighting
 * - Copy to clipboard per section
 * - Separated info and action sections
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { DebugState } from './types';
import { DEBUG_SECTIONS } from './types';

interface Props {
  debugState: DebugState | null;
  gridSize?: number;
  lastClickPosition?: { x: number; y: number } | null;
  savedData?: any;
}

const props = withDefaults(defineProps<Props>(), {
  gridSize: 20,
  lastClickPosition: null,
  savedData: null,
});

const emit = defineEmits<{
  (e: 'reset'): void;
  (e: 'clearMutations'): void;
  (e: 'exportState'): void;
  (e: 'refresh'): void;
}>();

// Check if we're in development mode
const isDev = import.meta.env.DEV;

// ==================== Draggable State ====================
const position = ref({ x: 0, y: 60 }); // Initial position (top-right)
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

// ==================== Toolbar State ====================
const isToolbarCollapsed = ref(false);

// Section expanded states - initialize from DEBUG_SECTIONS
const expandedSections = ref<Record<string, boolean>>(
  DEBUG_SECTIONS.reduce((acc, section) => {
    acc[section.key] = section.defaultExpanded;
    return acc;
  }, {} as Record<string, boolean>)
);

// Quick info section expanded state
const quickInfoExpanded = ref(true);

// Copy feedback state
const copiedSection = ref<string | null>(null);

// ==================== Draggable Logic ====================

function initializePosition(): void {
  // Position in top-right corner with some padding
  if (typeof window !== 'undefined') {
    position.value = {
      x: window.innerWidth - 420, // 400px width + 20px padding
      y: 60,
    };
  }
}

function onMouseDown(e: MouseEvent): void {
  // Only drag from header
  if (!(e.target as HTMLElement).closest('.drag-handle')) return;

  isDragging.value = true;
  dragOffset.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y,
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  e.preventDefault();
}

function onMouseMove(e: MouseEvent): void {
  if (!isDragging.value) return;

  const newX = e.clientX - dragOffset.value.x;
  const newY = e.clientY - dragOffset.value.y;

  // Constrain to viewport
  const maxX = window.innerWidth - 100;
  const maxY = window.innerHeight - 100;

  position.value = {
    x: Math.max(0, Math.min(newX, maxX)),
    y: Math.max(0, Math.min(newY, maxY)),
  };
}

function onMouseUp(): void {
  isDragging.value = false;
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
}

onMounted(() => {
  initializePosition();
});

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
});

// ==================== Computed Values ====================

const formattedTimestamp = computed(() => {
  if (!props.debugState?.timestamp) return '';
  return new Date(props.debugState.timestamp).toLocaleTimeString();
});

// Quick info computed values
const selectedShapeId = computed(() => props.debugState?.selection?.selectedShapeId || null);

const visibleGridArea = computed(() => {
  const viewport = props.debugState?.viewport;
  if (!viewport?.stageWidth || !viewport?.stageHeight) return null;

  const zoom = viewport.zoom || 1.0;
  const visibleWidth = viewport.stageWidth / zoom;
  const visibleHeight = viewport.stageHeight / zoom;

  return {
    squaresX: Math.floor(visibleWidth / props.gridSize),
    squaresY: Math.floor(visibleHeight / props.gridSize),
    pixelsX: Math.round(visibleWidth),
    pixelsY: Math.round(visibleHeight),
  };
});

const gridCoordinates = computed(() => {
  if (!props.lastClickPosition) return null;
  return {
    gridX: Math.floor(props.lastClickPosition.x / props.gridSize),
    gridY: Math.floor(props.lastClickPosition.y / props.gridSize),
    pixelX: Math.round(props.lastClickPosition.x),
    pixelY: Math.round(props.lastClickPosition.y),
  };
});

const currentStep = computed(() => props.debugState?.step?.currentNumber || 1);

// ==================== Section Toggle Functions ====================

function toggleToolbar(): void {
  isToolbarCollapsed.value = !isToolbarCollapsed.value;
}

function toggleSection(key: string): void {
  expandedSections.value[key] = !expandedSections.value[key];
}

function toggleQuickInfo(): void {
  quickInfoExpanded.value = !quickInfoExpanded.value;
}

// ==================== JSON Formatting ====================

function formatJson(obj: any): string {
  if (obj === null || obj === undefined) return 'null';
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function highlightJson(json: string): string {
  if (!json) return '';

  let escaped = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Highlight keys
  escaped = escaped.replace(
    /"([^"]+)":/g,
    '<span class="text-purple-600">"$1"</span>:'
  );

  // Highlight string values
  escaped = escaped.replace(
    /: "([^"]+)"/g,
    ': <span class="text-green-700">"$1"</span>'
  );

  // Highlight numbers
  escaped = escaped.replace(
    /: (-?\d+\.?\d*)/g,
    ': <span class="text-blue-600">$1</span>'
  );

  // draggable: false -> red
  escaped = escaped.replace(
    /(<span class="text-purple-600">"draggable"<\/span>: )(false)/g,
    '$1<span class="text-red-600 font-bold">$2</span>'
  );
  // draggable: true -> green
  escaped = escaped.replace(
    /(<span class="text-purple-600">"draggable"<\/span>: )(true)/g,
    '$1<span class="text-green-600 font-bold">$2</span>'
  );
  // listening: false -> red
  escaped = escaped.replace(
    /(<span class="text-purple-600">"listening"<\/span>: )(false)/g,
    '$1<span class="text-red-600 font-bold">$2</span>'
  );
  // listening: true -> green
  escaped = escaped.replace(
    /(<span class="text-purple-600">"listening"<\/span>: )(true)/g,
    '$1<span class="text-green-600 font-bold">$2</span>'
  );

  // Other booleans
  escaped = escaped.replace(
    /: (true|false)(?![^<]*>)/g,
    ': <span class="text-orange-600">$1</span>'
  );

  // Highlight null
  escaped = escaped.replace(
    /: (null)/g,
    ': <span class="text-gray-400">$1</span>'
  );

  return escaped;
}

// ==================== Data Accessors ====================

function getSectionData(key: keyof DebugState): any {
  if (!props.debugState) return null;
  return props.debugState[key];
}

function getItemCount(key: keyof DebugState): string {
  const data = getSectionData(key);
  if (Array.isArray(data)) {
    return `(${data.length})`;
  }
  return '';
}

// ==================== Clipboard Functions ====================

async function copySection(key: string): Promise<void> {
  const data = getSectionData(key as keyof DebugState);
  if (data !== null && data !== undefined) {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      copiedSection.value = key;
      setTimeout(() => {
        copiedSection.value = null;
      }, 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
}

async function exportAllState(): Promise<void> {
  if (props.debugState) {
    try {
      const fullState = {
        ...props.debugState,
        gridSize: props.gridSize,
        lastClickPosition: props.lastClickPosition,
        savedData: props.savedData,
      };
      await navigator.clipboard.writeText(JSON.stringify(fullState, null, 2));
      copiedSection.value = 'all';
      setTimeout(() => {
        copiedSection.value = null;
      }, 1500);
    } catch (err) {
      console.error('Failed to export:', err);
    }
  }
}

// ==================== Action Handlers ====================

function handleReset(): void {
  if (confirm('Reset canvas? This will clear all saved data and reload the page.')) {
    emit('reset');
  }
}
</script>

<template>
  <div
    v-if="isDev"
    ref="toolbarRef"
    class="fixed bg-white shadow-lg rounded-lg border border-gray-200 z-50 transition-shadow duration-200"
    :class="[
      isToolbarCollapsed ? 'w-auto' : 'w-[400px]',
      isDragging ? 'shadow-2xl cursor-grabbing' : ''
    ]"
    :style="{
      left: `${position.x}px`,
      top: `${position.y}px`,
      maxHeight: 'calc(100vh - 80px)',
    }"
    @mousedown="onMouseDown"
  >
    <!-- Header (Drag Handle) -->
    <div
      class="drag-handle flex items-center justify-between px-3 py-2 bg-gray-50 rounded-t-lg border-b border-gray-200 select-none"
      :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'"
    >
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-400">⋮⋮</span>
        <span class="text-sm">🔧</span>
        <span class="text-xs font-semibold text-gray-700">Grid Debug</span>
        <span v-if="!isToolbarCollapsed" class="text-[10px] text-gray-400">
          {{ formattedTimestamp }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="!isToolbarCollapsed"
          class="text-[10px] px-1.5 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded transition-colors"
          @click.stop="emit('refresh')"
          title="Refresh state"
        >
          ↻
        </button>
        <button
          class="text-gray-400 hover:text-gray-600 text-xs px-1"
          @click.stop="toggleToolbar"
          :title="isToolbarCollapsed ? 'Expand' : 'Collapse'"
        >
          {{ isToolbarCollapsed ? '▶' : '▼' }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div
      v-show="!isToolbarCollapsed"
      class="overflow-y-auto"
      style="max-height: calc(100vh - 180px);"
    >
      <!-- ==================== QUICK INFO SECTION ==================== -->
      <div class="border-b border-gray-200">
        <div
          class="flex items-center justify-between px-3 py-1.5 bg-blue-50 cursor-pointer select-none"
          @click="toggleQuickInfo"
        >
          <div class="flex items-center gap-2">
            <span class="text-[10px] text-gray-400">{{ quickInfoExpanded ? '▼' : '▶' }}</span>
            <span class="text-xs font-semibold text-blue-700">Quick Info</span>
          </div>
          <div class="flex items-center gap-1">
            <div class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span class="text-[9px] text-gray-500">Dev Mode</span>
          </div>
        </div>

        <div v-show="quickInfoExpanded" class="px-3 py-2 space-y-2 bg-gray-50/50">
          <!-- Grid Size -->
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-gray-600">Grid Size:</span>
            <span class="text-[10px] font-mono font-semibold text-gray-900">{{ gridSize }}px</span>
          </div>

          <!-- Current Step -->
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-gray-600">Current Step:</span>
            <span class="text-[10px] font-mono font-semibold text-purple-600">Step {{ currentStep }}</span>
          </div>

          <!-- Selected Shape -->
          <div class="pt-1 border-t border-gray-100">
            <div class="text-[10px] text-gray-500 mb-0.5">Selected Shape:</div>
            <div v-if="selectedShapeId" class="text-[10px] font-mono font-semibold text-purple-600 break-all">
              {{ selectedShapeId }}
            </div>
            <div v-else class="text-[10px] text-gray-400 italic">
              No shape selected
            </div>
          </div>

          <!-- Visible Grid Area -->
          <div v-if="visibleGridArea" class="pt-1 border-t border-gray-100">
            <div class="text-[10px] text-gray-500 mb-0.5">Visible Grid Area:</div>
            <div class="grid grid-cols-2 gap-x-3 gap-y-0.5">
              <div class="flex items-center justify-between">
                <span class="text-[10px] text-gray-600">W:</span>
                <span class="text-[10px] font-mono text-green-600">
                  {{ visibleGridArea.squaresX }} <span class="text-gray-400">({{ visibleGridArea.pixelsX }}px)</span>
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] text-gray-600">H:</span>
                <span class="text-[10px] font-mono text-green-600">
                  {{ visibleGridArea.squaresY }} <span class="text-gray-400">({{ visibleGridArea.pixelsY }}px)</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Last Click Position -->
          <div class="pt-1 border-t border-gray-100">
            <div class="text-[10px] text-gray-500 mb-0.5">Last Click:</div>
            <div v-if="gridCoordinates" class="grid grid-cols-2 gap-x-3 gap-y-0.5">
              <div class="flex items-center justify-between">
                <span class="text-[10px] text-gray-600">X:</span>
                <span class="text-[10px] font-mono text-blue-600">
                  {{ gridCoordinates.gridX }} <span class="text-gray-400">({{ gridCoordinates.pixelX }}px)</span>
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] text-gray-600">Y:</span>
                <span class="text-[10px] font-mono text-blue-600">
                  {{ gridCoordinates.gridY }} <span class="text-gray-400">({{ gridCoordinates.pixelY }}px)</span>
                </span>
              </div>
            </div>
            <div v-else class="text-[10px] text-gray-400 italic">
              Click on canvas...
            </div>
          </div>

          <!-- LocalStorage Summary -->
          <div v-if="savedData" class="pt-1 border-t border-gray-100">
            <div class="text-[10px] text-gray-500 mb-0.5">LocalStorage:</div>
            <div class="text-[10px] text-gray-600">
              <span v-if="savedData.homeArea?.shapes?.length">
                Home: {{ savedData.homeArea.shapes.length }} shape(s)
              </span>
              <span v-if="savedData.childAreas && Object.keys(savedData.childAreas).length > 0">
                | Children: {{ Object.keys(savedData.childAreas).length }} area(s)
              </span>
              <span v-if="!savedData.homeArea?.shapes?.length && (!savedData.childAreas || Object.keys(savedData.childAreas).length === 0)" class="text-gray-400 italic">
                Empty
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== STATE SECTIONS ==================== -->
      <div class="divide-y divide-gray-100">
        <div
          v-for="section in DEBUG_SECTIONS"
          :key="section.key"
          class="px-3 py-2"
        >
          <!-- Section Header -->
          <div
            class="flex items-center justify-between cursor-pointer select-none"
            @click="toggleSection(section.key)"
          >
            <div class="flex items-center gap-2">
              <span class="text-gray-400 text-[10px]">
                {{ expandedSections[section.key] ? '▼' : '▶' }}
              </span>
              <span class="text-xs font-medium text-gray-700">
                {{ section.label }}
              </span>
              <span class="text-[10px] text-gray-400">
                {{ getItemCount(section.key) }}
              </span>
            </div>
            <div class="flex items-center gap-1">
              <button
                class="text-[9px] px-1.5 py-0.5 rounded transition-colors"
                :class="copiedSection === section.key
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-500'"
                @click.stop="copySection(section.key)"
                :title="`Copy ${section.label}`"
              >
                {{ copiedSection === section.key ? '✓' : 'Copy' }}
              </button>
            </div>
          </div>

          <!-- Section Description -->
          <div
            v-if="expandedSections[section.key]"
            class="text-[9px] text-gray-400 mt-0.5 mb-1"
          >
            {{ section.description }}
          </div>

          <!-- Section Content -->
          <div
            v-show="expandedSections[section.key]"
            class="mt-1"
          >
            <!-- eslint-disable-next-line vue/no-v-html -->
            <pre
              class="text-[9px] font-mono bg-gray-50 p-2 rounded border border-gray-200 overflow-auto max-h-64 whitespace-pre-wrap break-all"
            ><code v-html="highlightJson(formatJson(getSectionData(section.key)))"></code></pre>
          </div>
        </div>
      </div>

      <!-- ==================== ACTIONS SECTION ==================== -->
      <div class="px-3 py-2 bg-gray-100 border-t border-gray-200">
        <div class="text-[9px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Actions</div>
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            <button
              class="text-[9px] px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded transition-colors"
              @click="handleReset"
              title="Clear localStorage and reload"
            >
              Reset Canvas
            </button>
            <button
              class="text-[9px] px-2 py-1 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded transition-colors"
              @click="emit('clearMutations')"
              title="Clear mutation history"
            >
              Clear Log
            </button>
          </div>
          <button
            class="text-[9px] px-2 py-1 rounded transition-colors"
            :class="copiedSection === 'all'
              ? 'bg-green-100 text-green-600'
              : 'bg-blue-100 hover:bg-blue-200 text-blue-600'"
            @click="exportAllState"
            title="Copy all state to clipboard"
          >
            {{ copiedSection === 'all' ? '✓ Copied' : 'Export All' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}

/* Prevent text selection while dragging */
.cursor-grabbing {
  user-select: none;
}
</style>
