# Grid Component Architecture

## State Management Pattern

### Central Store (GridStateStore)

All state flows through `GridStateStore` - a single source of truth with:

1. **Reactive State**: Vue 3 `reactive()` for automatic UI updates
2. **Mutation Tracking**: Every change logged with action name, before/after values, and source location
3. **Subscriber Pattern**: Components subscribe to state changes via `store.subscribe()`

### State Flow

```
User Action (click, drag, zoom, etc.)
    │
    ▼
Manager Method (e.g., zoomManager.zoomIn())
    │
    ▼
Store Mutation (e.g., store.setZoom(newZoom))
    │
    ├──► MutationTracker logs: { action, path, prevValue, nextValue, source }
    │
    ▼
notify() called
    │
    ▼
All Subscribers notified
    ├── Debug Toolbar updates
    ├── (Future) WebSocket broadcasts
    └── (Future) Other listeners
```

### Key Principles

1. **Managers don't hold state** - They read from and write to the store
2. **All mutations go through store** - Never mutate state directly
3. **Every mutation calls notify()** - Subscribers always get updated
4. **No manual refresh calls** - Subscribe pattern handles updates automatically

### Example: Adding New State

When adding new state (e.g., gridConfig):

1. Add interface to `GridStateStore.ts`:
```typescript
export interface GridConfigState {
  gridSize: number;
  snapEnabled: boolean;
  gridVisible: boolean;
}
```

2. Add to `GridState` interface:
```typescript
export interface GridState {
  // ... existing
  gridConfig: GridConfigState;
}
```

3. Add initial state in `createGridStateStore()`:
```typescript
const state = reactive<GridState>({
  // ... existing
  gridConfig: {
    gridSize: 20,
    snapEnabled: true,
    gridVisible: true,
  },
});
```

4. Add mutation methods with tracking:
```typescript
setGridSize(size: number): void {
  const prev = state.gridConfig.gridSize;
  state.gridConfig.gridSize = size;
  tracker.record('GRID_CONFIG/SET_SIZE', ['gridConfig', 'gridSize'], prev, size);
  notify(); // CRITICAL: Always call notify()
},
```

5. Add to store interface:
```typescript
export interface GridStateStore {
  // ... existing
  setGridSize(size: number): void;
  setSnapEnabled(enabled: boolean): void;
  // etc.
}
```

6. Update manager to use store:
```typescript
// Before (local state):
private gridSize: number = 20;
getGridSize(): number { return this.gridSize; }

// After (store-backed):
getGridSize(): number { return this.store.state.gridConfig.gridSize; }
setGridSize(size: number): void { this.store.setGridSize(size); }
```

### Subscriber Pattern Example

```typescript
// In a composable or component:
function subscribeToStore(): void {
  unsubscribe = registry.store.subscribe(() => {
    // Called on EVERY state change
    refreshLocalState();
  });
}

// Cleanup on unmount
onUnmounted(() => {
  unsubscribe?.();
});
```

### Debug Toolbar Integration

The `useDebugState` composable:
1. Subscribes to store via `subscribeToStore()`
2. Rebuilds debug state on every notification
3. Cleans up subscription on unmount

No manual `refreshDebugState()` calls needed anywhere.

---

## Completed Phases

### Phase 1: Mutation Tracking ✅
- `MutationTracker.ts` - Logs all mutations with source location
- All store methods call `tracker.record()` before `notify()`

### Phase 2: Viewport State ✅
- `ViewportState` interface added to store
- `ZoomManager` migrated to use store
- Zoom/pan mutations tracked as `VIEWPORT/SET_ZOOM`, `VIEWPORT/SET_PAN`

### Phase 3: Grid Configuration State ✅
- `GridConfigState` interface added: `gridSize`, `snapEnabled`, `gridVisible`
- Store initialized with config from ManagerRegistry
- BoundsService now reads from store
- Debug toolbar reads gridConfig from store
- Mutations tracked as `GRID_CONFIG/SET_SIZE`, `GRID_CONFIG/SET_SNAP`, `GRID_CONFIG/SET_VISIBLE`

---

## Pending Phases

### Phase 4: Selection State Unification
- Wire `SelectionManager` to use store's `state.selection`

### Phase 5: Layer State Consolidation
- Layer metadata in store, Konva refs local

### Phase 6: Shape State Synchronization
- Shape data from store, Konva refs local

### Phase 7: Step/Orchestration State
- Centralize step workflow state

### Phase 8: Area State Alignment
- Wire `AreaManager` to store

### Phase 9: Debug Toolbar ✅
- Comprehensive debug toolbar created
- Subscribes to store for automatic updates

### Phase 10: Cleanup & Optimization
- Remove legacy code paths
- Add computed properties for derived state
