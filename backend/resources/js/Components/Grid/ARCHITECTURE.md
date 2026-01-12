# Grid Component Architecture

## Overview

The Grid component uses an **Event-Driven Architecture (EDA)** with **Command/Query Responsibility Segregation (CQRS)**. This enables loose coupling between managers, predictable state mutations, and comprehensive debugging.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        EVENT BUS                                 │
│  (Central pub/sub - managers emit events, others subscribe)      │
└─────────────────────────────────────────────────────────────────┘
         ↑ emit                              ↓ subscribe
┌────────┴────────┐                  ┌───────┴────────┐
│   COMMANDS      │                  │    FLOWS       │
│  (Mutations)    │                  │  (Orchestrate) │
└────────┬────────┘                  └───────┬────────┘
         ↓                                   ↓
┌────────────────────────────────────────────────────────────────┐
│                     GridStateStore                              │
│  (Single Source of Truth - reactive state, command dispatch)    │
└────────────────────────────────────────────────────────────────┘
         ↑ mutate                            ↑ read
┌────────┴────────────────────────────────────┴──────────────────┐
│                        MANAGERS                                 │
│  Each manager:                                                  │
│  - Owns specific state domain                                   │
│  - Emits domain events                                          │
│  - Subscribes to relevant events                                │
│  - Doesn't know about other managers                            │
└────────────────────────────────────────────────────────────────┘
```

## State Management

### Central Store (GridStateStore)

All state flows through `GridStateStore` - a single source of truth with:

1. **Reactive State**: Vue 3 `reactive()` for automatic UI updates
2. **Command Dispatch**: `store.dispatch(command)` for all mutations
3. **Event Emission**: Events emitted after mutations via EventBus
4. **Mutation Tracking**: Every change logged for debugging
5. **Subscriber Pattern**: Components subscribe via `store.subscribe()`

### State Flow (Command Pattern)

```
User Action (click, drag, zoom, etc.)
    │
    ▼
Flow Orchestrator (e.g., CreateHomeAreaFlow)
    │
    ▼
store.dispatch({ type: 'SHAPE_CREATE', payload: { shape } })
    │
    ├──► Command Handler validates and applies mutation
    │
    ├──► MutationTracker logs: { action, path, prevValue, nextValue }
    │
    ├──► EventBus emits: { type: 'SHAPE_CREATED', payload: { shapeId, shape } }
    │
    ▼
Subscribers notified (managers, debug toolbar, UI)
```

## Event System

### EventBus

Central pub/sub system for decoupled communication:

```typescript
// Emit an event
eventBus.emit({ type: 'SHAPE_CREATED', payload: { shapeId, shape } });

// Subscribe to events
eventBus.on('SHAPE_CREATED', ({ shapeId }) => {
  // React to shape creation
});
```

### Event Categories

| Category | Events | Emitter |
|----------|--------|---------|
| **Shape** | `SHAPE_CREATED`, `SHAPE_UPDATED`, `SHAPE_DELETED` | Store |
| **Layer** | `LAYER_CREATED`, `LAYER_LOCKED`, `LAYER_UNLOCKED` | Store |
| **Selection** | `SELECTION_CHANGED`, `SELECTION_CLEARED` | Store |
| **Viewport** | `ZOOM_CHANGED`, `PAN_CHANGED` | Store |
| **Step** | `STEP_CHANGED`, `SAVED_STATE_CHANGED` | Store |
| **User Input** | `CANVAS_CLICKED`, `WHEEL_ZOOM`, `PAN_STARTED` | EventManager |
| **Drag** | `SHAPE_DRAG_STARTED`, `SHAPE_DRAG_ENDED` | EventManager |

## Command System

### Commands

All state mutations go through typed commands:

```typescript
// Shape commands
{ type: 'SHAPE_CREATE', payload: { shape: ShapeState } }
{ type: 'SHAPE_UPDATE', payload: { shapeId: string, updates: Partial<ShapeState> } }
{ type: 'SHAPE_DELETE', payload: { shapeId: string } }

// Layer commands
{ type: 'LAYER_CREATE', payload: { layer: LayerState } }
{ type: 'LAYER_LOCK', payload: { layerId: string } }
{ type: 'LAYER_UNLOCK', payload: { layerId: string } }

// Selection commands
{ type: 'SELECTION_SELECT', payload: { shapeId, layerId, isParent? } }
{ type: 'SELECTION_DESELECT', payload: {} }
```

### Command Execution

```typescript
const result = store.dispatch({
  type: 'SHAPE_CREATE',
  payload: { shape }
});

if (result.success) {
  console.log('Shape created:', result.data);
} else {
  console.error('Failed:', result.error);
}
```

## Flow Orchestrators

Flows coordinate multi-step operations using events:

### CreateHomeAreaFlow
Creates the initial home area (Step 1):
1. Validates no home area exists
2. Dispatches `SHAPE_CREATE` command
3. Dispatches `LAYER_ADD_SHAPE` command
4. Stores root shape ID
5. Emits completion via callbacks

### StepTransitionFlow
Handles transitions between steps:
1. Locks current layer
2. Creates new layer for next step
3. Updates selection state
4. Emits step change events

### ShapeCreationFlow
Creates child area shapes:
1. Validates within parent bounds
2. Calculates nesting depth
3. Dispatches shape and layer commands
4. Updates parent-child relationships

## Manager Responsibilities

| Manager | Purpose | Events Subscribed |
|---------|---------|-------------------|
| **ShapeManager** | Konva node lifecycle | `SELECTION_CHANGED`, `ZOOM_CHANGED` |
| **LayerManager** | Layer/Konva.Layer mapping | `LAYER_CREATED`, `LAYER_LOCKED` |
| **ZoomManager** | Viewport control | `WHEEL_ZOOM` |
| **SelectionManager** | Selection visuals | `SELECTION_CHANGED` |
| **TransformManager** | Resize/rotation | `SELECTION_CHANGED` |
| **GridManager** | Grid overlay rendering | `ZOOM_CHANGED` |
| **EventManager** | Konva event → EventBus | (emits all user input events) |
| **LabelManager** | Shape labels | `SHAPE_CREATED`, `SHAPE_UPDATED` |
| **StepOrchestrator** | Step workflow | `CANVAS_CLICKED`, flow callbacks |

## Type System

### Canonical State Types

All state types defined in `types/state/`:

```
types/state/
├── ShapeState.ts        # Shape with area semantics
├── LayerState.ts        # Layer metadata (no Konva refs)
├── AreaState.ts         # Legacy area state
├── ViewportState.ts     # Zoom, pan
├── GridConfigState.ts   # Grid size, snapping
├── SelectionState.ts    # Selected shape/layer
├── ActionLockState.ts   # Mutex for actions
├── GridState.ts         # Combined state interface
└── index.ts             # Re-exports all types
```

### Key Principles

1. **Single Source of Truth** - Types defined once in `types/state/`
2. **No Konva in State** - Konva refs managed by managers at runtime
3. **Serializable** - State can be exported to JSON for persistence

## Debug System

### Separation of Concerns

Debug functionality is completely separate from core:

```
debug/
├── types.ts           # Debug-specific type definitions
├── useDebugState.ts   # Vue composable for state aggregation
├── DebugToolbar.vue   # UI component (dev mode only)
└── CLAUDE.Debug.md    # Documentation
```

### MutationTracker

Logs all state changes for debugging:

```typescript
{
  id: 'mut_123',
  timestamp: 1704067200000,
  action: 'SHAPE/UPDATE',
  path: ['shapes', 'shape_123', 'x'],
  prevValue: 100,
  nextValue: 150,
  source: 'ShapeManager.updatePosition (line 42)'
}
```

**Note:** MutationTracker is for debugging only. No undo/redo is implemented.

## Key Design Decisions

1. **Event-Driven over Callbacks** - Managers don't know about each other
2. **CQRS Pattern** - Clear separation between commands and queries
3. **Flows for Orchestration** - Multi-step operations coordinated via events
4. **External Callbacks for Vue** - Pan mode state stays in component
5. **Action Locks** - Prevent conflicting operations (zoom during drag)

## File Structure

```
Grid/
├── GridCanvas.vue              # Main component
├── ARCHITECTURE.md             # This file
│
├── core/
│   ├── ManagerRegistry.ts      # Factory & coordinator
│   ├── EventManager.ts         # Konva → EventBus bridge
│   ├── ShapeManager.ts         # Shape lifecycle
│   ├── ZoomManager.ts          # Viewport control
│   ├── SelectionManager.ts     # Selection visuals
│   ├── LayerManager.ts         # Layer management
│   ├── GridManager.ts          # Grid overlay
│   ├── TransformManager.ts     # Resize/rotation
│   ├── LabelManager.ts         # Shape labels
│   ├── PersistenceManager.ts   # Save/load
│   ├── StepOrchestrator.ts     # Step workflow
│   │
│   ├── state/
│   │   ├── GridStateStore.ts   # Central store
│   │   └── MutationTracker.ts  # Debug logging
│   │
│   ├── events/
│   │   ├── EventBus.ts         # Pub/sub system
│   │   ├── types.ts            # Event definitions
│   │   └── CLAUDE.EventBus.md  # Documentation
│   │
│   ├── commands/
│   │   ├── types.ts            # Command definitions
│   │   ├── handlers.ts         # Command execution
│   │   └── CLAUDE.Commands.md  # Documentation
│   │
│   ├── flows/
│   │   ├── CreateHomeAreaFlow.ts
│   │   ├── StepTransitionFlow.ts
│   │   ├── ShapeCreationFlow.ts
│   │   └── CLAUDE.Flows.md     # Documentation
│   │
│   └── services/
│       └── BoundsService.ts    # Constraint queries
│
├── types/
│   ├── state/                  # Canonical state types
│   ├── shapes.ts               # Domain types
│   ├── layers.ts               # Runtime layer type
│   └── constants.ts            # Configuration
│
└── debug/
    ├── types.ts
    ├── useDebugState.ts
    ├── DebugToolbar.vue
    └── CLAUDE.Debug.md
```

## Context Documentation

CLAUDE.*.md files provide context for each subsystem:

| File | Documents |
|------|-----------|
| `types/state/CLAUDE.StateTypes.md` | All state type definitions |
| `core/events/CLAUDE.EventBus.md` | Event bus system |
| `core/commands/CLAUDE.Commands.md` | Command/Query system |
| `core/flows/CLAUDE.Flows.md` | Flow orchestrators |
| `core/CLAUDE.EventManager.md` | Konva event handling |
| `core/CLAUDE.Managers.md` | All managers overview |
| `debug/CLAUDE.Debug.md` | Debug system |

These files enable context resumption when Claude's context is exhausted.
