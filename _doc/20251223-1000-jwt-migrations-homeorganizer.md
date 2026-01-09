---
title: "Align JWT token storage migrations to HomeOrganizer"
id: "20251223-1000-jwt-migrations-homeorganizer"
status: draft
owner: "AI"
requires_approval: true
---

# 1) Summary / Goal
- Update the three JWT table create-migrations (short, long, blacklist) that were copied from another project so they correctly match HomeOrganizer’s JWT behavior.
- This prevents auth/blacklist edge-case failures (notably `jwt_tokens_blacklist.jti` being too short when `JwtService` falls back to storing a 128-char `token_hash`) and keeps JWT persistence reliable for the app.

# 2) MVP Scope (Do the minimum)
- In-scope:
  - Adjust only the schema details inside the existing create-table migrations to match how HomeOrganizer currently issues/persists/blacklists JWTs.
  - Ensure the schema supports configured token hash lengths (e.g., `sha256` = 64 chars, `sha512` = 128 chars).
  - Keep changes minimal and compatible with the existing table/column names already referenced by the codebase.
- Out-of-scope:
  - Refactoring `JwtService`, controllers, or models.
  - Changing JWT secrets/algorithms/config values.
  - Adding “alter” migrations or migrating existing production data (assume pre-release fresh install).

# 3) Assumptions & Constraints
- Environment: Dockerized Laravel backend (`docker compose exec backend ...`).
- DB note: pre-release => fresh install; create-only migrations (edit these create migrations; do not add alter migrations).
- The current JWT persistence approach (tables `jwt_tokens_short`, `jwt_tokens_long`, `jwt_tokens_blacklist`) remains in use.
- Table/column names stay the same unless you explicitly request renames (renames would require expanding scope beyond the 3 migration files).

# 4) Files to Change (strict allow-list)
- `/Users/zor/Code/Personal/BurpazorTechnologies/HomeOrganizer/backend/database/migrations/2025_11_22_000700_create_jwt_tokens_short_table.php` — ensure schema matches HomeOrganizer’s short token persistence needs.
- `/Users/zor/Code/Personal/BurpazorTechnologies/HomeOrganizer/backend/database/migrations/2025_11_22_000710_create_jwt_tokens_long_table.php` — ensure schema matches HomeOrganizer’s long/refresh token persistence needs.
- `/Users/zor/Code/Personal/BurpazorTechnologies/HomeOrganizer/backend/database/migrations/2025_11_22_000720_create_jwt_tokens_blacklist_table.php` — fix blacklist schema mismatch (notably `jti` length vs `token_hash` fallback) and ensure indexes support blacklist lookups.
> Only files listed here may be edited in implementation.

# 5) Implementation Steps (ordered, checklist)
1. Confirm the intended hashing strategy for JWT storage in HomeOrganizer (keep default `sha256`, or support `sha512`/other) and confirm we want to support blacklisting tokens even if a token ever lacks a `jti` claim (fallback uses `token_hash`).
2. Update the three migrations minimally so table schemas match HomeOrganizer usage:
   - Increase `jwt_tokens_blacklist.jti` length to safely store either a normal `jti` **or** a full-length `token_hash` fallback.
   - Review any other column length/type defaults that could truncate values produced by current HomeOrganizer JWT code (keep changes minimal).
   - Add/adjust only essential indexes if needed for the current query patterns (blacklist checks by `token_type` + `token_hash` or `jti`).
3. Re-run migrations in a disposable environment to verify the schema builds cleanly.

# 6) API / Contracts (if applicable)
- N/A (schema-only change).

# 7) Permissions / Access (if applicable)
- N/A.

# 8) Commands to Run
~~~bash
docker compose exec backend php artisan migrate
~~~

9) Test Plan (how we verify)

- Run migrations on a fresh/dev database and confirm the three tables are created with the expected column lengths.
- Smoke check JWT blacklist path by generating a JWT and invalidating it; confirm a blacklist row is created without truncation.

Expected outputs.

- Migrations complete successfully.
- `jwt_tokens_blacklist.jti` can store a full-length token hash when needed (no truncation).

10) Rollback Plan

- Revert the migration file changes and re-run migrations in a disposable environment.

11) Open Questions

- Should we officially support `JWT_TOKEN_HASH_ALGO=sha512` (128 chars) in this project, or lock to `sha256`?
- Do you want blacklist entries to support tokens that might not include a `jti` claim (current code falls back to storing `token_hash` in `jti`)?

Approval

status: pending

approver: User

date: 2025-12-23

Reply “APPROVED” to proceed. Any change in scope requires updating this doc and re-approval.


---

## Implementation phase (only after approval)
- Touch **only** the files listed in **Files to Change**.
- Follow the exact **Implementation Steps**.
- Keep changes minimal; no refactors or extras unless added to the plan and re-approved.
- If anything is ambiguous, **pause and update the plan** instead of guessing.

## Output formatting requirements
- **First reply:** only the `/doc/{plan}.md` file content (as a code block).
- **Subsequent replies (post-approval):** only the requested diffs or file contents needed for the MVP; no extra commentary.
- When running Laravel tasks, show commands as `docker compose exec backend php artisan …`.

**This rule is mandatory and cannot be bypassed.**

