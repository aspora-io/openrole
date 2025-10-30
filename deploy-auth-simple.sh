#!/bin/bash

# Simple OpenRole Authentication Deployment
# Deploys authentication system without local build

set -e

echo "🚀 Deploying OpenRole Authentication (Simple)..."

# Configuration
SERVER_IP="145.223.75.73"
SERVER_USER="hyperdude"

log_info() {
    echo "✅ $1"
}

log_error() {
    echo "❌ $1"
}

# Create deployment package without build
create_package() {
    log_info "Creating deployment package..."
    
    # Create a focused package with just what we need
    tar -czf openrole-auth-simple.tar.gz \
        --exclude='deployment/tests' \
        --exclude='deployment/*.tar.gz' \
        --exclude='apps/api/node_modules' \
        --exclude='apps/api/dist' \
        deployment/ \
        apps/api/ \
        database/ \
        docker-compose.auth.yml \
        .env.production
    
    log_info "Package created: openrole-auth-simple.tar.gz"
}

# Deploy to server
deploy_to_server() {
    log_info "Deploying to server $SERVER_USER@$SERVER_IP..."
    
    # Copy deployment package
    scp openrole-auth-simple.tar.gz $SERVER_USER@$SERVER_IP:~/
    
    # Deploy on server
    ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
        set -e
        
        echo "🏗️  Setting up OpenRole Authentication on server..."
        
        # Stop any existing services
        cd ~ && docker-compose -f openrole-auth-deploy/docker-compose.auth.yml down 2>/dev/null || true
        
        # Remove old deployment
        rm -rf openrole-auth-deploy
        
        # Create new deployment directory
        mkdir -p openrole-auth-deploy
        cd openrole-auth-deploy
        
        # Extract package
        echo "📦 Extracting files..."
        tar -xzf ../openrole-auth-simple.tar.gz
        
        # Load environment variables
        if [ -f ".env.production" ]; then
            export $(cat .env.production | grep -v '^#' | xargs)
        fi
        
        echo "🐳 Starting services with Docker Compose..."
        
        # Start services (Docker will build the API automatically)
        docker-compose -f docker-compose.auth.yml up -d --build
        
        echo "⏳ Waiting for services to initialize..."
        sleep 15
        
        # Check service health
        echo "🔍 Checking service status..."
        docker-compose -f docker-compose.auth.yml ps
        
        # Test API health
        if docker exec openrole-api curl -f http://localhost:3002/health 2>/dev/null; then
            echo "✅ API server is healthy"
        else
            echo "⚠️  API server may still be starting..."
        fi
        
        # Test database connection
        if docker exec openrole-db psql -U postgres -d openrole -c "SELECT 1;" 2>/dev/null; then
            echo "✅ Database is accessible"
        else
            echo "⚠️  Database may still be initializing..."
        fi
        
        echo "🎉 Deployment completed!"
        
        # Cleanup
        rm -f ../openrole-auth-simple.tar.gz
ENDSSH
    
    log_info "Server deployment completed"
}

# Test the deployment
test_deployment() {
    log_info "Testing deployment..."
    
    sleep 5
    
    # Test web server
    if curl -f -s "http://$SERVER_IP:8081/" > /dev/null; then
        log_info "✅ Web server is responding"
    else
        echo "⚠️  Web server test: $(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP:8081/)"
    fi
    
    # Test API health endpoint
    if curl -f -s "http://$SERVER_IP:3002/health" > /dev/null; then
        log_info "✅ API server health check passed"
    else
        echo "⚠️  API server test: $(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP:3002/health)"
    fi
}

# Main execution
main() {
    echo "🔐 OpenRole Authentication Deployment"
    echo "======================================"
    echo ""
    
    create_package
    echo ""
    
    deploy_to_server
    echo ""
    
    test_deployment
    echo ""
    
    log_info "🎉 Authentication system deployed!"
    echo ""
    echo "📋 Service Information:"
    echo "   Web Frontend: http://$SERVER_IP:8081"
    echo "   API Backend: http://$SERVER_IP:3002"
    echo "   Health Check: http://$SERVER_IP:3002/health"
    echo ""
    echo "🔗 Authentication Endpoints:"
    echo "   POST http://$SERVER_IP:3002/api/auth/register"
    echo "   POST http://$SERVER_IP:3002/api/auth/login"
    echo "   GET  http://$SERVER_IP:3002/api/auth/google"
    echo ""
    echo "🌐 Production URLs (after DNS):"
    echo "   https://openrole.net/"
    echo "   https://openrole.net/api/auth/register"
    echo "   https://openrole.net/api/auth/google"
    
    # Cleanup
    rm -f openrole-auth-simple.tar.gz
}

# Run main function
main