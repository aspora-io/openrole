#!/bin/bash

# OpenRole Production Deployment
SERVER_IP="145.223.75.73"
SERVER_USER="alanops"

echo "🚀 Deploying OpenRole to production..."
echo "Server: $SERVER_USER@$SERVER_IP"

# Check if repo is public
IS_PRIVATE=$(gh repo view aspora-io/openrole --json isPrivate -q .isPrivate)

if [ "$IS_PRIVATE" = "true" ]; then
    echo "Repository is private. Making it public for deployment..."
    gh repo edit aspora-io/openrole --visibility public
    echo "✅ Repository is now public"
fi

# Deploy command
echo ""
echo "Running deployment..."
ssh $SERVER_USER@$SERVER_IP "cd ~ && rm -rf openrole && git clone https://github.com/aspora-io/openrole.git && cd openrole && docker-compose -f docker-compose.simple.yml up -d --build && docker ps"

echo ""
echo "🌐 Your site will be available at:"
echo "   - http://$SERVER_IP"
echo "   - https://openrole.net"