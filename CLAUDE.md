---
description: |
  Run all npm/node commands inside the Docker "node" service.
alwaysApply: true
---

# Node / NPM Docker Execution Rule

## Rule
All **Node / NPM-related commands** must be executed inside the Docker container.  
Do **not** run Node, npm, npx, yarn, pnpm, or related tools on the host machine.

Node is **not installed locally**.

## Mandatory Prefix
Before running any Node/NPM command:

1. Enter the container:
   ```bash
   docker compose exec node bash
````

2. Change directory:

   ```bash
   cd /var/www/html/
   ```

## Required One-Liner Format (Preferred)

```bash
docker compose exec node bash -lc 'cd /var/www/html && <COMMAND>'
```

## Examples

```bash
docker compose exec node bash -lc 'cd /var/www/html && npm install'
docker compose exec node bash -lc 'cd /var/www/html && npm run dev'
docker compose exec node bash -lc 'cd /var/www/html && npm run build'
docker compose exec node bash -lc 'cd /var/www/html && npx eslint .'
docker compose exec node bash -lc 'cd /var/www/html && node -v'
```

## Subdirectory Example

```bash
docker compose exec node bash -lc 'cd /var/www/html/frontend && npm install'
```

## Prohibited

* Installing Node locally
* Running `npm`, `node`, `npx`, `yarn`, `pnpm` on the host
* Assuming host-level Node availability

```

