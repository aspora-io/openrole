# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

OpenRole is a transparent job platform built as a Turborepo monorepo with Next.js 14 frontend and Hono API backend. The platform requires salary transparency, verifies employers, and eliminates ghost jobs.

## Architecture

This is a monorepo using npm workspaces with Turbo:
- **apps/web**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **apps/api**: Hono framework on Node.js runtime with Drizzle ORM
- **packages**: Shared code (configured but currently empty)
- **database**: PostgreSQL schema and migrations

## Essential Commands

### Development
```bash
# From repository root
npm install              # Install all dependencies
npm run dev              # Start all apps in development mode
npm run build            # Build all applications
npm run test             # Run tests across all packages
npm run lint             # Lint all code
npm run type-check       # TypeScript checking
npm run start:production # Start in production mode

# Individual app commands (run from root)
npm run dev --workspace=apps/web    # Run only frontend
npm run dev --workspace=apps/api    # Run only API
npm run test --workspace=apps/api   # Test only API
```

### Docker Development
```bash
# Local development with hot reload
docker-compose -f docker-compose.local.yml up -d

# Access points:
# Web: http://localhost:3010
# API: http://localhost:3011
# PostgreSQL: localhost:5432 (user: postgres, password: postgres)
# Redis: localhost:6379

# Production-like environment
docker-compose -f docker-compose.simple.yml up -d --build
```

### Database Operations
```bash
# Initialize database (from root)
docker exec -i openrole-db psql -U postgres < database/init.sql

# Run migrations
cd apps/api
npm run db:migrate      # Apply migrations
npm run db:generate     # Generate Drizzle types from schema
```

### Testing
```bash
# Unit tests
npm test                         # All tests
npm run test:watch              # Watch mode
npm run test:coverage           # Coverage report

# API integration tests (from apps/api)
npm run test:integration        # Requires running database

# E2E tests (from apps/web)
npm run test:e2e               # Playwright tests
```

### Deployment
```bash
# Deploy to production (145.223.75.73)
./deployment/deploy-production.sh

# Alternative deployment methods
./deployment/deploy-clean.sh    # Clean deployment from scratch
ssh hyperdude@145.223.75.73    # Direct server access
```

## Key Implementation Details

### API Structure (apps/api)
- **Entry**: `src/index.ts` - Hono server setup
- **Routes**: `src/routes/` - Organized by feature (auth, jobs, profile)
- **Services**: Business logic separated from routes
- **Middleware**: Auth middleware using JWT
- **Database**: Drizzle ORM with PostgreSQL

### Frontend Structure (apps/web)
- **App Router**: Using Next.js 14 app directory
- **Pages**: `src/app/` - File-based routing
- **Components**: `src/components/` - Reusable UI components
- **Hooks**: `src/hooks/` - Custom React hooks (useAuth, useJobSearch)
- **API Client**: `src/lib/api.ts` - Centralized API communication

### Authentication Flow
1. Frontend uses `useAuth` hook for state management
2. JWT tokens stored in httpOnly cookies
3. API validates tokens in auth middleware
4. User roles: candidate, employer, admin

### Database Schema
Key tables:
- `users`: Authentication and basic info
- `companies`: Employer organizations (require verification)
- `jobs`: Job postings with mandatory salary_min/salary_max
- `applications`: Track candidate applications
- `cv_profiles`: CV and portfolio management (feature branch)

### Environment Variables
```bash
# Required for all environments
DATABASE_URL=postgresql://user:password@localhost:5432/openrole
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
NODE_ENV=development|production

# Frontend specific
NEXT_PUBLIC_API_URL=http://localhost:3011  # API endpoint
```

## Current Development

### Active Feature: CV & Profile Tools (branch: 001-cv-profile-tools)
Implementing comprehensive CV management with:
- Multiple privacy levels (public, semi-private, anonymous)
- CV upload and generation
- Portfolio showcase
- Work experience tracking
- Multi-phase rollout plan

### Deployment Configuration
- **Production Server**: 145.223.75.73 (username: hyperdude)
- **Domain**: openrole.net
- **SSL**: Handled by Traefik
- **GitHub Actions**: Builds and publishes to GHCR

### Docker Compose Files
- `docker-compose.local.yml`: Local development with hot reload
- `docker-compose.traefik.yml`: Production with Traefik proxy
- `docker-compose.simple.yml`: Simplified deployment (currently missing from repo)

## Important Notes

1. **Monorepo Dependencies**: Uses workspace protocol (`workspace:*`), which can cause issues in Docker builds. Use `--force` flag when needed.

2. **Port Assignments**:
   - Web: 3000 (container) → 3010 (local) or 80 (production)
   - API: 3001 (container) → 3011 (local)
   - PostgreSQL: 5432
   - Redis: 6379

3. **Git Workflow**: 
   - Use feature branches for major changes
   - PRs can be auto-merged for rapid development
   - Repository was made public for easier deployment

4. **Testing Requirements**:
   - New features need tests
   - API endpoints require integration tests
   - Critical UI flows need E2E tests

5. **Deployment Issues**:
   - SSH key already configured for hyperdude@145.223.75.73
   - Use deploy keys for private repo access
   - Traefik handles SSL and routing in production