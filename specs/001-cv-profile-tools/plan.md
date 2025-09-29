# Implementation Plan: CV & Profile Tools

**Branch**: `001-cv-profile-tools` | **Date**: 2025-09-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-cv-profile-tools/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
CV & Profile Tools is a comprehensive candidate profile system for OpenRole.net that enables job seekers to create detailed professional profiles, upload and manage CVs, control privacy settings, and track job applications. The system spans 5 phases from MVP to AI-powered marketplace, emphasizing transparency, accessibility, and GDPR compliance with features including verified candidate badges, blind CV options, application tracking, and career development tools.

## Technical Context
**Language/Version**: TypeScript 5.x with strict type checking  
**Primary Dependencies**: Next.js 14 (App Router), Hono on Bun runtime, Drizzle ORM, PostgreSQL, Redis  
**Storage**: PostgreSQL for structured data, S3-compatible storage for CV files and portfolios  
**Testing**: Vitest for unit tests, Playwright for integration tests, Postman/Newman for contract tests  
**Target Platform**: Web application (responsive design for desktop/mobile)
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: <2.5s LCP, <100ms FID, sub-200ms API response times  
**Constraints**: GDPR compliance, WCAG 2.1 AA accessibility, 10MB file upload limit  
**Scale/Scope**: Support 10k+ candidates, 1000+ employers, 100k+ applications

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. Transparency First**: ✅ PASS
- Profile privacy controls provide candidate transparency options
- Application status tracking ensures hiring process transparency
- Verified employer badges promote employer transparency

**II. Test-Driven Development**: ✅ PASS
- TDD approach with contract tests before implementation
- 80% code coverage requirement
- Integration tests for all user workflows

**III. Modern Stack Excellence**: ✅ PASS
- TypeScript throughout the stack
- Next.js 14 with App Router for frontend
- Hono on Bun runtime for backend
- Performance targets specified (<2.5s LCP, <100ms FID)

**IV. Security by Design**: ✅ PASS
- JWT authentication with RBAC
- GDPR compliance with 3-year retention policy
- File upload validation and size limits
- Data encryption at rest and in transit

**V. Accessibility First**: ✅ PASS
- WCAG 2.1 AA compliance requirement
- Keyboard navigation and screen reader support
- Privacy controls accessible to all users

## Project Structure

### Documentation (this feature)
```
specs/001-cv-profile-tools/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
apps/
├── web/                 # Next.js 14 frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── profile/
│   │   │   │   └── applications/
│   │   │   └── (public)/
│   │   ├── components/
│   │   │   ├── profile/
│   │   │   ├── cv/
│   │   │   └── ui/
│   │   └── lib/
│   └── tests/
│       ├── integration/
│       └── unit/
└── api/                 # Hono backend application
    ├── src/
    │   ├── routes/
    │   │   ├── profiles/
    │   │   ├── cvs/
    │   │   ├── applications/
    │   │   └── auth/
    │   ├── models/
    │   ├── services/
    │   └── middleware/
    └── tests/
        ├── contract/
        ├── integration/
        └── unit/

packages/
├── database/            # Shared database schema (Drizzle)
├── shared/              # Shared types and utilities
└── ui/                  # Shared UI components
```

**Structure Decision**: Web application structure selected due to Next.js frontend and Hono API backend requirements. Monorepo with Turborepo for shared packages including database schema, UI components, and TypeScript types.

## Phase 0: Outline & Research
No NEEDS CLARIFICATION markers remain in the specification - all critical decisions have been clarified through the /clarify command. Research will focus on implementation best practices for the specified tech stack.

**Output**: research.md with technology implementation patterns and best practices

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Candidate Profile, CV Document, Privacy Setting, Job Application
   - Portfolio Item, Employer Search, Application Status, Feedback Tag
   - Career Pathway, Verified Badge entities with relationships

2. **Generate API contracts** from functional requirements:
   - Profile management endpoints (CRUD operations)
   - CV upload and management endpoints
   - Application tracking endpoints
   - Search and filtering endpoints
   - Output OpenAPI schemas to `/contracts/`

3. **Generate contract tests** from contracts:
   - Test files for each endpoint group
   - Assert request/response schemas match OpenAPI specs
   - Tests must fail initially (TDD approach)

4. **Extract test scenarios** from user stories:
   - Profile creation and management flows
   - CV upload and version management
   - Privacy setting changes and visibility
   - Application tracking and status updates

5. **Update agent file incrementally**:
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
   - Add CV & Profile Tools context to CLAUDE.md

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract endpoint → contract test task [P]
- Each entity → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Database schema → Models → Services → API → Frontend
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 35-40 numbered, ordered tasks covering:
- Database setup and migrations
- Model definitions and validations
- API endpoint implementations
- Frontend components and pages
- File upload and storage integration
- Privacy and security features
- Testing and validation

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*No constitutional violations identified - all requirements align with principles*

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v1.0.0 - See `/memory/constitution.md`*