# FairPath.io WordPress Stack Recommendation

## Theme Foundation

### Primary Recommendation: GeneratePress Pro
- **Why**: Lightweight (< 30KB), excellent performance, extensive customization
- **Cost**: $59/year
- **Key Benefits**:
  - Built-in schema markup support
  - Mobile-first design
  - Compatible with all major job board plugins
  - Excellent page builder compatibility

### Alternative: Astra Pro
- **Cost**: $47/year
- **Benefits**: Similar performance, slightly easier customizer

## Core Job Board Functionality

### Plugin Stack Option 1: WP Job Manager Suite (Recommended)
Total Cost: ~$299/year for all extensions

**Core Plugin**: WP Job Manager (Free)
- Base job listing functionality
- Employer accounts
- Application management

**Essential Add-ons**:
1. **WP Job Manager - Paid Listings** ($149/year)
   - Payment integration for job posts
   - Package/credit system
   - Stripe/PayPal support

2. **WP Job Manager - Resume Manager** ($149/year)
   - Candidate profiles
   - CV uploads
   - Skills tagging

3. **WP Job Manager - Application Deadline** ($29)
   - Auto-expire jobs
   - Scheduled publishing

4. **WP Job Manager - Job Alerts** ($39)
   - Email notifications for candidates
   - Search saved alerts

### Plugin Stack Option 2: WP Job Board (Alternative)
**WP Job Board Pro** ($89 one-time)
- All-in-one solution
- Built-in payment processing
- Less extensible but cheaper

## Essential Supporting Plugins

### Performance & Caching
1. **WP Rocket** ($59/year)
   - Page caching
   - Database optimization
   - CDN integration
   - Lazy loading

### Security
1. **Wordfence Premium** ($119/year)
   - Firewall
   - Malware scanning
   - Login security
   - Real-time threat defense

### SEO & Schema
1. **Rank Math Pro** ($89/year)
   - Job posting schema
   - XML sitemaps
   - Google Jobs integration
   - Local SEO

### Forms & Communication
1. **FluentCRM** (Free)
   - Email automation
   - Application status updates
   - Candidate nurturing

2. **Fluent Forms Pro** ($59/year)
   - Custom application forms
   - Conditional logic
   - File uploads

### Payments
1. **Stripe for WooCommerce** (Free)
   - If using WooCommerce for payments

OR

2. **WP Simple Pay Pro** ($99/year)
   - Standalone Stripe integration
   - Recurring payments
   - Custom payment forms

### User Management
1. **Ultimate Member** (Free)
   - Enhanced user profiles
   - Frontend user dashboard
   - Social login options

2. **User Role Editor Pro** ($29/year)
   - Granular permissions
   - Custom capabilities

### Analytics
1. **MonsterInsights Pro** ($99/year)
   - Google Analytics integration
   - eCommerce tracking
   - Custom events

OR

2. **Plausible Analytics** ($9/month)
   - Privacy-focused alternative
   - No cookie banners needed

## Transparency-Specific Plugins

### Custom Development Needs
For FairPath's unique transparency features, consider:

1. **Advanced Custom Fields Pro** ($49/year)
   - Mandatory salary fields
   - Verification badges
   - Custom employer fields

2. **AutomatorWP** ($99/year)
   - Workflow automation
   - Status change notifications
   - Application tracking triggers

## Email Infrastructure

### Recommended: Postmark
- $10/month for 10,000 emails
- Excellent delivery rates
- Transactional email focus

**Plugin**: Post SMTP (Free)
- Connects WordPress to Postmark
- Email logging
- Failure notifications

## Backup Solution

**UpdraftPlus Premium** ($70/year)
- Automated backups
- Remote storage (S3, Google Drive)
- One-click restore
- Cloning/migration

## Development Tools

1. **WP Migrate Pro** ($99/year)
   - Push/pull between dev/staging/prod
   - Database sync
   - Media file sync

2. **Query Monitor** (Free)
   - Debug performance issues
   - Database query analysis
   - Hook inspection

## Total Stack Cost Estimate

### Year 1 Setup:
- Theme: $59
- WP Job Manager Suite: $299
- Performance/Security/SEO: $267
- Email/Forms/Analytics: $168
- Development tools: $99
- **Total: ~$892/year**

### Hosting Recommendation:
- **Kinsta Business 1** ($115/month)
  - Managed WordPress
  - Built-in CDN
  - Staging environment
  - Daily backups

OR

- **WP Engine Growth** ($96/month)
  - Similar features
  - Good support

## Implementation Timeline

### Week 1-2: Foundation
- Set up hosting
- Install WordPress
- Configure theme
- Install core plugins

### Week 3-4: Job Board Setup
- Configure WP Job Manager
- Set up payment processing
- Create job submission forms
- Design job listing pages

### Week 5-6: User Experience
- Candidate registration flow
- Employer dashboard
- Email notifications
- Application tracking

### Week 7-8: Polish & Launch
- Performance optimization
- Security hardening
- SEO configuration
- Content migration
- Beta testing

## Custom Code Requirements

For FairPath-specific features, you'll need custom code for:

1. **Mandatory Salary Display**
```php
// functions.php snippet
add_filter('submit_job_form_fields', 'fairpath_require_salary');
add_filter('job_manager_job_listing_data_fields', 'fairpath_admin_require_salary');
```

2. **Application Status Tracking**
- Custom post type for applications
- Status taxonomy
- Email triggers on status change

3. **Employer Verification System**
- User meta fields
- Admin approval workflow
- Verification badge display

## Alternative Approach: Headless WordPress

If you want more flexibility long-term:
- Use WordPress as backend only
- WPGraphQL plugin for API
- Next.js frontend (like your other projects)
- Better performance and customization

---

## Next Steps

1. **Purchase hosting** (start with staging environment)
2. **Install WordPress** and essential plugins
3. **Begin with WP Job Manager** free version to test
4. **Gradually add premium features** as you validate the concept
5. **Consider custom development** for transparency features

This stack gives you enterprise-grade job board functionality while maintaining the flexibility to add FairPath's unique transparency features.