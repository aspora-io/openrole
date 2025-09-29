# FairPath.io Quick Start Guide

## Minimal Viable Setup (2-3 days)

### Day 1: Basic Infrastructure

1. **Get Hosting** (Cheapest viable option)
   - SiteGround GrowBig: $19.99/month
   - OR Cloudways (Digital Ocean): $14/month
   - Includes SSL, staging, daily backups

2. **Install WordPress**
   - One-click install from hosting panel
   - Set up admin account
   - Configure permalinks: Settings → Permalinks → "Post name"

3. **Install Free Theme**
   - Astra (free version)
   - OR Neve (free version)
   - Import a business/corporate starter template

4. **Essential Free Plugins**
   ```
   - WP Job Manager (core job functionality)
   - Wordfence (security - free tier)
   - LiteSpeed Cache (if on LiteSpeed server) OR WP Super Cache
   - Rank Math (SEO - free tier)
   - Post SMTP (email delivery)
   ```

### Day 2: Job Board Configuration

1. **Configure WP Job Manager**
   - Settings → Job Listings
   - Enable: Registration required
   - Enable: User can edit pending jobs
   - Set job duration: 30 days

2. **Create Essential Pages**
   - Jobs (with shortcode: `[jobs]`)
   - Submit Job (with shortcode: `[submit_job_form]`)
   - Employer Dashboard (with shortcode: `[job_dashboard]`)
   - Candidate Dashboard (with shortcode: `[candidate_dashboard]`)

3. **Customize Job Submission Form**
   - Add custom field for salary (required)
   - Add company size field
   - Add remote work option

### Day 3: Launch Preparation

1. **Email Configuration**
   - Set up free SendGrid account (100 emails/day free)
   - Configure Post SMTP with SendGrid API

2. **Basic Transparency Features**
   - Add this to theme's functions.php:
   ```php
   // Make salary field required
   add_filter('submit_job_form_fields', function($fields) {
       if(isset($fields['job']['job_salary'])) {
           $fields['job']['job_salary']['required'] = true;
       }
       return $fields;
   });
   ```

3. **Create Initial Content**
   - Homepage with value proposition
   - About page explaining transparency mission
   - Terms of Service
   - Privacy Policy
   - "How It Works" for employers/candidates

## Free MVP Cost Breakdown

- **Hosting**: $14-20/month
- **Domain**: $12/year (if not owned)
- **Everything else**: FREE
- **Total Year 1**: ~$180-252

## Revenue Quick Start

### Week 1: Manual Processing
- List job posting prices on site
- Use contact form for employers
- Invoice manually via Stripe/PayPal
- Post jobs on their behalf

### Week 2-4: Basic Automation
- Add WooCommerce (free)
- Create "Job Posting" product
- Manual approval after payment
- Track in spreadsheet

### Month 2: Upgrade Path
Once you have revenue:
1. WP Job Manager Paid Listings ($149)
2. Resume Manager ($149)
3. Better hosting (Kinsta/WP Engine)

## Growth Hacks

1. **SEO from Day 1**
   - Submit to Google Jobs via Rank Math
   - Create location-specific landing pages
   - Blog about salary transparency

2. **Free Traffic Sources**
   - Post jobs from your network for free initially
   - Share on LinkedIn with #OpenSalary
   - Submit to job board aggregators

3. **Employer Acquisition**
   - Offer first 10 employers free featured posts
   - Create "Founding Employer" badges
   - Case studies of successful hires

## Monitoring & Iteration

### Week 1 Metrics
- Page views (Google Analytics)
- Job posts submitted
- User registrations
- Contact form submissions

### Week 2-4 Adjustments
- A/B test job submission form
- Optimize for mobile
- Add missing features based on feedback
- Improve email notifications

## Common Pitfalls to Avoid

1. **Don't over-customize initially** - Use defaults
2. **Don't buy all premium plugins upfront** - Validate first
3. **Don't neglect mobile** - Test everything on phone
4. **Don't skip email testing** - Ensure notifications work

## 30-Day Milestone Targets

- [ ] 50 employer registrations
- [ ] 20 active job postings
- [ ] 200 candidate sign-ups
- [ ] 5 employers willing to pay
- [ ] 1 successful hire story

---

Remember: The goal is to validate that employers will pay for transparent job postings. Everything else can be improved later.