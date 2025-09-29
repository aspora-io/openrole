#!/bin/bash

echo "📦 Installing OpenRole.net WordPress Plugins"
echo "=========================================="

# Function to install plugin via WP-CLI in Docker
install_plugin() {
    echo "Installing $1..."
    docker exec openrole_wordpress wp plugin install $1 --activate --allow-root
}

# Wait for WordPress to be installed
echo "⏳ Waiting for WordPress installation to complete..."
until docker exec openrole_wordpress wp core is-installed --allow-root 2>/dev/null; do
    echo "WordPress not ready yet. Please complete the installation at http://localhost:8080"
    sleep 10
done

echo "✅ WordPress is installed!"

# Install free plugins
echo ""
echo "🔧 Installing Core Plugins..."
install_plugin "wp-job-manager"
install_plugin "wordfence"
install_plugin "wp-mail-smtp"
install_plugin "seo-by-rank-math"
install_plugin "wp-super-cache"
install_plugin "user-role-editor"
install_plugin "advanced-custom-fields"
install_plugin "members"
install_plugin "post-smtp"

# Install development plugins
echo ""
echo "🛠️ Installing Development Plugins..."
install_plugin "query-monitor"
install_plugin "wp-migrate-db"
install_plugin "debug-bar"

echo ""
echo "✅ All free plugins installed!"
echo ""
echo "⚠️  Premium plugins to install manually:"
echo "   - WP Job Manager - Paid Listings"
echo "   - WP Job Manager - Resume Manager"
echo "   - WP Job Manager - Application Deadline"
echo ""
echo "👉 Next: Configure plugins at http://localhost:8080/wp-admin"