# Quickstart: CV & Profile Tools

## Overview
This quickstart guide validates the core user journeys for the CV & Profile Tools feature through step-by-step testing scenarios.

## Prerequisites
- Authentication system working
- Database schema deployed
- API endpoints available
- Frontend components implemented

## Test Scenarios

### 1. Candidate Profile Creation
**Goal**: Verify complete profile creation flow

**Steps**:
1. Navigate to `/profile/create`
2. Fill in basic information:
   - First name: "Jane"
   - Last name: "Smith"
   - Email: "jane.smith@example.com"
   - Headline: "Senior Software Engineer"
   - Location: "London, UK"
3. Add work experience:
   - Job title: "Senior Developer"
   - Company: "TechCorp"
   - Start date: "2022-01-01"
   - End date: Current
   - Description: "Led development of React applications"
   - Achievements: "Reduced load time by 40%"
4. Add education:
   - Institution: "University of London"
   - Degree: "Computer Science BSc"
   - Field: "Software Engineering"
   - Graduation: "2020-06-01"
5. Add skills: "TypeScript", "React", "Node.js"
6. Set salary expectations: £60,000 - £80,000
7. Set privacy to "semi_private"
8. Save profile

**Expected Results**:
- Profile created successfully
- All data persisted correctly
- Profile completeness indicator shows 100%
- Redirect to profile view page

### 2. CV Upload and Management
**Goal**: Test CV upload, labeling, and version management

**Steps**:
1. Navigate to `/profile/cvs`
2. Click "Upload CV"
3. Select PDF file (< 10MB)
4. Add label: "Technical CV"
5. Upload file
6. Verify CV appears in list
7. Upload second CV with label: "Management CV"
8. Set "Technical CV" as active
9. Edit label of "Management CV" to "Leadership CV"
10. Download "Technical CV"

**Expected Results**:
- Both CVs uploaded successfully
- File size validation works (reject >10MB)
- Labels can be edited
- Active CV marked correctly
- Download returns correct file
- File URLs are secure/temporary

### 3. Privacy Controls and Visibility
**Goal**: Verify privacy settings affect profile visibility

**Steps**:
1. Create profile with privacy "public"
2. Log in as employer user
3. Search for candidate by location
4. Verify profile appears with full details
5. Log back in as candidate
6. Change privacy to "semi_private"
7. Log in as employer again
8. Search and verify contact details hidden
9. Change to "anonymous"
10. Verify profile not discoverable in search

**Expected Results**:
- Public: Full profile visible in search
- Semi-private: Profile visible but contact hidden
- Anonymous: Profile not in search results
- Privacy changes take effect immediately

### 4. Job Application Flow
**Goal**: Test complete application submission and tracking

**Steps**:
1. Browse to job posting page
2. Click "Apply for this job"
3. Select CV from dropdown
4. Write cover letter
5. Submit application
6. Navigate to applications dashboard
7. Verify application appears with "submitted" status
8. (Simulate employer action) Update status to "received"
9. Check application shows updated status
10. View detailed application page
11. Verify status history shows transition

**Expected Results**:
- Application submitted successfully
- Status updates reflected in dashboard
- Status history maintained
- Cover letter and CV linked correctly
- Email notifications sent (if implemented)

### 5. CV Generation from Profile
**Goal**: Test automated CV generation feature

**Steps**:
1. Ensure profile has complete work experience and education
2. Navigate to CV generation page
3. Select "ATS-Safe" template
4. Choose sections to include: all except references
5. Generate CV
6. Preview generated CV
7. Download generated CV
8. Verify CV contains profile data correctly formatted

**Expected Results**:
- CV generated successfully
- All profile data included and formatted
- PDF is well-formatted and readable
- Generated CV saved to CV list
- Template styling applied correctly

### 6. External Application Tracking
**Goal**: Test manual entry of external job applications

**Steps**:
1. Navigate to applications page
2. Click "Add External Application"
3. Fill in details:
   - Job title: "DevOps Engineer"
   - Company: "StartupCo"
   - Application URL: "https://jobs.startupco.com/apply/123"
   - Applied date: Today
   - Notes: "Applied via company website"
4. Save external application
5. Update status to "interview"
6. Add notes about interview process

**Expected Results**:
- External application saved correctly
- Appears in applications dashboard
- Can be updated and tracked like internal applications
- Clearly marked as external application

### 7. Application Status Updates and Feedback
**Goal**: Test employer feedback and candidate notifications

**Steps**:
1. (As employer) Update application status to "rejected"
2. Select rejection reason: "missing_skills"
3. (As candidate) View updated application
4. Verify rejection reason visible (anonymized)
5. Check applications stats page
6. Verify rejection reason counted in statistics

**Expected Results**:
- Status updated immediately
- Rejection feedback anonymized and helpful
- Statistics updated correctly
- Candidate receives notification

### 8. Profile Verification Process
**Goal**: Test verified candidate badge workflow

**Steps**:
1. Complete profile with all required fields
2. Verify email address (click link in email)
3. Upload ID verification documents
4. (Simulate admin approval) Approve verification
5. Verify "Verified Candidate" badge appears
6. Check badge shows in search results

**Expected Results**:
- Email verification working
- ID upload secure and processed
- Badge awarded after all criteria met
- Badge visible to employers in search

### 9. Data Export and Privacy Compliance
**Goal**: Test GDPR compliance features

**Steps**:
1. Navigate to profile settings
2. Click "Export My Data"
3. Download exported data file
4. Verify all profile data included
5. Click "Delete My Account"
6. Confirm deletion understanding
7. Verify profile inaccessible
8. Check applications anonymized but retained

**Expected Results**:
- Data export contains all user data
- Export format is readable (JSON/CSV)
- Account deletion removes personal data
- Historical applications anonymized
- Deletion irreversible after confirmation

### 10. Performance and Accessibility
**Goal**: Validate non-functional requirements

**Steps**:
1. Test profile page load time (should be <2.5s)
2. Navigate using only keyboard
3. Test with screen reader
4. Verify color contrast meets WCAG standards
5. Test on mobile device
6. Upload maximum file size (10MB)
7. Test with slow network connection

**Expected Results**:
- Page loads within performance targets
- All features keyboard accessible
- Screen reader compatibility
- Mobile responsive design works
- File size limits enforced
- Graceful degradation on slow connections

## Success Criteria
All test scenarios must pass for the feature to be considered complete:

- ✅ Profile creation and management working
- ✅ CV upload and generation functional
- ✅ Privacy controls effective
- ✅ Application tracking accurate
- ✅ Performance targets met
- ✅ Accessibility requirements satisfied
- ✅ GDPR compliance implemented

## Rollback Plan
If critical issues found:
1. Disable CV generation temporarily
2. Fall back to basic profile view
3. Maintain existing applications data
4. Fix issues in staging before re-deployment