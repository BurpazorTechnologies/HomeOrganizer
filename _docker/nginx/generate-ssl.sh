#!/bin/bash

# Generate self-signed SSL certificates for nginx
# Run this script from the project root or _docker/nginx directory

# Source config if available
if [ -f "../../makefiles/config.mk" ]; then
    source ../../makefiles/config.mk
fi

SSL_DIR="${SSL_CERT_DIR:-./_docker/nginx/ssl}"
CERT_FILE="$SSL_DIR/cert.pem"
KEY_FILE="$SSL_DIR/key.pem"
DOMAIN="${APP_URL:-localhost}"

# Extract domain from URL (remove https:// and paths)
DOMAIN=$(echo "$DOMAIN" | sed 's|https\?://||' | sed 's|/.*||')

# Create ssl directory if it doesn't exist
mkdir -p "$SSL_DIR"

# Generate private key
openssl genrsa -out "$KEY_FILE" 2048

# Generate certificate with the domain
openssl req -new -x509 -key "$KEY_FILE" -out "$CERT_FILE" -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"

# Set proper permissions
chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"

echo "SSL certificates generated:"
echo "  Domain: $DOMAIN"
echo "  Certificate: $CERT_FILE"
echo "  Private Key: $KEY_FILE"
echo ""
echo "To use these certificates, make sure your nginx configuration includes:"
echo "  ssl_certificate /etc/nginx/ssl/cert.pem;"
echo "  ssl_certificate_key /etc/nginx/ssl/key.pem;"
