# GitHub Actions Workflows

This directory contains the CI/CD workflows for OpenRole.net.

## Repository Secrets Required

Before running these workflows, set up the following repository secrets in your GitHub repository settings:

### SSH Connection Secrets
- `HOST` - The hostname or IP address of your server (e.g., `your-server.com` or `192.168.1.100`)
- `SSH_KEY` - The private SSH key for connecting to the server (entire key content including headers)
- `USERNAME` - The username for SSH connection (e.g., `ubuntu`, `deploy`, or your server username)

### Setting up Repository Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the exact names above

### SSH Key Setup

To generate an SSH key pair for deployment:

```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "openrole-deploy" -f ~/.ssh/openrole_deploy

# Copy public key to server
ssh-copy-id -i ~/.ssh/openrole_deploy.pub username@your-server.com

# Copy private key content for GitHub secret
cat ~/.ssh/openrole_deploy
```

## Available Workflows

### 1. `test-connection.yml` - SSH Connection Test
- **Trigger**: Manual dispatch, push to main/develop, pull requests
- **Purpose**: Test basic SSH connectivity
- **Usage**: Run this first to verify your secrets are configured correctly

### 2. `deploy-test.yml` - Deployment Test
- **Trigger**: Manual dispatch with environment selection
- **Purpose**: Comprehensive server testing and deployment readiness check
- **Features**:
  - Tests SSH connection
  - Checks server prerequisites (disk, memory, software)
  - Tests file transfer capabilities
  - Verifies directory permissions
  - Sets up basic application structure

### 3. `deploy.yml` - Application Deployment
- **Trigger**: Manual dispatch with environment and branch selection
- **Purpose**: Deploy OpenRole.net to staging or production
- **Features**:
  - Builds the application
  - Runs tests before deployment
  - Zero-downtime deployment with releases
  - Health checks after deployment
  - Automatic cleanup of old releases

## Usage Instructions

### Testing Connection (First Time)
1. Set up the three repository secrets
2. Go to **Actions** tab in your repository
3. Select **Test SSH Connection** workflow
4. Click **Run workflow**

### Testing Deployment Setup
1. Go to **Actions** tab
2. Select **Deployment Test** workflow
3. Click **Run workflow**
4. Choose environment (staging/production)
5. Click **Run workflow**

### Deploying Application
1. Ensure tests pass and code is ready
2. Go to **Actions** tab
3. Select **Deploy OpenRole.net** workflow
4. Click **Run workflow**
5. Choose:
   - Environment (staging/production)
   - Branch to deploy (default: main)
6. Click **Run workflow**

## Environment Setup

### Server Requirements
- Ubuntu/Debian Linux server
- SSH access enabled
- Node.js 20+ installed
- NPM/PNPM installed
- Process manager (PM2 recommended)
- Reverse proxy (Nginx recommended)

### Directory Structure
The workflows expect this directory structure on the server:

```
~/apps/
├── openrole-staging/
│   ├── current -> releases/openrole-20240101-120000
│   ├── releases/
│   │   ├── openrole-20240101-120000/
│   │   └── openrole-20240101-110000/
│   ├── logs/
│   └── backups/
└── openrole-production/
    ├── current -> releases/openrole-20240101-120000
    ├── releases/
    ├── logs/
    └── backups/
```

## Troubleshooting

### SSH Connection Issues
- Verify `HOST`, `USERNAME`, and `SSH_KEY` secrets are correct
- Ensure SSH key has proper format (includes `-----BEGIN` and `-----END` lines)
- Check server SSH configuration allows key-based authentication
- Verify user has necessary permissions on the server

### Deployment Issues
- Check server has sufficient disk space
- Verify Node.js and NPM versions are compatible
- Ensure all environment variables are configured
- Check application logs in `~/apps/openrole-{env}/logs/`

### Getting Help
- Check the Actions logs for detailed error messages
- Verify server status and resource availability
- Test SSH connection manually from your local machine
- Review server logs for application-specific issues