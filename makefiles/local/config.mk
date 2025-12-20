
APP_NAME ?= HomeOrganizer
APP_URL ?= https://local.homeorganizer.xyz
APP_ENV ?= local

DOCKER_COMPOSE_FILE ?= docker-compose.yml
DOCKER_NETWORK ?= homeorganizer-network

NGINX_HTTP_PORT ?= 80
NGINX_HTTPS_PORT ?= 443

SSL_CERT_DIR ?= ./_docker/nginx/ssl
SSL_CERT_FILE ?= cert.pem
SSL_KEY_FILE ?= key.pem

LOG_LEVEL ?= info

export APP_NAME
export APP_URL
export APP_ENV
export DOCKER_COMPOSE_FILE
export DOCKER_NETWORK
export NGINX_HTTP_PORT
export NGINX_HTTPS_PORT
export SSL_CERT_DIR
export SSL_CERT_FILE
export SSL_KEY_FILE
export LOG_LEVEL
