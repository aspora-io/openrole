# Data Model: CV & Profile Tools

**Date**: 2025-09-30  
**Feature**: CV & Profile Tools for OpenRole.net  
**Based on**: [Feature Specification](./spec.md) and [Research](./research.md)

## Entity Overview

This data model extends the existing OpenRole.net schema with comprehensive profile and CV management capabilities while maintaining GDPR compliance and privacy controls.

## Core Entities

### CandidateProfile
**Purpose**: Extended professional profile information for job seekers
**Relationships**: Belongs to User, has many CVDocuments, has many ApplicationStatuses

```typescript
interface CandidateProfile {
  id: string (UUID)
  userId: string (FK to users.id)
  
  // Basic Information
  headline: string (max 255 chars)
  summary: string (max 2000 chars)
  location: string
  phoneNumber: string
  portfolioUrl: string
  linkedinUrl: string
  githubUrl: string
  
  // Professional Details  
  experienceYears: number
  skills: string[] (JSONB array)
  industries: string[] (JSONB array)
  
  // Preferences
  salaryExpectationMin: number (in euros annually)
  salaryExpectationMax: number (in euros annually)
  availableFrom: Date
  willingToRelocate: boolean
  remotePreference: 'remote' | 'hybrid' | 'office'
  
  // Privacy Controls (FR-003)
  privacyLevel: 'public' | 'semi-private' | 'anonymous'
  profileVisibleToEmployers: boolean
  contactInfoVisible: boolean
  salaryVisible: boolean
  
  // Verification Status (FR-012)
  emailVerified: boolean
  profileComplete: boolean
  idVerified: boolean
  verifiedBadge: boolean (computed field)
  
  // Metadata
  profileViews: number
  lastActiveAt: Date
  createdAt: Date
  updatedAt: Date
}
```

**Validation Rules**:
- headline: required, 10-255 characters
- summary: optional, max 2000 characters  
- salaryExpectationMin: must be >= 20000, <= salaryExpectationMax
- skills: array of 1-50 items, each 2-100 characters
- portfolioUrl, linkedinUrl, githubUrl: valid URL format or null

**Indexes**:
- `idx_candidate_profile_user_id` on userId
- `idx_candidate_profile_privacy` on privacyLevel
- `idx_candidate_profile_skills` (GIN) on skills
- `idx_candidate_profile_location` on location
- `idx_candidate_profile_salary` on (salaryExpectationMin, salaryExpectationMax)

### CVDocument
**Purpose**: Stores CV files and metadata with version control (FR-006)
**Relationships**: Belongs to CandidateProfile, has many ApplicationAttachments

```typescript
interface CVDocument {
  id: string (UUID)
  profileId: string (FK to candidate_profiles.id)
  
  // File Information
  filename: string
  originalFilename: string
  filePath: string (server file system path)
  fileSize: number (bytes, max 10MB per FR-002)
  mimeType: string ('application/pdf' | 'application/msword' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  
  // Version Control
  version: number (auto-increment per profile)
  label: string (user-defined description, e.g., "Software Engineer", "Product Manager")
  isDefault: boolean (one default per profile)
  
  // Generation Metadata  
  generatedFromProfile: boolean (false for uploads, true for generated)
  templateUsed: string (for generated CVs)
  generatedAt: Date (for generated CVs)
  
  // Security
  accessToken: string (UUID for secure file access)
  tokenExpiresAt: Date
  virusScanned: boolean
  scanResults: string (JSON metadata)
  
  // Status
  status: 'processing' | 'active' | 'archived' | 'failed'
  
  // Metadata
  downloadCount: number
  lastAccessedAt: Date  
  createdAt: Date
  updatedAt: Date
}
```

**Validation Rules**:
- filename: required, must be unique per profile
- fileSize: max 10485760 bytes (10MB)
- mimeType: must be in allowed list
- label: required, 1-100 characters
- Only one isDefault=true per profileId

**Indexes**:
- `idx_cv_document_profile_id` on profileId
- `idx_cv_document_status` on status
- `idx_cv_document_access_token` on accessToken
- `unique_cv_document_default` on (profileId) WHERE isDefault=true

### WorkExperience
**Purpose**: Professional work history details
**Relationships**: Belongs to CandidateProfile

```typescript
interface WorkExperience {
  id: string (UUID)
  profileId: string (FK to candidate_profiles.id)
  
  // Position Details
  jobTitle: string
  companyName: string
  companyWebsite: string
  location: string
  
  // Timeline
  startDate: Date
  endDate: Date (null for current position)
  isCurrent: boolean
  
  // Description
  description: string (responsibilities)
  achievements: string[] (JSONB array - measurable achievements per FR-011)
  skills: string[] (JSONB array - skills used in this role)
  
  // Display Order
  sortOrder: number
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}
```

**Validation Rules**:
- jobTitle, companyName: required, 2-200 characters
- startDate: required, cannot be future date
- endDate: must be >= startDate if provided
- description: required, 10-2000 characters
- achievements: array of 0-20 items, each 10-500 characters

### Education
**Purpose**: Educational background and qualifications
**Relationships**: Belongs to CandidateProfile

```typescript
interface Education {
  id: string (UUID)
  profileId: string (FK to candidate_profiles.id)
  
  // Institution Details
  institutionName: string
  degree: string
  fieldOfStudy: string
  location: string
  
  // Timeline
  startDate: Date
  endDate: Date (null for ongoing)
  isOngoing: boolean
  
  // Academic Details
  grade: string (optional, e.g., "First Class Honours", "3.8 GPA")
  description: string (achievements, relevant coursework)
  
  // Display Order
  sortOrder: number
  
  // Metadata  
  createdAt: Date
  updatedAt: Date
}
```

### PortfolioItem
**Purpose**: Work samples and project showcases (FR-009)
**Relationships**: Belongs to CandidateProfile

```typescript
interface PortfolioItem {
  id: string (UUID)
  profileId: string (FK to candidate_profiles.id)
  
  // Item Details
  title: string
  description: string
  type: 'project' | 'article' | 'design' | 'code' | 'document' | 'link'
  
  // File/Link Information
  fileName: string (for uploaded files)
  filePath: string (server file system path)
  fileSize: number
  mimeType: string
  externalUrl: string (for external links)
  
  // Project Metadata
  technologies: string[] (JSONB array)
  projectDate: Date
  role: string (your role in the project)
  
  // Validation Status (FR-010)
  linkValidated: boolean
  lastValidationCheck: Date
  validationStatus: 'pending' | 'valid' | 'invalid' | 'unreachable'
  
  // Display
  sortOrder: number
  isPublic: boolean (respects profile privacy settings)
  
  // Metadata
  viewCount: number
  createdAt: Date
  updatedAt: Date
}
```

### ApplicationStatus
**Purpose**: Enhanced application tracking beyond basic applications table (FR-015)
**Relationships**: Belongs to Application (existing table)

```typescript
interface ApplicationStatus {
  id: string (UUID)
  applicationId: string (FK to applications.id)
  
  // Status Information
  status: 'submitted' | 'received' | 'under_review' | 'interview_scheduled' | 'interview_completed' | 'rejected' | 'offer_extended' | 'hired'
  statusDate: Date
  
  // Additional Details
  notes: string (internal notes)
  interviewDate: Date (for interview statuses)
  interviewType: 'phone' | 'video' | 'in-person' | 'assessment'
  
  // Rejection Information (FR-017, FR-018)
  rejectionReason: string (standardized reasons)
  rejectionFeedback: string (anonymized feedback)
  feedbackShared: boolean
  
  // Tracking
  updatedBy: string (employer user ID)
  notificationSent: boolean
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}
```

**Validation Rules**:
- status: must follow valid state transitions
- interviewDate: required when status includes 'interview'
- rejectionReason: required when status = 'rejected'

### ExternalApplication
**Purpose**: Track applications made outside OpenRole.net (FR-016)
**Relationships**: Belongs to CandidateProfile

```typescript
interface ExternalApplication {
  id: string (UUID)
  profileId: string (FK to candidate_profiles.id)
  
  // Application Details
  companyName: string
  jobTitle: string
  jobUrl: string (job posting URL)
  applicationDate: Date
  
  // Status Tracking
  status: 'applied' | 'acknowledged' | 'interview' | 'rejected' | 'offer' | 'hired'
  lastStatusUpdate: Date
  
  // Notes
  notes: string (user notes about the application)
  source: string (where they found the job)
  
  // CV Used
  cvDocumentId: string (FK to cv_documents.id, optional)
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}
```

## Supporting Entities

### CVTemplate
**Purpose**: Templates for CV generation (FR-008)
**Relationships**: Referenced by CVDocument

```typescript
interface CVTemplate {
  id: string (UUID)
  
  // Template Details
  name: string
  description: string
  category: 'ats-safe' | 'modern' | 'classic' | 'creative'
  
  // Template Data
  htmlTemplate: string (HTML template with placeholders)
  cssStyles: string (styling for the template)
  previewImage: string (template preview image path)
  
  // Features
  isAccessible: boolean (WCAG 2.1 AA compliant)
  supportsSections: string[] (JSONB array of supported sections)
  
  // Status
  isActive: boolean
  isPremium: boolean (for future payment features)
  
  // Metadata
  usageCount: number
  createdAt: Date
  updatedAt: Date
}
```

### PrivacyAuditLog
**Purpose**: Audit trail for privacy setting changes (GDPR compliance)
**Relationships**: Belongs to CandidateProfile

```typescript
interface PrivacyAuditLog {
  id: string (UUID)
  profileId: string (FK to candidate_profiles.id)
  
  // Change Details
  fieldChanged: string
  oldValue: string
  newValue: string
  changeReason: string
  
  // User Context
  changedBy: string (user ID)
  ipAddress: string
  userAgent: string
  
  // Metadata
  createdAt: Date
}
```

## State Machines

### Application Status Flow
```
submitted → received → under_review → {interview_scheduled, rejected}
interview_scheduled → interview_completed → {rejected, offer_extended}
interview_completed → rejected
offer_extended → {hired, rejected}
```

### CV Document Status Flow  
```
processing → {active, failed}
active → archived
failed → (can be retried to processing)
```

## Data Relationships

### Primary Foreign Keys
- `candidate_profiles.user_id` → `users.id`
- `cv_documents.profile_id` → `candidate_profiles.id`  
- `work_experience.profile_id` → `candidate_profiles.id`
- `education.profile_id` → `candidate_profiles.id`
- `portfolio_items.profile_id` → `candidate_profiles.id`
- `application_statuses.application_id` → `applications.id`
- `external_applications.profile_id` → `candidate_profiles.id`
- `privacy_audit_logs.profile_id` → `candidate_profiles.id`

### Calculated Fields
- `CandidateProfile.verifiedBadge`: `emailVerified AND profileComplete AND idVerified`
- `CandidateProfile.profileComplete`: Has basic info + work experience + skills
- `CVDocument.accessUrl`: Generated URL with access token
- `ApplicationStatus.currentStatus`: Latest status for each application

## Migration Strategy

### Phase 1 - MVP Schema
- Create core profile and CV document tables
- Basic privacy controls and file upload
- Essential validation and indexes

### Phase 2 - Enhanced Features  
- Add portfolio items and external applications
- Template system for CV generation
- Advanced privacy audit logging

### Phase 3+ - Advanced Features
- AI-powered field enhancements
- Career pathway tracking
- Payment and premium features

### Backward Compatibility
- All new tables use UUIDs for future distribution
- Existing applications table extended via ApplicationStatus
- User roles and permissions inherit from existing auth system
- Database constraints ensure data integrity across migrations

## Performance Considerations

### Query Optimization
- Profile search queries use composite indexes
- Privacy filtering applied at database level
- File access uses direct file system paths with token validation
- Pagination for all list views

### Storage Optimization  
- CV files stored outside database for performance
- JSONB fields indexed with GIN for array searches
- Audit logs partitioned by date for historical data
- Soft deletes maintain referential integrity

This data model provides a comprehensive foundation for the CV & Profile Tools feature while maintaining constitutional principles of transparency, security, and accessibility.