/**
 * Commands Module - Public Exports
 *
 * Exports command types and the execute function for the grid system.
 *
 * Usage:
 *   import { GridCommand, executeCommand } from '@/Components/Grid/core/commands';
 *
 *   // Execute a command
 *   const result = executeCommand({ type: 'SHAPE_CREATE', payload: { shape } }, store);
 *
 *   // Or via store.dispatch() (preferred)
 *   store.dispatch({ type: 'SHAPE_CREATE', payload: { shape } });
 */

// Export all command types
export type {
  // Union types
  GridCommand,
  GridCommandType,
  GridCommandPayload,
  CommandResult,
  CommandHandler,
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
  // Area commands (legacy)
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

// Export command execution
export { executeCommand } from './handlers';
