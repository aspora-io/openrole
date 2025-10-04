# OpenRole.net - Transparent Job Platform

A fair, transparent job board that requires salary ranges, verifies employers, and eliminates ghost jobs.

## 🚀 Quick Start

### Local Development

1. **Clone and setup:**
   ```bash
   git clone https://github.com/aspora-io/openrole.git
   cd openrole
   cp .env.local .env
   ```

2. **Start services:**
   ```bash
   docker-compose -f docker-compose.local.yml up -d
   ```

3. **Access applications:**
   - **Web App:** http://localhost:3010
   - **API:** http://localhost:3011
   - **Database:** localhost:5432 (postgres/postgres)
   - **Redis:** localhost:6379
   
   **Live Production:** https://openrole.net
   - **Jobs:** https://openrole.net/jobs
   - **Applications:** https://openrole.net/applications
   - **Dashboards:** https://openrole.net/candidate-dashboard

4. **Stop services:**
   ```bash
   docker-compose -f docker-compose.local.yml down
   ```

### Production Deployment

Production is automatically deployed via GitHub Actions to https://openrole.net

## 🏗️ Architecture

- **Frontend:** Next.js 14 with TypeScript and Tailwind CSS
- **Backend:** Hono API on Node.js runtime  
- **Database:** PostgreSQL with Drizzle ORM
- **Cache:** Redis for sessions and caching
- **Infrastructure:** Docker containers with Traefik reverse proxy

## 📋 Development Roadmap

### Sprint 1 ✅ Completed
- [x] User authentication system
- [x] Basic job posting functionality
- [x] Job search and filtering
- [x] Mandatory salary transparency
- [x] **Application tracking system** 
- [x] **Enhanced candidate/employer dashboards**
- [x] **Modern UI with visual depth**

### Sprint 2 (Current)
- [ ] Better location precision (Dublin-specific)
- [ ] Core vs nice-to-have skills categorization
- [ ] Ghost job prevention system
- [ ] Company verification workflow
- [ ] CV & Profile Tools
- [ ] Email notifications

### Sprint 3
- [ ] Advanced search and filtering
- [ ] Personalized job recommendations
- [ ] Analytics dashboard
- [ ] Mobile app development

## 🛠️ Tech Stack

### Frontend (apps/web)
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod validation

### Backend (apps/api)  
- Hono framework
- TypeScript
- Drizzle ORM
- PostgreSQL
- Redis
- JWT authentication

### Infrastructure
- Docker & Docker Compose
- Traefik (reverse proxy)
- GitHub Actions (CI/CD)
- Let's Encrypt (SSL)

## 🗃️ Database Schema

Key entities:
- **Users** - Candidates, employers, admins
- **Companies** - Verified employer organizations  
- **Jobs** - Job postings with mandatory salary ranges
- **Applications** - Candidate applications to jobs
- **Profiles** - Extended candidate information

See `database/init.sql` for complete schema.

## 🎯 Application Tracking System

Our comprehensive application tracking system provides real-time visibility and management for both candidates and employers:

### For Candidates
- **Personal Applications Dashboard** - View all applications at `/applications`
- **Real-time Status Updates** - Track progress from submission to decision
- **Application History** - Complete timeline with status changes
- **Duplicate Prevention** - Smart detection prevents multiple applications
- **Interactive UI** - Modern design with glass morphism and animations

### For Employers  
- **Application Management** - Review and update application statuses
- **Bulk Actions** - Efficiently manage multiple applications
- **Status Workflow** - Guided process from review to hiring decision
- **Candidate Communication** - Track interactions and notes

### Technical Features
- **localStorage Persistence** - Reliable client-side storage
- **Event-driven Updates** - Real-time synchronization across dashboards
- **Performance Optimized** - Efficient filtering and sorting
- **Mobile Responsive** - Seamless experience across devices

## 🔧 Development Workflow

1. **Create feature branch:** `git checkout -b feature/job-search`
2. **Make changes and test locally**
3. **Commit with conventional commits:** `git commit -m "feat: add job search filtering"`
4. **Push and create PR:** `gh pr create`
5. **Auto-deploy on merge to main**

## 📊 Core Features

### ✅ Implemented
- **Landing page** with value proposition and modern design
- **User authentication** (signup/login/logout)
- **Job posting** with mandatory salary requirements
- **Job search and filtering** with multiple criteria
- **Application tracking system** with real-time updates
- **Enhanced dashboards** for candidates and employers
- **Modern UI design** with glass morphism and visual depth
- **Clean URL routing** for professional navigation
- **Docker-based development** environment
- **Production deployment** pipeline with SSL

### 🚧 In Development (Sprint 2)
- Advanced location filtering (Dublin-specific)
- Skills categorization (core vs nice-to-have)
- Ghost job prevention system
- CV & Profile Tools
- Email notifications

### 📋 Planned
- Advanced search algorithms
- Personalized job recommendations
- Analytics dashboard
- Mobile application

## 🌟 Key Differentiators

1. **Mandatory Salary Transparency** - Every job must show salary range
2. **Verified Employers** - Only confirmed companies can post
3. **No Ghost Jobs** - Active verification prevents expired listings
4. **Better Location Data** - Precise Dublin areas vs vague regions
5. **Smart Skills Matching** - Core requirements vs nice-to-have

## 🤝 Contributing

1. Check the [GitHub Issues](https://github.com/aspora-io/openrole/issues) for current tasks
2. Follow the development workflow above
3. Ensure tests pass and code follows TypeScript standards
4. Update documentation for new features

## 📱 Contact

- **Website:** https://openrole.net
- **Issues:** https://github.com/aspora-io/openrole/issues
- **Email:** alan@aspora.io

---

*Built with transparency, powered by community feedback.*