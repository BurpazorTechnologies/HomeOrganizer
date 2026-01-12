<script setup lang="ts">
/**
 * GridCanvasWithDebug.vue
 *
 * Wrapper component that adds debug toolbar in dev mode.
 * Keeps debug concerns out of the main GridCanvas component.
 *
 * Usage:
 * - Use this component instead of GridCanvas directly in your app
 * - In production, the debug toolbar is not rendered
 * - All props and events are passed through to GridCanvas
 */
import { ref, onMounted } from 'vue';
import GridCanvas from '@/Components/Grid/GridCanvas.vue';
import DebugToolbar from '@/Components/Grid/debug/DebugToolbar.vue';
import { useDebugState } from '@/Components/Grid/debug/useDebugState';
import { localStorageService } from '@/Services/localStorage';
import type { StepInfo } from '@/Components/Grid/types/orchestration';

// ==================== Props & Emits ====================

interface Props {
  gridSize: number;
  snapToGrid: boolean;
  scale: number;
  isPanMode?: boolean;
}

interface Emits {
  (e: 'click', position: { x: number; y: number }): void;
  (e: 'stepChange', stepInfo: StepInfo): void;
  (e: 'zoomChange', zoom: number): void;
  (e: 'resize', width: number, height: number): void;
  (e: 'update:isPanMode', value: boolean): void;
  (e: 'layerChange', layers: any[]): void;
  (e: 'savedDataChange', savedData: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// ==================== Component Refs ====================

const canvasRef = ref<InstanceType<typeof GridCanvas> | null>(null);

// ==================== Debug State ====================

const { debugState, subscribeToStore, refresh: refreshDebugState } = useDebugState(
  () => canvasRef.value?.getRegistry() ?? null
);

const lastClickPosition = ref<{ x: number; y: number } | null>(null);
const savedData = ref<any>(null);

// ==================== Event Handlers ====================

function handleClick(position: { x: number; y: number }): void {
  lastClickPosition.value = position;
  emit('click', position);
}

function handleStepChange(stepInfo: StepInfo): void {
  emit('stepChange', stepInfo);
}

function handleZoomChange(zoom: number): void {
  emit('zoomChange', zoom);
}

function handleResize(width: number, height: number): void {
  emit('resize', width, height);
}

function handlePanModeUpdate(value: boolean): void {
  emit('update:isPanMode', value);
}

function handleLayerChange(layers: any[]): void {
  emit('layerChange', layers);
}

function handleSavedDataChange(data: any): void {
  savedData.value = data;
  emit('savedDataChange', data);
}

function handleRegistryReady(): void {
  subscribeToStore();
}

// ==================== Debug Toolbar Handlers ====================

function handleDebugReset(): void {
  localStorageService.clear();
  window.location.reload();
}

function handleDebugClearMutations(): void {
  const registry = canvasRef.value?.getRegistry();
  if (registry?.isInitialized) {
    registry.store.clearMutationHistory();
  }
}

// ==================== Exposed Methods ====================

function zoomIn(): boolean {
  return canvasRef.value?.zoomIn() ?? false;
}

function zoomOut(): boolean {
  return canvasRef.value?.zoomOut() ?? false;
}

function resetZoom(): void {
  canvasRef.value?.resetZoom();
}

function getCurrentZoom(): number {
  return canvasRef.value?.getCurrentZoom() ?? 1.0;
}

function focusOnSelectedShape(): void {
  canvasRef.value?.focusOnSelectedShape();
}

function recenterToLayer(): void {
  canvasRef.value?.recenterToLayer();
}

function saveAreaName(areaId: string, name: string): void {
  canvasRef.value?.saveAreaName(areaId, name);
}

function saveShapeLabel(shapeId: string, label: string): void {
  canvasRef.value?.saveShapeLabel(shapeId, label);
}

function getRegistry() {
  return canvasRef.value?.getRegistry() ?? null;
}

defineExpose({
  zoomIn,
  zoomOut,
  resetZoom,
  getCurrentZoom,
  focusOnSelectedShape,
  recenterToLayer,
  saveAreaName,
  saveShapeLabel,
  getRegistry,
});

// ==================== Lifecycle ====================

onMounted(() => {
  // Debug state subscription is handled via handleRegistryReady
});
</script>

<template>
  <div class="grid-canvas-with-debug">
    <GridCanvas
      ref="canvasRef"
      :grid-size="props.gridSize"
      :snap-to-grid="props.snapToGrid"
      :scale="props.scale"
      :is-pan-mode="props.isPanMode"
      @click="handleClick"
      @step-change="handleStepChange"
      @zoom-change="handleZoomChange"
      @resize="handleResize"
      @update:is-pan-mode="handlePanModeUpdate"
      @layer-change="handleLayerChange"
      @saved-data-change="handleSavedDataChange"
      @registry-ready="handleRegistryReady"
    />

    <!-- Debug Toolbar (dev mode only) -->
    <DebugToolbar
      :debug-state="debugState"
      :grid-size="gridSize"
      :last-click-position="lastClickPosition"
      :saved-data="savedData"
      @reset="handleDebugReset"
      @clear-mutations="handleDebugClearMutations"
      @refresh="refreshDebugState"
    />
  </div>
</template>

<style scoped>
.grid-canvas-with-debug {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
