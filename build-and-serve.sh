#\!/bin/bash
echo "Building OpenRole frontend locally..."
cd apps/web

# Install dependencies
npm install --force --legacy-peer-deps

# Build the app  
npm run build

# Create a simple HTML fallback for dynamic routes
mkdir -p out/jobs
cp out/index.html out/jobs.html 2>/dev/null || true
cp out/index.html out/jobs/index.html 2>/dev/null || true

# Create nginx config
cat > nginx.conf << 'NGINX'
server {
    listen 3000;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /_next {
        alias /usr/share/nginx/html/_next;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

echo "Done\! Upload the 'out' directory and nginx.conf to the server."
