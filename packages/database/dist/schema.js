/**
 * OpenRole Database Schema
 *
 * Complete database schema for the OpenRole platform.
 * Combines existing tables with new CV & Profile Tools tables.
 *
 * @author OpenRole Team
 * @date 2025-09-30
 */
import { pgTable, uuid, text, timestamp, boolean, integer, pgEnum, json, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
// Enums
export const userRoleEnum = pgEnum('user_role', ['candidate', 'employer', 'admin']);
export const companySizeEnum = pgEnum('company_size', ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']);
export const jobStatusEnum = pgEnum('job_status', ['draft', 'published', 'closed', 'archived']);
export const remoteTypeEnum = pgEnum('remote_type', ['onsite', 'hybrid', 'remote']);
export const employmentTypeEnum = pgEnum('employment_type', ['full_time', 'part_time', 'contract', 'internship']);
export const applicationStatusEnum = pgEnum('application_status', [
    'submitted',
    'reviewing',
    'rejected',
    'interviewing',
    'offered',
    'withdrawn'
]);
// Companies table
export const companies = pgTable('companies', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    domain: text('domain').unique(),
    logo_url: text('logo_url'),
    description: text('description'),
    website: text('website'),
    size: companySizeEnum('size'),
    industry: text('industry'),
    founded_year: integer('founded_year'),
    location: text('location'),
    culture_values: json('culture_values').$type(),
    benefits: json('benefits').$type(),
    tech_stack: json('tech_stack').$type(),
    verified: boolean('verified').default(false),
    verified_at: timestamp('verified_at'),
    stripe_customer_id: text('stripe_customer_id'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
    return {
        domainIdx: index('companies_domain_idx').on(table.domain),
        verifiedIdx: index('companies_verified_idx').on(table.verified),
    };
});
// Users table
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').unique().notNull(),
    password_hash: text('password_hash'),
    role: userRoleEnum('role').notNull(),
    company_id: uuid('company_id').references(() => companies.id),
    first_name: text('first_name'),
    last_name: text('last_name'),
    avatar_url: text('avatar_url'),
    bio: text('bio'),
    location: text('location'),
    phone: text('phone'),
    linkedin_url: text('linkedin_url'),
    github_url: text('github_url'),
    portfolio_url: text('portfolio_url'),
    resume_url: text('resume_url'),
    skills: json('skills').$type(),
    experience_years: integer('experience_years'),
    desired_salary_min: integer('desired_salary_min'),
    desired_salary_max: integer('desired_salary_max'),
    open_to_opportunities: boolean('open_to_opportunities').default(false),
    email_verified: boolean('email_verified').default(false),
    email_verified_at: timestamp('email_verified_at'),
    last_login_at: timestamp('last_login_at'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
    return {
        emailIdx: uniqueIndex('users_email_idx').on(table.email),
        companyIdx: index('users_company_idx').on(table.company_id),
        roleIdx: index('users_role_idx').on(table.role),
    };
});
// Jobs table
export const jobs = pgTable('jobs', {
    id: uuid('id').primaryKey().defaultRandom(),
    company_id: uuid('company_id').references(() => companies.id).notNull(),
    posted_by_id: uuid('posted_by_id').references(() => users.id).notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    requirements: json('requirements').$type().notNull(),
    nice_to_have: json('nice_to_have').$type(),
    responsibilities: json('responsibilities').$type(),
    skills: json('skills').$type().notNull(),
    salary_min: integer('salary_min').notNull(),
    salary_max: integer('salary_max').notNull(),
    salary_currency: text('salary_currency').default('USD').notNull(),
    equity_min: text('equity_min'),
    equity_max: text('equity_max'),
    location: text('location'),
    remote_type: remoteTypeEnum('remote_type').notNull(),
    employment_type: employmentTypeEnum('employment_type').notNull(),
    visa_sponsorship: boolean('visa_sponsorship').default(false),
    benefits: json('benefits').$type(),
    interview_process: text('interview_process'),
    team_size: integer('team_size'),
    reports_to: text('reports_to'),
    status: jobStatusEnum('status').default('draft').notNull(),
    published_at: timestamp('published_at'),
    expires_at: timestamp('expires_at'),
    closed_at: timestamp('closed_at'),
    views_count: integer('views_count').default(0),
    applications_count: integer('applications_count').default(0),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
    return {
        companyIdx: index('jobs_company_idx').on(table.company_id),
        statusIdx: index('jobs_status_idx').on(table.status),
        salaryIdx: index('jobs_salary_idx').on(table.salary_min, table.salary_max),
        remoteIdx: index('jobs_remote_idx').on(table.remote_type),
        publishedIdx: index('jobs_published_idx').on(table.published_at),
    };
});
// Applications table
export const applications = pgTable('applications', {
    id: uuid('id').primaryKey().defaultRandom(),
    job_id: uuid('job_id').references(() => jobs.id).notNull(),
    user_id: uuid('user_id').references(() => users.id).notNull(),
    status: applicationStatusEnum('status').default('submitted').notNull(),
    cover_letter: text('cover_letter'),
    resume_url: text('resume_url'),
    answers: json('answers').$type(),
    notes: text('notes'),
    rejection_reason: text('rejection_reason'),
    withdrawn_reason: text('withdrawn_reason'),
    submitted_at: timestamp('submitted_at').defaultNow().notNull(),
    reviewed_at: timestamp('reviewed_at'),
    rejected_at: timestamp('rejected_at'),
    interview_scheduled_at: timestamp('interview_scheduled_at'),
    offered_at: timestamp('offered_at'),
    withdrawn_at: timestamp('withdrawn_at'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
    return {
        jobIdx: index('applications_job_idx').on(table.job_id),
        userIdx: index('applications_user_idx').on(table.user_id),
        statusIdx: index('applications_status_idx').on(table.status),
        uniqueApplication: uniqueIndex('applications_job_user_idx').on(table.job_id, table.user_id),
    };
});
// Saved searches table
export const savedSearches = pgTable('saved_searches', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').references(() => users.id).notNull(),
    name: text('name').notNull(),
    query: json('query').$type().notNull(),
    email_alerts: boolean('email_alerts').default(false),
    last_notified_at: timestamp('last_notified_at'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
    return {
        userIdx: index('saved_searches_user_idx').on(table.user_id),
    };
});
// Saved jobs table
export const savedJobs = pgTable('saved_jobs', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').references(() => users.id).notNull(),
    job_id: uuid('job_id').references(() => jobs.id).notNull(),
    notes: text('notes'),
    created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
    return {
        userIdx: index('saved_jobs_user_idx').on(table.user_id),
        jobIdx: index('saved_jobs_job_idx').on(table.job_id),
        uniqueSave: uniqueIndex('saved_jobs_user_job_idx').on(table.user_id, table.job_id),
    };
});
// Job views table (for analytics)
export const jobViews = pgTable('job_views', {
    id: uuid('id').primaryKey().defaultRandom(),
    job_id: uuid('job_id').references(() => jobs.id).notNull(),
    user_id: uuid('user_id').references(() => users.id),
    ip_address: text('ip_address'),
    user_agent: text('user_agent'),
    referrer: text('referrer'),
    created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
    return {
        jobIdx: index('job_views_job_idx').on(table.job_id),
        userIdx: index('job_views_user_idx').on(table.user_id),
        createdIdx: index('job_views_created_idx').on(table.created_at),
    };
});
// Payment records
export const payments = pgTable('payments', {
    id: uuid('id').primaryKey().defaultRandom(),
    company_id: uuid('company_id').references(() => companies.id).notNull(),
    stripe_payment_intent_id: text('stripe_payment_intent_id').unique(),
    amount: integer('amount').notNull(),
    currency: text('currency').default('USD').notNull(),
    status: text('status').notNull(),
    description: text('description'),
    metadata: json('metadata').$type(),
    created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
    return {
        companyIdx: index('payments_company_idx').on(table.company_id),
        stripeIdx: index('payments_stripe_idx').on(table.stripe_payment_intent_id),
    };
});
// Job credits (for pay-per-post model)
export const jobCredits = pgTable('job_credits', {
    id: uuid('id').primaryKey().defaultRandom(),
    company_id: uuid('company_id').references(() => companies.id).notNull(),
    payment_id: uuid('payment_id').references(() => payments.id),
    credits: integer('credits').notNull(),
    used: integer('used').default(0).notNull(),
    expires_at: timestamp('expires_at'),
    created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
    return {
        companyIdx: index('job_credits_company_idx').on(table.company_id),
        expiresIdx: index('job_credits_expires_idx').on(table.expires_at),
    };
});
// CandidateProfile table is defined in models/candidate-profile.ts
// CVDocument table is defined in models/cv-document.ts
// WorkExperience table is defined in models/work-experience.ts
// Education table is defined in models/education.ts
// PortfolioItem table is defined in models/portfolio-item.ts
// Define relations
export const companiesRelations = relations(companies, ({ many }) => ({
    users: many(users),
    jobs: many(jobs),
    payments: many(payments),
    jobCredits: many(jobCredits),
}));
export const usersRelations = relations(users, ({ one, many }) => ({
    company: one(companies, {
        fields: [users.company_id],
        references: [companies.id],
    }),
    applications: many(applications),
    savedSearches: many(savedSearches),
    savedJobs: many(savedJobs),
    postedJobs: many(jobs),
    // candidateProfile relation is defined in models/candidate-profile.ts
}));
export const jobsRelations = relations(jobs, ({ one, many }) => ({
    company: one(companies, {
        fields: [jobs.company_id],
        references: [companies.id],
    }),
    postedBy: one(users, {
        fields: [jobs.posted_by_id],
        references: [users.id],
    }),
    applications: many(applications),
    savedJobs: many(savedJobs),
    views: many(jobViews),
}));
export const applicationsRelations = relations(applications, ({ one }) => ({
    job: one(jobs, {
        fields: [applications.job_id],
        references: [jobs.id],
    }),
    user: one(users, {
        fields: [applications.user_id],
        references: [users.id],
    }),
}));
// CandidateProfile types are exported from models/candidate-profile.ts
// CVDocument types are exported from models/cv-document.ts
// WorkExperience types are exported from models/work-experience.ts
// Education types are exported from models/education.ts
// PortfolioItem types are exported from models/portfolio-item.ts
//# sourceMappingURL=schema.js.map