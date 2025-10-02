# OpenRole UX Test Plan

## Navigation Test Results

### ✅ All Pages Created
1. `/index.html` - Homepage (new)
2. `/static-mvp.html` - Original static homepage
3. `/jobs.html` - Job listings page
4. `/job-detail.html` - Individual job details
5. `/career-advice.html` - Career guidance
6. `/cv-upload.html` - CV upload form
7. `/employers.html` - Employer information
8. `/login.html` - User login
9. `/register.html` - User registration

### ✅ Navigation Links Fixed
- All navigation links now use `.html` extensions
- All pages have consistent header navigation
- All pages have footer navigation (except login/register which have minimal footers)
- Back navigation added where appropriate

### ✅ User Flows to Test

#### Job Seeker Flow:
1. **Homepage → Browse Jobs**
   - Click "Find Jobs" in nav or "View all jobs" button
   - Should go to `/jobs.html`
   
2. **Jobs → Job Detail**
   - Click any "View details" link
   - Should go to `/job-detail.html`
   
3. **Job Detail → Apply**
   - Click "Apply now" button
   - Should redirect to `/login.html` with redirect parameter
   
4. **Upload CV Flow**
   - Click "Upload CV" in nav
   - Fill form and submit
   - Privacy settings work correctly

5. **Career Advice**
   - Navigate to career advice
   - All internal anchor links work (CV tips, Interview prep, etc)
   - Smooth scrolling enabled

#### Employer Flow:
1. **Homepage → Employers**
   - Click "Employers" in nav
   - Should show employer landing page
   
2. **Employers → Post Job**
   - Click "Post a Job" button
   - Should go to login/register flow
   
3. **Pricing Navigation**
   - Anchor link to #pricing section works
   - Contact form at bottom

#### Authentication Flow:
1. **Register → Login**
   - "Already have account?" link works
   - Account type selection (job seeker vs employer)
   
2. **Login → Register**
   - "Don't have account?" link works
   - Social login buttons present

### ✅ Consistency Checks
- Logo links to homepage (/) on all pages
- Teal color scheme (#14B8A6) consistent
- Footer links consistent across pages
- Mobile responsive navigation

### ✅ Special Features
- Job type filters on homepage
- Search functionality redirects to jobs page with parameters
- Featured job badge on listings
- Remote job indicators
- Salary transparency on all job cards

## Deployment Ready
All pages are static HTML with Tailwind CDN, ready for nginx deployment at https://openrole.net