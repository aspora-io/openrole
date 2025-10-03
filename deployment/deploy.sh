#!/bin/bash

# OpenRole Deployment Script
# Server: 145.223.75.73
# User: hyperdude

echo "🚀 Deploying OpenRole to production..."

SERVER_IP="145.223.75.73"
SERVER_USER="hyperdude"

# Quick deployment command
echo "Run this command to deploy:"
echo ""
echo "ssh $SERVER_USER@$SERVER_IP 'cd /opt && mkdir -p openrole && cd openrole && docker pull ghcr.io/aspora-io/openrole-web:latest && docker pull ghcr.io/aspora-io/openrole-api:latest && curl -s https://raw.githubusercontent.com/aspora-io/openrole/master/docker-compose.simple.yml > docker-compose.yml && docker-compose up -d'"
echo ""
echo "Your site will be available at:"
echo "- http://$SERVER_IP"
echo "- https://openrole.net"