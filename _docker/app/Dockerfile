FROM ubuntu:22.04 as base

ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

RUN apt-get update && apt-get install -y --no-install-recommends  \
    apt-utils curl ca-certificates gnupg zip unzip libcap2-bin vim nano tzdata supervisor &&  \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

FROM base as php_base

RUN apt-get update \
    && mkdir -p /etc/apt/keyrings \
    && curl -sS 'https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x14aa40ec0831756756d7f66c4f4ea0aae5267a6c' | gpg --dearmor | tee /etc/apt/keyrings/ppa_ondrej_php.gpg > /dev/null \
    && echo "deb [signed-by=/etc/apt/keyrings/ppa_ondrej_php.gpg] https://ppa.launchpadcontent.net/ondrej/php/ubuntu jammy main" > /etc/apt/sources.list.d/ppa_ondrej_php.list \
    && apt-get update \
    && apt-get install -y php8.2-cli php8.2-dev php8.2-fpm \
       php8.2-pgsql php8.2-sqlite3 php8.2-gd php8.2-imagick \
       php8.2-curl \
       php8.2-imap php8.2-mysql php8.2-mbstring \
       php8.2-xml php8.2-zip php8.2-bcmath php8.2-soap \
       php8.2-intl php8.2-readline \
       php8.2-ldap \
       php8.2-msgpack php8.2-igbinary php8.2-redis php8.2-swoole \
       php8.2-memcached php8.2-pcov php8.2-xdebug \
    && curl -sLS https://getcomposer.org/installer | php -- --install-dir=/usr/bin/ --filename=composer \
    && apt-get -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

FROM php_base as node_base

# Install NVM and Node 18 for the build user (default: root)
RUN export NVM_DIR="/root/.nvm" && \
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash && \
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && \
    nvm install 18 && \
    nvm use 18

# Install Node.js system-wide for all users (for PHP-FPM, www-data, etc.) change this according 
# to latest needs in production
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

FROM node_base as nginx_base

RUN apt-get update && apt-get install -y --no-install-recommends nginx openssl

RUN mkdir -p /etc/nginx/ssl

RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/nginx/ssl/nginx-selfsigned.key -out /etc/nginx/ssl/nginx-selfsigned.crt -subj "/CN=local.homeorganizer.xyz"

RUN cat /etc/nginx/ssl/nginx-selfsigned.crt /etc/nginx/ssl/nginx-selfsigned.key > /etc/nginx/ssl/nginx-selfsigned.pem

COPY ./_docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY ./_docker/nginx/conf/*.conf /etc/nginx/conf.d/
COPY ./_docker/nginx/server/server.conf /etc/nginx/sites-available/default

FROM nginx_base as app_base

RUN groupadd --force -g 1000 default
RUN useradd -ms /bin/bash --no-user-group -g 1000 -u 1337 default

COPY ./laravel/ /var/www/html/
COPY ./_docker/app/start-container.sh /usr/local/bin/start-container.sh
COPY ./_docker/app/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY ./_docker/php/*.ini /etc/php/8.2/conf.d/
COPY ./_docker/php/www.conf /etc/php/8.2/php-fpm.d/

WORKDIR /var/www/html

RUN chown -R www-data:www-data . && \
    chmod -R 775 storage && \
    chmod -R 775 bootstrap/cache

RUN chmod +x /usr/local/bin/start-container.sh

RUN cp /etc/nginx/ssl/nginx-selfsigned.crt /usr/local/share/ca-certificates/nginx-selfsigned.crt && \
    chmod 644 /usr/local/share/ca-certificates/nginx-selfsigned.crt && \
    update-ca-certificates

EXPOSE 80 8080 443 5174 6001

ENTRYPOINT ["start-container.sh"]




















