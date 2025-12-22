.PHONY: build clean test lint format bash-backend bash-database bash-proxy frontend-dev frontend-clean rbac-refresh fix-permissions-host

build:
	@echo "🔨 Building all services..."
	docker compose --env-file .compose.local.env build
	@echo "✅ Build complete"

clean:
	@echo "🧹 Cleaning up..."
	docker compose --env-file .compose.local.env down -v --remove-orphans
	@echo "✅ Cleanup complete"

test:
	@echo "🧪 Running tests..."
	@echo "TODO: Implement test commands"
	docker compose --env-file .compose.local.env exec backend php artisan test

format:
	@echo "✨ Formatting code..."
	@echo "TODO: Implement formatting commands"
	# docker compose --env-file .compose.local.env exec frontend npm run format

fix-permissions-host:
	@echo "🛠  Host: chown to current user and open perms (dev only)..."
	sudo chown -R $$(id -u):$$(id -g) backend/storage backend/bootstrap/cache || true
	sudo chmod -R 777 backend/storage backend/bootstrap/cache || true
	@echo "✅ Host permissions opened (dev)"

bash-backend:
	@echo "🐚 Entering backend service bash shell..."
	docker compose --env-file .compose.local.env exec backend bash

bash-database:
	@echo "🐚 Entering database service bash shell..."
	docker compose --env-file .compose.local.env exec database bash

bash-proxy:
	@echo "🐚 Entering proxy service bash shell..."
	docker compose --env-file .compose.local.env exec proxy-server bash

