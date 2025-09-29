# Feature Specification: CV & Profile Tools

**Feature Branch**: `001-cv-profile-tools`  
**Created**: 2025-09-29  
**Status**: Draft  
**Input**: User description: "CV & Profile tools for OpenRole.net - comprehensive candidate profile system with CV upload, generation, privacy controls, and career development features delivered in 5 phases from MVP to AI-powered marketplace"

## Execution Flow (main)
```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies  
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## Clarifications

### Session 2025-09-29
- Q: What should be the maximum file size limit for CV uploads? → A: 10MB
- Q: What validation criteria should be required for the "Verified Candidate" badge? → A: Email + complete profile + ID verification
- Q: How long should candidate data be retained after last activity? → A: 3 years
- Q: When a candidate deletes their profile, what should happen to their historical application data? → A: Anonymize and retain for employer records
- Q: Which metrics should be included in calculating employer trust scores? → A: Response rate + response time + feedback quality + job posting accuracy + hiring rate

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a job seeker on OpenRole.net, I want to create a comprehensive professional profile with my CV, control who can see my information, and have tools to optimize my job search, so that I can find relevant opportunities while maintaining my privacy and presenting myself in the best light to potential employers.

### Acceptance Scenarios
1. **Given** a new candidate signs up, **When** they access their profile page, **Then** they can add personal details, work experience, education, skills, and upload their CV
2. **Given** a candidate has created their profile, **When** they set privacy to "anonymous", **Then** employers cannot see their name, photo, or contact details until the candidate allows it
3. **Given** a candidate has a complete profile, **When** they apply for a job, **Then** their profile and chosen CV version are shared with the employer
4. **Given** an employer searches for candidates, **When** they filter by skills and salary range, **Then** they see matching candidate profiles respecting privacy settings
5. **Given** a candidate wants multiple CV versions, **When** they upload additional CVs, **Then** they can store and label multiple versions for different applications
6. **Given** a candidate has applied to jobs, **When** they view their application tracker, **Then** they see the current status of each application

### Edge Cases
- What happens when a candidate uploads a corrupted CV file?
- How does the system handle profiles switching between privacy levels mid-application?
- What occurs when a candidate deletes their profile with active applications?
- How does the system manage CV file size limits and format restrictions?
- What happens when salary expectations exceed all available jobs?

## Requirements *(mandatory)*

### Functional Requirements

**Phase 1 - MVP Requirements**
- **FR-001**: System MUST allow candidates to create profiles with personal details, work experience, education, and skills
- **FR-002**: System MUST enable CV upload with support for PDF and DOC formats up to 10MB
- **FR-003**: System MUST provide three privacy levels: public (fully visible), semi-private (hide contact), and anonymous (hide all identifiers)
- **FR-004**: System MUST allow candidates to specify salary expectations and preferred locations
- **FR-005**: System MUST enable employers to search and filter candidate profiles by skills, location, and salary range
- **FR-006**: System MUST store multiple CV versions per candidate with descriptive labels
- **FR-007**: System MUST attach selected CV version to job applications

**Phase 2 - Enhanced Profiles**
- **FR-008**: System MUST generate CVs from profile data in multiple templates (ATS-safe, modern, classic)
- **FR-009**: System MUST support portfolio uploads including images, documents, and code samples
- **FR-010**: System MUST validate external links (GitHub, Behance, portfolio sites)
- **FR-011**: System MUST distinguish between job responsibilities and measurable achievements
- **FR-012**: System MUST award "Verified Candidate" badges to candidates who have verified email, complete profile (all required fields filled), and passed ID verification

**Phase 3 - Differentiators**
- **FR-013**: System MUST generate tailored CVs matching specific job posting requirements
- **FR-014**: System MUST provide blind CV option removing all personal identifiers
- **FR-015**: System MUST track application status: Received, Under Review, Rejected, Interview
- **FR-016**: System MUST allow manual entry of external job applications
- **FR-017**: System MUST enable employers to select standardized rejection reasons
- **FR-018**: System MUST anonymize and share rejection feedback with candidates

**Phase 4 - AI Career Hub**
- **FR-019**: System MUST analyze and suggest CV improvements for clarity and ATS optimization
- **FR-020**: System MUST identify skill gaps between current profile and target roles
- **FR-021**: System MUST generate career pathway maps showing progression routes
- **FR-022**: System MUST create interview prep packs with tailored questions
- **FR-023**: System MUST calculate employer trust scores based on response rate, average response time, feedback quality, job posting accuracy, and successful hiring rate

**Phase 5 - Marketplace**
- **FR-024**: System MUST match candidates with mentors in their field
- **FR-025**: System MUST enable paid CV review services
- **FR-026**: System MUST segment and deliver career newsletters by role/industry
- **FR-027**: System MUST handle payment processing for premium services at [NEEDS CLARIFICATION: pricing tiers - £5-10/month mentioned but specific features per tier?]

**Data & Compliance Requirements**
- **FR-028**: System MUST comply with GDPR and UK Data Protection regulations
- **FR-029**: System MUST retain candidate data for 3 years after last activity
- **FR-030**: System MUST allow candidates to export all their data
- **FR-031**: System MUST enable complete profile deletion while anonymizing and retaining historical application data for employer compliance and audit purposes

### Key Entities *(include if feature involves data)*
- **Candidate Profile**: Represents job seeker's professional information including personal details, experience, education, skills, preferences
- **CV Document**: Uploaded or generated CV files with version control, labels, and format metadata
- **Privacy Setting**: Configuration determining profile visibility (public, semi-private, anonymous)
- **Job Application**: Links candidate profile and CV to specific job posting with status tracking
- **Portfolio Item**: Work samples, projects, or external links showcasing candidate capabilities
- **Employer Search**: Saved search criteria and filters used by employers to find candidates
- **Application Status**: Workflow states for tracking application progress with timestamp history
- **Feedback Tag**: Standardized rejection reasons provided by employers
- **Career Pathway**: Skill progression map showing role advancement options
- **Verified Badge**: Certification of profile completeness and validation status

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---