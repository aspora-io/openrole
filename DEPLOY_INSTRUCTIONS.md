# Manual Deployment Instructions for OpenRole Frontend

## Current Status
- **Repository**: All frontend code is committed to master branch
- **Live Site**: Still showing old static page
- **Issue**: Automated deployment failing due to SSH configuration

## Manual Deployment Steps

### 1. SSH into Production Server
```bash
ssh your-user@86.159.155.227
```

### 2. Navigate to Apps Directory
```bash
cd ~/apps/openrole-production
```

### 3. Clone/Update Repository
```bash
# If first time:
git clone https://github.com/aspora-io/openrole.git current

# If updating:
cd current
git fetch origin
git pull origin master
```

### 4. Stop Existing Containers
```bash
docker-compose -f docker-compose.traefik.yml down
# or
docker stop openrole-web openrole-api
```

### 5. Build and Start New Containers
```bash
docker-compose -f docker-compose.traefik.yml up -d --build
```

### 6. Check Container Status
```bash
docker ps | grep openrole
docker logs openrole-web
```

### 7. Verify Deployment
```bash
curl https://openrole.net
```

## What You'll See After Deployment

### Homepage (/)
- Professional landing page with job search
- Features explanation and call-to-action buttons
- Employer and candidate sections

### Authentication (/login, /register)
- User registration with role selection (Job Seeker/Employer)
- Login with demo credentials for testing

### Job Search (/jobs)
- Advanced search with filters
- Job listings with salary transparency
- Save jobs functionality

### Dashboard (/dashboard)
- Candidate: Applications tracking, saved jobs
- Employer: Job postings, candidate management

## Demo Credentials for Testing
- **Candidate**: candidate@openrole.net / demo123
- **Employer**: employer@openrole.net / demo123

## Troubleshooting

### If Build Fails
The Docker builds might fail due to workspace dependencies. Check:
```bash
docker logs openrole-web
docker logs openrole-api
```

### If Containers Won't Start
Check for port conflicts:
```bash
sudo lsof -i :3000
sudo lsof -i :3001
```

### If API Doesn't Work
Ensure database and Redis are running:
```bash
docker ps | grep postgres
docker ps | grep redis
```

## Expected Result
After successful deployment, https://openrole.net should show:
1. Modern React homepage with search functionality
2. Working login/register system
3. Job search interface
4. User dashboards
5. Complete navigation system

The platform will be fully functional for users to register, post jobs, apply, and manage their hiring activities.