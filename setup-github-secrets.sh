#!/bin/bash

# Script to set up GitHub Actions secrets for OpenRole deployment
# Run this locally with gh CLI authenticated

echo "Setting up GitHub Actions secrets for OpenRole deployment..."

# Set the repository
REPO="aspora-io/openrole"

# Production environment secrets
echo "Setting production environment secrets..."

# SSH Configuration
gh secret set SSH_KEY --repo $REPO --body "$(cat ~/.ssh/id_rsa)" || echo "Add your SSH private key"
gh secret set HOST --repo $REPO --body "145.223.75.73"
gh secret set USERNAME --repo $REPO --body "hyperdude"

echo ""
echo "✅ GitHub Actions secrets configured!"
echo ""
echo "To deploy, run:"
echo "  gh workflow run deploy.yml --repo $REPO -f environment=production -f branch=master"
echo ""
echo "Or go to: https://github.com/$REPO/actions/workflows/deploy.yml"