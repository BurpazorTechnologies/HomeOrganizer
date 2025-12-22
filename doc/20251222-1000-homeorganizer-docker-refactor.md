---
title: "HomeOrganizer — Docker refactor (separate Node service, cleaner compose)"
id: "20251222-1000-homeorganizer-docker-refactor"
status: draft
owner: "AI"
requires_approval: true
---

# 1) Summary / Goal
- Refactor HomeOrganizer’s Docker setup (`_docker/*` + `docker-compose.yml`) to be cleaner and closer to best-practice (similar organization to `codingvibedev-site`).
- Explicitly separate the Node toolchain (Vite/Yarn/npm/nvm concerns) into its own service instead of bundling it into the PHP/backend container.

# 2) MVP Scope (Do the minimum)
- In-scope:
  - Split the current monolithic `app` container responsibilities into clear services:
    - `backend` (PHP-FPM / Laravel runtime)
    - `proxy-server` (Nginx reverse proxy)
    - `node` (Vite dev server / frontend tooling)
  - Rework `docker-compose.yml` to use anchors for shared attributes/env (like the `codingvibedev-site` compose).
  - Keep existing infra services working: MariaDB (`rds`), Postgres, Redis, RedisInsight, Mailpit, phpMyAdmin.
  - Preserve the current dev ports unless we confirm they’re unused.
- Out-of-scope:
  - Any Laravel app refactors or dependency upgrades (PHP/Node versions, Composer/NPM packages).
  - Any database schema changes (migrations/seeders) or data resets.
  - Production hardening (K8s, multi-stage production images, secrets management overhaul).

# 3) Assumptions & Constraints
- Environment: Docker Desktop on macOS; `docker compose` v2.
- DB note: pre-release => fresh install; create-only migrations (but we are not planning DB changes for this task).
- Data safety: avoid `docker compose down -v` unless explicitly requested (volumes contain DB data).
- Unknown to confirm: current Laravel code mount path in compose is `./laravel` but the repo appears to use `./backend` — we will verify and standardize during implementation.
- We’ll keep changes minimal and focused on Docker/Compose structure; no “nice-to-have” refactors.

# 4) Files to Change (strict allow-list)
- `/docker-compose.yml` — split services, add anchors, reorganize.
- `/_docker/app/Dockerfile` — repurpose/trim to backend-only responsibilities (or adjust build target used by `backend`).
- `/_docker/app/start-container.sh` — adjust if used by backend container (only if present/needed).
- `/_docker/app/supervisord.conf` — adjust/remove usage depending on how processes are split (only if present/needed).
- `/_docker/nginx/nginx.conf` — ensure proxy config targets the correct services.
- `/_docker/nginx/server/server.conf` — route PHP to `backend`, proxy Vite/HMR to `node` if needed.
- `/_docker/nginx/conf/*` — only if referenced by nginx.conf/server.conf and required for the refactor.
- `/_docker/php/*.ini` — ensure PHP settings match the new backend container usage.
- `/_docker/php/www.conf` — ensure PHP-FPM pool config matches the backend service.
- `/Makefile` — only if it references old service names/commands and breaks dev flow.
- `/makefiles/local/*.mk` — only if they reference old service names/commands and breaks dev flow.
> Only files listed here may be edited in implementation. If we discover we need additional files (e.g., a dedicated `/_docker/node/*`), we will pause and update this plan for re-approval.

# 5) Implementation Steps (ordered, checklist)
1. Inspect current `/_docker/app/*` to identify what the `app` image runs today (nginx/php-fpm/node/supervisord) and which host ports map to which process.
2. Update `/docker-compose.yml` structure:
   - Add `x-common-attributes` and `x-common-env` anchors.
   - Define `backend` service (PHP-FPM) with the Laravel code mounted.
   - Define `proxy-server` service (nginx) using existing configs; bind 80/443 to host; depend on `backend`.
   - Define `node` service using an official Node image; mount the same code; run Vite dev server; bind 5173 to host.
   - Keep DB/infra services as-is; ensure connectivity from `backend` via service names.
3. Update nginx configs to:
   - Send PHP requests to `backend:9000` (or the configured FPM port).
   - (If needed) proxy Vite dev/HMR requests to `node:5173`.
4. Align PHP-FPM settings (`www.conf`, ini files) and user permissions to prevent file permission issues on mounted volumes.
5. Validate end-to-end dev workflow with a full rebuild and basic Laravel + Vite checks.

# 6) API / Contracts (if applicable)
- Not applicable (infra-only change; no intended API changes).

# 7) Permissions / Access (if applicable)
- Not applicable.

# 8) Commands to Run
```bash
cd /Users/zor/Code/Personal/BurpazorTechnologies/HomeOrganizer

docker compose up -d --build
docker compose ps

# logs
docker compose logs -f proxy-server
docker compose logs -f backend
docker compose logs -f node

# Laravel sanity checks
docker compose exec backend php artisan -V
docker compose exec backend php artisan route:list
```

# 9) Test Plan (how we verify)
- `docker compose up -d --build` completes without errors.
- Browser checks:
  - `http://localhost/` loads (200) and nginx does not log upstream errors.
  - If HTTPS is configured: `https://localhost/` loads without nginx TLS/config errors.
  - `http://localhost:5173/` responds (Vite dev server).
  - If Laravel uses Vite in dev, the app loads assets correctly and HMR connects.
- Backend checks:
  - `docker compose exec backend php artisan about` succeeds.
  - `docker compose exec backend php artisan migrate:status` succeeds (read-only sanity check).

# 10) Rollback Plan
- Revert the changed files listed above (git revert / checkout).
- `docker compose up -d --build` to return to the previous stack.
- Avoid removing volumes unless explicitly requested.

# 11) Open Questions
- Is the Laravel app directory actually `./backend` or `./laravel` for HomeOrganizer? Which do you want as the canonical path?
- Which ports are truly required in dev for HomeOrganizer: `6001`, `8080`, `9001` (currently exposed by `app`)?
- Do you want service names aligned to the `codingvibedev-site` convention (`backend`, `proxy-server`, `database`) or keep existing names where possible (e.g., `rds`)?
- What Node package manager is canonical for HomeOrganizer right now (Yarn vs npm), and is nvm actually required, or is a pinned Node image acceptable?

Approval

status: pending

approver: User

date: 2025-12-22

Reply “APPROVED” to proceed. Any change in scope requires updating this doc and re-approval.

