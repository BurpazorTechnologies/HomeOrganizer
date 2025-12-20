#!/bin/bash

# Generate dynamic nginx configuration from template
# This script replaces environment variables in nginx config templates

set -e

# Resolve to the directory of this script so paths are stable
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Allow explicit project root override from Makefile
REPO_ROOT="${PROJECT_ROOT:-$SCRIPT_DIR/../..}"

# Load specific overrides from .compose.local.env if present (whitelist only)
ENV_FILE="$REPO_ROOT/.compose.local.env"
if [ -f "$ENV_FILE" ]; then
    for var in APP_URL SSL_CERT_FILE SSL_KEY_FILE BACKEND_CONTAINER_NAME; do
        if grep -qE "^${var}=" "$ENV_FILE"; then
            value=$(grep -E "^${var}=" "$ENV_FILE" | tail -n1 | sed 's/^'"$var"'=//')
            export "$var"="$value"
        fi
    done
fi

# Set default values if not set
APP_URL=${APP_URL:-"https://local.homeorganizer.xyz"}
SSL_CERT_FILE=${SSL_CERT_FILE:-"cert.pem"}
SSL_KEY_FILE=${SSL_KEY_FILE:-"key.pem"}
BACKEND_CONTAINER_NAME=${BACKEND_CONTAINER_NAME:-"homeorganizer-backend"}

# Extract domain name from URL (remove protocol)
DOMAIN_NAME=${APP_URL#https://}
DOMAIN_NAME=${DOMAIN_NAME#http://}

# Export variables for envsubst
export DOMAIN_NAME
export APP_URL
export SSL_CERT_FILE
export SSL_KEY_FILE
export BACKEND_CONTAINER_NAME

# Template directory (relative to this script)
TEMPLATE_DIR="$SCRIPT_DIR/server"
OUTPUT_DIR="$SCRIPT_DIR/server"

echo "🔧 Generating nginx configuration..."
echo "   APP_URL: $APP_URL"
echo "   DOMAIN_NAME: $DOMAIN_NAME"
echo "   SSL_CERT_FILE: $SSL_CERT_FILE"
echo "   SSL_KEY_FILE: $SSL_KEY_FILE"
echo "   BACKEND_CONTAINER_NAME: $BACKEND_CONTAINER_NAME"

# Process server.conf.template
if [ -f "$TEMPLATE_DIR/server.conf.template" ]; then
    # Use envsubst with specific variables only to avoid interfering with Nginx variables
    envsubst '$DOMAIN_NAME $APP_URL $SSL_CERT_FILE $SSL_KEY_FILE $BACKEND_CONTAINER_NAME' < "$TEMPLATE_DIR/server.conf.template" > "$OUTPUT_DIR/server.conf"
    echo "✅ Generated $OUTPUT_DIR/server.conf"
else
    echo "❌ Template file not found: $TEMPLATE_DIR/server.conf.template"
    exit 1
fi

echo "🎉 Nginx configuration generated successfully!"
