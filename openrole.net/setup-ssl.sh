#!/bin/bash

# SSL Setup Script for OpenRole.net
# This script sets up Let's Encrypt SSL certificates

set -e

# Load environment variables
if [ -f ".env.prod" ]; then
    source .env.prod
else
    echo "❌ .env.prod file not found. Please create it first."
    exit 1
fi

echo "🔒 Setting up SSL certificates for OpenRole.net"
echo "=============================================="

# Check if domain and email are set
if [ -z "$DOMAIN" ] || [ -z "$SSL_EMAIL" ]; then
    echo "❌ DOMAIN and SSL_EMAIL must be set in .env.prod"
    exit 1
fi

# Create SSL directory
mkdir -p ssl

# Check if we're in development (localhost)
if [ "$DOMAIN" = "localhost" ] || [ "$DOMAIN" = "127.0.0.1" ]; then
    echo "🏠 Development environment detected - creating self-signed certificates"
    
    # Generate self-signed certificate for development
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/privkey.pem \
        -out ssl/fullchain.pem \
        -subj "/C=US/ST=Development/L=Local/O=OpenRole/CN=$DOMAIN"
    
    echo "✅ Self-signed SSL certificate created for development"
    echo "⚠️  Note: Browsers will show security warnings for self-signed certificates"
    
else
    echo "🌐 Production environment detected - setting up Let's Encrypt"
    
    # Install certbot if not available
    if ! command -v certbot &> /dev/null; then
        echo "📦 Installing certbot..."
        if [ -f /etc/debian_version ]; then
            apt-get update && apt-get install -y certbot
        elif [ -f /etc/redhat-release ]; then
            yum install -y certbot
        else
            echo "❌ Unsupported OS. Please install certbot manually."
            exit 1
        fi
    fi
    
    # Stop any running containers that might use port 80
    echo "🛑 Stopping any conflicting services..."
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    
    # Get Let's Encrypt certificate
    echo "📜 Requesting SSL certificate from Let's Encrypt..."
    certbot certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --email "$SSL_EMAIL" \
        -d "$DOMAIN" \
        -d "www.$DOMAIN"
    
    # Copy certificates to our SSL directory
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/
    
    # Set proper permissions
    chmod 644 ssl/fullchain.pem
    chmod 600 ssl/privkey.pem
    
    echo "✅ Let's Encrypt SSL certificate installed successfully"
    
    # Set up auto-renewal
    echo "🔄 Setting up certificate auto-renewal..."
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && docker-compose -f $(pwd)/docker-compose.prod.yml restart nginx") | crontab -
    
    echo "✅ Auto-renewal scheduled (3 AM daily)"
fi

# Verify certificate files exist
if [ ! -f "ssl/fullchain.pem" ] || [ ! -f "ssl/privkey.pem" ]; then
    echo "❌ SSL certificate files not found after setup"
    exit 1
fi

echo ""
echo "🎉 SSL setup completed successfully!"
echo ""
echo "📋 Certificate Details:"
echo "   Certificate: ssl/fullchain.pem"
echo "   Private Key: ssl/privkey.pem"
echo "   Domain: $DOMAIN"
echo ""

if [ "$DOMAIN" != "localhost" ] && [ "$DOMAIN" != "127.0.0.1" ]; then
    echo "📝 Next Steps:"
    echo "   1. Point your domain's DNS A record to this server's IP"
    echo "   2. Run ./deploy.sh to start the production deployment"
    echo ""
fi

echo "🔒 Your SSL certificates are ready for deployment!"