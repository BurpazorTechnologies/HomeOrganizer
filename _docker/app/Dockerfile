FROM ubuntu:22.04 AS base

ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

RUN apt-get update && apt-get install -y --no-install-recommends  \
    apt-utils curl ca-certificates gnupg zip unzip libcap2-bin vim nano tzdata openssl &&  \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

FROM base AS php_base

RUN apt-get update \
    && mkdir -p /etc/apt/keyrings \
    && curl -sS 'https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x14aa40ec0831756756d7f66c4f4ea0aae5267a6c' | gpg --dearmor | tee /etc/apt/keyrings/ppa_ondrej_php.gpg > /dev/null \
    && echo "deb [signed-by=/etc/apt/keyrings/ppa_ondrej_php.gpg] https://ppa.launchpadcontent.net/ondrej/php/ubuntu jammy main" > /etc/apt/sources.list.d/ppa_ondrej_php.list \
    && apt-get update \
    && apt-get install -y php8.4-cli php8.4-dev php8.4-fpm \
       php8.4-pgsql php8.4-sqlite3 php8.4-gd php8.4-imagick \
       php8.4-curl \
       php8.4-imap php8.4-mysql php8.4-mbstring \
       php8.4-xml php8.4-zip php8.4-bcmath php8.4-soap \
       php8.4-intl php8.4-readline \
       php8.4-ldap \
       php8.4-msgpack php8.4-igbinary php8.4-redis php8.4-swoole \
       php8.4-memcached php8.4-pcov php8.4-xdebug \
    && curl -sLS https://getcomposer.org/installer | php -- --install-dir=/usr/bin/ --filename=composer \
    && apt-get -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

FROM php_base AS backend

RUN groupadd --force -g 1000 default
RUN useradd -ms /bin/bash --no-user-group -g 1000 -u 1337 default

COPY ./backend/ /var/www/html/
COPY ./_docker/app/start-container.sh /usr/local/bin/start-container.sh
COPY ./_docker/php/*.ini /etc/php/8.4/fpm/conf.d/
COPY ./_docker/php/*.ini /etc/php/8.4/cli/conf.d/
COPY ./_docker/php/www.conf /etc/php/8.4/fpm/pool.d/www.conf

RUN mkdir -p /etc/nginx/ssl

WORKDIR /var/www/html

RUN chown -R www-data:www-data . && \
    chmod -R 775 storage && \
    chmod -R 775 bootstrap/cache

RUN chmod +x /usr/local/bin/start-container.sh

EXPOSE 9000 6001 8080 9001

ENTRYPOINT ["start-container.sh"]

FROM base AS proxy

RUN apt-get update && apt-get install -y --no-install-recommends nginx && \
    apt-get -y autoremove && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN mkdir -p /etc/nginx/ssl

COPY ./_docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY ./_docker/nginx/conf/*.conf /etc/nginx/conf.d/
COPY ./_docker/nginx/server/server.conf /etc/nginx/sites-available/default

EXPOSE 80 443

CMD ["/usr/sbin/nginx", "-g", "daemon off;"]




















