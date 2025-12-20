.PHONY: up up-fg down restart logs queue-worker config-generate

# Generate nginx configuration from templates
nginx-config-generate:
	@echo "🔧 Generating nginx configuration..."
	chmod +x ./_docker/nginx/generate-config.sh
	PROJECT_ROOT=$(PWD) ./_docker/nginx/generate-config.sh
	@echo "✅ Configuration generated"

up:
	@echo "🚀 Starting all services..."
	@echo "   APP_URL: $(APP_URL)"
	@echo "   Environment: $(APP_ENV)"
	docker compose --env-file .compose.local.env up -d
	@echo "✅ All services started"

# Start all services in foreground (show live status) using .compose.local.env
up-fg:
	@echo "🚀 Starting all services in foreground..."
	@echo "   Using env file: .compose.local.env"
	@echo "   APP_URL: $(APP_URL)"
	@echo "   Environment: $(APP_ENV)"
	docker compose --env-file .compose.local.env up

down:
	@echo "🛑 Stopping all services..."
	docker compose --env-file .compose.local.env down
	@echo "✅ All services stopped"

restart: down up

# Regenerate config and restart services (use when you change nginx config)
nginx-reconfig: config-generate restart

logs:
	docker compose --env-file .compose.local.env logs -f

# Start queue worker
queue-worker:
	@echo "⚡ Starting queue worker..."
	@echo "TODO: Implement queue worker command"
	# docker compose --env-file .compose.local.env exec backend php artisan queue:work
