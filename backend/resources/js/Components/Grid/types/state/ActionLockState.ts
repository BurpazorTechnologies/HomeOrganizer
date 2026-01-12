/**
 * ActionLockState - Canonical action lock state type
 *
 * Single source of truth for action lock state in the grid system.
 * Ensures only one action (pan, zoom, drag, resize) happens at a time.
 */

/**
 * Action types - only one action can be active at a time
 * This prevents bugs from multi-action conflicts
 */
export type ActionType =
  | 'idle'      // No action in progress
  | 'panning'   // User is panning the canvas
  | 'zooming'   // User is zooming
  | 'dragging'  // User is dragging a shape
  | 'resizing'  // User is resizing a shape
  | 'creating'; // User is creating a new shape

/**
 * Action lock state - tracks which action is currently active
 */
export interface ActionLockState {
  /** The currently active action */
  currentAction: ActionType;

  /** ID of the element/manager that acquired the lock (null = no lock) */
  lockedBy: string | null;
}

/**
 * Default action lock state values
 */
export const DEFAULT_ACTION_LOCK_STATE: ActionLockState = {
  currentAction: 'idle',
  lockedBy: null,
};
