#!/bin/bash

echo "🧪 Testing OpenRole Integration..."
echo ""

# Test API endpoints directly
echo "1. Testing API Health Check:"
curl -s http://145.223.75.73:3002/health | python3 -m json.tool

echo ""
echo "2. Testing Jobs API:"
curl -s http://145.223.75.73:3002/api/jobs | python3 -m json.tool | head -20

echo ""
echo "3. Testing Login API:"
curl -s -X POST http://145.223.75.73:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' | python3 -m json.tool

echo ""
echo "4. Testing Search API:"
curl -s "http://145.223.75.73:3002/api/search?q=developer&location=london" | python3 -m json.tool

echo ""
echo "5. Testing Frontend Integration:"
echo "   Visit: https://openrole.net/jobs"
echo "   - Jobs should load dynamically"
echo "   - Login form should work"
echo "   - Search should function"

echo ""
echo "✅ Integration test complete!"