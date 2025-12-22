#!/usr/bin/env bash

if [ ! -z "1000" ]; then
    usermod -u 1000 default
fi

if [ ! -d /.composer ]; then
    mkdir /.composer
fi

chmod -R ugo+rw /.composer

SSL_DIR="/etc/nginx/ssl"
SSL_KEY="${SSL_DIR}/nginx-selfsigned.key"
SSL_CRT="${SSL_DIR}/nginx-selfsigned.crt"
SSL_CN="${SSL_CN:-local.homeorganizer.xyz}"

mkdir -p "${SSL_DIR}"

if [ ! -f "${SSL_KEY}" ] || [ ! -f "${SSL_CRT}" ]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "${SSL_KEY}" \
        -out "${SSL_CRT}" \
        -subj "/CN=${SSL_CN}"

    chmod 644 "${SSL_KEY}" "${SSL_CRT}"
fi

cd /var/www/html

composer install --prefer-dist --ignore-platform-reqs --no-ansi --no-interaction --no-progress

exec /usr/sbin/php-fpm8.4 -F