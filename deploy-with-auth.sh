#!/bin/bash

# OpenRole Deployment with Authentication
# Deploys the complete OpenRole platform with authentication backend

set -e

echo "🚀 Deploying OpenRole with Authentication..."

# Configuration
SERVER_IP="145.223.75.73"
SERVER_USER="hyperdude"
DEPLOY_DIR="openrole-auth-deploy"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is required but not installed"
        exit 1
    fi
    
    if ! command -v ssh &> /dev/null; then
        log_error "SSH is required but not installed"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Build and package the application
build_application() {
    log_info "Building application..."
    
    # Build API
    log_info "Building API server..."
    cd apps/api
    npm install --production=false
    npm run build
    cd ../..
    
    # Create deployment package
    log_info "Creating deployment package..."
    tar -czf openrole-auth.tar.gz \
        deployment/ \
        apps/api/dist/ \
        apps/api/package.json \
        database/ \
        docker-compose.auth.yml \
        .env.production \
        --exclude='deployment/tests' \
        --exclude='deployment/*.tar.gz'
    
    log_info "Application built successfully"
}

# Deploy to server
deploy_to_server() {
    log_info "Deploying to server $SERVER_USER@$SERVER_IP..."
    
    # Copy deployment package
    log_info "Copying files to server..."
    scp openrole-auth.tar.gz $SERVER_USER@$SERVER_IP:~/
    
    # Deploy on server
    log_info "Setting up on server..."
    ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
        set -e
        
        echo "📦 Extracting deployment package..."
        
        # Create deployment directory
        mkdir -p openrole-auth-deploy
        cd openrole-auth-deploy
        
        # Extract package
        tar -xzf ../openrole-auth.tar.gz
        
        echo "🗄️  Setting up database..."
        
        # Update environment variables
        export DATABASE_URL="postgresql://postgres:postgres@openrole-db:5432/openrole"
        
        echo "🐳 Starting services with Docker Compose..."
        
        # Stop any existing services
        docker-compose -f docker-compose.auth.yml down 2>/dev/null || true
        
        # Start services
        docker-compose -f docker-compose.auth.yml up -d --build
        
        echo "⏳ Waiting for services to start..."
        sleep 10
        
        # Check service health
        echo "🔍 Checking service health..."
        docker-compose -f docker-compose.auth.yml ps
        
        echo "✅ Deployment completed successfully!"
        
        # Cleanup
        rm -f ../openrole-auth.tar.gz
ENDSSH
    
    log_info "Server deployment completed"
}

# Test the deployment
test_deployment() {
    log_info "Testing deployment..."
    
    # Test web server
    if curl -f -s "http://$SERVER_IP:8081" > /dev/null; then
        log_info "✅ Web server is responding"
    else
        log_warn "⚠️  Web server may not be ready yet"
    fi
    
    # Test API server
    if curl -f -s "http://$SERVER_IP:3002/health" > /dev/null; then
        log_info "✅ API server is responding"
    else
        log_warn "⚠️  API server may not be ready yet"
    fi
    
    log_info "Deployment test completed"
}

# Cleanup local files
cleanup() {
    log_info "Cleaning up local files..."
    rm -f openrole-auth.tar.gz
    log_info "Cleanup completed"
}

# Main execution
main() {
    echo "🔐 OpenRole Authentication Deployment"
    echo "======================================"
    echo ""
    
    check_prerequisites
    echo ""
    
    build_application
    echo ""
    
    deploy_to_server
    echo ""
    
    test_deployment
    echo ""
    
    cleanup
    echo ""
    
    log_info "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Service URLs:"
    echo "   Web: http://$SERVER_IP:8081"
    echo "   API: http://$SERVER_IP:3002"
    echo "   Health Check: http://$SERVER_IP:3002/health"
    echo ""
    echo "🔗 API Endpoints:"
    echo "   POST /api/auth/register    - User registration"
    echo "   POST /api/auth/login       - User login"
    echo "   GET  /api/auth/me          - Get current user"
    echo "   GET  /api/auth/google      - Google OAuth"
    echo ""
    echo "🔧 Next steps:"
    echo "1. Update DNS to point openrole.net to $SERVER_IP"
    echo "2. Set up SSL certificate for HTTPS"
    echo "3. Configure production database credentials"
    echo "4. Test authentication flows"
}

# Error handling
trap 'log_error "Deployment failed"; cleanup; exit 1' ERR

# Run main function
main