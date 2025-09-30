# OpenRole.net Deployment Guide

## Current Status
- ✅ Code is working and tested locally
- ✅ Docker containers build successfully
- ✅ Domain openrole.net is configured (DNS pointing to 86.159.155.227)
- ✅ SSL/HTTPS is handled by Traefik on the server
- ❌ Containers need to be deployed on production server

## Why is there a 404 error?
The 404 error occurs because Traefik (reverse proxy) on the production server cannot find the OpenRole backend containers. The containers need to be running on the production server and connected to the Traefik network.

## Deployment Methods

### Option 1: Manual Deployment (Recommended)
1. SSH into your production server (86.159.155.227)
2. Copy and run the `manual-deploy.sh` script:

```bash
# On the production server
wget https://raw.githubusercontent.com/aspora-io/openrole/001-cv-profile-tools/manual-deploy.sh
chmod +x manual-deploy.sh
./manual-deploy.sh
```

### Option 2: GitHub Actions (Currently Failing)
The GitHub Actions workflow is configured but failing due to SSH connectivity issues. To use it when fixed:

```bash
# Trigger deployment from GitHub
gh workflow run deploy.yml --repo aspora-io/openrole \
  --ref 001-cv-profile-tools \
  -f environment=production \
  -f branch=001-cv-profile-tools
```

### Option 3: Direct Docker Commands
On the production server:

```bash
# Clone the repository
cd ~/apps
git clone https://github.com/aspora-io/openrole.git openrole-production
cd openrole-production
git checkout 001-cv-profile-tools

# Start containers with Traefik integration
docker-compose -f docker-compose.traefik.yml up -d --build
```

## Verify Deployment

After deployment, verify everything is working:

```bash
# Check containers are running
docker ps | grep openrole

# Check container logs
docker logs openrole-web
docker logs openrole-api

# Check Traefik network connection
docker network inspect traefik | grep openrole

# Test the endpoints
curl https://openrole.net
curl https://api.openrole.net/health
```

## Troubleshooting

### Still getting 404?
1. Ensure containers are running: `docker ps`
2. Check they're on Traefik network: `docker network inspect traefik`
3. Verify Traefik labels: `docker inspect openrole-web | grep traefik`
4. Check logs: `docker logs openrole-web`

### Container not starting?
1. Check build errors: `docker-compose -f docker-compose.traefik.yml build`
2. Ensure ports aren't in use: `netstat -tlnp | grep 3000`
3. Check disk space: `df -h`

## Local Development
To run locally for testing:
```bash
docker-compose -f docker-compose.local.yml up -d
# Access at http://localhost:3010 (web) and http://localhost:3011 (api)
```