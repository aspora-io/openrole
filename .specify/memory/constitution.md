<!-- 
Sync Impact Report
Version change: 1.0.0 → 1.0.0 (initial ratification)
Added principles:
- I. Transparency First
- II. Test-Driven Development  
- III. Modern Stack Excellence
- IV. Security by Design
- V. Accessibility First
Added sections:
- Code Quality Standards
- Architecture Principles
Templates requiring updates:
✅ plan-template.md - Constitution Check references updated
✅ spec-template.md - No constitution-specific references
✅ tasks-template.md - No constitution-specific references
✅ agent-file-template.md - Not checked (no commands directory found)
Follow-up TODOs:
- TODO(RATIFICATION_DATE): Confirm original adoption date with project owner
-->

# OpenRole.net Constitution

## Core Principles

### I. Transparency First
Every feature must embody radical transparency in hiring practices. This means mandatory salary ranges on all job postings, clear application status tracking, verified employer badges, and open communication channels between candidates and employers. Features that obscure information or create opacity in the hiring process are prohibited.

### II. Test-Driven Development 
TDD is mandatory for all feature development. Tests must be written first, fail initially, then pass through implementation. The Red-Green-Refactor cycle must be strictly enforced. Code coverage must maintain 80% minimum with focus on critical business logic. Integration tests are required for all API endpoints and user workflows.

### III. Modern Stack Excellence
Leverage modern TypeScript throughout the stack. Frontend uses Next.js 14 with App Router, backend uses Hono on Bun runtime. Performance targets are non-negotiable: <2.5s LCP, <100ms FID. All code must be type-safe with strict TypeScript settings. No legacy patterns or deprecated libraries.

### IV. Security by Design
Security cannot be an afterthought. JWT authentication with secure refresh tokens, RBAC for authorization, GDPR compliance for data handling, and regular security audits are mandatory. All user data must be encrypted at rest and in transit. API rate limiting and input validation on every endpoint.

### V. Accessibility First
WCAG 2.1 AA compliance is the minimum standard. Every UI component must be keyboard navigable, screen reader compatible, and provide proper ARIA labels. Color contrast ratios must meet standards. Features must be usable by all users regardless of abilities.

## Code Quality Standards

- ESLint and Prettier configuration must be enforced via pre-commit hooks
- All code must pass linting before merge
- Conventional commits format is mandatory
- Pull requests required for all changes with CI/CD checks
- Docker-first deployment approach for consistency
- Monorepo structure using Turborepo for code sharing

## Architecture Principles

- Domain-driven design with clear separation of concerns
- API-first development with OpenAPI specifications
- Event-driven architecture for background jobs using BullMQ
- Caching strategy with Redis for performance
- Database migrations versioned and reversible
- Microservices-ready but start with modular monolith

## Governance

The Constitution supersedes all development practices and architectural decisions. Any deviation from constitutional principles requires explicit documentation and approval from the tech lead. Amendments to this constitution require a documented rationale, impact analysis, and migration plan for existing code.

All pull requests must include a constitution compliance check. Code reviews must verify adherence to all principles. Complexity that violates simplicity principles must be justified with clear business value.

Use CLAUDE.md for runtime development guidance specific to Claude Code. Similar guidance files should exist for other AI coding assistants (e.g., .github/copilot-instructions.md for GitHub Copilot).

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE) | **Last Amended**: 2025-09-29