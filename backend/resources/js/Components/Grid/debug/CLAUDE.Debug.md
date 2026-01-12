# CLAUDE.Debug.md

## Purpose
Documents the debug system for the Grid component. The debug system provides real-time state inspection and debugging tools, completely separated from core functionality.

## Current State
- Phase: 6 (Cleanup & Debug Separation)
- Status: Complete
- Last Updated: 2026-01-13

## Architecture

### Design Principles
1. **Complete Separation** - Debug system only reads state, never modifies core behavior
2. **Development Only** - All debug components check `import.meta.env.DEV`
3. **Store-Backed** - Subscribes to GridStateStore for automatic updates
4. **JSON Export Format** - State can be exported in the same format as backend persistence

### Debug System Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                    GridStateStore                                │
│  (Central state - shapes, layers, selection, viewport, etc.)    │
└─────────────────────────────────────────────────────────────────┘
         │
         │ subscribe()
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    useDebugState                                 │
│  (Vue composable that aggregates state from managers)            │
│  - Reads from store                                              │
│  - Reads runtime Konva node state                               │
│  - Reads mutation history                                        │
└─────────────────────────────────────────────────────────────────┘
         │
         │ debugState ref
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DebugToolbar.vue                              │
│  (Draggable UI component with collapsible JSON sections)        │
│  - Displays all state in formatted JSON                         │
│  - Copy individual sections or all state                        │
│  - Reset canvas action                                          │
│  - Clear mutation history action                                │
└─────────────────────────────────────────────────────────────────┘
```

## Structure

```
debug/
├── CLAUDE.Debug.md          # This documentation file
├── types.ts                 # Type definitions for debug state
├── useDebugState.ts         # Vue composable for state aggregation
└── DebugToolbar.vue         # UI component for state display
```

## Dependencies

**Imports:**
- `GridStateStore` - For state subscription
- `ManagerRegistry` - For accessing managers and Konva state
- `MutationTracker` - For mutation history types

**Used By:**
- `GridCanvas.vue` - Initializes debug composable and mounts toolbar

## Debug State Structure

The `DebugState` interface aggregates:

| Section | Source | Purpose |
|---------|--------|---------|
| `actionLock` | Store | Current action in progress (pan, zoom, drag) |
| `viewport` | Store + ZoomManager | Zoom level, pan position, stage dimensions |
| `coordinates` | Stage | Global vs local coordinate systems |
| `selection` | Store + SelectionManager | Selected shape, transformer attachment |
| `shapes` | Store + ShapeManager | All shapes with runtime Konva state |
| `layers` | Store + LayerManager | Layer hierarchy, locked status |
| `areas` | Store + AreaManager | Area hierarchy (legacy) |
| `step` | StepOrchestrator | Current workflow step |
| `gridConfig` | Store + GridManager | Grid size, snapping, clip bounds |
| `konvaNodes` | ShapeManager | Runtime Konva node properties |
| `mutations` | MutationTracker | Recent state changes with source |

## Usage

### In GridCanvas.vue
```typescript
import { useDebugState } from '@/Components/Grid/debug/useDebugState';
import DebugToolbar from '@/Components/Grid/debug/DebugToolbar.vue';

// Create composable with registry accessor
const { debugState, subscribeToStore, refresh } = useDebugState(() => registry);

// After registry initialization:
subscribeToStore();

// In template:
<DebugToolbar
  :debug-state="debugState"
  :grid-size="gridSize"
  @reset="handleDebugReset"
  @clear-mutations="handleDebugClearMutations"
  @refresh="refresh"
/>
```

### Debug Toolbar Actions

| Action | Effect |
|--------|--------|
| **Reset Canvas** | Clears localStorage, reloads page |
| **Clear Log** | Clears mutation history from MutationTracker |
| **Export All** | Copies all state to clipboard as JSON |
| **Refresh** | Manually refreshes Konva runtime state |
| **Copy (per section)** | Copies individual section to clipboard |

## MutationTracker

The `MutationTracker` provides:
- Logging of all state mutations with action name, path, before/after values
- Source location extraction from stack trace
- Console logging in development mode
- History retrieval with configurable limit

**Important:** MutationTracker is for **debugging only**. It does NOT support undo/redo.
Any undo/redo code should be removed - the user explicitly stated this is not needed.

```typescript
interface MutationRecord {
  id: string;
  timestamp: number;
  action: string;
  path: string[];
  prevValue: any;
  nextValue: any;
  source: string;
}
```

## Utility Functions

### clearLocalStorage()
Available in debug mode to clear persisted grid state:
```typescript
import { localStorageService } from '@/Services/localStorage';
localStorageService.clear();
window.location.reload();
```

## Gotchas & Notes

1. **Dev Mode Only** - DebugToolbar only renders when `import.meta.env.DEV === true`

2. **Store Subscription** - Must call `subscribeToStore()` after registry is initialized

3. **Konva State** - Some runtime state (draggable, listening, etc.) requires manual refresh
   since Konva nodes don't trigger Vue reactivity

4. **Mutation Tracking** - Can be disabled via `store.disableMutationTracking()` if performance
   is impacted, but this is rarely needed

5. **No Undo/Redo** - MutationTracker records history for debugging, not for replay.
   Do not attempt to implement undo/redo - the user explicitly stated this is not needed.

6. **JSON Export Format** - The exported state matches the backend persistence format,
   enabling easy comparison between frontend state and stored data

## Testing

Debug components can be tested by:
1. Mocking ManagerRegistry with minimal state
2. Verifying useDebugState correctly aggregates state
3. Checking DebugToolbar renders sections correctly

```typescript
// Example test setup
const mockRegistry = {
  isInitialized: true,
  store: mockStore,
  shapeManager: mockShapeManager,
  // ... other managers
};

const { debugState, refresh } = useDebugState(() => mockRegistry);
refresh();
expect(debugState.value).toBeDefined();
```
