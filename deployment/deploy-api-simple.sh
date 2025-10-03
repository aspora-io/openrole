#!/bin/bash

# Simple API deployment without workspace dependencies
SERVER_IP="145.223.75.73"
SERVER_USER="hyperdude"

echo "🚀 Deploying OpenRole API (simple version)..."

ssh $SERVER_USER@$SERVER_IP << 'EOF'
cd ~

# Create simple API deployment
echo "📦 Creating simple API deployment..."
mkdir -p openrole-api-simple
cd openrole-api-simple

# Create a simple API server
cat > server.js << 'SERVER'
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'openrole-api' });
});

// Mock endpoints for now
app.get('/api/jobs', (req, res) => {
  res.json({
    data: [
      {
        id: 1,
        title: 'Senior Software Developer',
        company: 'Tech Corp',
        location: 'London',
        salary_min: 60000,
        salary_max: 80000,
        type: 'permanent',
        posted_date: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Digital Marketing Manager',
        company: 'Global Marketing Ltd',
        location: 'Manchester',
        salary_min: 45000,
        salary_max: 55000,
        type: 'permanent',
        remote: true,
        posted_date: new Date().toISOString()
      }
    ],
    total: 247,
    page: 1,
    per_page: 10
  });
});

app.get('/api/jobs/:id', (req, res) => {
  res.json({
    id: req.params.id,
    title: 'Senior Software Developer',
    company: 'Tech Corp',
    location: 'London',
    salary_min: 60000,
    salary_max: 80000,
    type: 'permanent',
    description: 'We are looking for an experienced software developer...',
    requirements: ['React', 'Node.js', 'Cloud technologies'],
    posted_date: new Date().toISOString()
  });
});

app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    message: 'Registration endpoint (mock)'
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    token: 'mock-jwt-token',
    user: {
      id: 1,
      email: req.body.email,
      role: 'candidate'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`OpenRole API running on port ${PORT}`);
});
SERVER

# Create package.json
cat > package.json << 'PACKAGE'
{
  "name": "openrole-api-simple",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
PACKAGE

# Create Dockerfile
cat > Dockerfile << 'DOCKER'
FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY server.js .
EXPOSE 3001
CMD ["npm", "start"]
DOCKER

# Create docker-compose
cat > docker-compose.yml << 'COMPOSE'
version: '3.8'

services:
  api:
    build: .
    container_name: openrole-api-simple
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
    restart: unless-stopped
COMPOSE

# Build and start
echo "🚀 Building and starting API..."
docker-compose down 2>/dev/null || true
docker-compose up -d --build

# Wait and test
echo "⏳ Waiting for API to start..."
sleep 5

echo "🧪 Testing API endpoints..."
echo "Health check:"
curl -s http://localhost:3001/health | jq . || echo "Failed"

echo ""
echo "Jobs endpoint:"
curl -s http://localhost:3001/api/jobs | jq '.data[0]' || echo "Failed"

echo ""
echo "✅ Simple API deployment complete!"
echo "API available at: http://$SERVER_IP:3001"
EOF

echo "🎉 Deployment finished!"