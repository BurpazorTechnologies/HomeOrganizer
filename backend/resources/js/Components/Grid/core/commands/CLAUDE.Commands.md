# CLAUDE.Commands.md

## Purpose
Documents the Command/Query Responsibility Segregation (CQRS) pattern implementation for the Grid system. Commands modify state, queries read state - both are typed and go through centralized routing.

## Current State
- Phase: 3 (Command/Query Separation)
- Status: Complete
- Last Updated: 2026-01-13

## Structure

```
core/
├── commands/
│   ├── types.ts              # GridCommand union type + individual command interfaces
│   ├── handlers.ts           # Command execution logic + routing
│   ├── index.ts              # Public exports
│   └── CLAUDE.Commands.md    # This context file
│
├── queries/
│   ├── types.ts              # GridQuery union type + individual query interfaces
│   ├── QueryService.ts       # Query execution + createQueryService factory
│   └── index.ts              # Public exports
│
└── state/
    └── GridStateStore.ts     # Now has dispatch() method for commands
```

## Command Pattern

### Command Flow
```
store.dispatch({ type: 'SHAPE_CREATE', payload: { shape } })
  → executeCommand() in handlers.ts
  → handleShapeCreate() calls store.addShape()
  → store mutates state
  → store emits SHAPE_CREATED event
  → returns { success: true }
```

### Command Structure
```typescript
interface CreateShapeCommand {
  type: 'SHAPE_CREATE';
  payload: {
    shape: ShapeState;
  };
}

// All commands follow this pattern:
// - type: DOMAIN_ACTION (e.g., SHAPE_CREATE, LAYER_LOCK)
// - payload: Contains all data needed for the operation
```

### Available Commands

| Domain | Command | Payload |
|--------|---------|---------|
| Shape | SHAPE_CREATE | { shape: ShapeState } |
| Shape | SHAPE_UPDATE | { shapeId, updates } |
| Shape | SHAPE_MOVE | { shapeId, x, y } |
| Shape | SHAPE_RESIZE | { shapeId, width, height } |
| Shape | SHAPE_DELETE | { shapeId } |
| Shape | SHAPE_SET_ROOT | { shapeId \| null } |
| Shape | SHAPE_ADD_CHILD | { parentId, childId } |
| Shape | SHAPE_REMOVE_CHILD | { parentId, childId } |
| Layer | LAYER_CREATE | { layer: LayerState } |
| Layer | LAYER_UPDATE | { layerId, updates } |
| Layer | LAYER_DELETE | { layerId } |
| Layer | LAYER_SET_CURRENT | { layerId \| null } |
| Layer | LAYER_ADD_SHAPE | { layerId, shapeId, isPrimary? } |
| Layer | LAYER_REMOVE_SHAPE | { layerId, shapeId } |
| Layer | LAYER_LOCK | { layerId } |
| Layer | LAYER_UNLOCK | { layerId } |
| Area | AREA_CREATE | { area: AreaState } |
| Area | AREA_UPDATE | { areaId, updates } |
| Area | AREA_DELETE | { areaId } |
| Area | AREA_SET_ROOT | { areaId \| null } |
| Selection | SELECTION_SELECT | { shapeId, layerId, isParent? } |
| Selection | SELECTION_DESELECT | {} |
| Step | STEP_SET_CURRENT | { step: number } |
| Step | STEP_SET_SAVED | { isSaved: boolean } |
| Viewport | VIEWPORT_SET_ZOOM | { zoom: number } |
| Viewport | VIEWPORT_SET_PAN | { pan: { x, y } } |
| Viewport | VIEWPORT_SET | { viewport: Partial<ViewportState> } |
| Grid Config | GRID_CONFIG_SET_SIZE | { gridSize: number } |
| Grid Config | GRID_CONFIG_SET_SNAP | { snapEnabled: boolean } |
| Grid Config | GRID_CONFIG_SET_VISIBLE | { gridVisible: boolean } |
| Grid Config | GRID_CONFIG_SET | { config: Partial<GridConfigState> } |
| Action Lock | ACTION_LOCK_ACQUIRE | { action, lockerId } |
| Action Lock | ACTION_LOCK_RELEASE | { lockerId } |
| Action Lock | ACTION_LOCK_FORCE_RELEASE | {} |
| Store | STORE_DESERIALIZE | { data: SerializedGridState } |
| Store | STORE_CLEAR | {} |

## Query Pattern

### Query Flow
```
queryService.query({ type: 'GET_SHAPE', payload: { shapeId: '123' } })
  → executeQuery() in QueryService.ts
  → routes to appropriate store method
  → returns shape data (read-only)
```

### Query Structure
```typescript
interface GetShapeQuery {
  type: 'GET_SHAPE';
  payload: {
    shapeId: string;
  };
}

// Result type is inferred from QueryResultMap
type Result = QueryResult<'GET_SHAPE'>; // ShapeState | undefined
```

### Available Queries

| Domain | Query | Returns |
|--------|-------|---------|
| Shape | GET_SHAPE | ShapeState \| undefined |
| Shape | GET_SHAPE_BOUNDS | Bounds \| null |
| Shape | GET_CHILD_SHAPES | ShapeState[] |
| Shape | GET_PARENT_SHAPE | ShapeState \| undefined |
| Shape | GET_PARENT_BOUNDS | Bounds \| null |
| Shape | GET_ROOT_SHAPE | ShapeState \| undefined |
| Shape | GET_AREA_SHAPES | ShapeState[] |
| Shape | GET_SHAPES_BY_AREA_TYPE | ShapeState[] |
| Shape | GET_ALL_SHAPES | ShapeState[] |
| Layer | GET_LAYER | LayerState \| undefined |
| Layer | GET_CURRENT_LAYER | LayerState \| undefined |
| Layer | GET_ALL_LAYERS | LayerState[] |
| Layer | IS_LAYER_LOCKED | boolean |
| Layer | GET_LOCKED_LAYER_IDS | string[] |
| Selection | GET_SELECTION | SelectionState |
| Selection | GET_SELECTED_SHAPE | ShapeState \| undefined |
| Selection | IS_SHAPE_SELECTED | boolean |
| Viewport | GET_VIEWPORT | ViewportState |
| Viewport | GET_ZOOM | number |
| Viewport | GET_PAN | { x, y } |
| Grid Config | GET_GRID_CONFIG | GridConfigState |
| Grid Config | GET_GRID_SIZE | number |
| Grid Config | IS_SNAP_ENABLED | boolean |
| Grid Config | IS_GRID_VISIBLE | boolean |
| Action Lock | GET_ACTION_LOCK | ActionLockState |
| Action Lock | GET_CURRENT_ACTION | string |
| Action Lock | IS_ACTION_ALLOWED | boolean |
| Step | GET_CURRENT_STEP | number |
| Step | IS_SAVED | boolean |
| Store | SERIALIZE | SerializedGridState |

## Usage Examples

### Dispatching Commands
```typescript
import type { GridCommand } from '@/Components/Grid/core/commands';

// Via store.dispatch()
store.dispatch({
  type: 'SHAPE_CREATE',
  payload: { shape: newShape }
});

// With result checking
const result = store.dispatch({
  type: 'ACTION_LOCK_ACQUIRE',
  payload: { action: 'dragging', lockerId: 'shape-123' }
});
if (result.success && result.data) {
  // Lock acquired
}
```

### Using QueryService
```typescript
import { createQueryService } from '@/Components/Grid/core/queries';

const queryService = createQueryService(store);

// Type-safe queries
const shape = queryService.query({
  type: 'GET_SHAPE',
  payload: { shapeId: '123' }
}); // Returns ShapeState | undefined

const bounds = queryService.query({
  type: 'GET_PARENT_BOUNDS',
  payload: { childShapeId: '456' }
}); // Returns Bounds | null
```

## Dependencies

**Imports (commands/types.ts):**
- State types from `../../types/state`

**Imports (commands/handlers.ts):**
- `GridStateStore` from `../state/GridStateStore`
- All command types from `./types`

**Imports (queries/QueryService.ts):**
- `GridStateStore` from `../state/GridStateStore`
- Query types from `./types`

**Exports (commands/index.ts):**
- All command type interfaces
- `GridCommand` union type
- `executeCommand()` function
- `CommandResult` type

**Exports (queries/index.ts):**
- All query type interfaces
- `GridQuery` union type
- `createQueryService()` factory
- `QueryService` interface
- `QueryResult`, `QueryResultMap` types

## Gotchas & Notes

1. **Commands vs Direct Methods** - The store still has direct mutation methods (addShape, removeShape, etc.) for backwards compatibility. Commands call these internally. Eventually, direct methods may be deprecated.

2. **Circular Dependency** - `handlers.ts` imports from `GridStateStore` for the type, and `GridStateStore` imports `executeCommand`. We handle this with dynamic `require()` in dispatch().

3. **Command Results** - Most commands return `{ success: true }`. Some (like ACTION_LOCK_ACQUIRE) return data in `result.data`. Always check `result.success` first.

4. **Queries are Read-Only** - Queries never modify state. They return copies of data where appropriate to prevent accidental mutation.

5. **Type Safety** - Both commands and queries use discriminated unions with exhaustive switch statements. Adding a new command/query requires updating the union type AND adding a handler.

6. **Event Emission** - Commands don't emit events directly. The underlying store methods emit events after mutations.

## Migration Path

### Phase 3 Complete - Current State
- Commands defined and handlers implemented
- dispatch() method added to store
- QueryService created for read operations
- Direct methods still available (backwards compat)

### Future Migration (Optional)
- Managers could be updated to use dispatch() instead of direct methods
- Direct mutation methods could be marked deprecated
- Event subscriptions could trigger command dispatch for complex flows
