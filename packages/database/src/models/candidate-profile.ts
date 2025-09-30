/**
 * CandidateProfile Drizzle ORM Model
 * 
 * Extended professional profile information for job seekers.
 * Based on migration 001-candidate-profiles.sql and data-model.md specifications.
 * 
 * Features:
 * - Comprehensive profile management with privacy controls
 * - JSONB fields for skills and industries
 * - Salary expectations and preferences
 * - Verification status tracking
 * - GDPR-compliant privacy settings
 * 
 * @author OpenRole Team
 * @date 2025-09-30
 */

import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  integer, 
  boolean, 
  date,
  timestamp,
  jsonb,
  index,
  unique,
  check
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from '../schema';

// Type definitions for JSONB fields
export type SkillsArray = string[];
export type IndustriesArray = string[];

// Enum types based on database constraints
export const RemotePreference = {
  REMOTE: 'remote',
  HYBRID: 'hybrid', 
  OFFICE: 'office'
} as const;

export const PrivacyLevel = {
  PUBLIC: 'public',
  SEMI_PRIVATE: 'semi-private',
  ANONYMOUS: 'anonymous'
} as const;

export type RemotePreferenceType = typeof RemotePreference[keyof typeof RemotePreference];
export type PrivacyLevelType = typeof PrivacyLevel[keyof typeof PrivacyLevel];

/**
 * CandidateProfile table schema
 * 
 * Stores extended professional profile information for job seekers with
 * comprehensive privacy controls and verification status tracking.
 */
export const candidateProfiles = pgTable('candidate_profiles', {
  // Primary Key
  id: uuid('id')
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  
  // Foreign Key to users table
  userId: uuid('user_id')
    .notNull(),
  
  // Basic Information
  headline: varchar('headline', { length: 255 })
    .notNull(),
  
  summary: text('summary'),
  
  location: varchar('location', { length: 255 }),
  
  phoneNumber: varchar('phone_number', { length: 50 }),
  
  portfolioUrl: text('portfolio_url'),
  
  linkedinUrl: text('linkedin_url'),
  
  githubUrl: text('github_url'),
  
  // Professional Details
  experienceYears: integer('experience_years')
    .notNull(),
  
  skills: jsonb('skills')
    .$type<SkillsArray>()
    .default(sql`'[]'::jsonb`),
  
  industries: jsonb('industries')
    .$type<IndustriesArray>()
    .default(sql`'[]'::jsonb`),
  
  // Preferences
  salaryExpectationMin: integer('salary_expectation_min')
    .notNull(),
  
  salaryExpectationMax: integer('salary_expectation_max')
    .notNull(),
  
  availableFrom: date('available_from'),
  
  willingToRelocate: boolean('willing_to_relocate')
    .default(false),
  
  remotePreference: varchar('remote_preference', { length: 10 })
    .notNull()
    .$type<RemotePreferenceType>(),
  
  // Privacy Controls (FR-003)
  privacyLevel: varchar('privacy_level', { length: 20 })
    .notNull()
    .default('semi-private')
    .$type<PrivacyLevelType>(),
  
  profileVisibleToEmployers: boolean('profile_visible_to_employers')
    .default(true),
  
  contactInfoVisible: boolean('contact_info_visible')
    .default(false),
  
  salaryVisible: boolean('salary_visible')
    .default(true),
  
  // Verification Status (FR-012)
  emailVerified: boolean('email_verified')
    .default(false),
  
  profileComplete: boolean('profile_complete')
    .default(false),
  
  idVerified: boolean('id_verified')
    .default(false),
  
  // Metadata
  profileViews: integer('profile_views')
    .default(0),
  
  lastActiveAt: timestamp('last_active_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`),
  
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}, (table) => {
  return {
    // Indexes based on migration
    userIdIdx: index('idx_candidate_profile_user_id').on(table.userId),
    privacyIdx: index('idx_candidate_profile_privacy').on(table.privacyLevel),
    locationIdx: index('idx_candidate_profile_location').on(table.location),
    salaryIdx: index('idx_candidate_profile_salary').on(table.salaryExpectationMin, table.salaryExpectationMax),
    skillsIdx: index('idx_candidate_profile_skills').on(table.skills),
    experienceIdx: index('idx_candidate_profile_experience').on(table.experienceYears),
    remoteIdx: index('idx_candidate_profile_remote').on(table.remotePreference),
    activeIdx: index('idx_candidate_profile_active').on(table.lastActiveAt),
    
    // Unique constraint for user_id (one profile per user)
    userIdUnique: unique('candidate_profiles_user_id_unique').on(table.userId),
    
    // Check constraints (these should be handled by database migration)
    // Including here for documentation/type safety
    headlineLength: check('headline_length', sql`char_length(${table.headline}) >= 10`),
    summaryLength: check('summary_length', sql`char_length(${table.summary}) <= 2000`),
    experienceRange: check('experience_range', sql`${table.experienceYears} >= 0 AND ${table.experienceYears} <= 50`),
    skillsLimit: check('skills_limit', sql`jsonb_array_length(${table.skills}) <= 50`),
    salaryMin: check('salary_min', sql`${table.salaryExpectationMin} >= 20000`),
    salaryMax: check('salary_max', sql`${table.salaryExpectationMax} >= 20000`),
    salaryRange: check('salary_range_valid', sql`${table.salaryExpectationMin} <= ${table.salaryExpectationMax}`),
    remotePreferenceValid: check('remote_preference_valid', sql`${table.remotePreference} IN ('remote', 'hybrid', 'office')`),
    privacyLevelValid: check('privacy_level_valid', sql`${table.privacyLevel} IN ('public', 'semi-private', 'anonymous')`),
  };
});

/**
 * Relations for CandidateProfile
 */
export const candidateProfilesRelations = relations(candidateProfiles, ({ one, many }) => ({
  // Relation to users table (assuming it exists in the schema)
  user: one(users, {
    fields: [candidateProfiles.userId],
    references: [users.id],
  }),
  
  // Future relations to other tables
  // cvDocuments: many(cvDocuments),
  // workExperiences: many(workExperience), // This relation is defined in work-experience.ts to avoid circular imports
  // educations: many(education), // This relation is defined in education.ts to avoid circular imports
  // portfolioItems: many(portfolioItems), // This relation is defined in portfolio-item.ts to avoid circular imports
  // externalApplications: many(externalApplications),
  // privacyAuditLogs: many(privacyAuditLogs),
}));

// users table is imported from schema.ts

/**
 * Zod validation schemas
 */

// Base validation schema for profile fields
const profileValidation = {
  headline: z.string()
    .min(10, 'Headline must be at least 10 characters')
    .max(255, 'Headline must not exceed 255 characters'),
  
  summary: z.string()
    .max(2000, 'Summary must not exceed 2000 characters')
    .optional(),
  
  location: z.string()
    .max(255, 'Location must not exceed 255 characters')
    .optional(),
  
  phoneNumber: z.string()
    .max(50, 'Phone number must not exceed 50 characters')
    .optional(),
  
  portfolioUrl: z.string()
    .url('Portfolio URL must be a valid URL')
    .optional()
    .or(z.literal('')),
  
  linkedinUrl: z.string()
    .url('LinkedIn URL must be a valid URL')
    .optional()
    .or(z.literal('')),
  
  githubUrl: z.string()
    .url('GitHub URL must be a valid URL')
    .optional()
    .or(z.literal('')),
  
  experienceYears: z.number()
    .int('Experience years must be an integer')
    .min(0, 'Experience years cannot be negative')
    .max(50, 'Experience years cannot exceed 50'),
  
  skills: z.array(z.string().min(2).max(100))
    .max(50, 'Cannot have more than 50 skills')
    .default([]),
  
  industries: z.array(z.string().min(2).max(100))
    .default([]),
  
  salaryExpectationMin: z.number()
    .int('Salary minimum must be an integer')
    .min(20000, 'Minimum salary must be at least €20,000'),
  
  salaryExpectationMax: z.number()
    .int('Salary maximum must be an integer')
    .min(20000, 'Maximum salary must be at least €20,000'),
  
  availableFrom: z.date().optional(),
  
  willingToRelocate: z.boolean().default(false),
  
  remotePreference: z.enum(['remote', 'hybrid', 'office']),
  
  privacyLevel: z.enum(['public', 'semi-private', 'anonymous'])
    .default('semi-private'),
  
  profileVisibleToEmployers: z.boolean().default(true),
  
  contactInfoVisible: z.boolean().default(false),
  
  salaryVisible: z.boolean().default(true),
};

// Insert schema - for creating new profiles
export const insertCandidateProfileSchema = createInsertSchema(candidateProfiles, profileValidation)
  .refine((data) => data.salaryExpectationMin <= data.salaryExpectationMax, {
    message: 'Minimum salary must be less than or equal to maximum salary',
    path: ['salaryExpectationMax'],
  });

// Select schema - for querying profiles
export const selectCandidateProfileSchema = createSelectSchema(candidateProfiles);

// Update schema - for updating existing profiles (all fields optional except id)
export const updateCandidateProfileSchema = createSelectSchema(candidateProfiles, {
  ...profileValidation,
  id: z.string().uuid(),
}).partial().required({ id: true })
  .refine((data) => {
    if (data.salaryExpectationMin && data.salaryExpectationMax) {
      return data.salaryExpectationMin <= data.salaryExpectationMax;
    }
    return true;
  }, {
    message: 'Minimum salary must be less than or equal to maximum salary',
    path: ['salaryExpectationMax'],
  });

/**
 * TypeScript types derived from schemas
 */
export type InsertCandidateProfile = z.infer<typeof insertCandidateProfileSchema>;
export type SelectCandidateProfile = z.infer<typeof selectCandidateProfileSchema>;
export type UpdateCandidateProfile = z.infer<typeof updateCandidateProfileSchema>;

/**
 * Computed field types for derived data
 */
export type CandidateProfileWithComputed = SelectCandidateProfile & {
  /**
   * Verified badge status (computed field)
   * Returns true if emailVerified AND profileComplete AND idVerified
   */
  verifiedBadge: boolean;
  
  /**
   * Completion percentage based on filled fields
   */
  completionPercentage: number;
  
  /**
   * Display name based on privacy settings
   */
  displayName: string;
  
  /**
   * Masked contact information based on privacy settings
   */
  maskedContactInfo: {
    email?: string;
    phone?: string;
    location?: string;
  };
};

/**
 * Validation helpers
 */
export const candidateProfileHelpers = {
  /**
   * Calculate verified badge status
   */
  calculateVerifiedBadge: (profile: SelectCandidateProfile): boolean => {
    return profile.emailVerified && profile.profileComplete && profile.idVerified;
  },
  
  /**
   * Calculate profile completion percentage
   */
  calculateCompletionPercentage: (profile: SelectCandidateProfile): number => {
    const requiredFields = [
      profile.headline,
      profile.summary,
      profile.location,
      profile.experienceYears !== null,
      profile.skills && profile.skills.length > 0,
    ];
    
    const optionalFields = [
      profile.phoneNumber,
      profile.portfolioUrl,
      profile.linkedinUrl,
      profile.githubUrl,
      profile.industries && profile.industries.length > 0,
      profile.availableFrom,
    ];
    
    const requiredComplete = requiredFields.filter(Boolean).length;
    const optionalComplete = optionalFields.filter(Boolean).length;
    
    // Required fields are worth 70%, optional fields 30%
    const requiredScore = (requiredComplete / requiredFields.length) * 70;
    const optionalScore = (optionalComplete / optionalFields.length) * 30;
    
    return Math.round(requiredScore + optionalScore);
  },
  
  /**
   * Check if profile meets completion criteria
   */
  isProfileComplete: (profile: SelectCandidateProfile): boolean => {
    return !!(
      profile.headline &&
      profile.summary &&
      profile.location &&
      profile.experienceYears !== null &&
      profile.skills && profile.skills.length > 0
    );
  },
  
  /**
   * Generate display name based on privacy settings
   */
  getDisplayName: (profile: SelectCandidateProfile, userFirstName?: string, userLastName?: string): string => {
    switch (profile.privacyLevel) {
      case 'public':
        return userFirstName && userLastName ? `${userFirstName} ${userLastName}` : 'Professional';
      case 'semi-private':
        return userFirstName ? `${userFirstName} ${userLastName?.[0] || ''}.` : 'Professional';
      case 'anonymous':
        return 'Anonymous Professional';
      default:
        return 'Professional';
    }
  },
  
  /**
   * Get masked contact information based on privacy settings
   */
  getMaskedContactInfo: (
    profile: SelectCandidateProfile, 
    userEmail?: string
  ): CandidateProfileWithComputed['maskedContactInfo'] => {
    const masked: CandidateProfileWithComputed['maskedContactInfo'] = {};
    
    if (profile.contactInfoVisible) {
      if (userEmail) masked.email = userEmail;
      if (profile.phoneNumber) masked.phone = profile.phoneNumber;
    } else {
      // Show masked versions
      if (userEmail) masked.email = userEmail.replace(/(.{2}).+(@.+)/, '$1***$2');
      if (profile.phoneNumber) masked.phone = profile.phoneNumber.replace(/(.{3}).+(.{2})/, '$1***$2');
    }
    
    // Location is handled separately based on privacy level
    if (profile.privacyLevel !== 'anonymous' && profile.location) {
      masked.location = profile.location;
    }
    
    return masked;
  },
  
  /**
   * Validate skill format and content
   */
  validateSkills: (skills: string[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (skills.length > 50) {
      errors.push('Cannot have more than 50 skills');
    }
    
    skills.forEach((skill, index) => {
      if (skill.length < 2) {
        errors.push(`Skill ${index + 1} must be at least 2 characters`);
      }
      if (skill.length > 100) {
        errors.push(`Skill ${index + 1} must not exceed 100 characters`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  },
  
  /**
   * Validate URL format
   */
  validateUrl: (url: string | null | undefined, fieldName: string): { valid: boolean; error?: string } => {
    if (!url || url === '') return { valid: true };
    
    try {
      new URL(url);
      return { valid: true };
    } catch {
      return { 
        valid: false, 
        error: `${fieldName} must be a valid URL` 
      };
    }
  },
};

/**
 * Database query helpers
 */
export const candidateProfileQueries = {
  /**
   * Common select fields for public profiles
   */
  publicSelectFields: {
    id: candidateProfiles.id,
    headline: candidateProfiles.headline,
    summary: candidateProfiles.summary,
    location: candidateProfiles.location,
    experienceYears: candidateProfiles.experienceYears,
    skills: candidateProfiles.skills,
    industries: candidateProfiles.industries,
    remotePreference: candidateProfiles.remotePreference,
    privacyLevel: candidateProfiles.privacyLevel,
    emailVerified: candidateProfiles.emailVerified,
    profileComplete: candidateProfiles.profileComplete,
    idVerified: candidateProfiles.idVerified,
    profileViews: candidateProfiles.profileViews,
    lastActiveAt: candidateProfiles.lastActiveAt,
    createdAt: candidateProfiles.createdAt,
  },
  
  /**
   * Privacy-filtered fields based on profile privacy level
   */
  getSelectFieldsByPrivacy: (privacyLevel: PrivacyLevelType) => {
    const baseFields = candidateProfileQueries.publicSelectFields;
    
    switch (privacyLevel) {
      case 'public':
        return {
          ...baseFields,
          portfolioUrl: candidateProfiles.portfolioUrl,
          linkedinUrl: candidateProfiles.linkedinUrl,
          githubUrl: candidateProfiles.githubUrl,
          salaryExpectationMin: candidateProfiles.salaryExpectationMin,
          salaryExpectationMax: candidateProfiles.salaryExpectationMax,
        };
      
      case 'semi-private':
        return {
          ...baseFields,
          portfolioUrl: candidateProfiles.portfolioUrl,
          linkedinUrl: candidateProfiles.linkedinUrl,
          githubUrl: candidateProfiles.githubUrl,
        };
      
      case 'anonymous':
        return {
          ...baseFields,
          location: sql`NULL`.as('location'), // Hide location for anonymous
        };
      
      default:
        return baseFields;
    }
  }
};

/**
 * Export the table and all related types/helpers
 */
export default candidateProfiles;