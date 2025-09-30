
# Implementation Plan: CV & Profile Tools

**Branch**: `001-cv-profile-tools` | **Date**: 2025-09-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/home/alan/business/openrole/specs/001-cv-profile-tools/spec.md`

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
Comprehensive candidate profile system for OpenRole.net delivering CV upload/generation, privacy controls, and career development features across 5 phases. Core focus on transparency, user control, and AI-powered job matching while maintaining strict privacy and GDPR compliance.

## Technical Context
**Language/Version**: TypeScript 5.x with strict type checking + Node.js 20+  
**Primary Dependencies**: Next.js 14 (App Router), Hono on Node.js runtime, Drizzle ORM, PostgreSQL, Redis  
**Storage**: PostgreSQL for structured data, Redis for sessions/cache, file system for CV/portfolio uploads  
**Testing**: Playwright for E2E, Jest for unit tests, manual TDD approach  
**Target Platform**: Linux containers via Docker, web browsers (desktop/mobile)
**Project Type**: web - monorepo with frontend (Next.js) + backend (Hono API)  
**Performance Goals**: <2.5s LCP, <100ms FID, <200ms API response times, 80%+ test coverage  
**Constraints**: GDPR compliance, WCAG 2.1 AA accessibility, 10MB file upload limit  
**Scale/Scope**: 31 functional requirements across 5 development phases, multi-tenant candidate/employer system

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. Transparency First**: ✅ PASS
- CV tools include privacy controls allowing candidates to choose transparency levels
- Application tracking provides clear status visibility
- Profile verification badges promote employer trust through transparency

**II. Test-Driven Development**: ✅ PASS  
- Plan includes contract tests before implementation
- Jest unit tests and Playwright E2E tests specified
- 80%+ test coverage target aligns with constitutional requirement

**III. Modern Stack Excellence**: ✅ PASS
- TypeScript 5.x with strict settings throughout
- Next.js 14 App Router for frontend performance
- Performance targets align: <2.5s LCP, <100ms FID
- Hono API framework for modern backend patterns

**IV. Security by Design**: ✅ PASS
- GDPR compliance built into requirements (FR-028-031)
- File upload validation and size limits (10MB)
- Privacy controls by design, not afterthought
- Data retention and deletion policies specified

**V. Accessibility First**: ✅ PASS
- WCAG 2.1 AA compliance specified in constraints
- Form-heavy features will require extensive accessibility testing
- CV generation must produce accessible document formats

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
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
├── web/ (Next.js frontend)
│   ├── src/
│   │   ├── app/
│   │   │   ├── profile/
│   │   │   ├── cv/
│   │   │   └── dashboard/
│   │   ├── components/
│   │   │   ├── profile/
│   │   │   ├── cv/
│   │   │   └── ui/
│   │   └── lib/
│   │       ├── validation/
│   │       ├── api/
│   │       └── utils/
│   └── tests/
│       ├── e2e/
│       ├── components/
│       └── integration/

├── api/ (Hono backend)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── profiles/
│   │   │   ├── cv/
│   │   │   └── uploads/
│   │   ├── models/
│   │   │   ├── profile.ts
│   │   │   ├── cv.ts
│   │   │   └── application.ts
│   │   ├── services/
│   │   │   ├── profile/
│   │   │   ├── cv-generation/
│   │   │   └── file-upload/
│   │   └── middleware/
│   └── tests/
│       ├── contract/
│       ├── integration/
│       └── unit/

packages/
├── shared-types/ (TypeScript definitions)
├── database/ (Drizzle ORM schemas)
└── validation/ (Zod schemas)

database/
├── migrations/
├── seeds/
└── init.sql
```

**Structure Decision**: Web application with separate frontend/backend apps in monorepo structure using Turborepo. Frontend uses Next.js 14 App Router with feature-based organization. Backend uses Hono with domain-driven structure. Shared packages for types and validation ensure consistency.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [ ] Phase 0: Research complete (/plan command)
- [ ] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
