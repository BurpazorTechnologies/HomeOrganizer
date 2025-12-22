#!/usr/bin/env bash

if [ ! -z "1000" ]; then
    usermod -u 1000 default
fi

if [ ! -d /.composer ]; then
    mkdir /.composer
fi

chmod -R ugo+rw /.composer

cd /var/www/html

composer install --prefer-dist --ignore-platform-reqs --no-ansi --no-interaction --no-progress

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install 18
nvm use 18

npm install

# Dynamically find the node path and symlink it
NODE_PATH="$(bash -c 'source $NVM_DIR/nvm.sh && nvm which 18')"
ln -sf "$NODE_PATH" /usr/local/bin/node

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf