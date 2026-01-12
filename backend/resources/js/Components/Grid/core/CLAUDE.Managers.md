# CLAUDE.Managers.md

## Purpose
Documents all core managers in the Grid system. This file provides context for understanding how managers interact with the EventBus and GridStateStore.

## Current State
- Phase: 2 (Manager Event Migration)
- Status: Complete
- Last Updated: 2026-01-13

## Structure

```
core/
├── ManagerRegistry.ts       # Factory & coordinator - creates EventBus, injects to all managers
├── GridManager.ts           # Grid visualization - subscribes to grid config events
├── ShapeManager.ts          # Shape lifecycle - prepared for event subscriptions
├── ZoomManager.ts           # Viewport zoom - deprecated callbacks, store emits events
├── SelectionManager.ts      # Selection state - subscribes to SHAPE_DELETED
├── LayerManager.ts          # Layer hierarchy - (not yet migrated)
├── TransformManager.ts      # Resize/rotation - (not yet migrated)
├── LabelManager.ts          # Shape labels - (not yet migrated)
├── EventManager.ts          # Konva event handling - (Phase 5 migration)
├── PersistenceManager.ts    # Save/load - (not yet migrated)
├── StepOrchestrator.ts      # Step workflow - (Phase 4 replacement with Flows)
├── AreaManager.ts           # Area hierarchy - (legacy, being removed)
│
├── state/
│   └── GridStateStore.ts    # Central state - emits all events via EventBus
│
├── services/
│   └── BoundsService.ts     # Live bounds queries
│
├── events/
│   ├── EventBus.ts          # Pub/sub system
│   ├── types.ts             # Event type definitions
│   └── index.ts             # Public exports
│
└── CLAUDE.Managers.md       # This context file
```

## Manager Overview

### ManagerRegistry (Coordinator)
**Role:** Creates and initializes all managers in dependency order

**EventBus Integration:**
- Creates EventBus first (with logging in dev mode)
- Passes EventBus to GridStateStore
- Injects EventBus to managers via `setEventBus()` methods
- Sets up ZOOM_CHANGED subscription for backwards-compatible zoom handling
- Cleans up EventBus on destroy()

**Key Methods:**
- `initialize()` - Creates all managers with EventBus
- `destroy()` - Cleans up all managers and EventBus
- `eventBus` getter - Provides access to shared EventBus

### GridManager (Visualization)
**Role:** Draws grid lines on canvas

**EventBus Integration:**
- `setEventBus(eventBus)` - Sets up subscriptions
- Subscribes to: `GRID_SIZE_CHANGED`, `GRID_VISIBLE_CHANGED`, `GRID_CONFIG_CHANGED`
- Auto-redraws grid when config changes

**State Source:** Reads from `GridStateStore.state.gridConfig`

### ZoomManager (Viewport)
**Role:** Manages zoom level and pan position

**EventBus Integration:**
- Stores EventBus reference (for future use)
- Does NOT emit events directly (store emits `ZOOM_CHANGED` when `setZoom()` called)
- `onZoomChange()` callback is **deprecated** - use EventBus subscription instead

**State Source:** Reads/writes via `GridStateStore` (setZoom, setPan)

### ShapeManager (Lifecycle)
**Role:** Creates/tracks Konva shape nodes, handles drag constraints

**EventBus Integration:**
- `setEventBus(eventBus)` - Sets up subscriptions (prepared for future)
- Store emits `SHAPE_CREATED`, `SHAPE_UPDATED`, `SHAPE_DELETED` on mutations

**State Source:** Reads/writes via `GridStateStore` (addShape, updateShape, removeShape)

### SelectionManager (Selection)
**Role:** Manages selected shape and visual feedback

**EventBus Integration:**
- `setEventBus(eventBus)` - Sets up subscriptions
- Subscribes to: `SHAPE_DELETED` (auto-deselects if selected shape deleted)
- Store emits `SELECTION_CHANGED`, `SELECTION_CLEARED` on selection mutations
- `onSelectionChange()` callback is **deprecated** - use EventBus subscription instead

**State Source:** Reads/writes via `GridStateStore` (select, deselect)

### Other Managers (Not Yet Migrated)
- **LayerManager**: Layer creation/management
- **TransformManager**: Shape resize/rotation
- **LabelManager**: Text labels on shapes
- **PersistenceManager**: Save/load to localStorage
- **StepOrchestrator**: Multi-step workflow coordination

These will be migrated in future phases.

## Event Flow Patterns

### Zoom Change Flow (Current)
```
User scrolls wheel
  → EventManager.handleWheel()
  → ZoomManager.zoomWheel()
  → store.setZoom()
  → ZOOM_CHANGED event emitted
  → ManagerRegistry subscription
    → GridManager.redrawGrid()
    → ShapeManager.validateChildShapeBounds()
    → callbacks.onZoomEnd()
```

### Grid Config Change Flow
```
store.setGridSize(newSize)
  → GRID_SIZE_CHANGED event emitted
  → GridManager subscription
    → GridManager.redrawGrid()
```

### Shape Deletion Flow
```
ShapeManager.deleteShape(id)
  → store.removeShape(id)
  → SHAPE_DELETED event emitted
  → SelectionManager subscription
    → If selected, auto-deselect
```

## Dependencies

**Imports (ManagerRegistry):**
- All manager classes
- `createGridStateStore` from state/GridStateStore
- `createEventBus` from events/
- `createBoundsService` from services/BoundsService

**Exports:**
- `ManagerRegistry` class
- `ManagerRegistryConfig` interface
- `ManagerRegistryCallbacks` interface

## Gotchas & Notes

1. **EventBus is optional** - Managers work without it for backwards compatibility
2. **Store emits events** - Managers don't emit events directly; they mutate store, which emits
3. **Deprecated callbacks** - `onZoomChange`, `onSelectionChange` kept for backwards compat
4. **Subscription cleanup** - All managers with EventBus have `destroy()` that clears subscriptions
5. **AreaManager missing** - Pre-existing issue, AreaManager module doesn't exist yet

## TODO (Future Phases)

- [ ] Phase 3: Add command/query separation with dispatch()
- [ ] Phase 4: Replace StepOrchestrator with event-driven Flows
- [ ] Phase 5: Refactor EventManager to use EventBus for Konva events
- [ ] Phase 6: Remove MutationTracker, cleanup deprecated callbacks
