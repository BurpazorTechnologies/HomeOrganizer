#!/bin/sh
set -e

echo "Enabling corepack..."
corepack enable

echo "Preparing yarn@1.22.22..."
corepack prepare yarn@1.22.22 --activate

echo "Waiting for SSL certs..."
while [ ! -f /etc/nginx/ssl/nginx-selfsigned.key ] || [ ! -f /etc/nginx/ssl/nginx-selfsigned.crt ]; do
  echo "Waiting for SSL certs in /etc/nginx/ssl ..."
  sleep 1
done

echo "Configuring yarn..."
yarn config set registry "https://registry.npmjs.org/"
yarn config set network-timeout 600000 -g
yarn config set network-concurrency 1 -g

echo "Running yarn install..."
yarn install --verbose --no-lockfile --network-timeout 600000

echo "Yarn install completed. Checking for node_modules..."
if [ ! -d "node_modules" ]; then
  echo "ERROR: node_modules directory not found after install!"
  exit 1
fi

echo "Starting vite dev server..."
yarn dev

