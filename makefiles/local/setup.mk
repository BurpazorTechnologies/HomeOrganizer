# Local Development Setup Commands
# This file contains setup-related commands for local development

.PHONY: ssl-generate ssl-recreate ssl-setup setup-all

# Generate SSL certificates
ssl-generate:
	@echo "🔐 Generating SSL certificates..."
	@echo "   Domain: $(APP_URL)"
	chmod +x ./_docker/nginx/generate-ssl.sh
	./_docker/nginx/generate-ssl.sh
	@echo "✅ SSL certificates generated successfully"

# Recreate SSL certificates (useful for domain changes)
ssl-recreate:
	@echo "🔄 Recreating SSL certificates..."
	@echo "   Domain: $(APP_URL)"
	@echo "   Removing old certificates..."
	rm -rf $(SSL_CERT_DIR)/cert.pem $(SSL_CERT_DIR)/key.pem 2>/dev/null || true
	@echo "   Generating new certificates..."
	chmod +x ./_docker/nginx/generate-ssl.sh
	./_docker/nginx/generate-ssl.sh
	@echo "✅ SSL certificates recreated successfully"
	@echo "💡 Run 'make restart' to apply new certificates"

# Setup SSL (make executable and generate)
ssl-setup: ssl-generate

# Complete local development setup
setup-all: ssl-setup
	@echo "🚀 Local development setup complete!"
	@echo "Run 'make up' to start all services"
