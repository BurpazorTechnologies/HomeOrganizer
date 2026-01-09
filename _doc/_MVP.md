
# Flutter Home Inventory Canvas — MVP Roadmap (Technical)

## MVP Goal
Build a Flutter app that lets users:
- Log in (email + password)
- Create/open a **Home** (project root)
- Organize nested containers visually on a **zoomable canvas** (grid + rectangles)
- Label containers and manage per-container item lists
- Share a Home with other users
- Collaborate in real time (multi-user edits + presence)

Backend is assumed to exist (auth + persistence + realtime endpoints). Backend planning is out of scope here.

---

## Scope

### In Scope (MVP)
- Auth: email/password login, session persistence
- Home/project: create/list/open/delete (as allowed)
- Canvas:
  - Infinite-ish grid
  - Pan/zoom
  - Rectangles only (square/rectangle)
  - Selection, create, move, resize
  - Nesting: containers inside containers
  - Reparent (drag into another container)
  - Labels
- Sidebar:
  - Zoom/focus-based content (LOD navigation)
  - Breadcrumbs
  - Properties editor for selected/focus container
  - Item list CRUD for focus container
- Sharing:
  - Invite by email
  - Roles: owner/editor/viewer
- Realtime collaboration:
  - Op-based sync over WebSocket
  - Presence: selection/cursor/viewport

### Out of Scope (MVP)
- Arbitrary shapes beyond rectangle
- Rich constraints (complex snapping rules, alignment tools, auto-layout)
- Full offline-first conflict-free merging (CRDT) — keep as upgrade path
- Advanced history/undo (basic local undo optional)

---

## Key Architecture Decisions (Client)

### Rendering & Interaction
- Use:
  - `InteractiveViewer`
  - `TransformationController`
  - `CustomPaint` + `CustomPainter`
- Maintain a single `Matrix4` transform (pan/zoom).
- Coordinate conversions:
  - **screen -> world** via inverse transform (for hit-test and placement)
  - **world -> screen** via transform (for overlays/handles if needed)
- Rendering strategy:
  - Grid drawn in world space (LOD-aware)
  - Nodes drawn as rectangles + labels
  - Level-of-detail rendering based on zoom scale:
    - Zoomed out: only top-level nodes + labels
    - Medium: show children outlines + minimal labels
    - Zoomed in: show detailed labels + badges + item counts

### State Management
- One authoritative in-memory document state: `HomeDocument`
- Unidirectional updates via **operations** (ops) and reducers:
  - UI emits `Op`
  - Reducer applies to state (optimistic)
  - Realtime/persistence layer sends to backend
  - Incoming ops apply through the same reducer

Recommended: Riverpod or BLoC (choose one and stick to it).

### Realtime Transport
- WebSocket room subscription by Home:
  - Channel: `home:{homeId}`
- Op-based protocol:
  - Client sends ops, server orders and broadcasts ops with assigned `rev`.

### Collaboration Algorithm (MVP)
- **Server-ordered ops**, optimistic local apply.
- Reconciliation:
  - Track `rev` (server revision)
  - Each outgoing op has `baseRev`
  - If server applies out-of-date op, server rebases or applies last-write-wins per field.
- Upgrade path (later):
  - Replace op engine with CRDT (Yjs-like) if offline merge becomes required.

---

## Data Model (Client)

### Node (Container)
A node is a rectangle that may contain:
- child nodes
- items
- label

Recommended: store geometry in **parent-local coordinates**.

```ts
Node {
  id: string
  type: enum // home|floor|room|section|cabinet|drawer|itemContainer
  parentId: string | null
  rect: { x: double, y: double, w: double, h: double } // parent-local coords
  label: string
  childrenIds: string[]
  items: Item[] // optional, any node can have items
  meta: { createdAt, updatedAt, createdBy }
}
````

### Item

```ts
Item {
  id: string
  name: string
  qty: number
  notes?: string
  tags?: string[]
  meta: { createdAt, updatedAt, createdBy }
}
```

### Document

```ts
HomeDocument {
  homeId: string
  rootNodeId: string
  nodesById: Map<string, Node>
  rev: number              // last server revision applied
  pendingOps: Queue<Op>    // optimistic ops awaiting ACK
}
```

---

## Canvas Engine Requirements

### Hit Testing

* Input: world point
* Output: deepest node containing point (by traversing children)
* Use:

  * bounding box containment checks
  * consistent z-order within parent (childrenIds order)

### Constraints

MVP constraints:

* Child stays inside parent bounds (clamp after move/resize)
* Minimum size per node (e.g., 24x24 world units)
* Optional padding within parent

### Reparenting

Drag a node and drop into another container:

* Determine new parent by hit-testing drop point
* Convert geometry:

  * old rect in old parent-local -> world -> new parent-local
* Update:

  * `parentId`
  * `childrenIds` ordering in old/new parents
  * rect recalculated

### Snapping (Basic)

* Grid snap toggle:

  * snap x/y/w/h to nearest `gridStep` in world units

---

## Sidebar (Zoom + Focus Rules)

### Definitions

* `zoomScale`: derived from transform matrix
* `focusNodeId`: one of:

  * Selected node, else
  * Deepest node containing viewport center, else
  * Root

### Sidebar Content Rules (MVP)

* Zoomed out (scale < A):

  * List Floors and Rooms
  * Minimal properties panel (name, count)
* Medium (A..B):

  * Tree list of focus node’s child containers
  * Breadcrumbs always visible
* Zoomed in (scale > B):

  * Focus node properties editor
  * Item list editor for focus node

Always show breadcrumbs:
`Home > Floor 1 > Room 1 > Cabinet 1 > Drawer 1`

---

## Operation Protocol (Realtime + Persistence)

### Op Envelope

```ts
Op {
  opId: string         // uuid
  homeId: string
  actorId: string
  baseRev: number      // client's last known rev at time of creation
  ts: number           // client timestamp (ms)
  type: string
  payload: object
}
```

### Minimum Op Types (MVP)

Nodes:

* `node.create` (parentId, rect, type, label)
* `node.updateRect` (id, rect)
* `node.rename` (id, label)
* `node.reparent` (id, newParentId, newRect)
* `node.delete` (id, cascade=true)
* `node.reorderChildren` (parentId, orderedChildIds)

Items:

* `item.add` (nodeId, item)
* `item.update` (nodeId, itemId, patch)
* `item.remove` (nodeId, itemId)

Presence:

* `presence.selection` (nodeId)
* `presence.cursor` (worldX, worldY)
* `presence.viewport` (matrix or simplified camera params)

### Server ACK / Broadcast

Server returns/broadcasts:

```ts
OpApplied {
  op: Op
  appliedRev: number
}
```

Client rules:

* Apply local ops immediately
* On ACK:

  * remove from pending queue
  * update `rev`
* On receiving remote op:

  * apply via reducer
  * update `rev`
* On baseRev mismatch:

  * if state diverges, do a resync flow (below)

---

## Reconnect + Resync (MVP)

* On WS disconnect:

  * keep accepting local ops into `pendingOps`
* On reconnect:

  * rejoin `home:{homeId}`
  * request server for:

    * either ops since `rev`
    * or full snapshot if rev gap too large
* Apply:

  * snapshot sets state
  * then replay `pendingOps` on top (client rebase)

---

## MVP Milestones (Deliverables + Acceptance Criteria)

### M0 — Flutter App Skeleton

Deliverables:

* Project structure (features/shared)
* Routing: `AuthGate -> HomeList -> Editor`
* Theme + responsive layout (desktop-ready)

Acceptance:

* App runs; navigation works; editor placeholder renders

---

### M1 — Authentication (Email/Password)

Deliverables:

* Login screen (validation)
* Token/session persistence (secure storage)
* Logout, route guards

Acceptance:

* Login works, persists after restart, logout returns to login

---

### M2 — Home CRUD + Role Surface

Deliverables:

* Home list: owned/shared
* Create Home (name)
* Open Home editor
* UI role surface: owner/editor/viewer (disable edit actions if viewer)

Acceptance:

* Can create/open multiple Homes; viewer cannot edit

---

### M3 — Canvas v1 (Grid + Pan/Zoom + Render)

Deliverables:

* `InteractiveViewer` + `TransformationController`
* World/screen conversion utils
* Grid rendering (world space)
* Node rendering: rectangle + label
* Selection via hit-test

Acceptance:

* Smooth pan/zoom; selection reliable at any zoom

---

### M4 — Editing Basics (Create/Move/Resize/Delete/Rename)

Deliverables:

* Toolbar: add child node to selected/focus parent
* Drag move with clamping within parent
* Resize handles + min size
* Delete node (cascade)
* Rename inline or in sidebar
* Grid snap toggle (basic)

Acceptance:

* Build hierarchy quickly: Floor -> Room -> Cabinet -> Drawer

---

### M5 — True Nesting + Reparenting

Deliverables:

* Deep hit-test + correct selection priority
* Drag node into container to reparent
* Local-to-world-to-local rect conversion
* Maintain children ordering

Acceptance:

* Reparenting works with predictable geometry and constraints

---

### M6 — Sidebar v1 (Zoom-Driven Navigation + Breadcrumbs)

Deliverables:

* Breadcrumb component
* Tree view of containers at medium zoom
* Properties editor (label, type, rect numeric fields optional)
* Zoom/focus rules wired to sidebar content

Acceptance:

* Sidebar changes correctly with zoom/focus without losing context

---

### M7 — Items List per Container

Deliverables:

* Item list CRUD in sidebar for focus node
* Item count badges on canvas (LOD)
* Optional: aggregated counts for parents

Acceptance:

* Drawer shows items; room shows child containers and summary counts

---

### M8 — Persistence + Resync (Client Mechanics)

Deliverables:

* Load snapshot on open
* Autosave strategy:

  * send ops to backend
  * debounced batching optional
* Pending op queue + retry
* Reconnect + resync workflow (snapshot fallback)

Acceptance:

* Network drop doesn’t permanently break editing; state recovers after reconnect

---

### M9 — Sharing + Realtime Collaboration (MVP)

Deliverables:

* Share dialog: invite by email, role selection
* WS connect + join room `home:{homeId}`
* Send/receive ops:

  * local optimistic apply
  * apply remote ops
  * reconcile with ACK + rev updates
* Presence:

  * collaborators list
  * highlight selection + optional cursor
* Basic conflict handling:

  * server-ordered ops
  * last-write-wins per field
  * resync on large divergence

Acceptance:

* Two clients edit same Home concurrently:

  * moves/resizes/renames/items appear live
  * presence visible
  * reconnect is stable

---

## Test Plan (Minimum)

### Unit Tests

* Rect math: clamp, min size
* Transform conversions: screen<->world, local<->world
* Hit-testing and deepest-node selection
* Reparent rect conversion correctness
* Op reducer correctness (pure deterministic)

### Golden/Widget Tests

* Canvas rendering at defined zoom levels (LOD)
* Sidebar content changes with zoom/focus

### Integration Tests

* Op send/ACK flow
* Reconnect + resync + pending replay
* Role-based UI permissions

### Manual Multi-User Session

* Two devices: concurrent edits + presence
* Stress: rapid drag/resize, high zoom changes

---

## Suggested Module Layout

```
lib/
  shared/
    theme/
    widgets/
    utils/          // matrix, geometry, ids
    storage/        // secure storage, caching
    network/        // api client, ws client
  features/
    auth/
      ui/
      state/
      data/
    homes/
      ui/
      state/
      data/         // list/create/share
    editor/
      domain/       // Node, Item, Op models
      engine/       // hit-test, constraints, snapping, transforms
      state/        // document store + reducer
      realtime/     // ws room, presence, op queue
      ui/
        canvas/
        sidebar/
        toolbar/
```

---

## MVP Completion Checklist

* [ ] Auth login + session persistence
* [ ] Home CRUD + list owned/shared
* [ ] Canvas pan/zoom + grid + rect nodes + labels
* [ ] Create/move/resize/delete/rename
* [ ] True nesting + reparenting
* [ ] Zoom/focus-driven sidebar + breadcrumbs
* [ ] Item list CRUD per container
* [ ] Snapshot load + op-based save + reconnect resync
* [ ] Sharing + roles + realtime ops + presence

---

```
::contentReference[oaicite:0]{index=0}
```
