# @openrole/database

Database models and schemas for the OpenRole CV & Profile Tools platform using Drizzle ORM.

## Overview

This package provides type-safe database models, validation schemas, and utility functions for the OpenRole platform. It includes comprehensive support for candidate profiles, CV management, and privacy controls.

## Installation

```bash
npm install @openrole/database
```

## Dependencies

- `drizzle-orm` - Type-safe SQL query builder
- `drizzle-zod` - Zod schema integration for Drizzle
- `postgres` - PostgreSQL client
- `zod` - Schema validation

## Models

### CandidateProfile

The `CandidateProfile` model provides extended professional profile information for job seekers with comprehensive privacy controls and verification status tracking.

#### Features

- **Privacy Controls**: Three privacy levels (public, semi-private, anonymous)
- **Verification System**: Email, profile completion, and ID verification
- **JSONB Fields**: Efficient storage for skills and industries arrays
- **Salary Preferences**: Min/max salary expectations with validation
- **Remote Work Preferences**: Support for remote, hybrid, and office preferences
- **Profile Analytics**: View tracking and completion percentage calculation

#### Basic Usage

```typescript
import { 
  candidateProfiles, 
  insertCandidateProfileSchema,
  type InsertCandidateProfile,
  type SelectCandidateProfile 
} from '@openrole/database';

// Create a new profile
const newProfile: InsertCandidateProfile = {
  userId: 'user-uuid',
  headline: 'Senior Full Stack Developer',
  summary: 'Experienced developer with 8+ years in web development...',
  location: 'Berlin, Germany',
  experienceYears: 8,
  skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
  industries: ['Technology', 'Fintech'],
  salaryExpectationMin: 70000,
  salaryExpectationMax: 90000,
  remotePreference: 'hybrid',
  privacyLevel: 'semi-private'
};

// Validate before insertion
const validatedProfile = insertCandidateProfileSchema.parse(newProfile);
```

#### Schema Definition

```typescript
// Basic Information
headline: string (10-255 chars, required)
summary: string (max 2000 chars, optional)
location: string (optional)
phoneNumber: string (max 50 chars, optional)
portfolioUrl: string (valid URL, optional)
linkedinUrl: string (valid URL, optional)
githubUrl: string (valid URL, optional)

// Professional Details
experienceYears: number (0-50, required)
skills: string[] (max 50 items, JSONB)
industries: string[] (JSONB)

// Preferences
salaryExpectationMin: number (min 20000, required)
salaryExpectationMax: number (min 20000, required)
availableFrom: Date (optional)
willingToRelocate: boolean (default false)
remotePreference: 'remote' | 'hybrid' | 'office' (required)

// Privacy Controls
privacyLevel: 'public' | 'semi-private' | 'anonymous' (default 'semi-private')
profileVisibleToEmployers: boolean (default true)
contactInfoVisible: boolean (default false)
salaryVisible: boolean (default true)

// Verification Status
emailVerified: boolean (default false)
profileComplete: boolean (default false, calculated)
idVerified: boolean (default false)
```

#### Validation Schemas

```typescript
import { 
  insertCandidateProfileSchema,
  updateCandidateProfileSchema,
  selectCandidateProfileSchema 
} from '@openrole/database';

// For creating new profiles
const insertSchema = insertCandidateProfileSchema;

// For updating existing profiles (all fields optional except id)
const updateSchema = updateCandidateProfileSchema;

// For querying profiles
const selectSchema = selectCandidateProfileSchema;
```

#### Helper Functions

```typescript
import { candidateProfileHelpers } from '@openrole/database';

// Calculate verified badge status
const isVerified = candidateProfileHelpers.calculateVerifiedBadge(profile);

// Calculate completion percentage
const completionPct = candidateProfileHelpers.calculateCompletionPercentage(profile);

// Check if profile meets completion criteria
const isComplete = candidateProfileHelpers.isProfileComplete(profile);

// Generate display name based on privacy settings
const displayName = candidateProfileHelpers.getDisplayName(
  profile, 
  userFirstName, 
  userLastName
);

// Get masked contact info based on privacy settings
const maskedContact = candidateProfileHelpers.getMaskedContactInfo(
  profile, 
  userEmail
);

// Validate skills array
const skillsValidation = candidateProfileHelpers.validateSkills(skills);

// Validate URL format
const urlValidation = candidateProfileHelpers.validateUrl(url, 'Portfolio URL');
```

#### Query Helpers

```typescript
import { candidateProfileQueries } from '@openrole/database';

// Get select fields for public profiles
const publicFields = candidateProfileQueries.publicSelectFields;

// Get privacy-filtered fields based on privacy level
const filteredFields = candidateProfileQueries.getSelectFieldsByPrivacy('semi-private');
```

#### Database Constraints

The model includes comprehensive database constraints:

- **Check Constraints**: Headline length (10-255), experience years (0-50), salary minimums
- **Unique Constraints**: One profile per user
- **Foreign Keys**: References users table
- **Indexes**: Optimized for common query patterns (privacy, location, salary, skills)

#### Privacy Levels

1. **Public**: All information visible including portfolio links and salary ranges
2. **Semi-Private**: Portfolio links visible, contact info masked, location shown
3. **Anonymous**: Minimal information, location hidden, highly masked contact info

#### Database Migration

The model is based on migration `001-candidate-profiles.sql` which includes:

- Table creation with all constraints
- Indexes for performance optimization
- Triggers for automatic `updated_at` and `profile_complete` calculation
- PostgreSQL functions for verification badge calculation

## Database Schema

The complete schema includes:

- `users` - Base user accounts
- `companies` - Company information
- `jobs` - Job postings
- `applications` - Job applications
- `candidate_profiles` - Extended candidate profiles
- Supporting tables for saved searches, job views, payments, etc.

## TypeScript Types

All models export both insert and select types:

```typescript
import type { 
  InsertCandidateProfile,
  SelectCandidateProfile,
  UpdateCandidateProfile,
  CandidateProfileWithComputed 
} from '@openrole/database';
```

## Performance Considerations

- **JSONB Indexing**: Skills and industries use GIN indexes for efficient array queries
- **Selective Fields**: Query helpers provide privacy-filtered field selection
- **Pagination Support**: All list queries should implement pagination
- **File Storage**: CV files stored outside database with secure token access

## Development

```bash
# Type checking
npm run type-check

# Build
npm run build

# Watch mode
npm run dev
```

## License

Private - OpenRole Platform