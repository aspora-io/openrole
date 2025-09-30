# Quickstart Guide: CV & Profile Tools

**Date**: 2025-09-30  
**Feature**: CV & Profile Tools for OpenRole.net  
**Purpose**: Validation script for testing complete feature implementation

## Overview

This quickstart guide provides step-by-step validation of the CV & Profile Tools feature implementation. It serves as both documentation and an integration test script to verify all functional requirements are met.

## Prerequisites

- OpenRole.net platform running with authentication system
- PostgreSQL database with extended schema
- File system storage configured
- Test user accounts (candidate and employer)
- API client (curl, Postman, or automated test runner)

## Environment Setup

```bash
# 1. Start local development environment
cd /home/alan/business/openrole
docker-compose -f docker-compose.local.yml up -d

# 2. Verify services are running
curl http://localhost:3011/v1/health
curl http://localhost:3010

# 3. Set environment variables for testing
export API_BASE="http://localhost:3011/v1"
export WEB_BASE="http://localhost:3010"
export TEST_TOKEN="<jwt-token-for-candidate-user>"
export EMPLOYER_TOKEN="<jwt-token-for-employer-user>"
```

## Test Data Preparation

```bash
# Create test CV file
echo "Sample CV content for testing" > test-cv.pdf

# Create test portfolio files
echo "Sample portfolio document" > portfolio-sample.pdf
echo "Sample code snippet" > code-sample.txt
```

## Phase 1: MVP Features Testing

### FR-001: Basic Profile Creation

**Test: Create candidate profile with required fields**

```bash
# Create profile
curl -X POST "$API_BASE/profiles/me" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "headline": "Senior Full-Stack Developer",
    "summary": "Experienced developer with 5+ years building scalable web applications using modern JavaScript frameworks and cloud technologies.",
    "location": "Dublin, Ireland",
    "phoneNumber": "+353 1 234 5678",
    "portfolioUrl": "https://johndoe.dev",
    "linkedinUrl": "https://linkedin.com/in/johndoe",
    "githubUrl": "https://github.com/johndoe",
    "experienceYears": 5,
    "skills": ["TypeScript", "React", "Node.js", "PostgreSQL", "AWS"],
    "industries": ["Technology", "SaaS"],
    "salaryExpectationMin": 60000,
    "salaryExpectationMax": 80000,
    "availableFrom": "2024-02-01",
    "willingToRelocate": false,
    "remotePreference": "hybrid"
  }'

# Expected: 201 Created with profile data
# Verify: Profile contains all submitted fields
# Verify: profileComplete = false (needs work experience)
# Verify: verifiedBadge = false (needs email verification)
```

**Test: Profile validation rules**

```bash
# Test minimum salary validation
curl -X POST "$API_BASE/profiles/me" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "headline": "Test",
    "salaryExpectationMin": 15000
  }'

# Expected: 422 Validation Error
# Verify: Error mentions minimum salary of 20000
```

### FR-002: CV Upload with File Validation

**Test: Upload valid CV file**

```bash
# Upload PDF CV
curl -X POST "$API_BASE/cv" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -F "file=@test-cv.pdf" \
  -F "label=Software Engineer CV" \
  -F "isDefault=true"

# Expected: 201 Created with CV document metadata
# Verify: File size is recorded correctly
# Verify: MIME type is application/pdf
# Verify: Version number is 1 (first CV)
# Verify: isDefault = true
# Verify: status = processing (initially)
```

**Test: File size and type validation**

```bash
# Test oversized file (>10MB)
dd if=/dev/zero of=large-file.pdf bs=1M count=11
curl -X POST "$API_BASE/cv" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -F "file=@large-file.pdf" \
  -F "label=Large CV"

# Expected: 413 Payload Too Large
# Verify: Error message mentions 10MB limit

# Test invalid file type
echo "not a cv" > invalid.txt
curl -X POST "$API_BASE/cv" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -F "file=@invalid.txt" \
  -F "label=Invalid CV"

# Expected: 422 Validation Error
# Verify: Error mentions supported file types
```

### FR-003: Privacy Controls

**Test: Set privacy levels**

```bash
# Set semi-private privacy
curl -X PUT "$API_BASE/profiles/me/privacy" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "privacyLevel": "semi-private",
    "profileVisibleToEmployers": true,
    "contactInfoVisible": false,
    "salaryVisible": true
  }'

# Expected: 200 OK with updated privacy settings
# Verify: Settings are applied correctly
```

**Test: Privacy enforcement in employer search**

```bash
# Search profiles as employer
curl -X GET "$API_BASE/profiles?skills=typescript" \
  -H "Authorization: Bearer $EMPLOYER_TOKEN"

# Expected: 200 OK with profile list
# Verify: Contact info is hidden (contactInfoVisible=false)
# Verify: Salary info is visible (salaryVisible=true)
# Verify: Profile appears in search (profileVisibleToEmployers=true)
```

### FR-004: Salary Expectations

**Test: Salary range specifications**

```bash
# Update salary expectations
curl -X PUT "$API_BASE/profiles/me" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "salaryExpectationMin": 65000,
    "salaryExpectationMax": 85000
  }'

# Expected: 200 OK with updated profile
# Verify: Salary range is updated
# Verify: Min <= Max validation enforced
```

### FR-005: Employer Profile Search

**Test: Search and filter functionality**

```bash
# Test skill-based search
curl -X GET "$API_BASE/profiles?skills=typescript,react&location=Dublin" \
  -H "Authorization: Bearer $EMPLOYER_TOKEN"

# Expected: 200 OK with matching profiles
# Verify: Results contain profiles with specified skills
# Verify: Location filtering works

# Test salary range filtering
curl -X GET "$API_BASE/profiles?salaryMin=50000&salaryMax=90000" \
  -H "Authorization: Bearer $EMPLOYER_TOKEN"

# Expected: 200 OK with profiles in salary range
# Verify: Only profiles within range are returned
```

### FR-006: Multiple CV Versions

**Test: CV version management**

```bash
# Upload second CV version
curl -X POST "$API_BASE/cv" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -F "file=@test-cv-v2.pdf" \
  -F "label=Product Manager CV" \
  -F "isDefault=false"

# Expected: 201 Created
# Verify: Version number is 2
# Verify: isDefault = false
# Verify: Previous CV remains default

# List all CV versions
curl -X GET "$API_BASE/cv" \
  -H "Authorization: Bearer $TEST_TOKEN"

# Expected: 200 OK with array of CV documents
# Verify: Both versions are listed
# Verify: Version numbers are correct
```

### FR-007: CV Attachment to Applications

**Test: CV selection in applications**

```bash
# Get available CVs for application
curl -X GET "$API_BASE/cv" \
  -H "Authorization: Bearer $TEST_TOKEN"

# Apply to job with specific CV
CV_ID="<cv-document-id>"
JOB_ID="<job-posting-id>"

curl -X POST "$API_BASE/applications" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"jobId\": \"$JOB_ID\",
    \"cvDocumentId\": \"$CV_ID\",
    \"coverLetter\": \"I am interested in this position...\"
  }"

# Expected: 201 Created with application
# Verify: CV is attached to application
# Verify: Correct CV version is referenced
```

## Phase 2: Enhanced Profile Features

### FR-008: CV Generation from Profile

**Test: Template-based CV generation**

```bash
# Get available templates
curl -X GET "$API_BASE/cv/templates" \
  -H "Authorization: Bearer $TEST_TOKEN"

# Expected: 200 OK with template list
# Verify: Templates include ATS-safe, modern, classic categories
# Verify: Each template has preview and description

# Generate CV from profile
TEMPLATE_ID="<template-uuid>"
curl -X POST "$API_BASE/cv/generate" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"templateId\": \"$TEMPLATE_ID\",
    \"label\": \"Generated CV - Modern\",
    \"isDefault\": false,
    \"sections\": {
      \"includePersonalDetails\": true,
      \"includeWorkExperience\": true,
      \"includeEducation\": true,
      \"includeSkills\": true,
      \"includePortfolio\": false
    }
  }"

# Expected: 202 Accepted (async processing)
# Verify: Returns CV ID and processing status
# Verify: Estimated completion time provided
```

### FR-009: Portfolio Management

**Test: Portfolio item upload**

```bash
# Add portfolio project
curl -X POST "$API_BASE/portfolio" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -F "file=@portfolio-sample.pdf" \
  -F "title=E-commerce Platform" \
  -F "description=Complete redesign of checkout flow resulting in 25% conversion increase" \
  -F "type=project" \
  -F "technologies=[\"React\", \"TypeScript\", \"Stripe\"]" \
  -F "projectDate=2023-06-15" \
  -F "role=Lead Frontend Developer" \
  -F "isPublic=true"

# Expected: 201 Created with portfolio item
# Verify: File is uploaded and stored
# Verify: Metadata is correctly recorded

# Add external link portfolio item
curl -X POST "$API_BASE/portfolio" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Open Source Library",
    "description": "TypeScript library for form validation",
    "type": "code",
    "externalUrl": "https://github.com/johndoe/validation-lib",
    "technologies": ["TypeScript", "Jest", "GitHub Actions"],
    "projectDate": "2023-03-10",
    "role": "Creator and Maintainer",
    "isPublic": true
  }'

# Expected: 201 Created
# Verify: External URL is stored
# Verify: No file is uploaded
```

### FR-010: External Link Validation

**Test: Link validation system**

```bash
# Check portfolio item validation status
PORTFOLIO_ID="<portfolio-item-id>"
curl -X GET "$API_BASE/portfolio/$PORTFOLIO_ID" \
  -H "Authorization: Bearer $TEST_TOKEN"

# Expected: 200 OK with portfolio item
# Verify: linkValidated field exists
# Verify: validationStatus shows current state
# Verify: lastValidationCheck timestamp

# Test invalid URL handling
curl -X POST "$API_BASE/portfolio" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Broken Link Test",
    "description": "Testing invalid URL handling",
    "type": "link",
    "externalUrl": "https://invalid-domain-that-does-not-exist.com",
    "isPublic": false
  }'

# Expected: 201 Created
# Note: Validation happens asynchronously
# Verify: validationStatus eventually becomes "unreachable"
```

### FR-011: Achievements vs Responsibilities

**Test: Work experience with achievements**

```bash
# Add work experience with structured achievements
curl -X POST "$API_BASE/profiles/me/experience" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobTitle": "Senior Software Engineer",
    "companyName": "Tech Corp Ltd",
    "companyWebsite": "https://techcorp.com",
    "location": "Dublin, Ireland",
    "startDate": "2020-03-01",
    "endDate": "2023-02-28",
    "isCurrent": false,
    "description": "Led development of microservices architecture and mentored junior developers in best practices.",
    "achievements": [
      "Reduced API response times by 40% through database optimization",
      "Implemented CI/CD pipeline reducing deployment time from 2 hours to 15 minutes",
      "Mentored 3 junior developers resulting in 2 promotions"
    ],
    "skills": ["TypeScript", "Docker", "AWS", "PostgreSQL", "Kubernetes"]
  }'

# Expected: 201 Created with work experience
# Verify: Achievements are stored separately from description
# Verify: Achievements are measurable and specific
# Verify: Skills are properly categorized
```

### FR-012: Verified Candidate Badge

**Test: Verification badge calculation**

```bash
# Check initial verification status
curl -X GET "$API_BASE/profiles/me" \
  -H "Authorization: Bearer $TEST_TOKEN"

# Expected: verifiedBadge = false initially
# Verify: emailVerified, profileComplete, idVerified fields exist

# Simulate email verification (admin endpoint in real implementation)
curl -X PUT "$API_BASE/admin/users/verify-email" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "<user-id>"}'

# Check updated verification status
curl -X GET "$API_BASE/profiles/me" \
  -H "Authorization: Bearer $TEST_TOKEN"

# Expected: emailVerified = true
# Verify: verifiedBadge calculation updates correctly
# Verify: Badge shows in employer search results
```

## Phase 3: Advanced Features Testing

### FR-013: Tailored CV Generation

**Test: Job-specific CV generation**

```bash
# Generate CV tailored to specific job posting
JOB_ID="<target-job-id>"
curl -X POST "$API_BASE/cv/generate/tailored" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"templateId\": \"$TEMPLATE_ID\",
    \"label\": \"CV for Frontend Developer Role\",
    \"targetJobId\": \"$JOB_ID\",
    \"emphasizeSkills\": [\"React\", \"TypeScript\", \"CSS\"],
    \"includeRelevantExperience\": true
  }"

# Expected: 202 Accepted (async processing)
# Verify: CV generation considers job requirements
# Verify: Relevant skills and experience are highlighted
```

### FR-014: Blind CV Option

**Test: Anonymous CV generation**

```bash
# Generate blind CV with personal identifiers removed
curl -X POST "$API_BASE/cv/generate" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"templateId\": \"$TEMPLATE_ID\",
    \"label\": \"Blind CV - No Personal Info\",
    \"blindMode\": true,
    \"removePersonalInfo\": true,
    \"removeContactDetails\": true,
    \"removePhotoPlaceholder\": true
  }"

# Expected: 202 Accepted
# Verify: Generated CV contains no identifying information
# Verify: Experience and skills remain intact
# Verify: Company names can be optionally anonymized
```

### FR-015: Application Status Tracking

**Test: Enhanced application tracking**

```bash
# Check application status
APPLICATION_ID="<application-id>"
curl -X GET "$API_BASE/applications/$APPLICATION_ID/status" \
  -H "Authorization: Bearer $TEST_TOKEN"

# Expected: 200 OK with detailed status history
# Verify: Status progression is tracked
# Verify: Timestamps for each status change
# Verify: Interview scheduling information when applicable
```

### FR-016: External Application Tracking

**Test: Manual external application entry**

```bash
# Add external application
curl -X POST "$API_BASE/external-applications" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "External Company Ltd",
    "jobTitle": "Senior Developer",
    "jobUrl": "https://externalcompany.com/jobs/senior-dev",
    "applicationDate": "2023-12-01",
    "status": "applied",
    "notes": "Applied through their website, used my React-focused CV",
    "source": "Company website",
    "cvDocumentId": "<cv-id-used>"
  }'

# Expected: 201 Created with external application
# Verify: Application is tracked alongside internal applications
# Verify: CV reference is maintained
# Verify: Notes and source information preserved
```

### FR-017 & FR-018: Rejection Feedback

**Test: Standardized rejection reasons and feedback**

```bash
# Simulate employer providing rejection feedback
curl -X PUT "$API_BASE/applications/$APPLICATION_ID/status" \
  -H "Authorization: Bearer $EMPLOYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "rejected",
    "rejectionReason": "Experience level mismatch",
    "rejectionFeedback": "Candidate has strong technical skills but requires more senior-level experience for this role. Consider applying for mid-level positions.",
    "feedbackShared": true
  }'

# Check candidate view of feedback
curl -X GET "$API_BASE/applications/$APPLICATION_ID/feedback" \
  -H "Authorization: Bearer $TEST_TOKEN"

# Expected: 200 OK with anonymized feedback
# Verify: Personal identifiers removed from feedback
# Verify: Constructive feedback preserved
# Verify: Standardized rejection reasons used
```

## Integration Testing

### Full User Journey Test

**Test: Complete candidate onboarding to job application**

```bash
# 1. Create profile
# 2. Add work experience and education
# 3. Upload CV
# 4. Set privacy preferences
# 5. Add portfolio items
# 6. Generate tailored CV
# 7. Apply to job with generated CV
# 8. Track application status

# This test validates the entire user workflow
# Expected: All steps complete successfully
# Verify: Data consistency across all features
# Verify: Privacy settings respected throughout
```

### Performance Testing

**Test: File upload and processing performance**

```bash
# Upload maximum size CV (10MB)
time curl -X POST "$API_BASE/cv" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -F "file=@large-cv.pdf" \
  -F "label=Large CV Test"

# Expected: Response time < 30 seconds
# Verify: File processing completes successfully
# Verify: Virus scanning (if implemented) completes
```

### Security Testing

**Test: Authorization and privacy enforcement**

```bash
# Attempt to access other user's CV
OTHER_CV_ID="<other-user-cv-id>"
curl -X GET "$API_BASE/cv/$OTHER_CV_ID" \
  -H "Authorization: Bearer $TEST_TOKEN"

# Expected: 403 Forbidden or 404 Not Found
# Verify: Cross-user data access prevented

# Test file download security
curl -X GET "$API_BASE/cv/$CV_ID/download?token=invalid-token" \
  -H "Authorization: Bearer $TEST_TOKEN"

# Expected: 403 Forbidden
# Verify: Invalid tokens rejected
# Verify: Token expiration enforced
```

## Error Handling Testing

### Validation Error Testing

```bash
# Test all validation scenarios:
# - Invalid email formats
# - Salary min > max
# - Missing required fields
# - File type restrictions
# - File size limits
# - Invalid URL formats
# - Invalid date ranges

# Each test should return appropriate error codes and messages
```

### Edge Cases

```bash
# Test edge cases:
# - Profile with 0 experience years
# - Maximum skills array (50 items)
# - Special characters in text fields
# - Unicode handling in uploads
# - Concurrent CV uploads
# - Network interruption during upload
```

## Success Criteria

### Functional Requirements Validation

- [ ] All 31 functional requirements (FR-001 through FR-031) tested
- [ ] Privacy controls enforce visibility rules correctly
- [ ] File upload/download works securely
- [ ] CV generation produces valid documents
- [ ] Application tracking maintains data integrity
- [ ] Search and filtering perform within acceptable limits

### Performance Requirements

- [ ] CV upload completes within 30 seconds for 10MB files
- [ ] Profile search returns results within 500ms
- [ ] CV generation completes within 2 minutes
- [ ] API response times under 200ms for standard operations

### Security Requirements

- [ ] Authentication required for all endpoints
- [ ] Authorization prevents cross-user data access
- [ ] File access tokens expire correctly
- [ ] Privacy settings enforced consistently
- [ ] Input validation prevents injection attacks

### Accessibility Requirements

- [ ] Generated CVs meet WCAG 2.1 AA standards
- [ ] File download URLs are screen reader accessible
- [ ] Error messages are properly announced
- [ ] Form validation provides clear feedback

## Cleanup

```bash
# Remove test files
rm -f test-cv*.pdf portfolio-sample.pdf code-sample.txt large-file.pdf invalid.txt

# Reset test user profiles (optional)
curl -X DELETE "$API_BASE/profiles/me" \
  -H "Authorization: Bearer $TEST_TOKEN"

# Stop development services
docker-compose -f docker-compose.local.yml down
```

## Troubleshooting

### Common Issues

1. **File upload fails**: Check file permissions and storage configuration
2. **CV generation timeout**: Verify Puppeteer installation and memory limits
3. **Database connection errors**: Ensure PostgreSQL is running and schema is migrated
4. **Authentication failures**: Verify JWT configuration and token validity
5. **Privacy violations**: Check middleware implementation and database queries

### Debug Commands

```bash
# Check service health
curl $API_BASE/health

# View service logs
docker-compose logs api
docker-compose logs web

# Database query testing
docker exec openrole-postgres psql -U postgres -d openrole_dev -c "SELECT * FROM candidate_profiles LIMIT 5;"
```

This quickstart guide serves as comprehensive validation that the CV & Profile Tools feature meets all requirements and handles edge cases appropriately. It should be run after implementation to ensure quality and completeness.