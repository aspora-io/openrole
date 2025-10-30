#!/bin/bash

# OpenRole Authentication Setup Script
# Sets up database migrations and API server for authentication

set -e

echo "🔐 Setting up OpenRole Authentication System..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the OpenRole root directory"
    exit 1
fi

# Load environment variables
if [ -f ".env.production" ]; then
    echo "📄 Loading production environment variables..."
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "⚠️  Warning: .env.production not found, using defaults"
fi

# Function to run database migrations
run_migrations() {
    echo "🗄️  Running database migrations..."
    
    # Check if PostgreSQL is accessible
    if ! command -v psql &> /dev/null; then
        echo "❌ Error: PostgreSQL client (psql) not found"
        echo "Please install PostgreSQL client tools"
        exit 1
    fi
    
    # Extract database connection details
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ Error: DATABASE_URL environment variable not set"
        echo "Please update .env.production with your database connection string"
        exit 1
    fi
    
    echo "Running migrations on database: $DATABASE_URL"
    
    # Run init script
    echo "  → Running initial schema..."
    psql "$DATABASE_URL" -f database/init.sql || {
        echo "⚠️  Initial schema may already exist, continuing..."
    }
    
    # Run OAuth migration
    echo "  → Adding OAuth columns..."
    psql "$DATABASE_URL" -f database/migrations/008-oauth-columns.sql || {
        echo "⚠️  OAuth columns may already exist, continuing..."
    }
    
    echo "✅ Database migrations completed"
}

# Function to build and start API server
setup_api() {
    echo "🏗️  Building API server..."
    
    cd apps/api
    
    # Install dependencies
    echo "  → Installing dependencies..."
    npm install --production=false
    
    # Build the project
    echo "  → Building TypeScript..."
    npm run build
    
    echo "✅ API server built successfully"
    cd ../..
}

# Function to test the setup
test_setup() {
    echo "🧪 Testing authentication setup..."
    
    # Check if the API can start
    cd apps/api
    
    echo "  → Testing API server startup..."
    timeout 10s npm run start:production > /dev/null 2>&1 &
    API_PID=$!
    
    sleep 3
    
    # Check if the process is still running
    if kill -0 $API_PID 2>/dev/null; then
        echo "✅ API server started successfully"
        kill $API_PID
    else
        echo "❌ API server failed to start"
        echo "Check the logs for errors"
        cd ../..
        return 1
    fi
    
    cd ../..
}

# Main execution
echo "Starting authentication setup process..."
echo ""

# Step 1: Database migrations
run_migrations
echo ""

# Step 2: Build API
setup_api
echo ""

# Step 3: Test setup
test_setup
echo ""

echo "🎉 Authentication setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update DATABASE_URL in .env.production with your actual database"
echo "2. Configure LinkedIn OAuth credentials (optional)"
echo "3. Deploy the API server to your production environment"
echo "4. Update nginx configuration to proxy /api/ to the API server"
echo ""
echo "🔗 Available endpoints:"
echo "  POST /api/auth/register    - User registration"
echo "  POST /api/auth/login       - User login"
echo "  GET  /api/auth/me          - Get current user"
echo "  GET  /api/auth/google      - Google OAuth"
echo "  GET  /api/auth/linkedin    - LinkedIn OAuth"
echo ""
echo "🌐 Google OAuth callback: https://openrole.net/api/auth/google/callback"
echo "🔵 LinkedIn OAuth callback: https://openrole.net/api/auth/linkedin/callback"