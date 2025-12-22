include makefiles/config.mk

include makefiles/local/setup.mk
include makefiles/local/services.mk
include makefiles/local/development.mk

.PHONY: svc-connect-proxy ssl-sync

svc-connect-backend:
	@docker compose exec backend bash

svc-connect-node:
	@docker compose exec node bash

svc-connect-proxy:
	@echo "🐚 Entering proxy service bash shell..."
	docker compose exec proxy-server bash

svc-pg-migrate:
	@docker compose exec backend php artisan pg:migrate --fresh

svc-backend-reverb:
	@docker compose exec app php artisan reverb:start --port=6001 --debug

svc-postgres-init:
	@docker compose exec postgres bash /docker-entrypoint-initdb.d/10-create-database.sh

ssl-sync:
	@echo "Syncing backend SSL cert to Flutter assets/cert.pem..."
	@mkdir -p home_organizer_flutter_app/assets
	@docker compose up -d backend
	@docker compose exec -T backend bash -lc 'while [ ! -f /etc/nginx/ssl/nginx-selfsigned.crt ]; do sleep 1; done; cat /etc/nginx/ssl/nginx-selfsigned.crt' > home_organizer_flutter_app/assets/cert.pem
	@echo "Wrote home_organizer_flutter_app/assets/cert.pem"