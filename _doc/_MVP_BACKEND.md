# Home Inventory Canvas — Laravel Backend MVP (No Code)

## MVP Goals
- Email + password auth for Flutter clients
- Token-based API authentication
- Homes (projects): create/list/open/update/delete (as allowed)
- Persist nested containers (nodes) + per-node items
- Sharing: invite by email, accept invite, roles (owner/editor/viewer)
- Realtime collaboration (minimum viable):
  - server-ordered ops with monotonic `rev` per Home
  - broadcast applied ops to all connected members
  - presence (cursor/selection/viewport) is ephemeral

Non-goals (MVP):
- Offline-first CRDT merge
- Complex permission systems beyond roles
- Full audit/event sourcing (beyond minimal ops log)
- Advanced search/indexing beyond basic queries

---

## Core Concepts (Backend)

### Home (Project)
A “Home” is the root container for a user’s inventory layout (floors/rooms/etc). Each Home has:
- an owner
- members with roles
- a single ordered stream of edits (`rev`)

### Node (Container)
A node is a rectangular container on the canvas. Nodes can be nested arbitrarily:
- Floor → Room → Cabinet → Drawer → ItemContainer → ...
- geometry is stored in **parent-local coordinates** (x, y, w, h)
- ordering among siblings is stored to preserve render order

### Item
Items belong to a node (typically drawers/containers) but any node can have items in MVP.

### Op (Operation)
An op is the minimal unit of change used for realtime collaboration:
- create/move/resize/rename/reparent/delete nodes
- add/update/remove items
- reorder children

Server assigns a monotonically increasing revision `applied_rev` per Home.

---

## Tables (MVP Overview)

### 1) users
Purpose: authentication identity (Laravel default)
Key fields:
- id (primary)
- email (unique)
- password_hash
- name (optional)
- timestamps

Notes:
- MVP: email must be verified? Optional. If you want fewer screens, skip email verification initially.

---

### 2) personal_access_tokens (or equivalent)
Purpose: API token auth for Flutter clients
Key fields:
- tokenable_type / tokenable_id (user)
- token (hashed)
- abilities/scopes (optional)
- last_used_at
- expires_at (optional)

Notes:
- MVP: keep a single “app” token per device/session.

---

### 3) homes
Purpose: project root + revision counter
Key fields:
- id (primary)
- owner_user_id (FK -> users)
- name
- current_rev (unsigned integer; default 0)
- timestamps

Constraints:
- owner_user_id must exist
- current_rev increments with every applied op

Indexes:
- owner_user_id
- (optional) name search index

---

### 4) home_members
Purpose: membership + role
Key fields:
- id (primary)
- home_id (FK -> homes)
- user_id (FK -> users)
- role (enum/string: owner/editor/viewer)
- joined_at (or created_at)
- timestamps

Constraints:
- unique(home_id, user_id)
- role values: `owner`, `editor`, `viewer`

Indexes:
- home_id
- user_id
- unique(home_id, user_id)

Authorization mapping (MVP):
- owner: everything
- editor: read + write nodes/items + realtime
- viewer: read-only + realtime receive + presence send optional

---

### 5) nodes
Purpose: nested containers with geometry
Key fields:
- id (primary)
- home_id (FK -> homes)
- parent_id (nullable FK -> nodes)  
  - null only for the root node (optional approach) or for top-level nodes (if you treat Home as implicit root)
- type (string/enum; examples: floor, room, section, cabinet, drawer, itemContainer)
- label (string)
- x, y, w, h (double/decimal) — **parent-local geometry**
- sort_order (int) — sibling ordering
- meta (json, nullable) — MVP extension slot (color, icon, flags)
- timestamps

Constraints:
- home_id must exist
- parent_id must be within same home_id (enforce in app logic)
- w/h > 0 (enforce in app logic; optional DB check constraints if supported)
- type is a known value (enforce in app logic)

Indexes:
- (home_id, parent_id, sort_order)
- home_id
- parent_id

Notes:
- MVP: adjacency list is enough.
- If deep queries become slow later, add materialized path or nested set later (not MVP).

---

### 6) items
Purpose: item list per node
Key fields:
- id (primary)
- home_id (FK -> homes) (denormalized for faster queries)
- node_id (FK -> nodes)
- name
- qty (unsigned int)
- notes (text, nullable)
- tags (json array, nullable)
- timestamps

Constraints:
- node_id must exist and belong to same home_id (enforce in app logic)

Indexes:
- (home_id, node_id)
- node_id
- home_id

Notes:
- MVP: do not over-normalize tags.

---

### 7) home_ops
Purpose: ordered ops log for realtime + resync
Key fields:
- op_id (primary; client-generated UUID/ULID)
- home_id (FK -> homes)
- actor_user_id (FK -> users)
- base_rev (unsigned integer)
- applied_rev (unsigned integer) — assigned by server (monotonic)
- op_type (string)
- payload (json) — op payload body
- created_at (timestamp)

Constraints:
- unique(home_id, applied_rev)
- unique(op_id) globally or within home
- applied_rev is strictly increasing per home (enforce via transaction)

Indexes:
- (home_id, applied_rev)
- actor_user_id
- home_id

Retention:
- MVP: keep last N ops or last X days (optional). If you keep everything, fine for MVP scale.

---

### 8) home_invitations
Purpose: invite-by-email flow
Key fields:
- id (primary)
- home_id (FK -> homes)
- inviter_user_id (FK -> users)
- invitee_email
- role (editor/viewer; owner not allowed via invite in MVP)
- token (random string, hashed at rest optional)
- status (pending/accepted/declined/revoked)
- expires_at (optional)
- timestamps

Constraints:
- prevent duplicate active invites: unique(home_id, invitee_email, status=pending) (enforce in app logic or DB partial index if supported)

Indexes:
- home_id
- invitee_email
- token (unique)

Notes:
- If invitee already has account, accept links membership.
- If not, allow accept after signup using same email.

---

## API Surface (MVP)

### Auth
- POST `/auth/login`
  - input: email, password
  - output: token, user profile
- POST `/auth/logout`
  - revokes current token
- GET `/me`
  - returns user + membership summary

Optional (MVP+):
- POST `/auth/register`
- POST `/auth/password/reset` flow

---

### Homes
- GET `/homes`
  - returns owned + shared homes (with role)
- POST `/homes`
  - create home; creator becomes owner and is added to members
- GET `/homes/{homeId}`
  - returns home metadata + role of current user
- PATCH `/homes/{homeId}`
  - rename home (owner only)
- DELETE `/homes/{homeId}`
  - owner only

---

### Snapshot (Open Editor)
- GET `/homes/{homeId}/snapshot`
  - returns:
    - home metadata (id, name, current_rev)
    - nodes: array
    - items: array
  - MVP: return full snapshot always (fine until very large)

Notes:
- This is what clients load on open and on resync.

---

### Nodes (Optional direct endpoints)
You can do MVP either way:
- **Option A (recommended for collaboration):** edits go through ops only; no direct node CRUD endpoints except snapshot.
- **Option B:** allow REST endpoints for single-user edits; realtime ops still exist.

For MVP collaboration, prefer **Option A**.

---

### Items (Optional direct endpoints)
Same as above: either ops only or direct endpoints.
Prefer ops only for a single source of truth.

---

### Sharing / Membership
- POST `/homes/{homeId}/invite`
  - owner only
  - input: invitee_email, role(editor/viewer)
- GET `/homes/{homeId}/invites`
  - owner only
- POST `/invites/{token}/accept`
  - requires auth; email must match invitee_email
- POST `/invites/{token}/decline`
- DELETE `/homes/{homeId}/members/{userId}` (owner only)
- PATCH `/homes/{homeId}/members/{userId}` (owner only; change role)

---

## Realtime (MVP)

### Channels
- Private channel per home: `private-home.{homeId}`
- Authorization:
  - only members can subscribe
  - viewers can subscribe read-only

### Events
1) Op applied broadcast
- event: `HomeOpApplied`
- payload:
  - homeId
  - applied_rev
  - op_id
  - actor_user_id
  - op_type
  - payload

2) Presence (ephemeral)
- event: `HomePresence`
- payload:
  - homeId
  - userId
  - selectionNodeId (nullable)
  - cursor {x,y} (nullable)
  - viewport/camera (optional minimal)
- Do not persist presence in DB (MVP)

---

## Op Processing Rules (Server-Ordered, Minimum Viable)

### Inputs from client
- op_id (unique)
- base_rev (client’s last known rev)
- op_type + payload

### Server apply flow (must be transactional)
1) Authorize user is member and has edit role:
   - editor/owner can write
   - viewer cannot write
2) Read Home current_rev (for update)
3) Validate op payload:
   - node IDs exist and belong to home
   - geometry constraints (w/h positive, etc.)
   - reparent constraints (no cycles; parent belongs to same home)
4) Apply mutation to canonical tables (nodes/items) OR apply patch logic
5) Increment `homes.current_rev` by 1, assign `applied_rev`
6) Insert row into `home_ops` with `applied_rev`
7) Broadcast `HomeOpApplied` to channel members

### Conflict policy (MVP)
- Accept ops even if base_rev is behind (clients may be stale).
- Last write wins per affected field, in server order.
- If op references missing entities (deleted already), return 409 conflict or ignore as no-op (pick one rule and keep consistent).

Recommended MVP rule:
- If target missing: return 409 with reason; client resyncs.

---

## Permissions (MVP Matrix)

| Action | Owner | Editor | Viewer |
|---|---:|---:|---:|
| Read snapshot | ✅ | ✅ | ✅ |
| Apply ops (edit) | ✅ | ✅ | ❌ |
| Invite members | ✅ | ❌ | ❌ |
| Change roles / remove members | ✅ | ❌ | ❌ |
| Receive realtime ops | ✅ | ✅ | ✅ |
| Send presence | ✅ | ✅ | ✅ (optional) |

---

## Validation Rules (MVP)
- Node geometry:
  - w > 0, h > 0
  - optional min size (e.g., 24 units) enforced server-side to keep clients consistent
- Reparent:
  - newParent must be in same home
  - cannot reparent a node under itself or its descendants
- Delete:
  - cascade delete children + items
- Label:
  - length <= 120
- Item qty:
  - qty >= 0 or >= 1 (pick one, consistent)

---

## Minimal Indexing & Performance Notes
MVP queries:
- Snapshot: fetch all nodes/items by home_id
- Canvas rendering: children by (home_id, parent_id, sort_order)

Recommended indexes:
- nodes(home_id, parent_id, sort_order)
- items(home_id, node_id)
- home_ops(home_id, applied_rev)

Avoid premature optimization. Full snapshot is acceptable for MVP unless homes become huge.

---

## Roadmap (Backend Milestones)

### B0 — Project Bootstrap
- Sanctum installed and configured
- Basic auth endpoints: login/logout/me
- Home creation + membership auto-add (owner)

Acceptance:
- Flutter can log in and get token; create a home; list homes

---

### B1 — Homes + Membership (Sharing Foundation)
- home_members roles
- authorization policies (HomePolicy / Gate checks)
- list homes (owned + shared with role)

Acceptance:
- Different users see correct homes and roles

---

### B2 — Snapshot Persistence (Nodes + Items)
- nodes + items tables
- snapshot endpoint returns full graph
- basic create home root node strategy:
  - either create explicit root node on home creation
  - or treat top-level nodes as parent_id = null

Acceptance:
- Flutter editor can load snapshot reliably

---

### B3 — Ops Endpoint (Write Path)
- POST `/homes/{homeId}/ops` (batch supported optional)
- transactional op apply
- increment rev + append home_ops
- return applied_rev + op echo

Acceptance:
- Flutter can edit by sending ops and seeing updated snapshot state

---

### B4 — Realtime Broadcast (Collaboration)
- private channels per home + auth
- broadcast `HomeOpApplied` on apply
- clients receive ops in order

Acceptance:
- Two clients see edits live

---

### B5 — Invites (Share by Email)
- create invite by email + role
- accept invite creates membership
- revoke/expire invite (optional)

Acceptance:
- Owner can share home; invited user can open and collaborate

---

### B6 — Presence (Ephemeral)
- presence event broadcast endpoint (HTTP or WS message)
- throttle/ratelimit presence events (e.g., 10–20/s per user)
- do not persist

Acceptance:
- Users can see selection/cursor of collaborators (best effort)

---

## Minimal Realtime Mechanics Summary (MVP)
- Authoritative storage: nodes/items tables
- Ordered changes: home_ops + current_rev
- Clients:
  - load snapshot + rev
  - send ops with base_rev
  - apply optimistic updates
  - receive broadcast ops and apply
  - resync via snapshot if conflict or gap detected

---

## Operational / Safety Requirements (MVP)
- Rate limit:
  - ops endpoint (to prevent spam)
  - presence endpoint (high frequency)
- Membership checks on every home-scoped request
- Logging:
  - log failed op validations with homeId/userId/opId
- Backups:
  - DB backups only (MVP)

---
