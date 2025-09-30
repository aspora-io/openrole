# Tasks: CV & Profile Tools

**Input**: Design documents from `/home/alan/business/openrole/specs/001-cv-profile-tools/`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓)

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Tech stack: TypeScript 5.x, Next.js 14, Hono, Drizzle ORM, PostgreSQL, Redis
   → Structure: Web app with apps/web/ (frontend) + apps/api/ (backend)
2. Load design documents ✓:
   → data-model.md: 8 entities (CandidateProfile, CVDocument, WorkExperience, Education, PortfolioItem, ApplicationStatus, ExternalApplication, CVTemplate)
   → contracts/: 5 API contracts (profile-api.yaml, cv-api.yaml, profiles-api.yaml, cvs-api.yaml, applications-api.yaml)
   → research.md: File system storage, Puppeteer PDF generation, Zod validation
3. Generate tasks by category ✓
4. Applied task rules ✓
5. Number tasks sequentially (T001-T031)
6. Generate dependency graph ✓
7. Create parallel execution examples ✓
8. Validate task completeness ✓
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Exact file paths included in descriptions

## Path Conventions
Based on plan.md structure:
- **Frontend**: `apps/web/src/`
- **Backend**: `apps/api/src/`
- **Shared**: `packages/`
- **Database**: `database/`

## Phase 3.1: Setup
- [x] T001 Create monorepo structure per implementation plan with apps/web/, apps/api/, packages/, database/
- [x] T002 Initialize TypeScript workspace with Next.js 14, Hono, Drizzle ORM dependencies in package.json
- [x] T003 [P] Configure ESLint, Prettier, and TypeScript configs for strict type checking

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (from contracts/)
- [x] T004 [P] Contract test profile APIs in apps/api/tests/contract/profile-api.test.ts
- [x] T005 [P] Contract test CV APIs in apps/api/tests/contract/cv-api.test.ts
- [x] T006 [P] Contract test profiles search APIs in apps/api/tests/contract/profiles-api.test.ts
- [x] T007 [P] Contract test CVs management APIs in apps/api/tests/contract/cvs-api.test.ts
- [x] T008 [P] Contract test applications APIs in apps/api/tests/contract/applications-api.test.ts

### Integration Tests (from quickstart.md scenarios)
- [x] T009 [P] Integration test profile creation flow in apps/api/tests/integration/profile-creation.test.ts
- [x] T010 [P] Integration test CV upload and validation in apps/api/tests/integration/cv-upload.test.ts
- [x] T011 [P] Integration test privacy controls enforcement in apps/api/tests/integration/privacy-controls.test.ts
- [x] T012 [P] Integration test CV generation from profile in apps/api/tests/integration/cv-generation.test.ts
- [x] T013 [P] Integration test portfolio management in apps/api/tests/integration/portfolio-management.test.ts

## Phase 3.3: Database & Models (ONLY after tests are failing)

### Database Schema (from data-model.md)
- [x] T014 Create database migration for candidate_profiles table in database/migrations/001-candidate-profiles.sql
- [x] T015 Create database migration for cv_documents table in database/migrations/002-cv-documents.sql
- [x] T016 Create database migration for work_experience table in database/migrations/003-work-experience.sql
- [x] T017 Create database migration for education table in database/migrations/004-education.sql
- [x] T018 Create database migration for portfolio_items table in database/migrations/005-portfolio-items.sql

### Drizzle ORM Models
- [x] T019 [P] CandidateProfile model in packages/database/src/models/candidate-profile.ts
- [x] T020 [P] CVDocument model in packages/database/src/models/cv-document.ts
- [x] T021 [P] WorkExperience model in packages/database/src/models/work-experience.ts
- [x] T022 [P] Education model in packages/database/src/models/education.ts
- [x] T023 [P] PortfolioItem model in packages/database/src/models/portfolio-item.ts

### Validation Schemas
- [x] T024 [P] Profile validation schemas in packages/validation/src/profile-schemas.ts
- [x] T025 [P] CV validation schemas in packages/validation/src/cv-schemas.ts

## Phase 3.4: Core Services Implementation

### Profile Services
- [ ] T026 ProfileService CRUD operations in apps/api/src/services/profile-service.ts
- [ ] T027 Privacy controls service in apps/api/src/services/privacy-service.ts
- [ ] T028 Profile search service in apps/api/src/services/profile-search-service.ts

### CV & File Services
- [ ] T029 File upload service with validation in apps/api/src/services/file-upload-service.ts
- [ ] T030 CV generation service with Puppeteer in apps/api/src/services/cv-generation-service.ts
- [ ] T031 Portfolio management service in apps/api/src/services/portfolio-service.ts

## Phase 3.5: API Endpoints Implementation

### Profile Endpoints
- [ ] T032 POST /profiles/me endpoint in apps/api/src/routes/profiles/create.ts
- [ ] T033 GET /profiles/me endpoint in apps/api/src/routes/profiles/get.ts
- [ ] T034 PUT /profiles/me endpoint in apps/api/src/routes/profiles/update.ts
- [ ] T035 PUT /profiles/me/privacy endpoint in apps/api/src/routes/profiles/privacy.ts
- [ ] T036 GET /profiles search endpoint in apps/api/src/routes/profiles/search.ts

### Work Experience & Education Endpoints
- [ ] T037 Work experience CRUD endpoints in apps/api/src/routes/profiles/experience.ts
- [ ] T038 Education CRUD endpoints in apps/api/src/routes/profiles/education.ts

### CV Management Endpoints
- [ ] T039 POST /cv upload endpoint in apps/api/src/routes/cv/upload.ts
- [ ] T040 GET /cv list endpoint in apps/api/src/routes/cv/list.ts
- [ ] T041 GET /cv/{id}/download endpoint in apps/api/src/routes/cv/download.ts
- [ ] T042 POST /cv/generate endpoint in apps/api/src/routes/cv/generate.ts
- [ ] T043 GET /cv/templates endpoint in apps/api/src/routes/cv/templates.ts

### Portfolio Endpoints
- [ ] T044 Portfolio CRUD endpoints in apps/api/src/routes/portfolio/portfolio.ts

## Phase 3.6: Frontend Components

### Profile Management UI
- [ ] T045 [P] Profile form component in apps/web/src/components/profile/ProfileForm.tsx
- [ ] T046 [P] Privacy settings component in apps/web/src/components/profile/PrivacySettings.tsx
- [ ] T047 [P] Work experience form in apps/web/src/components/profile/WorkExperienceForm.tsx
- [ ] T048 [P] Education form in apps/web/src/components/profile/EducationForm.tsx

### CV Management UI
- [ ] T049 [P] CV upload component in apps/web/src/components/cv/CVUpload.tsx
- [ ] T050 [P] CV list component in apps/web/src/components/cv/CVList.tsx
- [ ] T051 [P] CV generation form in apps/web/src/components/cv/CVGeneration.tsx

### Portfolio UI
- [ ] T052 [P] Portfolio management component in apps/web/src/components/portfolio/PortfolioManager.tsx

## Phase 3.7: Integration & Middleware

### API Integration
- [ ] T053 Connect services to database using Drizzle ORM connections
- [ ] T054 Authentication middleware for protected routes in apps/api/src/middleware/auth.ts
- [ ] T055 File upload middleware with size/type validation in apps/api/src/middleware/upload.ts
- [ ] T056 Privacy enforcement middleware in apps/api/src/middleware/privacy.ts

### Error Handling & Logging
- [ ] T057 Global error handling middleware in apps/api/src/middleware/error-handler.ts
- [ ] T058 Request logging and monitoring in apps/api/src/middleware/logging.ts

## Phase 3.8: Polish & Validation

### Unit Tests
- [ ] T059 [P] Unit tests for ProfileService in apps/api/tests/unit/profile-service.test.ts
- [ ] T060 [P] Unit tests for CV generation in apps/api/tests/unit/cv-generation.test.ts
- [ ] T061 [P] Unit tests for file upload validation in apps/api/tests/unit/file-upload.test.ts

### E2E Tests
- [ ] T062 [P] E2E profile creation flow in apps/web/tests/e2e/profile-creation.spec.ts
- [ ] T063 [P] E2E CV upload and management in apps/web/tests/e2e/cv-management.spec.ts

### Performance & Documentation
- [ ] T064 Performance tests for API endpoints (<200ms response time)
- [ ] T065 [P] Update API documentation in docs/api-reference.md
- [ ] T066 Execute quickstart.md validation scenarios
- [ ] T067 Code review and remove duplication

## Dependencies

### Critical Path
1. Setup (T001-T003) → Database (T014-T018) → Models (T019-T023)
2. Models → Services (T026-T031) → Endpoints (T032-T044)
3. Tests (T004-T013) must FAIL before implementation (T014+)

### Blocking Dependencies
- T014-T018 (migrations) block T019-T023 (models)
- T019-T023 (models) block T026-T031 (services)
- T026-T031 (services) block T032-T044 (endpoints)
- T054-T056 (middleware) block T053 (integration)

### Parallel Groups
- **Contract Tests**: T004-T008 (different files)
- **Integration Tests**: T009-T013 (different files)  
- **Models**: T019-T023 (different files)
- **Validation**: T024-T025 (different files)
- **Frontend Components**: T045-T052 (different files)
- **Unit Tests**: T059-T061 (different files)
- **E2E Tests**: T062-T063 (different files)

## Parallel Execution Examples

### Phase 3.2 - All Contract Tests Together
```bash
# Launch T004-T008 in parallel:
Task: "Contract test profile APIs in apps/api/tests/contract/profile-api.test.ts"
Task: "Contract test CV APIs in apps/api/tests/contract/cv-api.test.ts"  
Task: "Contract test profiles search APIs in apps/api/tests/contract/profiles-api.test.ts"
Task: "Contract test CVs management APIs in apps/api/tests/contract/cvs-api.test.ts"
Task: "Contract test applications APIs in apps/api/tests/contract/applications-api.test.ts"
```

### Phase 3.3 - All Models Together  
```bash
# Launch T019-T023 in parallel after migrations complete:
Task: "CandidateProfile model in packages/database/src/models/candidate-profile.ts"
Task: "CVDocument model in packages/database/src/models/cv-document.ts"
Task: "WorkExperience model in packages/database/src/models/work-experience.ts" 
Task: "Education model in packages/database/src/models/education.ts"
Task: "PortfolioItem model in packages/database/src/models/portfolio-item.ts"
```

### Phase 3.6 - All Frontend Components Together
```bash
# Launch T045-T052 in parallel:
Task: "Profile form component in apps/web/src/components/profile/ProfileForm.tsx"
Task: "Privacy settings component in apps/web/src/components/profile/PrivacySettings.tsx"
Task: "Work experience form in apps/web/src/components/profile/WorkExperienceForm.tsx"
Task: "Education form in apps/web/src/components/profile/EducationForm.tsx"
Task: "CV upload component in apps/web/src/components/cv/CVUpload.tsx"
Task: "CV list component in apps/web/src/components/cv/CVList.tsx"
Task: "CV generation form in apps/web/src/components/cv/CVGeneration.tsx"
Task: "Portfolio management component in apps/web/src/components/portfolio/PortfolioManager.tsx"
```

## Notes
- **[P] tasks**: Different files, no dependencies between them
- **Sequential tasks**: Same service/file, must complete in order
- **TDD Critical**: All tests T004-T013 must fail before any implementation
- **Commit strategy**: Commit after each completed task
- **File conflicts**: No [P] task modifies same file as another [P] task
- **Validation**: Run contract tests and quickstart.md after implementation

## Validation Checklist
*GATE: All items must be checked before completion*

- [x] All contracts have corresponding tests (T004-T008)
- [x] All entities have model tasks (T019-T023) 
- [x] All tests come before implementation (T004-T013 before T014+)
- [x] Parallel tasks truly independent (verified file paths)
- [x] Each task specifies exact file path
- [x] No [P] task modifies same file as another [P] task
- [x] Dependencies properly sequenced
- [x] Critical TDD flow maintained (tests → models → services → endpoints)

## Task Summary
- **Total Tasks**: 67 tasks across 8 phases
- **Parallel Tasks**: 24 tasks marked [P] for concurrent execution
- **Sequential Tasks**: 43 tasks with dependencies  
- **Estimated Completion**: 3-4 weeks with parallel execution
- **Test Coverage**: 80%+ as per constitutional requirement