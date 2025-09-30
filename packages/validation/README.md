# @openrole/validation

Comprehensive Zod validation schemas for OpenRole CV & Profile Tools, based on OpenAPI contracts and data model specifications.

## Installation

This package is part of the OpenRole monorepo and is automatically linked when you install dependencies at the root level.

```bash
npm install  # From the root of the monorepo
```

## Usage

### Basic Import

```typescript
import { profileSchemas, validateProfileData } from '@openrole/validation';
// or
import { 
  profileCreateRequestSchema, 
  profileUpdateRequestSchema,
  workExperienceRequestSchema 
} from '@openrole/validation/profile';
```

### Profile Validation

```typescript
// Validate profile creation data
const profileData = {
  headline: 'Senior Full-Stack Developer',
  location: 'Dublin, Ireland',
  experienceYears: 5,
  skills: ['TypeScript', 'React', 'Node.js'],
  salaryExpectationMin: 60000,
  salaryExpectationMax: 80000,
  remotePreference: 'hybrid'
};

const result = validateProfileData(profileSchemas.profileCreate, profileData);
if (result.success) {
  console.log('Valid profile:', result.data);
} else {
  console.log('Validation errors:', result.errors);
}
```

### Work Experience Validation

```typescript
const workExpData = {
  jobTitle: 'Senior Software Engineer',
  companyName: 'Tech Corp Ltd',
  location: 'Dublin, Ireland',
  startDate: '2020-03-01',
  endDate: '2023-02-28',
  isCurrent: false,
  description: 'Led a team of 5 developers building microservices architecture.',
  achievements: ['Reduced API response times by 40%'],
  skills: ['TypeScript', 'Docker', 'AWS']
};

const result = workExperienceRequestSchema.safeParse(workExpData);
```

### Privacy Settings Validation

```typescript
const privacyData = {
  privacyLevel: 'semi-private',
  profileVisibleToEmployers: true,
  contactInfoVisible: false,
  salaryVisible: true
};

const result = profileSchemas.privacySettings.safeParse(privacyData);
```

## Available Schemas

### Main Profile Schemas
- `profileCreateRequestSchema` - For creating new profiles
- `profileUpdateRequestSchema` - For updating existing profiles (all fields optional)
- `privacySettingsRequestSchema` - For privacy settings updates

### Related Entity Schemas
- `workExperienceRequestSchema` - For work experience entries
- `educationRequestSchema` - For education entries

### Search and Filtering
- `profileSearchQuerySchema` - For employer profile search queries

### Common Field Validators
- `uuidSchema` - UUID validation
- `emailSchema` - Email validation
- `phoneSchema` - International phone number validation
- `urlSchema` - URL validation with protocol requirement
- `dateStringSchema` - Date string validation (YYYY-MM-DD)
- `futureDateSchema` - Future date validation
- `pastOrPresentDateSchema` - Past or present date validation

### Array Validators
- `skillsArraySchema` - Skills array (1-50 items, 2-100 chars each, unique)
- `industriesArraySchema` - Industries array
- `achievementsArraySchema` - Achievements array for work experience

### Enum Validators
- `remotePreferenceSchema` - Remote work preference (remote, hybrid, office)
- `privacyLevelSchema` - Privacy level (public, semi-private, anonymous)

## Validation Rules

### Profile Data
- **Headline**: 10-255 characters, alphanumeric + basic punctuation
- **Summary**: Max 2000 characters (optional)
- **Skills**: 1-50 unique skills, each 2-100 characters
- **Salary**: Min €20,000, max salary >= min salary
- **Experience Years**: 0-50 years
- **URLs**: Must include protocol (https://) and be from appropriate domains

### Business Logic Validation
- LinkedIn URLs must contain "linkedin.com"
- GitHub URLs must contain "github.com"
- Current positions cannot have end dates
- End dates must be after start dates
- Anonymous profiles cannot have visible contact info
- Salary ranges must be logical (max >= min)

### Date Validation
- **Start/End Dates**: Must be in YYYY-MM-DD format, no future dates
- **Available From**: Must be today or future date
- **Current Positions**: End date must be null when isCurrent=true

## Helper Functions

### validateProfileData()
```typescript
function validateProfileData<T>(schema: ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Array<{ field: string; message: string; code: string }>;
}
```

### sanitizeSkills()
```typescript
function sanitizeSkills(skills: string[]): string[]
// Trims, deduplicates, and normalizes skill names
```

### validateProfileBusinessLogic()
```typescript
function validateProfileBusinessLogic(profile: Partial<ProfileCreateRequest>): {
  isValid: boolean;
  errors: string[];
}
// Additional business logic validation beyond schema rules
```

## TypeScript Types

All schemas export corresponding TypeScript types:

```typescript
type ProfileCreateRequest = z.infer<typeof profileCreateRequestSchema>;
type ProfileUpdateRequest = z.infer<typeof profileUpdateRequestSchema>;
type PrivacySettingsRequest = z.infer<typeof privacySettingsRequestSchema>;
type WorkExperienceRequest = z.infer<typeof workExperienceRequestSchema>;
type EducationRequest = z.infer<typeof educationRequestSchema>;
```

## Error Handling

Validation errors include:
- **field**: The field path that failed validation
- **message**: Human-readable error message
- **code**: Zod error code for programmatic handling

```typescript
const result = validateProfileData(schema, data);
if (!result.success) {
  result.errors.forEach(error => {
    console.log(`${error.field}: ${error.message} (${error.code})`);
  });
}
```

## Schema Collections

For convenience, all schemas are available in a single object:

```typescript
import { profileSchemas } from '@openrole/validation';

// Use any schema
profileSchemas.profileCreate
profileSchemas.workExperience
profileSchemas.education
profileSchemas.uuid
profileSchemas.email
// etc.
```

## Development

### Building
```bash
npm run build
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## Notes

- All validation is based on the OpenAPI contracts in `/specs/001-cv-profile-tools/contracts/`
- Schemas enforce both OpenAPI validation rules and additional business logic
- Date validation uses strict YYYY-MM-DD format
- Phone numbers must be in international format (+countrycode...)
- Skills are automatically deduplicated and normalized
- Privacy settings have cross-field validation rules