#!/bin/bash

# DEPLOYMENT INSTRUCTIONS
# Run these commands on your production server (86.159.155.227)

echo "🚀 Starting CV & Profile Tools Deployment..."
echo "Run these commands on your production server:"
echo ""
echo "1. SSH into your server:"
echo "   ssh your-user@86.159.155.227"
echo ""
echo "2. Download and run the deployment script:"
echo "   cd ~"
echo "   wget https://raw.githubusercontent.com/aspora-io/openrole/master/manual-deploy.sh"
echo "   chmod +x manual-deploy.sh"
echo "   ./manual-deploy.sh"
echo ""
echo "3. Verify deployment:"
echo "   docker ps | grep openrole"
echo "   curl https://openrole.net"
echo "   curl https://api.openrole.net/api/profile/health"
echo ""
echo "✅ This will deploy the complete CV & Profile Tools feature!"

# Alternatively, if you have SSH configured, uncomment and run:
# ssh your-user@86.159.155.227 "
#   cd ~ && 
#   wget -O manual-deploy.sh https://raw.githubusercontent.com/aspora-io/openrole/master/manual-deploy.sh && 
#   chmod +x manual-deploy.sh && 
#   ./manual-deploy.sh
# "