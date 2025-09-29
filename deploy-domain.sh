#!/bin/bash

# OpenRole.net Domain Deployment Script
# Run this after registering openrole.net and configuring DNS

echo "🌐 Deploying OpenRole.net to production domain..."

# Check if domain resolves to this server
SERVER_IP=$(curl -s ifconfig.me)
DOMAIN_IP=$(dig +short openrole.net)

echo "Server IP: $SERVER_IP"
echo "Domain IP: $DOMAIN_IP"

if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
    echo "⚠️  WARNING: openrole.net does not resolve to this server yet"
    echo "Please ensure DNS is configured correctly:"
    echo "  A record: @ -> $SERVER_IP"
    echo "  A record: www -> $SERVER_IP"
    echo "  A record: api -> $SERVER_IP"
    echo ""
    echo "DNS propagation can take up to 24 hours"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create production environment
echo "📁 Setting up production environment..."
mkdir -p ~/apps/openrole-production/{logs,releases}

# Build and deploy with Docker Compose
echo "🐳 Building and deploying containers..."
cd ~/apps/openrole-production

# Copy the latest release
git clone https://github.com/aspora-io/openrole.git releases/$(date +%Y%m%d-%H%M%S)
cd releases/$(date +%Y%m%d-%H%M%S)
git checkout 001-cv-profile-tools

# Update symlink
cd ~/apps/openrole-production
rm -f current
ln -sf releases/$(ls -t releases | head -1) current

# Deploy with Traefik
cd current
docker-compose -f docker-compose.traefik.yml up -d --build

echo "✅ OpenRole.net deployment initiated!"
echo ""
echo "🌐 Your site will be available at:"
echo "  • https://openrole.net"
echo "  • https://www.openrole.net"  
echo "  • https://api.openrole.net"
echo ""
echo "📋 Next steps:"
echo "  1. Wait for SSL certificates to be issued (~2 minutes)"
echo "  2. Test the endpoints"
echo "  3. Monitor logs: docker-compose logs -f"
echo ""
echo "🎉 Welcome to the transparent job platform!"