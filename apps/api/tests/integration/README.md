# Integration Tests

## Profile Creation Flow Test

The `profile-creation.test.ts` file contains comprehensive integration tests for the complete profile creation flow as specified in the quickstart.md document.

### Test Coverage

1. **FR-001: Basic Profile Creation**
   - Tests profile creation with required fields
   - Validates minimum salary requirements (€20,000)
   - Validates salary range (min <= max)
   - Validates field length constraints

2. **Profile Completion Status**
   - Tests profile completion calculation based on required fields
   - Verifies that profiles need work experience and education to be marked complete

3. **FR-011: Work Experience with Achievements**
   - Tests adding work experience with structured achievements
   - Validates that achievements are measurable and specific
   - Ensures achievements are stored separately from responsibilities

4. **FR-003: Privacy Settings**
   - Tests privacy settings configuration
   - Validates privacy enforcement in employer search results
   - Ensures contact info visibility is properly controlled

5. **FR-012: Profile Verification**
   - Tests verification badge calculation
   - Validates the three verification criteria: email, profile completion, ID
   - Shows verified badge in search results

6. **End-to-End Journey**
   - Simulates complete user journey from profile creation to portfolio addition
   - Tests integration between all services
   - Validates data consistency across features

7. **Error Scenarios**
   - Database connection failures
   - Concurrent modification handling
   - Maximum array size validation (50 skills max)
   - Special character handling
   - Zero experience years
   - Invalid date ranges

### Running the Tests

```bash
# From the API directory
npm run test:integration

# Or run specific test file
npm test tests/integration/profile-creation.test.ts
```

### Expected Behavior

Since the implementation doesn't exist yet, all tests will FAIL. This is expected and follows TDD principles:
1. Write tests first (RED phase)
2. Implement features to make tests pass (GREEN phase)
3. Refactor while keeping tests green (REFACTOR phase)

### Test Structure

The tests use mocked services to validate business logic integration:
- `ProfileService` - Handles profile CRUD operations
- `PrivacyService` - Manages privacy settings
- `WorkExperienceService` - Manages work experience entries
- `EducationService` - Manages education records
- `CvService` - Handles CV uploads and generation
- `PortfolioService` - Manages portfolio items

### Key Business Rules Tested

1. **Minimum Salary**: €20,000 minimum
2. **Profile Completion**: Requires work experience and education
3. **Verification Badge**: Requires email verification + complete profile + ID verification
4. **Privacy Controls**: Contact info can be hidden while salary remains visible
5. **Achievements**: Must be specific and measurable (include metrics)
6. **Field Limits**: 
   - Headline: 200 characters max
   - Skills: 50 maximum
   - Summary: 2000 characters max

### Next Steps

1. Implement the service interfaces
2. Create database repositories
3. Add validation schemas
4. Implement API endpoints
5. Make tests pass one by one