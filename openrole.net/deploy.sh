#!/bin/bash

# OpenRole.net Production Deployment Script
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="openrole"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

echo "🚀 Starting OpenRole.net deployment to $ENVIRONMENT"
echo "==========================================="

# Check if required files exist
if [ ! -f ".env.prod" ]; then
    echo "❌ .env.prod file not found. Please copy .env.prod.example and configure it."
    exit 1
fi

if [ ! -f "ssl/fullchain.pem" ] || [ ! -f "ssl/privkey.pem" ]; then
    echo "⚠️  SSL certificates not found. Setting up Let's Encrypt..."
    ./setup-ssl.sh
fi

# Load environment variables
source .env.prod

echo "📁 Creating backup directory..."
mkdir -p "$BACKUP_DIR"

# Backup current deployment if exists
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "💾 Creating backup of current deployment..."
    
    # Export database
    docker-compose -f docker-compose.prod.yml exec -T mysql mysqldump \
        -u root -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME" > "$BACKUP_DIR/database.sql"
    
    # Backup WordPress files
    docker-compose -f docker-compose.prod.yml exec -T wordpress \
        tar -czf - /var/www/html/wp-content > "$BACKUP_DIR/wp-content.tar.gz"
    
    echo "✅ Backup completed: $BACKUP_DIR"
fi

# Build and deploy
echo "🐳 Building and deploying containers..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Wait for WordPress to be ready
echo "🔍 Waiting for WordPress to be ready..."
until $(curl --output /dev/null --silent --head --fail http://localhost); do
    printf '.'
    sleep 5
done

echo ""
echo "🔧 Configuring WordPress..."

# Install WordPress if not already installed
if ! docker-compose -f docker-compose.prod.yml exec -T wordpress wp core is-installed --allow-root 2>/dev/null; then
    echo "📝 Installing WordPress..."
    docker-compose -f docker-compose.prod.yml exec -T wordpress wp core install \
        --url="https://$DOMAIN" \
        --title="OpenRole.net - Where Every Role is Open" \
        --admin_user="$WP_ADMIN_USER" \
        --admin_password="$WP_ADMIN_PASSWORD" \
        --admin_email="$WP_ADMIN_EMAIL" \
        --allow-root
fi

# Activate theme and plugins
echo "🎨 Activating theme and plugins..."
docker-compose -f docker-compose.prod.yml exec -T wordpress wp theme activate openrole --allow-root
docker-compose -f docker-compose.prod.yml exec -T wordpress wp plugin activate --all --allow-root

# Configure WP Job Manager
echo "⚙️  Configuring job board settings..."
docker-compose -f docker-compose.prod.yml exec -T wordpress wp option update \
    job_manager_per_page 20 --allow-root
docker-compose -f docker-compose.prod.yml exec -T wordpress wp option update \
    job_manager_hide_filled_positions 1 --allow-root
docker-compose -f docker-compose.prod.yml exec -T wordpress wp option update \
    job_manager_enable_categories 1 --allow-root

# Set up permalinks
docker-compose -f docker-compose.prod.yml exec -T wordpress wp rewrite structure \
    '/%postname%/' --allow-root
docker-compose -f docker-compose.prod.yml exec -T wordpress wp rewrite flush --allow-root

# Configure caching
echo "⚡ Setting up performance optimizations..."
docker-compose -f docker-compose.prod.yml exec -T wordpress wp config set \
    WP_CACHE true --allow-root

# Security hardening
echo "🔒 Applying security hardening..."
docker-compose -f docker-compose.prod.yml exec -T wordpress wp config set \
    DISALLOW_FILE_EDIT true --allow-root
docker-compose -f docker-compose.prod.yml exec -T wordpress wp config set \
    FORCE_SSL_ADMIN true --allow-root

# Health check
echo "🏥 Running health checks..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
    echo "✅ HTTP health check passed"
else
    echo "❌ HTTP health check failed"
    exit 1
fi

if curl -s -o /dev/null -w "%{http_code}" https://localhost -k | grep -q "200\|301\|302"; then
    echo "✅ HTTPS health check passed"
else
    echo "⚠️  HTTPS health check failed (SSL may need configuration)"
fi

# Performance test
echo "📊 Running basic performance test..."
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" http://localhost)
echo "   Response time: ${RESPONSE_TIME}s"

if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
    echo "✅ Performance test passed (under 2 seconds)"
else
    echo "⚠️  Performance test warning (over 2 seconds)"
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "🔧 Access Points:"
echo "   Website: https://$DOMAIN"
echo "   Admin: https://$DOMAIN/wp-admin"
echo ""
echo "📝 Next Steps:"
echo "   1. Configure your domain DNS to point to this server"
echo "   2. Test all functionality on the live site"
echo "   3. Set up monitoring and backup schedules"
echo "   4. Configure email settings for notifications"
echo ""
echo "📊 Monitoring:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo "   docker-compose -f docker-compose.prod.yml ps"
echo ""
echo "🎯 Your OpenRole.net platform is live and ready!"