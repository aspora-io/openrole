/**
 * Drizzle ORM Database Schema
 * Complete type-safe schema definitions for OpenRole
 */

import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb, uniqueIndex, index, point } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  userType: varchar('user_type', { length: 20 }).notNull(), // 'candidate', 'employer', 'admin'
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  companyName: varchar('company_name', { length: 255 }),
  verified: boolean('verified').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    userTypeIdx: index('users_user_type_idx').on(table.userType),
  };
});

export const usersRelations = relations(users, ({ many, one }) => ({
  postedJobs: many(jobs, { relationName: 'postedBy' }),
  applications: many(applications),
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  company: one(companies, { fields: [users.id], references: [companies.createdBy] }),
}));

// ============================================================================
// COMPANIES
// ============================================================================

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  website: varchar('website', { length: 255 }),
  logoUrl: varchar('logo_url', { length: 255 }),
  industry: varchar('industry', { length: 100 }),
  sizeCategory: varchar('size_category', { length: 50 }), // 'startup', 'small', 'medium', 'large', 'enterprise'
  verified: boolean('verified').default(false),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    nameIdx: index('companies_name_idx').on(table.name),
    verifiedIdx: index('companies_verified_idx').on(table.verified),
  };
});

export const companiesRelations = relations(companies, ({ one, many }) => ({
  creator: one(users, { fields: [companies.createdBy], references: [users.id] }),
  jobs: many(jobs),
}));

// ============================================================================
// JOBS
// ============================================================================

export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  postedBy: uuid('posted_by').references(() => users.id, { onDelete: 'set null' }),

  // Salary transparency (mandatory)
  salaryMin: integer('salary_min').notNull(), // Now NOT NULL for transparency
  salaryMax: integer('salary_max').notNull(), // Now NOT NULL for transparency
  salaryCurrency: varchar('salary_currency', { length: 3 }).default('EUR'),
  salaryType: varchar('salary_type', { length: 20 }).default('annual'),
  equityOffered: boolean('equity_offered').default(false),

  // Location
  locationPrecise: varchar('location_precise', { length: 255 }),
  locationGeneral: varchar('location_general', { length: 100 }),
  locationCoordinates: point('location_coordinates'),
  remoteType: varchar('remote_type', { length: 20 }).default('office'), // 'remote', 'hybrid', 'office'

  // Job details
  employmentType: varchar('employment_type', { length: 50 }).notNull(), // 'full-time', 'part-time', 'contract', 'internship'
  experienceLevel: varchar('experience_level', { length: 50 }).notNull(), // 'entry', 'mid', 'senior', 'lead', 'executive'
  department: varchar('department', { length: 100 }),

  // Skills
  coreSkills: jsonb('core_skills').default([]),
  niceToHaveSkills: jsonb('nice_to_have_skills').default([]),
  certificationsRequired: jsonb('certifications_required').default([]),

  // Requirements & responsibilities
  requirements: jsonb('requirements').default([]),
  responsibilities: jsonb('responsibilities').default([]),
  benefits: jsonb('benefits').default([]),

  // Application settings
  applicationDeadline: timestamp('application_deadline', { withTimezone: true }),
  externalApplicationUrl: varchar('external_application_url', { length: 500 }),
  requiresCoverLetter: boolean('requires_cover_letter').default(false),
  requiresPortfolio: boolean('requires_portfolio').default(false),
  customQuestions: jsonb('custom_questions').default([]),

  // Job lifecycle
  status: varchar('status', { length: 20 }).default('draft'), // 'draft', 'active', 'paused', 'filled', 'expired'
  featured: boolean('featured').default(false),
  urgent: boolean('urgent').default(false),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  lastVerified: timestamp('last_verified', { withTimezone: true }).defaultNow(),
  filledAt: timestamp('filled_at', { withTimezone: true }),

  // Analytics
  viewCount: integer('view_count').default(0),
  applicationCount: integer('application_count').default(0),

  // SEO
  slug: varchar('slug', { length: 300 }),
  metaDescription: text('meta_description'),
  tags: jsonb('tags').default([]),

  // Import tracking (for scraped jobs)
  source: varchar('source', { length: 50 }).default('manual'), // 'manual', 'import', 'api'
  sourceId: varchar('source_id', { length: 255 }), // Original ID from source system

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    statusIdx: index('jobs_status_idx').on(table.status),
    companyIdx: index('jobs_company_id_idx').on(table.companyId),
    createdAtIdx: index('jobs_created_at_idx').on(table.createdAt),
    locationIdx: index('jobs_location_general_idx').on(table.locationGeneral),
    salaryRangeIdx: index('jobs_salary_range_idx').on(table.salaryMin, table.salaryMax),
    slugIdx: uniqueIndex('jobs_slug_idx').on(table.slug),
    sourceIdIdx: index('jobs_source_id_idx').on(table.sourceId),
  };
});

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  company: one(companies, { fields: [jobs.companyId], references: [companies.id] }),
  poster: one(users, { fields: [jobs.postedBy], references: [users.id], relationName: 'postedBy' }),
  applications: many(applications),
  analytics: many(jobAnalytics),
  views: many(jobViews),
  savedBy: many(savedJobs),
}));

// ============================================================================
// APPLICATIONS
// ============================================================================

export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'cascade' }).notNull(),
  candidateId: uuid('candidate_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

  status: varchar('status', { length: 20 }).default('submitted'), // 'submitted', 'reviewed', 'interview', 'rejected', 'hired'
  coverLetter: text('cover_letter'),
  cvUrl: varchar('cv_url', { length: 255 }),
  cvDocumentId: uuid('cv_document_id'),
  portfolioUrl: varchar('portfolio_url', { length: 255 }),
  customAnswers: jsonb('custom_answers').default({}),

  // Tracking
  viewedByEmployer: boolean('viewed_by_employer').default(false),
  viewedAt: timestamp('viewed_at', { withTimezone: true }),

  appliedAt: timestamp('applied_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    uniqueApplication: uniqueIndex('unique_job_candidate').on(table.jobId, table.candidateId),
    jobIdx: index('applications_job_id_idx').on(table.jobId),
    candidateIdx: index('applications_candidate_id_idx').on(table.candidateId),
    statusIdx: index('applications_status_idx').on(table.status),
  };
});

export const applicationsRelations = relations(applications, ({ one }) => ({
  job: one(jobs, { fields: [applications.jobId], references: [jobs.id] }),
  candidate: one(users, { fields: [applications.candidateId], references: [users.id] }),
}));

// ============================================================================
// PROFILES
// ============================================================================

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),

  headline: varchar('headline', { length: 255 }),
  summary: text('summary'),
  skills: jsonb('skills').default([]),
  experienceYears: integer('experience_years'),
  location: varchar('location', { length: 255 }),
  willingToRelocate: boolean('willing_to_relocate').default(false),
  remotePreference: varchar('remote_preference', { length: 20 }).default('hybrid'),

  // Visibility
  profileVisibility: varchar('profile_visibility', { length: 20 }).default('public'), // 'public', 'semi-private', 'anonymous'
  searchable: boolean('searchable').default(true),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    userIdx: uniqueIndex('profiles_user_id_idx').on(table.userId),
  };
});

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

// ============================================================================
// JOB ANALYTICS
// ============================================================================

export const jobAnalytics = pgTable('job_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'cascade' }).notNull(),
  date: timestamp('date', { withTimezone: true }).notNull(),

  views: integer('views').default(0),
  uniqueViews: integer('unique_views').default(0),
  applications: integer('applications').default(0),
  qualifiedApplications: integer('qualified_applications').default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    jobDateIdx: uniqueIndex('job_analytics_job_date_idx').on(table.jobId, table.date),
    jobIdx: index('job_analytics_job_id_idx').on(table.jobId),
  };
});

export const jobAnalyticsRelations = relations(jobAnalytics, ({ one }) => ({
  job: one(jobs, { fields: [jobAnalytics.jobId], references: [jobs.id] }),
}));

// ============================================================================
// JOB VIEWS
// ============================================================================

export const jobViews = pgTable('job_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  sessionId: varchar('session_id', { length: 255 }),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  referrer: varchar('referrer', { length: 500 }),

  viewedAt: timestamp('viewed_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    jobIdx: index('job_views_job_id_idx').on(table.jobId),
    viewedAtIdx: index('job_views_viewed_at_idx').on(table.viewedAt),
  };
});

export const jobViewsRelations = relations(jobViews, ({ one }) => ({
  job: one(jobs, { fields: [jobViews.jobId], references: [jobs.id] }),
  user: one(users, { fields: [jobViews.userId], references: [users.id] }),
}));

// ============================================================================
// SAVED JOBS
// ============================================================================

export const savedJobs = pgTable('saved_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  candidateId: uuid('candidate_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'cascade' }).notNull(),

  savedAt: timestamp('saved_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    uniqueSave: uniqueIndex('unique_candidate_job_save').on(table.candidateId, table.jobId),
    candidateIdx: index('saved_jobs_candidate_id_idx').on(table.candidateId),
    jobIdx: index('saved_jobs_job_id_idx').on(table.jobId),
  };
});

export const savedJobsRelations = relations(savedJobs, ({ one }) => ({
  candidate: one(users, { fields: [savedJobs.candidateId], references: [users.id] }),
  job: one(jobs, { fields: [savedJobs.jobId], references: [jobs.id] }),
}));

// ============================================================================
// IMPORT HISTORY (for bulk imports)
// ============================================================================

export const importHistory = pgTable('import_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceName: varchar('source_name', { length: 100 }).notNull(),
  importNote: text('import_note'),
  importedBy: uuid('imported_by').references(() => users.id, { onDelete: 'set null' }),

  jobsProcessed: integer('jobs_processed').default(0),
  jobsImported: integer('jobs_imported').default(0),
  jobsSkipped: integer('jobs_skipped').default(0),
  jobsFailed: integer('jobs_failed').default(0),

  importedAt: timestamp('imported_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    importedAtIdx: index('import_history_imported_at_idx').on(table.importedAt),
    importedByIdx: index('import_history_imported_by_idx').on(table.importedBy),
  };
});

export const importHistoryRelations = relations(importHistory, ({ one }) => ({
  importer: one(users, { fields: [importHistory.importedBy], references: [users.id] }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type JobAnalytics = typeof jobAnalytics.$inferSelect;
export type NewJobAnalytics = typeof jobAnalytics.$inferInsert;

export type JobView = typeof jobViews.$inferSelect;
export type NewJobView = typeof jobViews.$inferInsert;

export type SavedJob = typeof savedJobs.$inferSelect;
export type NewSavedJob = typeof savedJobs.$inferInsert;

export type ImportHistory = typeof importHistory.$inferSelect;
export type NewImportHistory = typeof importHistory.$inferInsert;
