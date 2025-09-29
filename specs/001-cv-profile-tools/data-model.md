# Data Model: CV & Profile Tools

## Core Entities

### Candidate Profile
**Purpose**: Central entity representing a job seeker's professional information
**Fields**:
- `id`: UUID primary key
- `userId`: Foreign key to User entity
- `firstName`: String, required
- `lastName`: String, required
- `email`: String, unique, required
- `phone`: String, optional
- `headline`: String (max 120 chars)
- `bio`: Text (max 2000 chars)
- `location`: String
- `remoteWork`: Boolean, default false
- `salaryExpectationMin`: Integer (annual in pence)
- `salaryExpectationMax`: Integer (annual in pence)
- `privacyLevel`: Enum (public, semi_private, anonymous)
- `isVerified`: Boolean, default false
- `verificationDate`: Timestamp, nullable
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

**Relationships**:
- One-to-many with Work Experience
- One-to-many with Education
- One-to-many with CV Documents
- One-to-many with Portfolio Items
- One-to-many with Job Applications
- Many-to-many with Skills

**State Transitions**:
- Draft → Complete (all required fields filled)
- Complete → Verified (email + profile + ID verification passed)
- Any state → Deleted (soft delete with anonymization)

### Work Experience
**Purpose**: Individual work history entries
**Fields**:
- `id`: UUID primary key
- `profileId`: Foreign key to Candidate Profile
- `jobTitle`: String, required
- `company`: String, required
- `startDate`: Date, required
- `endDate`: Date, nullable (current job)
- `description`: Text (responsibilities)
- `achievements`: Text (measurable outcomes)
- `location`: String
- `isRemote`: Boolean
- `order`: Integer (display order)

### Education
**Purpose**: Educational background entries
**Fields**:
- `id`: UUID primary key
- `profileId`: Foreign key to Candidate Profile
- `institution`: String, required
- `degree`: String, required
- `fieldOfStudy`: String
- `startDate`: Date
- `endDate`: Date, nullable
- `grade`: String, optional
- `description`: Text, optional
- `order`: Integer

### Skills
**Purpose**: Searchable skills taxonomy
**Fields**:
- `id`: UUID primary key
- `name`: String, unique, required
- `category`: String (technical, soft, industry)
- `isVerified`: Boolean (curated vs user-generated)

### Profile Skills
**Purpose**: Junction table for candidate skills with proficiency
**Fields**:
- `profileId`: Foreign key to Candidate Profile
- `skillId`: Foreign key to Skills
- `proficiencyLevel`: Enum (beginner, intermediate, advanced, expert)
- `yearsExperience`: Integer, optional

### CV Document
**Purpose**: Uploaded or generated CV files with version control
**Fields**:
- `id`: UUID primary key
- `profileId`: Foreign key to Candidate Profile
- `fileName`: String, required
- `originalFileName`: String, required
- `fileSize`: Integer (bytes)
- `mimeType`: String, required
- `storageUrl`: String, required
- `label`: String (e.g., "Technical CV", "Management CV")
- `isGenerated`: Boolean (true for system-generated)
- `templateId`: String, nullable (for generated CVs)
- `version`: Integer, default 1
- `isActive`: Boolean, default true
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

**Validation Rules**:
- File size ≤ 10MB
- MIME type in [application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document]
- Maximum 10 active CVs per profile

### Portfolio Item
**Purpose**: Work samples and external links
**Fields**:
- `id`: UUID primary key
- `profileId`: Foreign key to Candidate Profile
- `title`: String, required
- `description`: Text, optional
- `type`: Enum (image, document, link, code)
- `url`: String (for external links)
- `fileName`: String (for uploaded files)
- `storageUrl`: String (for uploaded files)
- `thumbnailUrl`: String, optional
- `tags`: JSON array of strings
- `order`: Integer
- `isPublic`: Boolean, default true

### Job Application
**Purpose**: Links candidate profiles to job postings with tracking
**Fields**:
- `id`: UUID primary key
- `profileId`: Foreign key to Candidate Profile
- `jobId`: Foreign key to Job entity
- `cvDocumentId`: Foreign key to CV Document
- `status`: Enum (submitted, received, under_review, interview, rejected, offer, hired)
- `appliedAt`: Timestamp
- `lastStatusChange`: Timestamp
- `coverLetter`: Text, optional
- `withdrawnAt`: Timestamp, nullable
- `withdrawnReason`: String, optional

**State Transitions**:
- submitted → received (employer acknowledgment)
- received → under_review (screening process)
- under_review → {interview, rejected}
- interview → {offer, rejected}
- offer → {hired, rejected}
- Any status → withdrawn (candidate action)

### Application Status Log
**Purpose**: Audit trail for application status changes
**Fields**:
- `id`: UUID primary key
- `applicationId`: Foreign key to Job Application
- `fromStatus`: Enum, nullable (initial status)
- `toStatus`: Enum, required
- `changedBy`: Foreign key to User (system/employer/candidate)
- `reason`: String, optional
- `notes`: Text, optional
- `changedAt`: Timestamp

### Feedback Tag
**Purpose**: Standardized rejection reasons from employers
**Fields**:
- `id`: UUID primary key
- `applicationId`: Foreign key to Job Application
- `tag`: Enum (too_junior, missing_skills, over_budget, culture_fit, location, other)
- `isAnonymized`: Boolean, default true
- `createdAt`: Timestamp

### Employer Search
**Purpose**: Saved search criteria for employers
**Fields**:
- `id`: UUID primary key
- `employerId`: Foreign key to User entity
- `name`: String, required
- `criteria`: JSON object (skills, location, salary, etc.)
- `alertsEnabled`: Boolean, default false
- `lastRunAt`: Timestamp, nullable
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### Career Pathway
**Purpose**: Skill progression maps (Phase 4 feature)
**Fields**:
- `id`: UUID primary key
- `fromRole`: String, required
- `toRole`: String, required
- `requiredSkills`: JSON array of skill IDs
- `optionalSkills`: JSON array of skill IDs
- `averageTimeframe`: Integer (months)
- `difficulty`: Enum (easy, moderate, challenging)
- `isActive`: Boolean, default true

### Verified Badge
**Purpose**: Track verification status and criteria
**Fields**:
- `id`: UUID primary key
- `profileId`: Foreign key to Candidate Profile
- `badgeType`: Enum (email_verified, profile_complete, id_verified, employment_verified)
- `verifiedAt`: Timestamp
- `expiresAt`: Timestamp, nullable
- `verificationData`: JSON (metadata about verification process)
- `isActive`: Boolean, default true

## Relationships Summary

```
User (1) ←→ (1) Candidate Profile
Candidate Profile (1) ←→ (many) Work Experience
Candidate Profile (1) ←→ (many) Education
Candidate Profile (1) ←→ (many) CV Documents
Candidate Profile (1) ←→ (many) Portfolio Items
Candidate Profile (1) ←→ (many) Job Applications
Candidate Profile (many) ←→ (many) Skills [via Profile Skills]
Job Application (1) ←→ (many) Application Status Log
Job Application (1) ←→ (many) Feedback Tags
Job Application (many) ←→ (1) CV Document
Candidate Profile (1) ←→ (many) Verified Badges
```

## Indexes for Performance

- `candidate_profiles.email` (unique)
- `candidate_profiles.privacy_level, created_at`
- `profile_skills.profile_id, skill_id`
- `cv_documents.profile_id, is_active`
- `job_applications.profile_id, status`
- `job_applications.job_id, status`
- `application_status_log.application_id, changed_at`
- `work_experience.profile_id, start_date DESC`
- `portfolio_items.profile_id, order`

## Data Retention Policies

- **Candidate Profiles**: 3 years after last activity
- **Job Applications**: Anonymized on profile deletion, retained for employer compliance
- **CV Documents**: Deleted with profile, unless referenced in active applications
- **Application Status Logs**: Retained indefinitely for audit purposes (anonymized)
- **Verification Data**: Encrypted, 1 year retention after verification