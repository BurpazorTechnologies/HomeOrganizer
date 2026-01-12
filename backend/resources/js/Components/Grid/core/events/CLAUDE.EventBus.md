# CLAUDE.EventBus.md

## Purpose
Central pub/sub event system for the Grid component architecture. Enables loose coupling between managers by allowing them to communicate through events rather than direct method calls.

## Current State
- Phase: 1 (Event Bus Foundation)
- Status: Complete
- Last Updated: 2026-01-13

## Structure

```
core/events/
├── index.ts           # Re-exports all public API
├── types.ts           # All GridEvent type definitions
├── EventBus.ts        # Event bus implementation
└── CLAUDE.EventBus.md # This context file
```

### Key Files

**types.ts** - Event type definitions
- 40+ event types as discriminated union (`GridEvent`)
- Helper types: `GridEventType`, `GridEventPayload<T>`, `GridEventHandler<T>`
- Events organized by category:
  - Shape events: SHAPE_CREATED, SHAPE_UPDATED, SHAPE_MOVED, SHAPE_RESIZED, SHAPE_DELETED, SHAPE_CHILD_ADDED, SHAPE_CHILD_REMOVED, ROOT_SHAPE_CHANGED
  - Layer events: LAYER_CREATED, LAYER_UPDATED, LAYER_DELETED, LAYER_LOCKED, LAYER_UNLOCKED, CURRENT_LAYER_CHANGED, LAYER_SHAPE_ADDED, LAYER_SHAPE_REMOVED
  - Area events (legacy): AREA_CREATED, AREA_UPDATED, AREA_DELETED, ROOT_AREA_CHANGED
  - Selection events: SELECTION_CHANGED, SELECTION_CLEARED
  - Viewport events: ZOOM_CHANGED, PAN_CHANGED, VIEWPORT_CHANGED
  - Grid config events: GRID_SIZE_CHANGED, SNAP_ENABLED_CHANGED, GRID_VISIBLE_CHANGED, GRID_CONFIG_CHANGED
  - Action lock events: ACTION_LOCK_ACQUIRED, ACTION_LOCK_RELEASED
  - Step events: STEP_CHANGED, SAVED_STATE_CHANGED
  - Store lifecycle events: STORE_DESERIALIZED, STORE_CLEARED
  - User interaction events: CANVAS_CLICKED, SHAPE_DRAG_STARTED, SHAPE_DRAG_ENDED, WHEEL_ZOOM, PAN_STARTED, PAN_ENDED

**EventBus.ts** - Implementation
- `createEventBus(options)` factory function
- `EventBus` interface with methods:
  - `emit<T>(event)` - Emit a typed event
  - `on<T>(type, handler)` - Subscribe to specific event type
  - `onAll(handler)` - Subscribe to all events (wildcard)
  - `off<T>(type, handler)` - Unsubscribe
  - `clear()` - Remove all subscribers
  - `subscriberCount(type?)` - Get subscriber count
  - `setLogging(enabled)` - Enable/disable debug logging

**index.ts** - Public API
- Re-exports `createEventBus`, `createEvent` from EventBus
- Re-exports all event types from types.ts

## Dependencies

**Imports:**
- `SelectionState`, `ViewportState`, `GridConfigState`, `ActionType` from `../../types/state`
- `ShapeState`, `LayerState`, `AreaState` from `../../types/state`

**Exports:**
- `EventBus` interface and `createEventBus` factory
- `createEvent` helper function
- All event type definitions

**Used By:**
- `core/state/GridStateStore.ts` - Emits events after mutations
- (Phase 2+) All managers will subscribe to events

## Integration with GridStateStore

The GridStateStore accepts an optional `eventBus` in its options:

```typescript
const eventBus = createEventBus({ logging: true });
const store = createGridStateStore({ eventBus });

// Store now emits events after every mutation
eventBus.on('SHAPE_CREATED', ({ shapeId, shape }) => {
  console.log('Shape created:', shapeId);
});

store.addShape(newShape); // Triggers SHAPE_CREATED event
```

## Event Flow Pattern

1. **Mutation happens** in GridStateStore (e.g., `addShape()`)
2. **State updates** via Vue reactivity
3. **Subscribers notified** via `notify()` (existing pattern)
4. **Event emitted** via `emit()` to EventBus
5. **Handlers invoked** for all subscribers to that event type

## Gotchas & Notes

- Events are **synchronous** - handlers run immediately during emit
- Event bus is **optional** - store works without it (backwards compatible)
- Events are emitted **after** state mutation and notify()
- Handlers receive **copies** of state objects (not references)
- Wildcard handlers (`onAll`) receive the full event object
- Type safety is enforced via discriminated unions
- Debug logging can be enabled for development

## TODO (Future Phases)

- [ ] Phase 2: Migrate managers to emit/subscribe to events
- [ ] Phase 3: Add command/query separation with dispatch()
- [ ] Phase 4: Create flow orchestrators using event subscriptions
- [ ] Phase 5: Refactor EventManager to use EventBus
