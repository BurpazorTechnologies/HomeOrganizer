# CLAUDE.StateTypes.md

## Purpose

This folder contains the **canonical state type definitions** for the Grid component system. These are the single source of truth for all state types - all managers and stores should import types from here.

## Current State

- **Phase:** 0 (Type Consolidation) - COMPLETE
- **Status:** Complete
- **Last Updated:** 2026-01-13

## Structure

```
types/state/
├── CLAUDE.StateTypes.md    # This file - context documentation
├── index.ts                # Re-exports all types (import from here!)
├── ShapeState.ts           # Shape state + ShapeType + AreaType re-export
├── LayerState.ts           # Layer state (no Konva refs)
├── AreaState.ts            # Area state + AreaType (legacy, being migrated)
├── ViewportState.ts        # Viewport state (zoom/pan)
├── GridConfigState.ts      # Grid configuration state
├── SelectionState.ts       # Selection state
├── ActionLockState.ts      # Action lock state
└── GridState.ts            # Complete grid state + SerializedGridState
```

## Dependencies

### Imports
- None (these are leaf types)

### Exports (from index.ts)
```typescript
// Shape types
export type { ShapeState, ShapeStateUpdate, ShapeType, AreaType }
// Layer types
export type { LayerState, LayerStateUpdate }
// Area types (legacy)
export type { AreaState, AreaStateUpdate }
// Selection types
export type { SelectionState }
export { DEFAULT_SELECTION_STATE }
// Viewport types
export type { ViewportState, PanPosition }
export { DEFAULT_VIEWPORT_STATE }
// Grid config types
export type { GridConfigState }
export { DEFAULT_GRID_CONFIG_STATE }
// Action lock types
export type { ActionLockState, ActionType }
export { DEFAULT_ACTION_LOCK_STATE }
// Complete state types
export type { GridState, SerializedGridState }
export { GRID_STATE_VERSION }
```

### Used By
- `core/state/GridStateStore.ts` - imports and re-exports all types
- All managers import types via GridStateStore (backwards compatible)
- Future: managers should import directly from `types/state/`

## Gotchas & Notes

### Naming Conventions (IMPORTANT!)
The following names are **standardized** - always use these:

| Standardized | NOT This | Notes |
|--------------|----------|-------|
| `zoom` | `scale` | Zoom level (1.0 = 100%) |
| `pan` | `position` | Pan offset in world coords |
| `gridSize` | `size` | Spacing between grid lines |
| `gridVisible` | `visible` | Show/hide grid lines |
| `snapEnabled` | - | Keep as-is |

### ShapeState vs Layer runtime type
- `ShapeState` = storable state (in types/state/)
- `LayerState` = storable layer state (in types/state/)
- `Layer` = runtime type with Konva refs (in types/layers.ts)

### Area Migration
- `AreaState` is **deprecated** - marked with `@deprecated` JSDoc
- New code should use `ShapeState` with `areaType` field set
- `AreaType` is exported from both `AreaState.ts` and re-exported from `ShapeState.ts`

### Backwards Compatibility
- `GridStateStore.ts` re-exports all types for backwards compatibility
- Existing imports like `import { ShapeState } from 'GridStateStore'` still work
- New code should prefer: `import type { ShapeState } from '../types/state'`

### Default Values
Each state type has a corresponding `DEFAULT_*_STATE` export:
- `DEFAULT_SELECTION_STATE`
- `DEFAULT_VIEWPORT_STATE`
- `DEFAULT_GRID_CONFIG_STATE`
- `DEFAULT_ACTION_LOCK_STATE`

These are used by `GridStateStore` for initialization and `clear()`.

### Serialization
- `SerializedGridState` is the JSON-compatible format for persistence
- Maps become arrays (Maps don't serialize to JSON)
- `GRID_STATE_VERSION` is currently `'2.0'`

## TODO

- [x] Create all state type files
- [x] Update GridStateStore to import from types/state/
- [x] Clean up types/grid.ts and types/layers.ts
- [x] Add default value exports
- [ ] (Future Phase 1) Add event type definitions in core/events/
- [ ] (Future) Migrate managers to import directly from types/state/
