# Profile API Contract Testing Guide

## Overview

This directory contains comprehensive contract tests for the Profile API endpoints as specified in the OpenAPI contract at `/specs/001-cv-profile-tools/contracts/profile-api.yaml`.

## Test Files Created

1. **`profile-api.test.ts`** - Main contract test suite with 100+ test cases
2. **`validation-helpers.test.ts`** - Helper function tests for schema validation
3. **`README.md`** - Detailed documentation about the test structure
4. **`TESTING_GUIDE.md`** - This file with setup instructions

## Current Status

The contract tests are ready but cannot be executed yet due to:

1. **Monorepo Setup Issues**: The workspace dependencies (`@openrole/database` and `@openrole/validation`) need to be properly configured
2. **Missing Implementation**: The API implementation doesn't exist yet (which is expected for contract tests)

## Test Structure Summary

### Endpoints Covered (15 total)

**Profile Management (5 endpoints):**
- POST /v1/profiles/me - Create profile
- GET /v1/profiles/me - Get current profile
- PUT /v1/profiles/me - Update profile
- PUT /v1/profiles/me/privacy - Update privacy
- GET /v1/profiles - Search profiles (employer)

**Work Experience (4 endpoints):**
- GET /v1/profiles/me/experience
- POST /v1/profiles/me/experience
- PUT /v1/profiles/me/experience/{id}
- DELETE /v1/profiles/me/experience/{id}

**Education (4 endpoints):**
- GET /v1/profiles/me/education
- POST /v1/profiles/me/education
- PUT /v1/profiles/me/education/{id}
- DELETE /v1/profiles/me/education/{id}

**Cross-cutting Concerns (2 test suites):**
- Response schema validation
- Error response standards

### Test Cases Per Endpoint

Each endpoint tests:
- ✅ Success case (200/201/204)
- ❌ Authentication errors (401)
- ❌ Bad request (400)
- ❌ Validation errors (422)
- ❌ Not found (404)
- ❌ Forbidden (403) - where applicable

**Total test cases: ~120**

### Schema Validation

Tests validate all response schemas match OpenAPI spec:

**CandidateProfile Schema (23 fields)**
```typescript
- id: UUID
- userId: UUID  
- headline: string (10-255 chars)
- summary: string (max 2000 chars)
- location: string
- phoneNumber: string
- portfolioUrl: URL
- linkedinUrl: URL
- githubUrl: URL
- experienceYears: number (0-50)
- skills: string[] (1-50 items)
- industries: string[]
- salaryExpectationMin: number (min 20000)
- salaryExpectationMax: number (min 20000)
- availableFrom: date (YYYY-MM-DD)
- willingToRelocate: boolean
- remotePreference: enum (remote|hybrid|office)
- privacyLevel: enum (public|semi-private|anonymous)
- profileVisibleToEmployers: boolean
- contactInfoVisible: boolean
- salaryVisible: boolean
- emailVerified: boolean
- profileComplete: boolean
- idVerified: boolean
- verifiedBadge: boolean
- profileViews: number
- lastActiveAt: ISO datetime
- createdAt: ISO datetime
- updatedAt: ISO datetime
```

**PublicProfile Schema (12 fields)**
- Subset of CandidateProfile based on privacy settings
- Conditional fields (contact info only if contactInfoVisible=true)

**WorkExperience Schema (15 fields)**
```typescript
- id: UUID
- profileId: UUID
- jobTitle: string (2-200 chars)
- companyName: string (2-200 chars)
- companyWebsite: URL (optional)
- location: string
- startDate: date (YYYY-MM-DD)
- endDate: date (nullable)
- isCurrent: boolean
- description: string (10-2000 chars)
- achievements: string[] (max 20, each 10-500 chars)
- skills: string[]
- sortOrder: number
- createdAt: ISO datetime
- updatedAt: ISO datetime
```

**Education Schema (13 fields)**
```typescript
- id: UUID
- profileId: UUID
- institutionName: string (2-200 chars)
- degree: string (2-200 chars)
- fieldOfStudy: string (2-200 chars)
- location: string
- startDate: date (YYYY-MM-DD)
- endDate: date (nullable)
- isOngoing: boolean
- grade: string (optional)
- description: string (max 1000 chars, optional)
- sortOrder: number
- createdAt: ISO datetime
- updatedAt: ISO datetime
```

### Error Response Schemas

**Standard Error**
```typescript
{
  error: string
  message: string
  code: string
  timestamp: ISO datetime
}
```

**Validation Error**
```typescript
{
  error: string
  message: string
  code: string
  details: Array<{
    field: string
    message: string
    code: string
  }>
  timestamp: ISO datetime
}
```

### Validation Helpers

Tests include helper functions for validating:
- **UUID format**: RFC 4122 compliant
- **ISO datetime**: ISO 8601 with timezone
- **Date format**: YYYY-MM-DD
- **URL format**: Valid HTTP/HTTPS URLs
- **Enum values**: Restricted string sets

## Running Tests (Once Setup Complete)

```bash
# Install dependencies (requires monorepo fix)
npm install

# Run only contract tests
npm run test:contract

# Run with coverage
npm run test:contract -- --coverage

# Run in watch mode
npm run test:contract -- --watch

# Run specific test suite
npm run test:contract -- --testNamePattern="Profile Management"

# Run validation helpers only
npx jest tests/contract/validation-helpers.test.ts
```

## Expected Test Results

### Phase 1: Setup Complete, No Implementation
```
❌ API implementation not found
   All contract tests skipped
✅ Validation helpers pass (24/24)
```

### Phase 2: Basic API Setup
```
❌ POST /v1/profiles/me (0/6 pass)
❌ GET /v1/profiles/me (0/3 pass)
❌ PUT /v1/profiles/me (0/4 pass)
❌ PUT /v1/profiles/me/privacy (0/3 pass)
❌ GET /v1/profiles (0/6 pass)
❌ Work Experience endpoints (0/16 pass)
❌ Education endpoints (0/16 pass)
✅ Validation helpers pass (24/24)
```

### Phase 3: Full Implementation Complete
```
✅ All contract tests pass (120/120)
✅ Validation helpers pass (24/24)
✅ Coverage: 100% contract compliance
```

## Next Steps to Run Tests

1. **Fix Monorepo Setup**
   ```bash
   # Option 1: Use proper workspace package manager
   npm install -g pnpm
   pnpm install
   
   # Option 2: Create local packages
   mkdir -p packages/database/src packages/validation/src
   echo 'export {}' > packages/database/src/index.ts
   echo 'export {}' > packages/validation/src/index.ts
   ```

2. **Install Test Dependencies**
   ```bash
   npm install --save-dev jest ts-jest @types/jest supertest @types/supertest
   ```

3. **Create Basic API Structure**
   ```typescript
   // src/index.ts
   import { Hono } from 'hono'
   
   const app = new Hono()
   
   app.get('/health', (c) => c.json({ status: 'ok' }))
   
   export { app }
   ```

4. **Run Contract Tests**
   ```bash
   npm run test:contract
   ```

5. **Implement Endpoints Incrementally**
   - Start with mock responses that match schemas
   - Add authentication middleware
   - Add validation middleware
   - Connect to database
   - Implement business logic

## Test-Driven Development Workflow

1. **Red**: Run contract tests → All fail (expected)
2. **Green**: Implement minimal code to make one test pass
3. **Refactor**: Improve code while keeping tests passing
4. **Repeat**: Move to next failing test

This ensures the API implementation exactly matches the OpenAPI contract specification.

## Contract Test Benefits

- **API First**: Implementation follows contract exactly
- **Documentation**: Tests serve as executable API documentation
- **Regression Prevention**: Schema changes break tests immediately
- **Integration Ready**: Real HTTP requests test the full stack
- **Quality Gate**: Must pass before deployment

The contract tests provide confidence that the API implementation is 100% compliant with the OpenAPI specification and ready for frontend integration.