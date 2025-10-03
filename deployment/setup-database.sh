#!/bin/bash

# Database setup script
SERVER_IP="145.223.75.73"
SERVER_USER="hyperdude"

echo "🗄️ Setting up OpenRole Database..."

ssh $SERVER_USER@$SERVER_IP << 'EOF'
cd ~

# Check if postgres container is running
if ! docker ps | grep -q openrole-db; then
    echo "❌ PostgreSQL container not running. Starting it..."
    
    # Create docker-compose for database
    cat > docker-compose-db.yml << 'COMPOSE'
version: '3.8'

services:
  openrole-db:
    image: postgres:16-alpine
    container_name: openrole-db
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=openrole
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres-data:
COMPOSE

    docker-compose -f docker-compose-db.yml up -d
    echo "⏳ Waiting for PostgreSQL to start..."
    sleep 10
fi

echo "✅ PostgreSQL is running"

# Test connection
echo "🧪 Testing database connection..."
docker exec openrole-db psql -U postgres -c "SELECT version();" || exit 1

echo "Database ready!"
EOF

echo ""
echo "🚀 Now initializing database schema..."

# Copy database files
scp -r database $SERVER_USER@$SERVER_IP:~/openrole-database/

ssh $SERVER_USER@$SERVER_IP << 'EOF'
cd ~/openrole-database

# Initialize main schema
echo "📝 Creating main schema..."
docker exec -i openrole-db psql -U postgres openrole < database/init.sql

# Run migrations
echo "🔄 Running migrations..."
for migration in database/migrations/*.sql; do
    echo "  - Applying $(basename $migration)..."
    docker exec -i openrole-db psql -U postgres openrole < "$migration"
done

# Check tables
echo ""
echo "📊 Database tables created:"
docker exec openrole-db psql -U postgres openrole -c "\dt"

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Connection details:"
echo "  Host: localhost (from server) or $HOSTNAME:5432 (external)"
echo "  Database: openrole"
echo "  User: postgres"
echo "  Password: postgres"
EOF

echo "🎉 Database initialization complete!"