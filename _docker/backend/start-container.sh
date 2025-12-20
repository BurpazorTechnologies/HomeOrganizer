set -e

echo "Starting Laravel application setup..."

# Function to check if Laravel is properly installed
check_laravel() {
    if [ -f "/var/www/html/artisan" ] && [ -f "/var/www/html/composer.json" ]; then
        return 0
    else
        return 1
    fi
}

# Function to install Laravel dependencies
install_dependencies() {
    echo "Installing Composer dependencies (if needed)..."
    if [ -f "/var/www/html/composer.json" ]; then
        composer install --no-dev --optimize-autoloader --no-interaction || true
    fi
}

# Function to setup Laravel environment
setup_laravel() {
    echo "Setting up Laravel environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f "/var/www/html/.env" ]; then
        echo "Creating .env file..."
        cp /var/www/html/.env.example /var/www/html/.env 2>/dev/null || {
            echo "APP_NAME=Laravel" > /var/www/html/.env
            echo "APP_ENV=production" >> /var/www/html/.env
            echo "APP_KEY=" >> /var/www/html/.env
            echo "APP_DEBUG=false" >> /var/www/html/.env
            echo "APP_URL=http://localhost" >> /var/www/html/.env
            echo "" >> /var/www/html/.env
            echo "LOG_CHANNEL=stack" >> /var/www/html/.env
            echo "LOG_DEPRECATIONS_CHANNEL=null" >> /var/www/html/.env
            echo "LOG_LEVEL=debug" >> /var/www/html/.env
            echo "" >> /var/www/html/.env
            echo "DB_CONNECTION=mysql" >> /var/www/html/.env
            echo "DB_HOST=127.0.0.1" >> /var/www/html/.env
            echo "DB_PORT=3306" >> /var/www/html/.env
            echo "DB_DATABASE=laravel" >> /var/www/html/.env
            echo "DB_USERNAME=root" >> /var/www/html/.env
            echo "DB_PASSWORD=" >> /var/www/html/.env
            echo "" >> /var/www/html/.env
            echo "BROADCAST_DRIVER=log" >> /var/www/html/.env
            echo "CACHE_DRIVER=file" >> /var/www/html/.env
            echo "FILESYSTEM_DISK=local" >> /var/www/html/.env
            echo "QUEUE_CONNECTION=sync" >> /var/www/html/.env
            echo "SESSION_DRIVER=file" >> /var/www/html/.env
            echo "SESSION_LIFETIME=120" >> /var/www/html/.env
            echo "" >> /var/www/html/.env
            echo "MEMCACHED_HOST=127.0.0.1" >> /var/www/html/.env
            echo "" >> /var/www/html/.env
            echo "REDIS_HOST=127.0.0.1" >> /var/www/html/.env
            echo "REDIS_PASSWORD=null" >> /var/www/html/.env
            echo "REDIS_PORT=6379" >> /var/www/html/.env
            echo "" >> /var/www/html/.env
            echo "MAIL_MAILER=smtp" >> /var/www/html/.env
            echo "MAIL_HOST=mailpit" >> /var/www/html/.env
            echo "MAIL_PORT=1025" >> /var/www/html/.env
            echo "MAIL_USERNAME=null" >> /var/www/html/.env
            echo "MAIL_PASSWORD=null" >> /var/www/html/.env
            echo "MAIL_ENCRYPTION=null" >> /var/www/html/.env
            echo "MAIL_FROM_ADDRESS=\"hello@example.com\"" >> /var/www/html/.env
            echo "MAIL_FROM_NAME=\"\${APP_NAME}\"" >> /var/www/html/.env
            echo "" >> /var/www/html/.env
            echo "AWS_ACCESS_KEY_ID=" >> /var/www/html/.env
            echo "AWS_SECRET_ACCESS_KEY=" >> /var/www/html/.env
            echo "AWS_DEFAULT_REGION=us-east-1" >> /var/www/html/.env
            echo "AWS_BUCKET=" >> /var/www/html/.env
            echo "AWS_USE_PATH_STYLE_ENDPOINT=false" >> /var/www/html/.env
            echo "" >> /var/www/html/.env
            echo "PUSHER_APP_ID=" >> /var/www/html/.env
            echo "PUSHER_APP_KEY=" >> /var/www/html/.env
            echo "PUSHER_APP_SECRET=" >> /var/www/html/.env
            echo "PUSHER_HOST=" >> /var/www/html/.env
            echo "PUSHER_PORT=443" >> /var/www/html/.env
            echo "PUSHER_SCHEME=https" >> /var/www/html/.env
            echo "PUSHER_APP_CLUSTER=mt1" >> /var/www/html/.env
            echo "" >> /var/www/html/.env
            echo "VITE_APP_NAME=\"\${APP_NAME}\"" >> /var/www/html/.env
            echo "VITE_PUSHER_APP_KEY=\"\${PUSHER_APP_KEY}\"" >> /var/www/html/.env
            echo "VITE_PUSHER_HOST=\"\${PUSHER_HOST}\"" >> /var/www/html/.env
            echo "VITE_PUSHER_PORT=\"\${PUSHER_PORT}\"" >> /var/www/html/.env
            echo "VITE_PUSHER_SCHEME=\"\${PUSHER_SCHEME}\"" >> /var/www/html/.env
            echo "VITE_PUSHER_APP_CLUSTER=\"\${PUSHER_APP_CLUSTER}\"" >> /var/www/html/.env
        }
    fi
    
    # Generate application key if not set
    if ! grep -q "APP_KEY=base64:" /var/www/html/.env; then
        echo "Generating application key..."
        php artisan key:generate --no-interaction
    fi
    
    # Set proper permissions only on writable dirs
    echo "Setting proper permissions on storage and cache..."
    chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache || true
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache || true
    
    # Clear and cache configuration
    echo "Optimizing Laravel..."
    php artisan config:cache --no-interaction || true
    php artisan route:cache --no-interaction || true
    php artisan view:cache --no-interaction || true
}

# Function to run database migrations
run_migrations() {
    echo "Running database migrations..."
    php artisan migrate --force --no-interaction || echo "Migration failed, continuing..."
}

# Function to configure PHP-FPM
configure_php_fpm() {
    echo "Configuring PHP-FPM..."

    # Set FPM_PORT with default value if not set
    FPM_PORT=${FPM_PORT:-9000}

    # Only attempt to modify if file is writable; otherwise skip
    if [ -w "/etc/php/8.4/fpm/pool.d/www.conf" ]; then
        sed -i "s/listen = 0.0.0.0:9000/listen = 0.0.0.0:${FPM_PORT}/" /etc/php/8.4/fpm/pool.d/www.conf || true
        echo "PHP-FPM configured to listen on port ${FPM_PORT}"
    else
        echo "Skipping PHP-FPM reconfiguration (no write permission). Using image default."
    fi
}

# Function to start PHP-FPM
start_php_fpm() {
    echo "Starting PHP-FPM..."
    exec /usr/sbin/php-fpm8.4 -F
}

# Main execution
main() {
    echo "=== Laravel Container Startup ==="
    
    # Check if Laravel is installed
    if check_laravel; then
        echo "Laravel application found, setting up..."
        
        # Install dependencies
        install_dependencies
        
        # Setup Laravel
        setup_laravel
        
    # Run migrations (optional, can be disabled)
    run_migrations
        
    echo "Laravel setup completed successfully!"
    
    # Configure PHP-FPM
    configure_php_fpm
    else
        echo "Laravel application not found in /var/www/html"
        echo "Please ensure the backend directory is properly mounted"
        exit 1
    fi
    
    # Start PHP-FPM
    start_php_fpm
}

# Run main function
main "$@"
