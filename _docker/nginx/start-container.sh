#!/bin/bash
set -e

echo "Waiting for SSL certs..."
while [ ! -f /etc/nginx/ssl/nginx-selfsigned.key ] || [ ! -f /etc/nginx/ssl/nginx-selfsigned.crt ]; do
  echo "Waiting for SSL certs in /etc/nginx/ssl ..."
  sleep 1
done

echo "SSL certs found. Starting nginx..."
exec /usr/sbin/nginx -g "daemon off;"

