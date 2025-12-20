# Stage 1: Base system setup
FROM ubuntu:24.04 AS base

LABEL maintainer="HomeOrganizer"

ARG WWWGROUP
ARG WWWUSER

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC
ENV PHP_VERSION=8.4

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Optimize apt for faster downloads
RUN echo "Acquire::http::Pipeline-Depth 0;" > /etc/apt/apt.conf.d/99custom && \
    echo "Acquire::http::No-Cache true;" >> /etc/apt/apt.conf.d/99custom && \
    echo "Acquire::BrokenProxy true;" >> /etc/apt/apt.conf.d/99custom

# Stage 2: Install system dependencies
FROM base AS system-deps

RUN apt-get update && apt-get upgrade -y \
    && mkdir -p /etc/apt/keyrings \
    && apt-get install -y gnupg gosu curl ca-certificates zip unzip git sqlite3 libcap2-bin libpng-dev python3 dnsutils librsvg2-bin nano iputils-ping

# Stage 3: Install PHP and extensions
FROM system-deps AS php-install

RUN curl -sS 'https://keyserver.ubuntu.com/pks/lookup?op=get&search=0xb8dc7e53946656efbce4c1dd71daeaab4ad4cab6' | gpg --dearmor | tee /etc/apt/keyrings/ppa_ondrej_php.gpg > /dev/null \
    && echo "deb [signed-by=/etc/apt/keyrings/ppa_ondrej_php.gpg] https://ppa.launchpadcontent.net/ondrej/php/ubuntu noble main" > /etc/apt/sources.list.d/ppa_ondrej_php.list \
    && apt-get update \
    && apt-get install -y php8.4-cli php8.4-fpm php8.4-dev \
       php8.4-pgsql php8.4-sqlite3 php8.4-gd \
       php8.4-curl php8.4-mongodb \
       php8.4-imap php8.4-mysql php8.4-mbstring \
       php8.4-xml php8.4-zip php8.4-bcmath php8.4-soap \
       php8.4-intl php8.4-readline \
       php8.4-ldap \
       php8.4-msgpack php8.4-igbinary php8.4-redis php8.4-swoole \
       php8.4-memcached php8.4-pcov php8.4-imagick php8.4-xdebug

# Stage 4: Install Composer
FROM php-install AS composer-install

RUN curl -sLS https://getcomposer.org/installer | php -- --install-dir=/usr/bin/ --filename=composer

# Stage 5: Final runtime image
FROM composer-install AS runtime

WORKDIR /var/www/html

# Configure PHP-FPM to listen on all interfaces (container-internal network)
RUN sed -i 's/listen = \/run\/php\/php8.4-fpm.sock/listen = 0.0.0.0:9000/' /etc/php/8.4/fpm/pool.d/www.conf \
    && sed -i 's/;listen.owner = www-data/listen.owner = www-data/' /etc/php/8.4/fpm/pool.d/www.conf \
    && sed -i 's/;listen.group = www-data/listen.group = www-data/' /etc/php/8.4/fpm/pool.d/www.conf \
    && sed -i 's/;listen.mode = 0660/listen.mode = 0660/' /etc/php/8.4/fpm/pool.d/www.conf

# Send PHP-FPM logs to stderr (container logs) to avoid /var/log permission issues
RUN sed -i 's#^;*error_log = .*#error_log = /proc/self/fd/2#' /etc/php/8.4/fpm/php-fpm.conf

# Write PID file into /tmp to avoid permissions on /run when running as non-root
RUN sed -i 's#^;*pid = .*#pid = /tmp/php8.4-fpm.pid#' /etc/php/8.4/fpm/php-fpm.conf

# Create user and group
RUN if ! getent group www-data > /dev/null 2>&1; then groupadd -g $WWWGROUP www-data; fi \
    && if ! getent passwd www-data > /dev/null 2>&1; then useradd -ms /bin/bash --no-user-group -g $WWWGROUP -u $WWWUSER www-data; fi \
    && usermod -aG www-data www-data \
    && mkdir -p /home/www-data \
    && chown www-data:www-data /home/www-data

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Copy startup script
COPY _docker/backend/start-container.sh /usr/local/bin/start-container
RUN chmod +x /usr/local/bin/start-container

# Create directories for volume mounts
RUN mkdir -p /etc/php/8.4/fpm/conf.d /etc/php/8.4/cli/conf.d

# Clean up apt cache
RUN apt-get -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Expose PHP-FPM port (will be configured at runtime)
EXPOSE 9000/tcp

# Keep as root for permission fixes, switch to www-data in start-container.sh
ENTRYPOINT ["start-container"]
