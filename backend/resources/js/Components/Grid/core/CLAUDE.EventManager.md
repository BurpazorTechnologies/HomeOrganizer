# CLAUDE.EventManager.md

## Purpose
Documents the EventManager - the centralized Konva event handler that emits events via EventBus. EventManager binds to all Konva stage events (click, drag, wheel, etc.) and translates them into typed GridEvents for other managers to subscribe to.

## Current State
- Phase: 5 (EventManager Refactor)
- Status: Complete - EventManager emits events via EventBus instead of using callbacks
- Last Updated: 2026-01-13

## Architecture

### Before (Callback-based)
```typescript
// EventManager called callbacks directly
new EventManager(stage, store, {
  onZoomWheel: (delta) => zoomManager.zoomWheel(delta),
  onPanStart: () => shapeManager.setShapesDraggable(false),
  onClick: (e, pos) => stepOrchestrator.handleClick(e, stage),
  // ... many more callbacks
});
```

### After (Event-based)
```typescript
// EventManager emits events via EventBus
new EventManager(stage, store, eventBus, externalCallbacks);

// ManagerRegistry subscribes to events
eventBus.on('WHEEL_ZOOM', ({ delta }) => zoomManager.zoomWheel(delta));
eventBus.on('PAN_STARTED', () => shapeManager.setShapesDraggable(false));
eventBus.on('CANVAS_CLICKED', ({ worldPosition, target, shapeId }) =>
  stepOrchestrator.handleClickFromEvent(worldPosition, target, shapeId)
);
```

## Structure

```
core/
├── EventManager.ts              # Konva event binding, emits GridEvents
├── ManagerRegistry.ts           # Subscribes to EventManager events
└── events/
    ├── EventBus.ts              # Central pub/sub system
    └── types.ts                 # Event type definitions
```

## Events Emitted by EventManager

| Event | When Emitted | Payload |
|-------|--------------|---------|
| `CANVAS_CLICKED` | Stage click | `{ position, worldPosition, target, shapeId? }` |
| `SHAPE_DRAG_STARTED` | Shape drag begins | `{ shapeId, position }` |
| `SHAPE_DRAG_ENDED` | Shape drag ends | `{ shapeId, position, previousPosition }` |
| `WHEEL_ZOOM` | Mouse wheel | `{ delta, position }` |
| `PAN_STARTED` | Stage/middle-mouse pan begins | `{ position }` |
| `PAN_ENDED` | Pan action ends | `{ pan }` |
| `PAN_ORCHESTRATION_REQUESTED` | Pan needs orchestration | `{ type, panPosition, stayInPanMode? }` |

## External Callbacks

Some callbacks cannot be converted to events because they involve Vue reactive state owned by the component:

```typescript
export interface EventManagerExternalCallbacks {
  // Pan mode state (Vue reactive ref in component)
  getIsPanMode: () => boolean;
  setIsPanMode: (value: boolean) => void;

  // Debug refresh (triggers Vue reactive update)
  refreshDebugState: () => void;
}
```

These are the only callbacks remaining after the event-driven refactor.

## Internal State Machines

EventManager manages two internal state machines:

### 1. Wheel Throttle
```typescript
private wheelState = {
  wheelTimeout: null as NodeJS.Timeout | null,
};
```
- Throttles wheel events to ~60fps
- Acquires/releases `zooming` action lock

### 2. Middle-Mouse Pan
```typescript
private middleMouseState = {
  isActive: boolean,
  previousPanModeState: boolean,
  handler: ((e: MouseEvent) => void) | null,
};
```
- Enables temporary pan mode on middle-click
- Restores previous pan mode state on release
- Acquires/releases `panning` action lock

## Dependencies

**Imports:**
- `Konva` from 'konva'
- `GridStateStore` from `./state/GridStateStore`
- `EventBus` from `./events`
- `EVENT_TIMING` from `../types/constants`

**Used By:**
- `ManagerRegistry` - Creates and initializes EventManager
- `GridCanvas.vue` - Provides external callbacks

## Usage

### Initialization (in ManagerRegistry)
```typescript
this._eventManager = new EventManager(
  this._stage,
  this._store,
  this._eventBus,
  this._eventManagerExternalCallbacks
);
this._eventManager.initialize();
```

### Subscribing to Events (in ManagerRegistry)
```typescript
this._eventBus.on('WHEEL_ZOOM', ({ delta }) => {
  this._zoomManager?.zoomWheel(delta);
});

this._eventBus.on('CANVAS_CLICKED', ({ worldPosition, target, shapeId }) => {
  this._stepOrchestrator?.handleClickFromEvent(worldPosition, target, shapeId);
});
```

### Pan Mode Change Handler
```typescript
// Called from Vue watcher in GridCanvas.vue
eventManager.handlePanModeChange(newValue, oldValue);
```

## Migration Notes

### StepOrchestrator Changes
A new method `handleClickFromEvent` was added to StepOrchestrator:
```typescript
handleClickFromEvent(
  worldPosition: { x: number; y: number },
  target: 'canvas' | 'shape' | 'other',
  shapeId?: string
): void
```

This replaces the old `handleClick(event, stage)` which required a raw Konva event.

### ClickContext Changes
The `event` field in `ClickContext` is now optional:
```typescript
export interface ClickContext {
  target: ClickTarget;
  position: { x: number; y: number };
  shapeId?: string;
  event?: Konva.KonvaEventObject<MouseEvent>;  // Now optional
}
```

## Gotchas & Notes

1. **Action Locks** - EventManager still manages action locks directly via store (acquire/release). This is intentional - locks prevent conflicting operations.

2. **World Position Calculation** - CANVAS_CLICKED includes both screen `position` and `worldPosition` (accounting for pan/zoom). Use `worldPosition` for coordinate comparisons with shapes.

3. **PAN_ORCHESTRATION_REQUESTED** - This event signals that pan operations need orchestration (e.g., checking if we should transition back to Step 1). The `type` field distinguishes between `pan_end` and `pan_mode_exit`.

4. **Middle-Mouse State Restoration** - When middle-mouse pan ends, the previous pan mode state is restored. The EventManager emits events, but also calls `setIsPanMode` callback to update Vue state.

5. **Drag Position Tracking** - `SHAPE_DRAG_ENDED` includes `previousPosition` but it's currently set to the same value as `position` because we don't track the original position. This could be enhanced if needed.

## Testing

```typescript
// Create mock dependencies
const mockEventBus = createEventBus({ logging: false });
const mockStore = createGridStateStore();
const mockCallbacks = {
  getIsPanMode: () => false,
  setIsPanMode: jest.fn(),
  refreshDebugState: jest.fn(),
};

// Create EventManager
const eventManager = new EventManager(
  mockStage,
  mockStore,
  mockEventBus,
  mockCallbacks
);

// Initialize
eventManager.initialize();

// Simulate click - EventManager will emit CANVAS_CLICKED
mockStage.fire('click', { target: mockStage });

// Verify event was emitted
expect(mockEventBus.getLastEvent()).toMatchObject({
  type: 'CANVAS_CLICKED',
  payload: expect.objectContaining({ target: 'canvas' }),
});
```
