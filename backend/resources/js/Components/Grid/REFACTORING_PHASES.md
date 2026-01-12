# Grid Refactoring Phases

## Overview
This document breaks down the refactoring into discrete, self-contained phases.
Each phase can be completed in one context session and leaves the codebase in a working state.

---

## PHASE A: State Duplication Audit (COMPLETE THIS FIRST)

### Identified Violations

| Manager | Duplicated State | Should Be In | Priority |
|---------|------------------|--------------|----------|
| **ShapeManager** | `selectedShapeId` | SelectionManager/Store | HIGH |
| **ShapeManager** | `gridSize`, `snapEnabled` | Store (gridConfig) | MEDIUM |
| **GridManager** | `config` (size, snapEnabled, visible) | Store (gridConfig) | MEDIUM |
| **SelectionManager** | `state.selectedShapeId` | Store (selection) | HIGH |
| **TransformManager** | `gridSize`, `snapEnabled` | Store (gridConfig) | MEDIUM |
| **LayerManager** | `currentLayerId` | Store | MEDIUM |
| **AreaManager** | `areas`, `rootAreaId` | Store | LOW |

---

## PHASE B1: Remove ShapeManager.selectedShapeId
**Scope**: ShapeManager.ts only
**Risk**: LOW
**Effort**: Small

### Current Problem
```typescript
// ShapeManager.ts
private selectedShapeId: string | null = null;

// SelectionManager.ts
private state: SelectionState = { selectedShapeId: null, ... }
```

### Fix
1. Remove `selectedShapeId` from ShapeManager
2. Add getter that queries SelectionManager
3. Update all internal references

### Files Modified
- `ShapeManager.ts`

### Verification
- Shape selection still works
- Shape dragging still works
- Debug toolbar shows correct selection

---

## PHASE B2: Unify gridSize/snapEnabled to Store
**Scope**: ShapeManager, TransformManager, Store
**Risk**: MEDIUM
**Effort**: Medium

### Current Problem
```typescript
// ShapeManager.ts
private gridSize: number;
private snapEnabled: boolean;

// TransformManager.ts
private gridSize: number;
private snapEnabled: boolean;

// Store already has:
// state.gridConfig.gridSize, state.gridConfig.snapEnabled
```

### Fix
1. Remove local copies from ShapeManager
2. Remove local copies from TransformManager
3. Query from store via getter or passed reference

### Files Modified
- `ShapeManager.ts`
- `TransformManager.ts`

### Verification
- Grid snapping works during drag
- Grid snapping works during resize
- Changing grid size affects both

---

## PHASE B3: Move SelectionManager state to Store
**Scope**: SelectionManager, GridStateStore
**Risk**: MEDIUM
**Effort**: Medium

### Current Problem
```typescript
// SelectionManager.ts
private state: SelectionState = {
  selectedShapeId: null,
  selectedLayerId: null,
  isParentSelected: false,
};
```

### Fix
1. Store already has `selection` - wire SelectionManager to read/write from store
2. Remove local `state` object
3. Keep `originalStrokeWidths`, `originalDashes` local (visual-only state)

### Files Modified
- `SelectionManager.ts`
- `GridStateStore.ts` (add selection mutations if missing)

### Verification
- Selection persists correctly
- Debug toolbar shows selection state
- Visual feedback (stroke changes) still works

---

## PHASE C1: LayerManager currentLayerId to Store
**Scope**: LayerManager, GridStateStore
**Risk**: LOW
**Effort**: Small

### Fix
1. Store already has `currentLayerId` - use it
2. Remove local copy from LayerManager

### Files Modified
- `LayerManager.ts`

---

## PHASE C2: AreaManager areas to Store
**Scope**: AreaManager, GridStateStore
**Risk**: MEDIUM
**Effort**: Medium

### Fix
1. Store already has `areas` Map - AreaManager should read from store
2. Remove local `areas` Map and `rootAreaId`
3. Write operations go through store mutations

### Files Modified
- `AreaManager.ts`

---

## PHASE D: Cross-Concern Cleanup
**Scope**: Review all manager interactions
**Risk**: LOW
**Effort**: Small per fix

### Known Issues
1. StepOrchestrator accesses managers via `(this.managers as any)` - should use typed interface
2. Some managers reach into other managers' internals

---

## Execution Order

```
PHASE A (Audit) - DONE (this document)
    ↓
PHASE B1 (ShapeManager.selectedShapeId) - 15 min
    ↓
PHASE B2 (gridSize/snapEnabled) - 30 min
    ↓
PHASE B3 (SelectionManager → Store) - 30 min
    ↓
PHASE C1 (LayerManager.currentLayerId) - 15 min
    ↓
PHASE C2 (AreaManager → Store) - 30 min
    ↓
PHASE D (Cross-concern cleanup) - ongoing
```

---

## Session Handoff Template

When starting a new session, use this prompt:

```
Continue refactoring the Grid component.
Read /backend/resources/js/Components/Grid/REFACTORING_PHASES.md
Complete PHASE [X] as described.
Mark it complete when done.
```

---

## Completion Checklist

- [x] PHASE A: Audit complete
- [x] PHASE B1: ShapeManager.selectedShapeId removed (ShapeManager now queries SelectionManager)
- [x] PHASE B2: gridSize/snapEnabled unified (ShapeManager, TransformManager, and GridManager now read from Store via getters)
- [x] PHASE B3: SelectionManager uses Store (selection state now backed by GridStateStore)
- [x] PHASE C1: LayerManager.currentLayerId uses Store (currentLayerId now backed by GridStateStore)
- [x] PHASE C2: AreaManager uses Store (areas Map and rootAreaId now backed by GridStateStore)
- [x] PHASE D: Cross-concern cleanup (removed `as any` casts, added zoomManager to ManagerInstances interface)
- [x] PHASE E: Shape/Area Simplification (unified model - area semantics embedded in ShapeState)
  - E1: Extended ShapeState with areaType, childShapeIds, depth, metadata fields
  - E2: Added ShapeManager area methods (createAreaShape, getAreaShapes, etc.)
  - E3: Updated StepOrchestrator and StepHandlers to use unified model
  - E4: Updated PersistenceManager to serialize/deserialize area fields
  - E5: Marked AreaManager as deprecated (kept for backward compatibility)
