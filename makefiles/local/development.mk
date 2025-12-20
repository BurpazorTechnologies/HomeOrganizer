# Local Development Commands
# This file contains development-specific commands

.PHONY: build clean test lint format bash-backend bash-database bash-proxy frontend-dev frontend-clean rbac-refresh fix-permissions-host

# Build all services
build:
	@echo "🔨 Building all services..."
	docker compose build
	@echo "✅ Build complete"

# Clean up containers and volumes
clean:
	@echo "🧹 Cleaning up..."
	docker compose down -v --remove-orphans
	docker system prune -f
	@echo "✅ Cleanup complete"

# Run tests (placeholder for future implementation)
test:
	@echo "🧪 Running tests..."
	@echo "TODO: Implement test commands"
	# docker compose exec backend php artisan test

# Run linting (placeholder for future implementation)
lint:
	@echo "🔍 Running linters..."
	@echo "TODO: Implement linting commands"
	# docker compose exec frontend npm run lint

# Format code (placeholder for future implementation)
format:
	@echo "✨ Formatting code..."
	@echo "TODO: Implement formatting commands"
	# docker compose exec frontend npm run format

# Run Nuxt frontend in dev mode locally
frontend-dev:
	@echo "🎨 Starting frontend (Nuxt) dev server..."
	@if [ ! -d "frontend/app/node_modules" ]; then \
		echo "📦 Installing frontend dependencies..."; \
		cd frontend/app && yarn install; \
	fi
	cd frontend/app && yarn dev --open

# Clear Nuxt cache (keeps node_modules)
frontend-clean:
	@echo "🧹 Clearing frontend cache..."
	cd frontend/app && rm -rf .nuxt .output
	@echo "✅ Frontend cache cleared (node_modules preserved)"

# Reset RBAC locally: migrate fresh, seed, then generate roles/permissions
rbac-refresh:
	@echo "🔁 RBAC: clear caches, regenerate types from config, migrate fresh & seed..."
	docker compose exec backend php artisan optimize:clear
	docker compose exec backend php artisan config:clear
	docker compose exec backend php artisan rbac:codegen
	docker compose exec backend php artisan migrate:fresh --seed
	docker compose exec backend php artisan optimize
	@echo "✅ RBAC refresh complete (config → types → DB)"

# Host-side quick fix using sudo (no Docker needed)
fix-permissions-host:
	@echo "🛠  Host: chown to current user and open perms (dev only)..."
	sudo chown -R $$(id -u):$$(id -g) backend/storage backend/bootstrap/cache || true
	sudo chmod -R 777 backend/storage backend/bootstrap/cache || true
	@echo "✅ Host permissions opened (dev)"

# Enter bash shell of backend service (Laravel)
bash-backend:
	@echo "🐚 Entering backend service bash shell..."
	docker compose exec backend bash

# Enter bash shell of database service
bash-database:
	@echo "🐚 Entering database service bash shell..."
	docker compose exec database bash

# Enter bash shell of proxy service (nginx)
bash-proxy:
	@echo "🐚 Entering proxy service bash shell..."
	docker compose exec proxy-server bash
