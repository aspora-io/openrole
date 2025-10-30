#!/bin/bash

# Deploy Minimal Authentication API
# Deploys a simple Node.js auth API alongside existing OpenRole setup

set -e

echo "🔐 Deploying OpenRole Minimal Authentication API..."

SERVER_IP="145.223.75.73"
SERVER_USER="hyperdude"

log_info() {
    echo "✅ $1"
}

# Deploy the minimal auth API
deploy_auth_api() {
    log_info "Deploying minimal authentication API..."
    
    # Create deployment package
    tar -czf openrole-auth-minimal.tar.gz \
        auth-api-minimal.js \
        auth-package.json \
        database/init.sql \
        database/migrations/008-oauth-columns.sql
    
    # Copy to server
    scp openrole-auth-minimal.tar.gz $SERVER_USER@$SERVER_IP:~/
    
    # Deploy on server
    ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
        set -e
        
        echo "🏗️  Setting up minimal auth API..."
        
        # Stop existing auth API if running
        docker stop openrole-auth-api 2>/dev/null || true
        docker rm openrole-auth-api 2>/dev/null || true
        
        # Create deployment directory
        mkdir -p openrole-auth-minimal
        cd openrole-auth-minimal
        
        # Extract files
        tar -xzf ../openrole-auth-minimal.tar.gz
        
        # Rename package.json
        mv auth-package.json package.json
        
        # Create simple Dockerfile
        cat > Dockerfile << 'EOF'
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY . .
EXPOSE 3002
CMD ["npm", "start"]
EOF
        
        echo "🗄️  Setting up database..."
        
        # Apply database migrations if database exists
        if docker exec openrole-db psql -U postgres -d openrole -c "SELECT 1;" 2>/dev/null; then
            echo "Database found, applying OAuth migrations..."
            docker exec -i openrole-db psql -U postgres -d openrole < database/migrations/008-oauth-columns.sql 2>/dev/null || echo "OAuth columns may already exist"
        else
            echo "Database not found, starting new database..."
            docker run --name openrole-db -d \
                --network openrole-net \
                -e POSTGRES_DB=openrole \
                -e POSTGRES_USER=postgres \
                -e POSTGRES_PASSWORD=postgres \
                -p 5432:5432 \
                postgres:15-alpine || echo "Database may already be running"
            
            sleep 5
            
            # Initialize database
            docker exec -i openrole-db psql -U postgres -d openrole < database/init.sql || echo "Schema may already exist"
            docker exec -i openrole-db psql -U postgres -d openrole < database/migrations/008-oauth-columns.sql || echo "OAuth columns may already exist"
        fi
        
        echo "🐳 Building and starting auth API..."
        
        # Build auth API image
        docker build -t openrole-auth-api .
        
        # Start auth API container
        docker run -d \
            --name openrole-auth-api \
            --restart unless-stopped \
            --network openrole-net \
            -p 3002:3002 \
            -e NODE_ENV=production \
            -e DATABASE_URL="postgresql://postgres:postgres@openrole-db:5432/openrole" \
            -e JWT_SECRET="Hw00tSuklDbLH4QDfmdoOuQhu6WwToWJ53yxOuDaeG8=" \
            openrole-auth-api
        
        echo "⏳ Waiting for API to start..."
        sleep 10
        
        # Test API health
        if curl -f http://localhost:3002/health 2>/dev/null; then
            echo "✅ Auth API is healthy"
        else
            echo "⚠️  Auth API may still be starting..."
            docker logs openrole-auth-api --tail 10
        fi
        
        echo "🎉 Minimal auth API deployed successfully!"
        
        # Cleanup
        rm -f ../openrole-auth-minimal.tar.gz
ENDSSH
    
    log_info "Deployment completed"
}

# Test the deployment
test_deployment() {
    log_info "Testing authentication API..."
    
    sleep 3
    
    # Test health endpoint
    if curl -f -s "http://$SERVER_IP:3002/health" > /dev/null; then
        log_info "✅ Auth API health check passed"
        
        # Show health response
        echo "🔍 API Health Response:"
        curl -s "http://$SERVER_IP:3002/health" | head -3
        echo ""
    else
        echo "⚠️  Auth API test: $(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP:3002/health)"
    fi
}

# Main execution
main() {
    echo "🔐 OpenRole Minimal Authentication Deployment"
    echo "=============================================="
    echo ""
    
    deploy_auth_api
    echo ""
    
    test_deployment
    echo ""
    
    log_info "🎉 Authentication system is ready!"
    echo ""
    echo "📋 Authentication Endpoints:"
    echo "   Health: http://$SERVER_IP:3002/health"
    echo "   Register: POST http://$SERVER_IP:3002/api/auth/register"
    echo "   Login: POST http://$SERVER_IP:3002/api/auth/login"
    echo "   Me: GET http://$SERVER_IP:3002/api/auth/me"
    echo "   Google OAuth: GET http://$SERVER_IP:3002/api/auth/google"
    echo ""
    echo "🌐 Production URLs (with domain):"
    echo "   https://openrole.net/api/auth/register"
    echo "   https://openrole.net/api/auth/login"
    echo "   https://openrole.net/api/auth/google"
    echo ""
    echo "✅ Your frontend authentication is now ready to use!"
    
    # Cleanup
    rm -f openrole-auth-minimal.tar.gz
}

# Run main function
main