/**
 * Grid Command Handlers
 *
 * Implements the execution logic for all grid commands.
 * Each handler receives the command payload and the store, performs the mutation,
 * and returns a result.
 *
 * The store's dispatch() method routes commands to these handlers.
 *
 * Pattern:
 *   dispatch({ type: 'SHAPE_CREATE', payload: { shape } })
 *   → handleShapeCreate(payload, store)
 *   → store mutates state, emits event
 *   → returns { success: true }
 */

import type { GridStateStore } from '../state/GridStateStore';
import type {
  GridCommand,
  GridCommandType,
  CommandResult,
  // Shape commands
  CreateShapeCommand,
  UpdateShapeCommand,
  MoveShapeCommand,
  ResizeShapeCommand,
  DeleteShapeCommand,
  SetRootShapeCommand,
  AddChildShapeCommand,
  RemoveChildShapeCommand,
  // Layer commands
  CreateLayerCommand,
  UpdateLayerCommand,
  DeleteLayerCommand,
  SetCurrentLayerCommand,
  AddShapeToLayerCommand,
  RemoveShapeFromLayerCommand,
  LockLayerCommand,
  UnlockLayerCommand,
  // Area commands
  CreateAreaCommand,
  UpdateAreaCommand,
  DeleteAreaCommand,
  SetRootAreaCommand,
  // Selection commands
  SelectCommand,
  DeselectCommand,
  // Step commands
  SetCurrentStepCommand,
  SetSavedStateCommand,
  // Viewport commands
  SetZoomCommand,
  SetPanCommand,
  SetViewportCommand,
  // Grid config commands
  SetGridSizeCommand,
  SetSnapEnabledCommand,
  SetGridVisibleCommand,
  SetGridConfigCommand,
  // Action lock commands
  AcquireActionLockCommand,
  ReleaseActionLockCommand,
  ForceReleaseActionLockCommand,
  // Store lifecycle commands
  DeserializeStoreCommand,
  ClearStoreCommand,
} from './types';

// ==================== Shape Command Handlers ====================

function handleShapeCreate(
  payload: CreateShapeCommand['payload'],
  store: GridStateStore
): CommandResult {
  store.addShape(payload.shape);
  return { success: true };
}

function handleShapeUpdate(
  payload: UpdateShapeCommand['payload'],
  store: GridStateStore
): CommandResult {
  const shape = store.getShape(payload.shapeId);
  if (!shape) {
    return { success: false, error: `Shape not found: ${payload.shapeId}` };
  }
  store.updateShape(payload.shapeId, payload.updates);
  return { success: true };
}

function handleShapeMove(
  payload: MoveShapeCommand['payload'],
  store: GridStateStore
): CommandResult {
  const shape = store.getShape(payload.shapeId);
  if (!shape) {
    return { success: false, error: `Shape not found: ${payload.shapeId}` };
  }
  store.updateShape(payload.shapeId, { x: payload.x, y: payload.y });
  return { success: true };
}

function handleShapeResize(
  payload: ResizeShapeCommand['payload'],
  store: GridStateStore
): CommandResult {
  const shape = store.getShape(payload.shapeId);
  if (!shape) {
    return { success: false, error: `Shape not found: ${payload.shapeId}` };
  }
  store.updateShape(payload.shapeId, { width: payload.width, height: payload.height });
  return { success: true };
}

function handleShapeDelete(
  payload: DeleteShapeCommand['payload'],
  store: GridStateStore
): CommandResult {
  const shape = store.getShape(payload.shapeId);
  if (!shape) {
    return { success: false, error: `Shape not found: ${payload.shapeId}` };
  }
  store.removeShape(payload.shapeId);
  return { success: true };
}

function handleShapeSetRoot(
  payload: SetRootShapeCommand['payload'],
  store: GridStateStore
): CommandResult {
  if (payload.shapeId !== null) {
    const shape = store.getShape(payload.shapeId);
    if (!shape) {
      return { success: false, error: `Shape not found: ${payload.shapeId}` };
    }
  }
  store.setRootShapeId(payload.shapeId);
  return { success: true };
}

function handleShapeAddChild(
  payload: AddChildShapeCommand['payload'],
  store: GridStateStore
): CommandResult {
  const parent = store.getShape(payload.parentId);
  if (!parent) {
    return { success: false, error: `Parent shape not found: ${payload.parentId}` };
  }
  const child = store.getShape(payload.childId);
  if (!child) {
    return { success: false, error: `Child shape not found: ${payload.childId}` };
  }
  store.addChildShapeId(payload.parentId, payload.childId);
  return { success: true };
}

function handleShapeRemoveChild(
  payload: RemoveChildShapeCommand['payload'],
  store: GridStateStore
): CommandResult {
  const parent = store.getShape(payload.parentId);
  if (!parent) {
    return { success: false, error: `Parent shape not found: ${payload.parentId}` };
  }
  store.removeChildShapeId(payload.parentId, payload.childId);
  return { success: true };
}

// ==================== Layer Command Handlers ====================

function handleLayerCreate(
  payload: CreateLayerCommand['payload'],
  store: GridStateStore
): CommandResult {
  store.addLayer(payload.layer);
  return { success: true };
}

function handleLayerUpdate(
  payload: UpdateLayerCommand['payload'],
  store: GridStateStore
): CommandResult {
  const layer = store.getLayer(payload.layerId);
  if (!layer) {
    return { success: false, error: `Layer not found: ${payload.layerId}` };
  }
  store.updateLayer(payload.layerId, payload.updates);
  return { success: true };
}

function handleLayerDelete(
  payload: DeleteLayerCommand['payload'],
  store: GridStateStore
): CommandResult {
  const layer = store.getLayer(payload.layerId);
  if (!layer) {
    return { success: false, error: `Layer not found: ${payload.layerId}` };
  }
  store.removeLayer(payload.layerId);
  return { success: true };
}

function handleLayerSetCurrent(
  payload: SetCurrentLayerCommand['payload'],
  store: GridStateStore
): CommandResult {
  if (payload.layerId !== null) {
    const layer = store.getLayer(payload.layerId);
    if (!layer) {
      return { success: false, error: `Layer not found: ${payload.layerId}` };
    }
  }
  store.setCurrentLayer(payload.layerId);
  return { success: true };
}

function handleLayerAddShape(
  payload: AddShapeToLayerCommand['payload'],
  store: GridStateStore
): CommandResult {
  const layer = store.getLayer(payload.layerId);
  if (!layer) {
    return { success: false, error: `Layer not found: ${payload.layerId}` };
  }
  store.addShapeToLayer(payload.layerId, payload.shapeId, payload.isPrimary);
  return { success: true };
}

function handleLayerRemoveShape(
  payload: RemoveShapeFromLayerCommand['payload'],
  store: GridStateStore
): CommandResult {
  const layer = store.getLayer(payload.layerId);
  if (!layer) {
    return { success: false, error: `Layer not found: ${payload.layerId}` };
  }
  store.removeShapeFromLayer(payload.layerId, payload.shapeId);
  return { success: true };
}

function handleLayerLock(
  payload: LockLayerCommand['payload'],
  store: GridStateStore
): CommandResult {
  const layer = store.getLayer(payload.layerId);
  if (!layer) {
    return { success: false, error: `Layer not found: ${payload.layerId}` };
  }
  store.lockLayer(payload.layerId);
  return { success: true };
}

function handleLayerUnlock(
  payload: UnlockLayerCommand['payload'],
  store: GridStateStore
): CommandResult {
  const layer = store.getLayer(payload.layerId);
  if (!layer) {
    return { success: false, error: `Layer not found: ${payload.layerId}` };
  }
  store.unlockLayer(payload.layerId);
  return { success: true };
}

// ==================== Area Command Handlers (Legacy) ====================

function handleAreaCreate(
  payload: CreateAreaCommand['payload'],
  store: GridStateStore
): CommandResult {
  store.addArea(payload.area);
  return { success: true };
}

function handleAreaUpdate(
  payload: UpdateAreaCommand['payload'],
  store: GridStateStore
): CommandResult {
  const area = store.getArea(payload.areaId);
  if (!area) {
    return { success: false, error: `Area not found: ${payload.areaId}` };
  }
  store.updateArea(payload.areaId, payload.updates);
  return { success: true };
}

function handleAreaDelete(
  payload: DeleteAreaCommand['payload'],
  store: GridStateStore
): CommandResult {
  const area = store.getArea(payload.areaId);
  if (!area) {
    return { success: false, error: `Area not found: ${payload.areaId}` };
  }
  store.removeArea(payload.areaId);
  return { success: true };
}

function handleAreaSetRoot(
  payload: SetRootAreaCommand['payload'],
  store: GridStateStore
): CommandResult {
  if (payload.areaId !== null) {
    const area = store.getArea(payload.areaId);
    if (!area) {
      return { success: false, error: `Area not found: ${payload.areaId}` };
    }
  }
  store.setRootAreaId(payload.areaId);
  return { success: true };
}

// ==================== Selection Command Handlers ====================

function handleSelectionSelect(
  payload: SelectCommand['payload'],
  store: GridStateStore
): CommandResult {
  const shape = store.getShape(payload.shapeId);
  if (!shape) {
    return { success: false, error: `Shape not found: ${payload.shapeId}` };
  }
  const layer = store.getLayer(payload.layerId);
  if (!layer) {
    return { success: false, error: `Layer not found: ${payload.layerId}` };
  }
  store.select(payload.shapeId, payload.layerId, payload.isParent);
  return { success: true };
}

function handleSelectionDeselect(
  _payload: DeselectCommand['payload'],
  store: GridStateStore
): CommandResult {
  store.deselect();
  return { success: true };
}

// ==================== Step Command Handlers ====================

function handleStepSetCurrent(
  payload: SetCurrentStepCommand['payload'],
  store: GridStateStore
): CommandResult {
  store.setCurrentStep(payload.step);
  return { success: true };
}

function handleStepSetSaved(
  payload: SetSavedStateCommand['payload'],
  store: GridStateStore
): CommandResult {
  store.setIsSaved(payload.isSaved);
  return { success: true };
}

// ==================== Viewport Command Handlers ====================

function handleViewportSetZoom(
  payload: SetZoomCommand['payload'],
  store: GridStateStore
): CommandResult {
  store.setZoom(payload.zoom);
  return { success: true };
}

function handleViewportSetPan(
  payload: SetPanCommand['payload'],
  store: GridStateStore
): CommandResult {
  store.setPan(payload.pan);
  return { success: true };
}

function handleViewportSet(
  payload: SetViewportCommand['payload'],
  store: GridStateStore
): CommandResult {
  store.setViewport(payload.viewport);
  return { success: true };
}

// ==================== Grid Config Command Handlers ====================

function handleGridConfigSetSize(
  payload: SetGridSizeCommand['payload'],
  store: GridStateStore
): CommandResult {
  store.setGridSize(payload.gridSize);
  return { success: true };
}

function handleGridConfigSetSnap(
  payload: SetSnapEnabledCommand['payload'],
  store: GridStateStore
): CommandResult {
  store.setSnapEnabled(payload.snapEnabled);
  return { success: true };
}

function handleGridConfigSetVisible(
  payload: SetGridVisibleCommand['payload'],
  store: GridStateStore
): CommandResult {
  store.setGridVisible(payload.gridVisible);
  return { success: true };
}

function handleGridConfigSet(
  payload: SetGridConfigCommand['payload'],
  store: GridStateStore
): CommandResult {
  store.setGridConfig(payload.config);
  return { success: true };
}

// ==================== Action Lock Command Handlers ====================

function handleActionLockAcquire(
  payload: AcquireActionLockCommand['payload'],
  store: GridStateStore
): CommandResult<boolean> {
  const acquired = store.acquireActionLock(payload.action, payload.lockerId);
  return { success: true, data: acquired };
}

function handleActionLockRelease(
  payload: ReleaseActionLockCommand['payload'],
  store: GridStateStore
): CommandResult {
  store.releaseActionLock(payload.lockerId);
  return { success: true };
}

function handleActionLockForceRelease(
  _payload: ForceReleaseActionLockCommand['payload'],
  store: GridStateStore
): CommandResult {
  store.forceReleaseActionLock();
  return { success: true };
}

// ==================== Store Lifecycle Command Handlers ====================

function handleStoreDeserialize(
  payload: DeserializeStoreCommand['payload'],
  store: GridStateStore
): CommandResult {
  store.deserialize(payload.data);
  return { success: true };
}

function handleStoreClear(
  _payload: ClearStoreCommand['payload'],
  store: GridStateStore
): CommandResult {
  store.clear();
  return { success: true };
}

// ==================== Command Router ====================

/**
 * Routes a command to its handler and returns the result.
 * This is the main entry point for command execution.
 */
export function executeCommand(
  command: GridCommand,
  store: GridStateStore
): CommandResult<unknown> {
  switch (command.type) {
    // Shape commands
    case 'SHAPE_CREATE':
      return handleShapeCreate(command.payload, store);
    case 'SHAPE_UPDATE':
      return handleShapeUpdate(command.payload, store);
    case 'SHAPE_MOVE':
      return handleShapeMove(command.payload, store);
    case 'SHAPE_RESIZE':
      return handleShapeResize(command.payload, store);
    case 'SHAPE_DELETE':
      return handleShapeDelete(command.payload, store);
    case 'SHAPE_SET_ROOT':
      return handleShapeSetRoot(command.payload, store);
    case 'SHAPE_ADD_CHILD':
      return handleShapeAddChild(command.payload, store);
    case 'SHAPE_REMOVE_CHILD':
      return handleShapeRemoveChild(command.payload, store);

    // Layer commands
    case 'LAYER_CREATE':
      return handleLayerCreate(command.payload, store);
    case 'LAYER_UPDATE':
      return handleLayerUpdate(command.payload, store);
    case 'LAYER_DELETE':
      return handleLayerDelete(command.payload, store);
    case 'LAYER_SET_CURRENT':
      return handleLayerSetCurrent(command.payload, store);
    case 'LAYER_ADD_SHAPE':
      return handleLayerAddShape(command.payload, store);
    case 'LAYER_REMOVE_SHAPE':
      return handleLayerRemoveShape(command.payload, store);
    case 'LAYER_LOCK':
      return handleLayerLock(command.payload, store);
    case 'LAYER_UNLOCK':
      return handleLayerUnlock(command.payload, store);

    // Area commands (legacy)
    case 'AREA_CREATE':
      return handleAreaCreate(command.payload, store);
    case 'AREA_UPDATE':
      return handleAreaUpdate(command.payload, store);
    case 'AREA_DELETE':
      return handleAreaDelete(command.payload, store);
    case 'AREA_SET_ROOT':
      return handleAreaSetRoot(command.payload, store);

    // Selection commands
    case 'SELECTION_SELECT':
      return handleSelectionSelect(command.payload, store);
    case 'SELECTION_DESELECT':
      return handleSelectionDeselect(command.payload, store);

    // Step commands
    case 'STEP_SET_CURRENT':
      return handleStepSetCurrent(command.payload, store);
    case 'STEP_SET_SAVED':
      return handleStepSetSaved(command.payload, store);

    // Viewport commands
    case 'VIEWPORT_SET_ZOOM':
      return handleViewportSetZoom(command.payload, store);
    case 'VIEWPORT_SET_PAN':
      return handleViewportSetPan(command.payload, store);
    case 'VIEWPORT_SET':
      return handleViewportSet(command.payload, store);

    // Grid config commands
    case 'GRID_CONFIG_SET_SIZE':
      return handleGridConfigSetSize(command.payload, store);
    case 'GRID_CONFIG_SET_SNAP':
      return handleGridConfigSetSnap(command.payload, store);
    case 'GRID_CONFIG_SET_VISIBLE':
      return handleGridConfigSetVisible(command.payload, store);
    case 'GRID_CONFIG_SET':
      return handleGridConfigSet(command.payload, store);

    // Action lock commands
    case 'ACTION_LOCK_ACQUIRE':
      return handleActionLockAcquire(command.payload, store);
    case 'ACTION_LOCK_RELEASE':
      return handleActionLockRelease(command.payload, store);
    case 'ACTION_LOCK_FORCE_RELEASE':
      return handleActionLockForceRelease(command.payload, store);

    // Store lifecycle commands
    case 'STORE_DESERIALIZE':
      return handleStoreDeserialize(command.payload, store);
    case 'STORE_CLEAR':
      return handleStoreClear(command.payload, store);

    default:
      // TypeScript exhaustiveness check
      const _exhaustiveCheck: never = command;
      return { success: false, error: `Unknown command type: ${(command as GridCommand).type}` };
  }
}
