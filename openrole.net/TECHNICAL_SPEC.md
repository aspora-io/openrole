# FairPath.io Technical Specification

## Overview
FairPath.io is a transparent job platform built with modern web technologies, emphasizing salary transparency, fair hiring practices, and exceptional user experience.

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **API Client**: TanStack Query (React Query)
- **Testing**: Vitest + React Testing Library + Playwright

### Backend
- **Runtime**: Node.js with Bun
- **Framework**: Hono (lightweight, fast, edge-ready)
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Cache**: Redis (Upstash for serverless)
- **Queue**: BullMQ for background jobs
- **File Storage**: S3-compatible (Cloudflare R2)
- **Testing**: Vitest + Supertest

### Infrastructure
- **Hosting**: Vercel (frontend) + Railway/Fly.io (backend)
- **Database**: Neon (serverless Postgres)
- **Email**: Resend
- **Payments**: Stripe
- **Monitoring**: Sentry + PostHog
- **CI/CD**: GitHub Actions

## Core Features

### 1. Job Management
- Create, edit, publish job listings
- Mandatory salary ranges
- Skill tagging with autocomplete
- Location + remote options
- Automatic expiration
- Draft/published states

### 2. User System
- **Candidates**: Profile, resume upload, saved searches, application tracking
- **Employers**: Company profiles, team management, job analytics
- **Admins**: Moderation, verification, platform analytics

### 3. Application Flow
- One-click apply with profile
- Custom screening questions
- Application status tracking
- Real-time notifications
- Candidate feedback system

### 4. Search & Discovery
- Full-text search with PostgreSQL
- Faceted filtering
- Saved searches with alerts
- AI-powered job matching
- Location-based search

### 5. Transparency Features
- Mandatory salary disclosure
- Company culture metrics
- Interview process transparency
- Response time commitments
- Hiring statistics

### 6. Payment System
- Pay-per-post model
- Subscription tiers
- Bulk job credits
- Promotional tools
- Invoice generation

## Database Schema

### Core Tables
```sql
-- Companies
companies (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  domain text UNIQUE,
  logo_url text,
  description text,
  size text,
  verified boolean DEFAULT false,
  created_at timestamp
)

-- Users
users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  password_hash text,
  role enum('candidate', 'employer', 'admin'),
  company_id uuid REFERENCES companies,
  created_at timestamp
)

-- Jobs
jobs (
  id uuid PRIMARY KEY,
  company_id uuid REFERENCES companies,
  title text NOT NULL,
  description text NOT NULL,
  requirements text[],
  salary_min integer NOT NULL,
  salary_max integer NOT NULL,
  salary_currency text DEFAULT 'USD',
  location text,
  remote_type enum('onsite', 'hybrid', 'remote'),
  employment_type enum('full_time', 'part_time', 'contract'),
  status enum('draft', 'published', 'closed'),
  expires_at timestamp,
  created_at timestamp
)

-- Applications
applications (
  id uuid PRIMARY KEY,
  job_id uuid REFERENCES jobs,
  user_id uuid REFERENCES users,
  status enum('submitted', 'reviewing', 'rejected', 'interviewing'),
  cover_letter text,
  resume_url text,
  created_at timestamp
)
```

## API Design

### RESTful Endpoints
```
# Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

# Jobs
GET    /api/jobs                 # List with filters
GET    /api/jobs/:id            # Single job
POST   /api/jobs                # Create (employer)
PUT    /api/jobs/:id            # Update (employer)
DELETE /api/jobs/:id            # Delete (employer)

# Applications
POST   /api/jobs/:id/apply      # Submit application
GET    /api/applications        # List (candidate)
GET    /api/applications/:id   # Single application
PUT    /api/applications/:id   # Update status (employer)

# Companies
GET    /api/companies/:id       # Public profile
PUT    /api/companies/:id       # Update (employer)

# Search
GET    /api/search/jobs         # Full-text search
GET    /api/search/suggestions  # Autocomplete

# Analytics
GET    /api/analytics/jobs/:id  # Job performance
GET    /api/analytics/company   # Company dashboard
```

## Security

### Authentication
- JWT tokens with refresh rotation
- OAuth2 social login (Google, GitHub)
- Email verification required
- 2FA support

### Authorization
- Role-based access control (RBAC)
- Resource-based permissions
- API rate limiting
- CORS configuration

### Data Protection
- Encryption at rest
- TLS everywhere
- PII data masking
- GDPR compliance
- Regular security audits

## Performance

### Targets
- Time to First Byte: < 200ms
- Largest Contentful Paint: < 2.5s
- First Input Delay: < 100ms
- Cumulative Layout Shift: < 0.1

### Strategies
- Edge caching with Vercel
- Database connection pooling
- Redis caching layer
- Image optimization (Next.js Image)
- Code splitting
- Lazy loading

## Monitoring & Analytics

### Application Monitoring
- Error tracking with Sentry
- Performance monitoring
- API endpoint metrics
- Database query analysis

### Business Metrics
- Job posting velocity
- Application rates
- User engagement
- Revenue tracking
- Conversion funnels

## Development Workflow

### Version Control
- Git with GitHub
- Feature branch workflow
- Conventional commits
- Automated versioning

### Code Quality
- TypeScript strict mode
- ESLint + Prettier
- Husky pre-commit hooks
- Code reviews required
- Test coverage > 80%

### Deployment
- Preview deployments for PRs
- Staging environment
- Blue-green deployments
- Automated rollbacks
- Database migrations

## MVP Scope (8 weeks)

### Phase 1: Foundation (2 weeks)
- User authentication
- Company profiles
- Basic job CRUD

### Phase 2: Core Features (3 weeks)
- Job search & filters
- Application system
- Candidate profiles

### Phase 3: Payments (1 week)
- Stripe integration
- Job posting credits
- Basic billing

### Phase 4: Polish (2 weeks)
- Email notifications
- Admin dashboard
- Performance optimization
- Security audit

## Post-MVP Roadmap

### Quarter 1
- AI-powered matching
- Advanced analytics
- Mobile app (React Native)
- API for partners

### Quarter 2
- Video introductions
- Skill assessments
- Salary benchmarking
- International expansion

### Quarter 3
- Team hiring workflows
- ATS integration
- Recruitment CRM
- White-label solution

## Success Metrics

### Technical KPIs
- 99.9% uptime
- < 3s page load
- < 1% error rate
- 90+ Lighthouse score

### Business KPIs
- 1000+ active jobs
- 50% application rate
- 80% employer retention
- 20% month-over-month growth