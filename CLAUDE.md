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

````md
---
description: |
  Run all npm/node commands inside the Docker "node" service.
  Always use user-chrome-devtools MCP to check logs automatically. Do not ask the user to send logs unless MCP cannot retrieve them.
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

# Chrome DevTools Logging Rule (MCP)

## Rule

Always use the `user-chrome-devtools` MCP to check logs automatically:

* Console errors/warnings
* Network failures (4xx/5xx), blocked requests, CORS, mixed content
* Failed source maps / runtime exceptions

Do **not** instruct the user to copy/paste logs or screenshots unless:

* MCP cannot access the environment, or
* MCP returns incomplete/empty results

## Prohibited

* Installing Node locally
* Running `npm`, `node`, `npx`, `yarn`, `pnpm` on the host
* Assuming host-level Node availability
* Asking the user to send logs without first attempting `user-chrome-devtools` MCP

```
```
