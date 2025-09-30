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

### Sprint 1 (Current)
- [ ] User authentication system
- [ ] Basic job posting functionality
- [ ] Job search and filtering
- [ ] Mandatory salary transparency

### Sprint 2
- [ ] Better location precision (Dublin-specific)
- [ ] Core vs nice-to-have skills categorization
- [ ] Ghost job prevention system
- [ ] Company verification workflow

### Sprint 3
- [ ] CV & Profile Tools
- [ ] Application tracking
- [ ] Employer dashboard
- [ ] Email notifications

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

## 🔧 Development Workflow

1. **Create feature branch:** `git checkout -b feature/job-search`
2. **Make changes and test locally**
3. **Commit with conventional commits:** `git commit -m "feat: add job search filtering"`
4. **Push and create PR:** `gh pr create`
5. **Auto-deploy on merge to main**

## 📊 Core Features

### ✅ Implemented
- Landing page with value proposition
- Docker-based development environment
- Production deployment pipeline
- Database schema design

### 🚧 In Development (Sprint 1)
- User authentication (signup/login)
- Job posting form with salary requirements
- Job listing and search functionality
- Basic employer/candidate dashboards

### 📋 Planned
- Advanced location filtering (Dublin-specific)
- Skills categorization (core vs nice-to-have)
- Ghost job prevention system
- CV & Profile Tools
- Application tracking
- Personalized job recommendations

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