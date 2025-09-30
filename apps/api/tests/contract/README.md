# Profile API Contract Tests

This directory contains contract tests for the Profile API endpoints based on the OpenAPI specification in `/specs/001-cv-profile-tools/contracts/profile-api.yaml`.

## Overview

These are **contract tests**, not integration tests. They validate that the API implementation correctly follows the OpenAPI contract specifications, including:

- Request/response schemas
- HTTP status codes
- Error response formats
- Authentication requirements
- Validation rules

## Test Coverage

The contract tests cover all endpoints defined in the profile API specification:

### Profile Management
- `POST /v1/profiles/me` - Create profile
- `GET /v1/profiles/me` - Get current user profile  
- `PUT /v1/profiles/me` - Update profile
- `PUT /v1/profiles/me/privacy` - Update privacy settings
- `GET /v1/profiles` - Search profiles (employer endpoint)

### Work Experience
- `GET /v1/profiles/me/experience` - Get work experience
- `POST /v1/profiles/me/experience` - Add work experience
- `PUT /v1/profiles/me/experience/{id}` - Update work experience
- `DELETE /v1/profiles/me/experience/{id}` - Delete work experience

### Education  
- `GET /v1/profiles/me/education` - Get education
- `POST /v1/profiles/me/education` - Add education
- `PUT /v1/profiles/me/education/{id}` - Update education
- `DELETE /v1/profiles/me/education/{id}` - Delete education

## Test Structure

Each endpoint is tested for:

1. **Success Cases**
   - Valid request data returns expected response
   - Response schema matches OpenAPI specification
   - Correct HTTP status codes

2. **Error Cases**
   - Invalid authentication (401)
   - Bad request data (400)
   - Validation errors (422)
   - Not found errors (404)
   - Forbidden access (403)

3. **Schema Validation**
   - UUID format validation
   - Date format validation (ISO 8601 and YYYY-MM-DD)
   - URL format validation
   - Enum value validation
   - Required field validation
   - Min/max length validation

## Expected Behavior

**These tests SHOULD FAIL initially** because no API implementation exists yet. This is intentional and correct behavior for contract tests.

The tests will:
1. Attempt to import the API application from `../../src/index`
2. Fail with "API implementation not found" error
3. All test cases will be skipped until implementation exists

## Running the Tests

Once the monorepo workspace dependencies are properly configured:

```bash
# Run only contract tests
npm run test:contract

# Run all tests
npm test

# Run contract tests in watch mode
npm run test:watch -- --testPathPattern=tests/contract
```

## Implementation Progress

To make these tests pass, you need to implement:

1. **API Application Setup**
   - Hono.js application exported from `src/index.ts`
   - Route handlers for all endpoints
   - Middleware for authentication, validation, error handling

2. **Request/Response Handling**
   - JSON request/response parsing
   - Input validation using Zod schemas
   - Error response formatting

3. **Authentication**
   - JWT token validation
   - User context extraction
   - Role-based access control

4. **Database Integration**
   - Profile, work experience, and education models
   - CRUD operations with proper error handling
   - Database constraints and validation

5. **Business Logic**
   - Privacy settings handling
   - Profile search and filtering
   - Data transformation for public profiles

## Validation Schemas

The tests include helper functions for validating:

- **UUIDs**: `validateUUID(value)`
- **ISO Dates**: `validateISODate(value)` (for timestamps)
- **Simple Dates**: `validateDate(value)` (for YYYY-MM-DD format)
- **URLs**: `validateURL(value)`

These ensure responses match the OpenAPI specification exactly.

## Mock Data

The tests use consistent mock data:

- Mock JWT token for authentication
- Mock UUIDs for entities (user, profile, experience, education)
- Valid request payloads that match schema requirements
- Invalid request payloads for error testing

## Notes

- Tests use supertest for HTTP requests
- All database operations should be mocked in contract tests
- Tests focus on API contract compliance, not business logic
- Error responses must include consistent structure with `error`, `message`, `code`, and `timestamp` fields
- Validation errors must include detailed field-level error information

## Next Steps

1. Set up proper monorepo workspace dependencies
2. Implement basic Hono.js application structure
3. Add route handlers (initially returning mock data)
4. Run contract tests to see which specific validations fail
5. Iteratively implement features until all contract tests pass