/**
 * WorkExperience Drizzle ORM Model
 *
 * Professional work history details with achievements vs responsibilities distinction.
 * Based on migration 003-work-experience.sql and data-model.md specifications.
 *
 * Features:
 * - Timeline management with validation (start <= end, current job logic)
 * - Achievements vs responsibilities (FR-011) - JSONB arrays for measurable achievements
 * - Skills tracking per role
 * - Automatic sort ordering and duration calculations
 * - Profile completion status updates
 * - Comprehensive validation and helper functions
 *
 * @author OpenRole Team
 * @date 2025-09-30
 */
import { pgTable, uuid, varchar, text, integer, boolean, date, timestamp, jsonb, index, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { candidateProfiles } from './candidate-profile';
/**
 * WorkExperience table schema
 *
 * Stores professional work history with detailed achievements tracking
 * and comprehensive timeline validation. Emphasizes measurable achievements
 * vs general responsibilities (FR-011).
 */
export const workExperience = pgTable('work_experience', {
    // Primary Key
    id: uuid('id')
        .primaryKey()
        .default(sql `uuid_generate_v4()`),
    // Foreign Key to candidate_profiles table
    profileId: uuid('profile_id')
        .notNull()
        .references(() => candidateProfiles.id, { onDelete: 'cascade' }),
    // Position Details
    jobTitle: varchar('job_title', { length: 200 })
        .notNull(),
    companyName: varchar('company_name', { length: 200 })
        .notNull(),
    companyWebsite: text('company_website'),
    location: varchar('location', { length: 255 }),
    // Timeline
    startDate: date('start_date')
        .notNull(),
    endDate: date('end_date'),
    isCurrent: boolean('is_current')
        .notNull()
        .default(false),
    // Description (FR-011: Achievements vs Responsibilities)
    description: text('description')
        .notNull(),
    achievements: jsonb('achievements')
        .$type()
        .default(sql `'[]'::jsonb`),
    skills: jsonb('skills')
        .$type()
        .default(sql `'[]'::jsonb`),
    // Display Order
    sortOrder: integer('sort_order')
        .default(0),
    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true })
        .default(sql `CURRENT_TIMESTAMP`)
        .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .default(sql `CURRENT_TIMESTAMP`)
        .notNull(),
}, (table) => {
    return {
        // Indexes based on migration
        profileIdIdx: index('idx_work_experience_profile_id').on(table.profileId),
        startDateIdx: index('idx_work_experience_start_date').on(table.startDate),
        currentIdx: index('idx_work_experience_current').on(table.isCurrent),
        sortOrderIdx: index('idx_work_experience_sort_order').on(table.profileId, table.sortOrder),
        companyIdx: index('idx_work_experience_company').on(table.companyName),
        skillsIdx: index('idx_work_experience_skills').on(table.skills),
        // Check constraints (these are implemented in the database migration)
        // Including here for documentation and type safety
        jobTitleLength: check('job_title_length', sql `char_length(${table.jobTitle}) >= 2`),
        companyNameLength: check('company_name_length', sql `char_length(${table.companyName}) >= 2`),
        descriptionLength: check('description_length', sql `char_length(${table.description}) >= 10 AND char_length(${table.description}) <= 2000`),
        dateRangeValid: check('work_experience_date_range_valid', sql `${table.endDate} IS NULL OR ${table.endDate} >= ${table.startDate}`),
        startDateNotFuture: check('work_experience_start_date_not_future', sql `${table.startDate} <= CURRENT_DATE`),
        currentNoEndDate: check('work_experience_current_no_end_date', sql `NOT ${table.isCurrent} OR ${table.endDate} IS NULL`),
        achievementsLimit: check('work_experience_achievements_limit', sql `jsonb_array_length(${table.achievements}) <= 20`),
    };
});
/**
 * Relations for WorkExperience
 */
export const workExperienceRelations = relations(workExperience, ({ one }) => ({
    // Relation to candidate_profiles table
    candidateProfile: one(candidateProfiles, {
        fields: [workExperience.profileId],
        references: [candidateProfiles.id],
    }),
}));
/**
 * Zod validation schemas
 */
// Base validation schema for work experience fields
const workExperienceValidation = {
    jobTitle: z.string()
        .min(2, 'Job title must be at least 2 characters')
        .max(200, 'Job title must not exceed 200 characters'),
    companyName: z.string()
        .min(2, 'Company name must be at least 2 characters')
        .max(200, 'Company name must not exceed 200 characters'),
    companyWebsite: z.string()
        .url('Company website must be a valid URL')
        .optional()
        .or(z.literal('')),
    location: z.string()
        .max(255, 'Location must not exceed 255 characters')
        .optional(),
    startDate: z.date()
        .max(new Date(), 'Start date cannot be in the future'),
    endDate: z.date()
        .optional(),
    isCurrent: z.boolean().default(false),
    description: z.string()
        .min(10, 'Description must be at least 10 characters')
        .max(2000, 'Description must not exceed 2000 characters'),
    achievements: z.array(z.string()
        .min(10, 'Each achievement must be at least 10 characters')
        .max(500, 'Each achievement must not exceed 500 characters'))
        .max(20, 'Cannot have more than 20 achievements')
        .default([]),
    skills: z.array(z.string()
        .min(2, 'Each skill must be at least 2 characters')
        .max(100, 'Each skill must not exceed 100 characters'))
        .default([]),
    sortOrder: z.number()
        .int('Sort order must be an integer')
        .min(0, 'Sort order cannot be negative')
        .default(0),
};
// Insert schema - for creating new work experience entries
export const insertWorkExperienceSchema = createInsertSchema(workExperience, workExperienceValidation)
    .refine((data) => {
    // If end date is provided, it must be >= start date
    if (data.endDate && data.startDate) {
        return data.endDate >= data.startDate;
    }
    return true;
}, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
})
    .refine((data) => {
    // If current job, end date must be null
    if (data.isCurrent) {
        return !data.endDate;
    }
    return true;
}, {
    message: 'Current job cannot have an end date',
    path: ['endDate'],
});
// Select schema - for querying work experience
export const selectWorkExperienceSchema = createSelectSchema(workExperience);
// Update schema - for updating existing work experience (all fields optional except id)
export const updateWorkExperienceSchema = createSelectSchema(workExperience, {
    ...workExperienceValidation,
    id: z.string().uuid(),
}).partial().required({ id: true })
    .refine((data) => {
    // If both dates are provided, validate range
    if (data.endDate && data.startDate) {
        return data.endDate >= data.startDate;
    }
    return true;
}, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
})
    .refine((data) => {
    // If marking as current, end date must be null
    if (data.isCurrent) {
        return !data.endDate;
    }
    return true;
}, {
    message: 'Current job cannot have an end date',
    path: ['endDate'],
});
/**
 * Timeline validation helpers
 */
export const workExperienceHelpers = {
    /**
     * Validate timeline (start <= end, current job logic)
     */
    validateTimeline: (startDate, endDate, isCurrent) => {
        const errors = [];
        // Start date cannot be in the future
        if (startDate > new Date()) {
            errors.push('Start date cannot be in the future');
        }
        // If current job, end date must be null
        if (isCurrent && endDate) {
            errors.push('Current job cannot have an end date');
        }
        // If end date provided, it must be >= start date
        if (endDate && endDate < startDate) {
            errors.push('End date must be on or after start date');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    },
    /**
     * Validate achievements array (10-500 chars each, max 20)
     */
    validateAchievements: (achievements) => {
        const errors = [];
        if (achievements.length > 20) {
            errors.push('Cannot have more than 20 achievements');
        }
        achievements.forEach((achievement, index) => {
            if (achievement.length < 10) {
                errors.push(`Achievement ${index + 1} must be at least 10 characters`);
            }
            if (achievement.length > 500) {
                errors.push(`Achievement ${index + 1} must not exceed 500 characters`);
            }
            if (achievement.trim() === '') {
                errors.push(`Achievement ${index + 1} cannot be empty`);
            }
        });
        return {
            valid: errors.length === 0,
            errors
        };
    },
    /**
     * Calculate duration in months from start date to end date (or current date)
     */
    calculateDurationMonths: (startDate, endDate = null) => {
        const end = endDate || new Date();
        const diffTime = end.getTime() - startDate.getTime();
        const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44); // Average days per month
        return Math.round(diffMonths);
    },
    /**
     * Calculate duration in years (rounded to 1 decimal place)
     */
    calculateDurationYears: (startDate, endDate = null) => {
        const months = workExperienceHelpers.calculateDurationMonths(startDate, endDate);
        return Math.round((months / 12) * 10) / 10; // Round to 1 decimal place
    },
    /**
     * Generate human-readable duration string
     */
    formatDuration: (startDate, endDate = null) => {
        const months = workExperienceHelpers.calculateDurationMonths(startDate, endDate);
        if (months < 1) {
            return 'Less than 1 month';
        }
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        if (years === 0) {
            return `${months} month${months === 1 ? '' : 's'}`;
        }
        if (remainingMonths === 0) {
            return `${years} year${years === 1 ? '' : 's'}`;
        }
        return `${years} year${years === 1 ? '' : 's'} ${remainingMonths} month${remainingMonths === 1 ? '' : 's'}`;
    },
    /**
     * Calculate total experience years across all work experience entries
     */
    calculateTotalExperience: (experiences) => {
        const totalMonths = experiences.reduce((total, exp) => {
            return total + workExperienceHelpers.calculateDurationMonths(new Date(exp.startDate), exp.endDate ? new Date(exp.endDate) : null);
        }, 0);
        return Math.round((totalMonths / 12) * 10) / 10; // Round to 1 decimal place
    },
    /**
     * Sort work experience entries by start date (most recent first) or sort order
     */
    sortExperiences: (experiences, sortBy = 'sortOrder') => {
        return [...experiences].sort((a, b) => {
            if (sortBy === 'sortOrder') {
                return a.sortOrder - b.sortOrder;
            }
            else {
                // Sort by start date, most recent first
                const aDate = new Date(a.startDate);
                const bDate = new Date(b.startDate);
                return bDate.getTime() - aDate.getTime();
            }
        });
    },
    /**
     * Add duration calculations to work experience entries
     */
    withDurationCalculations: (experiences) => {
        const sorted = workExperienceHelpers.sortExperiences(experiences, 'date');
        return experiences.map((exp, index) => {
            const startDate = new Date(exp.startDate);
            const endDate = exp.endDate ? new Date(exp.endDate) : null;
            return {
                ...exp,
                durationMonths: workExperienceHelpers.calculateDurationMonths(startDate, endDate),
                durationYears: workExperienceHelpers.calculateDurationYears(startDate, endDate),
                durationDisplay: workExperienceHelpers.formatDuration(startDate, endDate),
                isMostRecent: index === 0 && sorted[0].id === exp.id,
            };
        });
    },
    /**
     * Generate next sort order for a new work experience entry
     */
    getNextSortOrder: (existingExperiences) => {
        if (existingExperiences.length === 0)
            return 1;
        const maxSortOrder = Math.max(...existingExperiences.map(exp => exp.sortOrder || 0));
        return maxSortOrder + 1;
    },
    /**
     * Validate skills array format and content
     */
    validateSkills: (skills) => {
        const errors = [];
        skills.forEach((skill, index) => {
            if (skill.length < 2) {
                errors.push(`Skill ${index + 1} must be at least 2 characters`);
            }
            if (skill.length > 100) {
                errors.push(`Skill ${index + 1} must not exceed 100 characters`);
            }
            if (skill.trim() === '') {
                errors.push(`Skill ${index + 1} cannot be empty`);
            }
        });
        // Check for duplicates
        const uniqueSkills = new Set(skills.map(s => s.toLowerCase().trim()));
        if (uniqueSkills.size !== skills.length) {
            errors.push('Skills must be unique');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    },
    /**
     * Check if work experience is sufficient for profile completion
     */
    isExperienceSufficientForCompletion: (experiences) => {
        // At least one work experience entry with description and some details
        return experiences.some(exp => exp.jobTitle.length >= 2 &&
            exp.companyName.length >= 2 &&
            exp.description.length >= 10);
    },
    /**
     * Extract all unique skills from work experience entries
     */
    extractAllSkills: (experiences) => {
        const allSkills = experiences
            .flatMap(exp => exp.skills || [])
            .filter(skill => skill && skill.trim().length > 0);
        // Return unique skills, case-insensitive
        const uniqueSkills = Array.from(new Set(allSkills.map(skill => skill.trim().toLowerCase())));
        // Return with original casing
        return uniqueSkills.map(uniqueSkill => {
            const original = allSkills.find(skill => skill.trim().toLowerCase() === uniqueSkill);
            return original || uniqueSkill;
        });
    },
    /**
     * Format date for display
     */
    formatDate: (date, format = 'short') => {
        const d = typeof date === 'string' ? new Date(date) : date;
        if (format === 'long') {
            return d.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short'
        });
    },
    /**
     * Format date range for display
     */
    formatDateRange: (startDate, endDate, isCurrent = false) => {
        const start = workExperienceHelpers.formatDate(startDate);
        if (isCurrent || !endDate) {
            return `${start} - Present`;
        }
        const end = workExperienceHelpers.formatDate(endDate);
        return `${start} - ${end}`;
    },
};
/**
 * Database query helpers
 */
export const workExperienceQueries = {
    /**
     * Common select fields for work experience queries
     */
    selectFields: {
        id: workExperience.id,
        profileId: workExperience.profileId,
        jobTitle: workExperience.jobTitle,
        companyName: workExperience.companyName,
        companyWebsite: workExperience.companyWebsite,
        location: workExperience.location,
        startDate: workExperience.startDate,
        endDate: workExperience.endDate,
        isCurrent: workExperience.isCurrent,
        description: workExperience.description,
        achievements: workExperience.achievements,
        skills: workExperience.skills,
        sortOrder: workExperience.sortOrder,
        createdAt: workExperience.createdAt,
        updatedAt: workExperience.updatedAt,
    },
    /**
     * Select fields for public work experience display (excluding sensitive data)
     */
    publicSelectFields: {
        id: workExperience.id,
        jobTitle: workExperience.jobTitle,
        companyName: workExperience.companyName,
        companyWebsite: workExperience.companyWebsite,
        location: workExperience.location,
        startDate: workExperience.startDate,
        endDate: workExperience.endDate,
        isCurrent: workExperience.isCurrent,
        description: workExperience.description,
        achievements: workExperience.achievements,
        skills: workExperience.skills,
        sortOrder: workExperience.sortOrder,
    },
};
/**
 * Export the table and all related types/helpers
 */
export default workExperience;
//# sourceMappingURL=work-experience.js.map