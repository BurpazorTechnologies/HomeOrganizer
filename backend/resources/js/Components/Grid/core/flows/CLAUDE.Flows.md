# CLAUDE.Flows.md

## Purpose
Documents the Flow system - event-driven orchestration that replaces direct manager-to-manager calls. Flows subscribe to events, dispatch commands, and coordinate multi-step operations through the EventBus.

## Current State
- Phase: 4 (Flow Orchestrators)
- Status: Complete - Flows created alongside legacy StepOrchestrator
- Last Updated: 2026-01-13

## Architecture

### Flow vs Orchestrator Comparison

**Old Pattern (StepOrchestrator):**
```typescript
// Direct manager calls - tight coupling
stepOrchestrator.createChildAreaStep() {
  const layer = layerManager.createLayer();
  const shape = shapeManager.createRectangle();
  selectionManager.select(shape.id);
  labelManager.updateLabel(shape.id);
}
```

**New Pattern (Flows):**
```typescript
// Event-based - loose coupling
class CreateHomeAreaFlow extends BaseFlow {
  setupSubscriptions() {
    this.on('CREATE_HOME_AREA_REQUESTED', this.handleRequest);
  }

  handleRequest(payload) {
    this.dispatch({ type: 'SHAPE_CREATE', payload: {...} });
    this.dispatch({ type: 'LAYER_ADD_SHAPE', payload: {...} });
    this.emit({ type: 'HOME_AREA_CREATED', payload: {...} });
  }
}
```

## Structure

```
core/flows/
├── BaseFlow.ts              # Abstract base class for all flows
├── CreateHomeAreaFlow.ts    # Step 1 home area creation
├── StepTransitionFlow.ts    # Step transitions & layer orchestration
├── ShapeCreationFlow.ts     # Child area creation (Step 2+)
├── index.ts                 # Public exports + FlowRegistry
└── CLAUDE.Flows.md          # This context file
```

## Flow Catalog

| Flow | Events Subscribed | Commands Dispatched | Events Emitted |
|------|-------------------|---------------------|----------------|
| CreateHomeAreaFlow | CREATE_HOME_AREA_REQUESTED | SHAPE_CREATE, SHAPE_SET_ROOT, LAYER_ADD_SHAPE, SELECTION_SELECT | HOME_AREA_CREATED |
| StepTransitionFlow | STEP_TRANSITION_REQUESTED, SAVE_REQUESTED | LAYER_CREATE, LAYER_LOCK/UNLOCK, LAYER_SET_CURRENT, STEP_SET_CURRENT, STEP_SET_SAVED, SELECTION_DESELECT | STEP_TRANSITION_COMPLETED |
| ShapeCreationFlow | CREATE_CHILD_AREA_REQUESTED, SHAPE_DELETE_REQUESTED | SHAPE_CREATE, SHAPE_ADD_CHILD, SHAPE_REMOVE_CHILD, LAYER_ADD_SHAPE, LAYER_REMOVE_SHAPE, SELECTION_SELECT/DESELECT, SHAPE_DELETE | CHILD_AREA_CREATED |

## Usage Examples

### Starting Flows via FlowRegistry

```typescript
import { createFlowRegistry, startAllFlows, destroyAllFlows } from '@/Components/Grid/core/flows';

// Create and start all flows
const flowRegistry = createFlowRegistry({ eventBus, store });
startAllFlows(flowRegistry);

// Trigger flow via event
eventBus.emit({
  type: 'CREATE_HOME_AREA_REQUESTED',
  payload: {
    position: { x: 100, y: 100 },
    layerId: 'layer_1',
    defaults: { label: 'My Home' }
  }
});

// Cleanup
destroyAllFlows(flowRegistry);
```

### Creating Individual Flow

```typescript
import { createCreateHomeAreaFlow } from '@/Components/Grid/core/flows';

const homeAreaFlow = createCreateHomeAreaFlow({ eventBus, store });
homeAreaFlow.start();

// Flow now listens for CREATE_HOME_AREA_REQUESTED events
```

## BaseFlow API

```typescript
abstract class BaseFlow {
  // Lifecycle
  start(): void;    // Begin listening for events
  pause(): void;    // Stop listening, keep state
  resume(): void;   // Resume listening
  stop(): void;     // Stop and reset
  destroy(): void;  // Full cleanup

  // State
  get state(): FlowState;  // 'idle' | 'active' | 'paused' | 'completed'

  // Protected (for subclasses)
  protected on<T>(type: GridEventType, handler: Handler): void;
  protected emit<T>(event: GridEvent): void;
  protected dispatch(command: GridCommand): CommandResult;
  protected query(query: GridQuery): QueryResult;

  // Abstract (subclasses must implement)
  protected abstract setupSubscriptions(): void;
}
```

## Event Types Added

### Flow Request Events
| Event | Payload | Purpose |
|-------|---------|---------|
| CREATE_HOME_AREA_REQUESTED | position, layerId, defaults? | Request home area creation |
| CREATE_CHILD_AREA_REQUESTED | parentShapeId, position, layerId, defaults? | Request child area creation |
| STEP_TRANSITION_REQUESTED | fromStep, toStep, parentShapeId? | Request step change |
| SHAPE_DELETE_REQUESTED | shapeId, layerId | Request shape deletion |
| SAVE_REQUESTED | step, layerId | Request save |
| LOAD_REQUESTED | step, layerId?, parentAreaId? | Request load |
| PAN_ORCHESTRATION_REQUESTED | type, panPosition, stayInPanMode? | Request pan orchestration |

### Flow Completion Events
| Event | Payload | Emitted By |
|-------|---------|------------|
| HOME_AREA_CREATED | shapeId, layerId | CreateHomeAreaFlow |
| CHILD_AREA_CREATED | shapeId, parentShapeId, layerId | ShapeCreationFlow |
| STEP_TRANSITION_COMPLETED | fromStep, toStep, layerId | StepTransitionFlow |

## Migration Status

### Phase 4 Complete
- ✅ BaseFlow created with lifecycle management
- ✅ CreateHomeAreaFlow handles Step 1 shape creation
- ✅ StepTransitionFlow handles step changes
- ✅ ShapeCreationFlow handles child area creation/deletion
- ✅ FlowRegistry for managing all flows
- ✅ Event types for request/completion patterns
- ✅ CLAUDE.Flows.md created

### StepOrchestrator Status
The legacy `StepOrchestrator` and `StepHandlers` remain in the codebase for backwards compatibility. The flows can work alongside them:

- **Flows** use EventBus for coordination (new pattern)
- **StepOrchestrator** uses direct manager calls (legacy pattern)

To fully migrate:
1. ManagerRegistry would initialize flows instead of StepOrchestrator
2. EventManager would emit flow request events instead of calling orchestrator methods
3. UI components would react to flow completion events

### Coexistence Pattern
During migration, both patterns can coexist:
```typescript
// ManagerRegistry can initialize both
this._stepOrchestrator = new StepOrchestrator(managers);  // Legacy
this._flowRegistry = createFlowRegistry({ eventBus, store });  // New
startAllFlows(this._flowRegistry);
```

## Dependencies

**Imports (BaseFlow):**
- `EventBus`, `Unsubscribe` from `../events/EventBus`
- `GridEventType`, `GridEventPayload`, `GridEvent` from `../events/types`
- `GridStateStore` from `../state/GridStateStore`
- `GridCommand`, `CommandResult` from `../commands`
- `QueryService`, `createQueryService` from `../queries`

**Imports (Specific Flows):**
- `BaseFlow`, `FlowDependencies` from `./BaseFlow`
- `ShapeState`, `AreaType`, `LayerState` from `../../types/state`
- `SHAPE_COLORS` from `../../types/constants`

**Exports (index.ts):**
- `BaseFlow`, `FlowDependencies`, `FlowState`, `FlowFactory`
- `CreateHomeAreaFlow`, `createCreateHomeAreaFlow`
- `StepTransitionFlow`, `createStepTransitionFlow`
- `ShapeCreationFlow`, `createShapeCreationFlow`
- `FlowRegistry`, `createFlowRegistry`
- `startAllFlows`, `stopAllFlows`, `destroyAllFlows`

## Gotchas & Notes

1. **Flows are Passive** - Flows only act when events arrive. They don't proactively do anything.

2. **Command Results** - Always check `result.success` when dispatching commands. Flows should handle failures gracefully.

3. **Event Order** - Events are processed synchronously by the EventBus. Be careful about emit order.

4. **Query Freshness** - Queries always return current state. Use them right before you need the data.

5. **Flow State** - A flow in 'paused' state keeps its internal state but doesn't receive events.

6. **No Manager References** - Flows should NEVER directly reference managers. Use only:
   - `eventBus.emit()` to emit events
   - `store.dispatch()` to execute commands
   - `queryService.query()` to read state

7. **Legacy Integration** - The flows don't yet replace StepOrchestrator in production. They're designed to work alongside it during migration.

## Testing Flows

Flows are designed for testability:

```typescript
// Create mock EventBus and Store
const mockEventBus = createEventBus({ logging: false });
const mockStore = createGridStateStore();

// Create flow
const flow = new CreateHomeAreaFlow({ eventBus: mockEventBus, store: mockStore });
flow.start();

// Trigger event
mockEventBus.emit({
  type: 'CREATE_HOME_AREA_REQUESTED',
  payload: { position: { x: 0, y: 0 }, layerId: 'test' }
});

// Assert state changed
const rootShape = mockStore.getShape(mockStore.getRootShapeId()!);
expect(rootShape).toBeDefined();
```
