#!/bin/bash

echo "🚀 Setting up OpenRole.net WordPress Development Environment"
echo "=========================================="

# Check if Docker Desktop is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker Desktop is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p wordpress wp-content/themes/openrole wp-content/mu-plugins

# Start Docker containers
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Wait for MySQL to be ready
echo "⏳ Waiting for MySQL to initialize..."
sleep 30

# Check if WordPress is accessible
echo "🔍 Checking WordPress installation..."
until $(curl --output /dev/null --silent --head --fail http://localhost:8080); do
    printf '.'
    sleep 5
done

echo ""
echo "✅ WordPress is ready!"
echo ""
echo "🔧 Access Points:"
echo "   WordPress: http://localhost:8080"
echo "   phpMyAdmin: http://localhost:8083"
echo "   MailHog: http://localhost:8025"
echo ""
echo "📝 Default Credentials:"
echo "   Database Name: openrole"
echo "   Database User: openrole_user"
echo "   Database Pass: openrole_pass_2024"
echo ""
echo "👉 Next Steps:"
echo "   1. Complete WordPress installation at http://localhost:8080"
echo "   2. Run ./install-plugins.sh to install required plugins"
echo "   3. Activate the OpenRole theme"
echo ""

# Make scripts executable
chmod +x *.sh