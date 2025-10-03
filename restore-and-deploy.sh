#!/bin/bash

# Script to restore Promptcade and deploy OpenRole safely

echo "🔧 Starting recovery and deployment process..."

# SSH connection details (update these)
SSH_HOST="86.159.155.227"
SSH_USER="your-username"  # Update this

echo "This script will:"
echo "1. Restore Promptcade.com service"
echo "2. Deploy OpenRole with proper isolation"
echo ""
echo "Run these commands on your server:"
echo ""

cat << 'RECOVERY_SCRIPT'
#!/bin/bash
set -e

echo "=== Phase 1: Checking Current Status ==="
echo "Checking Docker containers..."
docker ps -a | grep -E "(promptcade|openrole)" || echo "No containers found"

echo ""
echo "Checking Traefik network..."
docker network inspect traefik | grep -A 5 -E "(promptcade|openrole)" || echo "No services on Traefik network"

echo ""
echo "=== Phase 2: Restoring Promptcade ==="
cd ~/hostingservps/promptcade/site || cd ~/apps/promptcade || echo "Promptcade directory not found"

# Check if Promptcade containers exist
if docker ps -a | grep promptcade > /dev/null; then
    echo "Starting Promptcade containers..."
    docker start $(docker ps -aq -f name=promptcade)
else
    echo "Rebuilding Promptcade containers..."
    docker-compose up -d --build
fi

# Wait and check
sleep 10
echo "Testing Promptcade..."
curl -s https://promptcade.com/health || curl -s https://promptcade.com || echo "Promptcade not responding yet"

echo ""
echo "=== Phase 3: Safely Deploying OpenRole ==="
cd ~/apps/openrole-production || mkdir -p ~/apps/openrole-production

# Clone/update repository
if [ -d 'openrole' ]; then
    cd openrole
    git fetch origin
    git checkout master
    git pull origin master
else
    git clone https://github.com/aspora-io/openrole.git
    cd openrole
    git checkout master
fi

# Stop ONLY OpenRole containers
echo "Stopping OpenRole containers if any..."
docker stop openrole-web openrole-api 2>/dev/null || true
docker rm openrole-web openrole-api 2>/dev/null || true

# Create production env file
cat > .env.production << EOF
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.openrole.net
API_URL=https://api.openrole.net
DATABASE_URL=postgresql://openrole:password@openrole-db:5432/openrole
REDIS_URL=redis://openrole-redis:6379
EOF

# Deploy with isolated network
echo "Deploying OpenRole with network isolation..."
docker-compose -f docker-compose.traefik.yml up -d --build

echo ""
echo "=== Phase 4: Verification ==="
echo "Waiting 30 seconds for services to start..."
sleep 30

echo ""
echo "Container status:"
docker ps | grep -E "(promptcade|openrole)" || echo "No containers running"

echo ""
echo "Service health checks:"
echo -n "Promptcade.com: "
curl -s -o /dev/null -w "%{http_code}" https://promptcade.com || echo "FAILED"

echo -n "OpenRole.net: "
curl -s -o /dev/null -w "%{http_code}" https://openrole.net || echo "FAILED"

echo -n "API.OpenRole.net: "
curl -s -o /dev/null -w "%{http_code}" https://api.openrole.net/health || echo "FAILED"

echo ""
echo "=== Phase 5: Troubleshooting (if needed) ==="
echo "Docker logs for any failed services:"
docker ps -a | grep -E "Exited.*promptcade" && docker logs $(docker ps -aq -f name=promptcade | head -1) | tail -20
docker ps -a | grep -E "Exited.*openrole" && docker logs $(docker ps -aq -f name=openrole | head -1) | tail -20

echo ""
echo "✅ Recovery and deployment complete!"
echo ""
echo "Summary:"
echo "- Promptcade: $(curl -s -o /dev/null -w "%{http_code}" https://promptcade.com || echo "DOWN")"
echo "- OpenRole: $(curl -s -o /dev/null -w "%{http_code}" https://openrole.net || echo "DOWN")"
echo "- OpenRole API: $(curl -s -o /dev/null -w "%{http_code}" https://api.openrole.net/health || echo "DOWN")"
RECOVERY_SCRIPT

echo ""
echo "To run this on your server:"
echo "1. SSH into your server: ssh $SSH_USER@$SSH_HOST"
echo "2. Create the script: nano recovery.sh"
echo "3. Paste the script content above"
echo "4. Make it executable: chmod +x recovery.sh"
echo "5. Run it: ./recovery.sh"
echo ""
echo "Or run directly via SSH:"
echo "ssh $SSH_USER@$SSH_HOST 'bash -s' < <(cat << 'EOF'"
echo "$(cat << 'RECOVERY_SCRIPT' | sed 's/^/  /')"
echo "EOF"
echo ")"