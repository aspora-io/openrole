/**
 * Education Drizzle ORM Model
 *
 * Educational background and qualifications for candidate profiles.
 * Based on migration 004-education.sql and data-model.md specifications.
 *
 * Features:
 * - Comprehensive education timeline tracking with overlap detection
 * - Institution and degree information with validation
 * - Academic details including grades and achievements
 * - Smart sort ordering with automatic timeline organization
 * - Education level hierarchy (Certificate → PhD)
 * - Duration calculations and status tracking
 * - Data quality warnings for overlapping education periods
 *
 * @author OpenRole Team
 * @date 2025-09-30
 */
import { pgTable, uuid, varchar, text, integer, boolean, date, timestamp, index, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { candidateProfiles } from './candidate-profile';
/**
 * Education table schema
 *
 * Stores educational background and qualifications with comprehensive
 * timeline validation and academic achievement tracking.
 */
export const education = pgTable('education', {
    // Primary Key
    id: uuid('id')
        .primaryKey()
        .default(sql `uuid_generate_v4()`),
    // Foreign Key to candidate_profiles table
    profileId: uuid('profile_id')
        .notNull()
        .references(() => candidateProfiles.id, { onDelete: 'cascade' }),
    // Institution Details
    institutionName: varchar('institution_name', { length: 200 })
        .notNull(),
    degree: varchar('degree', { length: 200 })
        .notNull(),
    fieldOfStudy: varchar('field_of_study', { length: 200 })
        .notNull(),
    location: varchar('location', { length: 255 }),
    // Timeline
    startDate: date('start_date')
        .notNull(),
    endDate: date('end_date'),
    isOngoing: boolean('is_ongoing')
        .notNull()
        .default(false),
    // Academic Details
    grade: varchar('grade', { length: 100 }),
    description: text('description'),
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
        profileIdIdx: index('idx_education_profile_id').on(table.profileId),
        startDateIdx: index('idx_education_start_date').on(table.startDate),
        ongoingIdx: index('idx_education_ongoing').on(table.isOngoing),
        sortOrderIdx: index('idx_education_sort_order').on(table.profileId, table.sortOrder),
        institutionIdx: index('idx_education_institution').on(table.institutionName),
        degreeIdx: index('idx_education_degree').on(table.degree),
        fieldIdx: index('idx_education_field').on(table.fieldOfStudy),
        // Check constraints (these should be handled by database migration)
        institutionNameLength: check('institution_name_length', sql `char_length(${table.institutionName}) >= 2`),
        degreeLength: check('degree_length', sql `char_length(${table.degree}) >= 2`),
        fieldOfStudyLength: check('field_of_study_length', sql `char_length(${table.fieldOfStudy}) >= 2`),
        descriptionLength: check('description_length', sql `char_length(${table.description}) <= 1000`),
        dateRangeValid: check('education_date_range_valid', sql `${table.endDate} IS NULL OR ${table.endDate} >= ${table.startDate}`),
        startDateReasonable: check('education_start_date_reasonable', sql `${table.startDate} >= '1950-01-01' AND ${table.startDate} <= CURRENT_DATE + INTERVAL '10 years'`),
        ongoingNoEndDate: check('education_ongoing_no_end_date', sql `NOT ${table.isOngoing} OR ${table.endDate} IS NULL`),
    };
});
/**
 * Relations for Education
 */
export const educationRelations = relations(education, ({ one }) => ({
    // Relation to candidate_profiles table
    candidateProfile: one(candidateProfiles, {
        fields: [education.profileId],
        references: [candidateProfiles.id],
    }),
}));
/**
 * Education level hierarchy for ranking degrees
 */
export const EducationLevel = {
    CERTIFICATE: 'Certificate',
    DIPLOMA: 'Diploma',
    ASSOCIATE: 'Associate',
    BACHELOR: 'Bachelor',
    MASTER: 'Master',
    MBA: 'MBA',
    PHD: 'PhD',
    DOCTORATE: 'Doctorate'
};
/**
 * Education level hierarchy array for comparison
 */
export const EDUCATION_HIERARCHY = [
    EducationLevel.CERTIFICATE,
    EducationLevel.DIPLOMA,
    EducationLevel.ASSOCIATE,
    EducationLevel.BACHELOR,
    EducationLevel.MASTER,
    EducationLevel.MBA,
    EducationLevel.PHD,
    EducationLevel.DOCTORATE
];
/**
 * Zod validation schemas
 */
// Base validation schema for education fields
const educationValidation = {
    institutionName: z.string()
        .min(2, 'Institution name must be at least 2 characters')
        .max(200, 'Institution name must not exceed 200 characters'),
    degree: z.string()
        .min(2, 'Degree must be at least 2 characters')
        .max(200, 'Degree must not exceed 200 characters'),
    fieldOfStudy: z.string()
        .min(2, 'Field of study must be at least 2 characters')
        .max(200, 'Field of study must not exceed 200 characters'),
    location: z.string()
        .max(255, 'Location must not exceed 255 characters')
        .optional(),
    startDate: z.date()
        .refine((date) => {
        const minDate = new Date('1950-01-01');
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() + 10);
        return date >= minDate && date <= maxDate;
    }, 'Start date must be between 1950 and 10 years from now'),
    endDate: z.date().optional(),
    isOngoing: z.boolean().default(false),
    grade: z.string()
        .max(100, 'Grade must not exceed 100 characters')
        .optional(),
    description: z.string()
        .max(1000, 'Description must not exceed 1000 characters')
        .optional(),
    sortOrder: z.number()
        .int('Sort order must be an integer')
        .min(0, 'Sort order cannot be negative')
        .default(0),
};
// Insert schema - for creating new education entries
export const insertEducationSchema = createInsertSchema(education, educationValidation)
    .refine((data) => {
    // If ongoing, end date must be null
    if (data.isOngoing && data.endDate) {
        return false;
    }
    // If not ongoing and end date is provided, it must be after start date
    if (!data.isOngoing && data.endDate && data.startDate) {
        return data.endDate >= data.startDate;
    }
    return true;
}, {
    message: 'End date must be after start date, and ongoing education cannot have an end date',
    path: ['endDate'],
});
// Select schema - for querying education entries
export const selectEducationSchema = createSelectSchema(education);
// Update schema - for updating existing education entries (all fields optional except id)
export const updateEducationSchema = createSelectSchema(education, {
    ...educationValidation,
    id: z.string().uuid(),
}).partial().required({ id: true })
    .refine((data) => {
    // If ongoing, end date must be null
    if (data.isOngoing && data.endDate) {
        return false;
    }
    // If not ongoing and end date is provided, it must be after start date
    if (!data.isOngoing && data.endDate && data.startDate) {
        return data.endDate >= data.startDate;
    }
    return true;
}, {
    message: 'End date must be after start date, and ongoing education cannot have an end date',
    path: ['endDate'],
});
/**
 * Education validation and utility helpers
 */
export const educationHelpers = {
    /**
     * Validate education timeline constraints
     */
    validateTimeline: (startDate, endDate, isOngoing) => {
        const errors = [];
        // Check start date is not in the future (beyond reasonable planning)
        const maxStartDate = new Date();
        maxStartDate.setFullYear(maxStartDate.getFullYear() + 10);
        if (startDate > maxStartDate) {
            errors.push('Start date cannot be more than 10 years in the future');
        }
        // Check start date is not too far in the past
        const minStartDate = new Date('1950-01-01');
        if (startDate < minStartDate) {
            errors.push('Start date cannot be before 1950');
        }
        // If ongoing, end date must be null
        if (isOngoing && endDate) {
            errors.push('Ongoing education cannot have an end date');
        }
        // If end date is provided, it must be after start date
        if (endDate && endDate < startDate) {
            errors.push('End date must be after start date');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    },
    /**
     * Calculate duration from start and end dates
     */
    calculateDuration: (startDate, endDate, isOngoing) => {
        const end = endDate || new Date();
        const diffTime = Math.abs(end.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const months = Math.round(diffDays / 30.44); // Average days per month
        const years = Math.round((months / 12) * 10) / 10; // Round to 1 decimal place
        return { months, years };
    },
    /**
     * Get education status based on dates and ongoing flag
     */
    getStatus: (endDate, isOngoing) => {
        if (isOngoing)
            return 'Ongoing';
        if (endDate)
            return 'Completed';
        return 'Unknown';
    },
    /**
     * Get education level rank from hierarchy
     */
    getEducationLevelRank: (degree) => {
        // Try exact match first
        const exactMatch = EDUCATION_HIERARCHY.findIndex(level => degree.toLowerCase() === level.toLowerCase());
        if (exactMatch !== -1)
            return exactMatch;
        // Try partial match
        for (let i = EDUCATION_HIERARCHY.length - 1; i >= 0; i--) {
            const hierarchyLevel = EDUCATION_HIERARCHY[i];
            if (hierarchyLevel && degree.toLowerCase().includes(hierarchyLevel.toLowerCase())) {
                return i;
            }
        }
        return -1; // Not found
    },
    /**
     * Get standardized education level
     */
    getStandardizedLevel: (degree) => {
        const rank = educationHelpers.getEducationLevelRank(degree);
        if (rank >= 0 && rank < EDUCATION_HIERARCHY.length) {
            return EDUCATION_HIERARCHY[rank];
        }
        return 'Not specified';
    },
    /**
     * Get highest education level from a list of education entries
     */
    getHighestEducationLevel: (educationList) => {
        let highestRank = -1;
        for (const edu of educationList) {
            const rank = educationHelpers.getEducationLevelRank(edu.degree);
            if (rank > highestRank) {
                highestRank = rank;
            }
        }
        if (highestRank >= 0 && highestRank < EDUCATION_HIERARCHY.length) {
            return EDUCATION_HIERARCHY[highestRank];
        }
        return 'Not specified';
    },
    /**
     * Check for overlapping education periods (for data quality warnings)
     */
    detectOverlappingEducation: (educationList, excludeId) => {
        const overlaps = [];
        const relevantEducation = educationList.filter(edu => edu.id !== excludeId);
        for (let i = 0; i < relevantEducation.length; i++) {
            for (let j = i + 1; j < relevantEducation.length; j++) {
                const edu1 = relevantEducation[i];
                const edu2 = relevantEducation[j];
                const edu1End = edu1.endDate || new Date();
                const edu2End = edu2.endDate || new Date();
                // Check for overlaps
                const edu1Start = new Date(edu1.startDate);
                const edu2Start = new Date(edu2.startDate);
                const overlap = educationHelpers.checkDateOverlap(edu1Start, edu1End, edu2Start, edu2End);
                if (overlap.hasOverlap) {
                    overlaps.push({
                        education1: edu1,
                        education2: edu2,
                        overlapType: overlap.type
                    });
                }
            }
        }
        return overlaps;
    },
    /**
     * Check if two date ranges overlap
     */
    checkDateOverlap: (start1, end1, start2, end2) => {
        // Convert to timestamps for comparison
        const s1 = start1.getTime();
        const e1 = end1.getTime();
        const s2 = start2.getTime();
        const e2 = end2.getTime();
        // No overlap
        if (e1 < s2 || e2 < s1) {
            return { hasOverlap: false, type: 'partial' };
        }
        // Complete overlap (same dates)
        if (s1 === s2 && e1 === e2) {
            return { hasOverlap: true, type: 'complete' };
        }
        // One contains the other
        if ((s1 <= s2 && e1 >= e2) || (s2 <= s1 && e2 >= e1)) {
            return { hasOverlap: true, type: 'contains' };
        }
        // Partial overlap
        return { hasOverlap: true, type: 'partial' };
    },
    /**
     * Calculate total education duration (sum of all education periods)
     */
    calculateTotalEducationYears: (educationList) => {
        let totalMonths = 0;
        for (const edu of educationList) {
            const duration = educationHelpers.calculateDuration(new Date(edu.startDate), edu.endDate ? new Date(edu.endDate) : null, edu.isOngoing);
            totalMonths += duration.months;
        }
        return Math.round((totalMonths / 12) * 10) / 10; // Round to 1 decimal place
    },
    /**
     * Enhance education entry with calculated fields
     */
    enhanceWithCalculatedFields: (edu) => {
        const duration = educationHelpers.calculateDuration(new Date(edu.startDate), edu.endDate ? new Date(edu.endDate) : null, edu.isOngoing);
        const status = educationHelpers.getStatus(edu.endDate, edu.isOngoing);
        const levelRank = educationHelpers.getEducationLevelRank(edu.degree);
        const standardizedLevel = educationHelpers.getStandardizedLevel(edu.degree);
        return {
            ...edu,
            durationMonths: duration.months,
            durationYears: duration.years,
            status,
            levelRank,
            standardizedLevel
        };
    },
    /**
     * Sort education entries by date (most recent first) and level
     */
    sortEducationEntries: (educationList) => {
        return [...educationList].sort((a, b) => {
            // First sort by sort_order if both have values
            const aSortOrder = a.sortOrder || 0;
            const bSortOrder = b.sortOrder || 0;
            if (aSortOrder !== 0 && bSortOrder !== 0 && aSortOrder !== bSortOrder) {
                return aSortOrder - bSortOrder;
            }
            // Then by start date (most recent first)
            const aStart = new Date(a.startDate).getTime();
            const bStart = new Date(b.startDate).getTime();
            if (aStart !== bStart) {
                return bStart - aStart;
            }
            // Then by education level (highest first)
            const aRank = educationHelpers.getEducationLevelRank(a.degree);
            const bRank = educationHelpers.getEducationLevelRank(b.degree);
            return bRank - aRank;
        });
    },
    /**
     * Generate suggested sort order for new education entry
     */
    generateSortOrder: (existingEducation) => {
        if (existingEducation.length === 0)
            return 1;
        const sortOrders = existingEducation.map(edu => edu.sortOrder || 0);
        const maxOrder = Math.max(...sortOrders);
        return maxOrder + 1;
    }
};
/**
 * Database query helpers
 */
export const educationQueries = {
    /**
     * Common select fields for education queries
     */
    selectFields: {
        id: education.id,
        profileId: education.profileId,
        institutionName: education.institutionName,
        degree: education.degree,
        fieldOfStudy: education.fieldOfStudy,
        location: education.location,
        startDate: education.startDate,
        endDate: education.endDate,
        isOngoing: education.isOngoing,
        grade: education.grade,
        description: education.description,
        sortOrder: education.sortOrder,
        createdAt: education.createdAt,
        updatedAt: education.updatedAt,
    },
    /**
     * Order by clause for education entries (most recent first)
     */
    defaultOrderBy: [
        sql `${education.sortOrder} ASC`,
        sql `${education.startDate} DESC`,
        sql `${education.createdAt} DESC`
    ],
    /**
     * Where clause for active education (non-archived)
     */
    activeEducationWhere: sql `TRUE`, // Placeholder - education doesn't have archived status
    /**
     * Where clause for ongoing education
     */
    ongoingEducationWhere: sql `${education.isOngoing} = true`,
    /**
     * Where clause for completed education
     */
    completedEducationWhere: sql `${education.isOngoing} = false AND ${education.endDate} IS NOT NULL`,
};
/**
 * Common education queries for specific use cases
 */
export const educationCommonQueries = {
    /**
     * Get education summary for profile completion calculation
     */
    getEducationSummary: (profileId) => ({
        where: sql `${education.profileId} = ${profileId}`,
        select: {
            count: sql `COUNT(*)`,
            hasOngoing: sql `BOOL_OR(${education.isOngoing})`,
            highestLevel: sql `
        CASE 
          WHEN MAX(
            CASE 
              WHEN LOWER(${education.degree}) LIKE '%doctorate%' OR LOWER(${education.degree}) LIKE '%phd%' THEN 7
              WHEN LOWER(${education.degree}) LIKE '%mba%' THEN 6
              WHEN LOWER(${education.degree}) LIKE '%master%' THEN 5
              WHEN LOWER(${education.degree}) LIKE '%bachelor%' THEN 4
              WHEN LOWER(${education.degree}) LIKE '%associate%' THEN 3
              WHEN LOWER(${education.degree}) LIKE '%diploma%' THEN 2
              WHEN LOWER(${education.degree}) LIKE '%certificate%' THEN 1
              ELSE 0
            END
          ) >= 7 THEN 'Doctorate'
          WHEN MAX(
            CASE 
              WHEN LOWER(${education.degree}) LIKE '%doctorate%' OR LOWER(${education.degree}) LIKE '%phd%' THEN 7
              WHEN LOWER(${education.degree}) LIKE '%mba%' THEN 6
              WHEN LOWER(${education.degree}) LIKE '%master%' THEN 5
              WHEN LOWER(${education.degree}) LIKE '%bachelor%' THEN 4
              WHEN LOWER(${education.degree}) LIKE '%associate%' THEN 3
              WHEN LOWER(${education.degree}) LIKE '%diploma%' THEN 2
              WHEN LOWER(${education.degree}) LIKE '%certificate%' THEN 1
              ELSE 0
            END
          ) = 6 THEN 'MBA'
          WHEN MAX(
            CASE 
              WHEN LOWER(${education.degree}) LIKE '%doctorate%' OR LOWER(${education.degree}) LIKE '%phd%' THEN 7
              WHEN LOWER(${education.degree}) LIKE '%mba%' THEN 6
              WHEN LOWER(${education.degree}) LIKE '%master%' THEN 5
              WHEN LOWER(${education.degree}) LIKE '%bachelor%' THEN 4
              WHEN LOWER(${education.degree}) LIKE '%associate%' THEN 3
              WHEN LOWER(${education.degree}) LIKE '%diploma%' THEN 2
              WHEN LOWER(${education.degree}) LIKE '%certificate%' THEN 1
              ELSE 0
            END
          ) = 5 THEN 'Master'
          WHEN MAX(
            CASE 
              WHEN LOWER(${education.degree}) LIKE '%doctorate%' OR LOWER(${education.degree}) LIKE '%phd%' THEN 7
              WHEN LOWER(${education.degree}) LIKE '%mba%' THEN 6
              WHEN LOWER(${education.degree}) LIKE '%master%' THEN 5
              WHEN LOWER(${education.degree}) LIKE '%bachelor%' THEN 4
              WHEN LOWER(${education.degree}) LIKE '%associate%' THEN 3
              WHEN LOWER(${education.degree}) LIKE '%diploma%' THEN 2
              WHEN LOWER(${education.degree}) LIKE '%certificate%' THEN 1
              ELSE 0
            END
          ) = 4 THEN 'Bachelor'
          WHEN MAX(
            CASE 
              WHEN LOWER(${education.degree}) LIKE '%doctorate%' OR LOWER(${education.degree}) LIKE '%phd%' THEN 7
              WHEN LOWER(${education.degree}) LIKE '%mba%' THEN 6
              WHEN LOWER(${education.degree}) LIKE '%master%' THEN 5
              WHEN LOWER(${education.degree}) LIKE '%bachelor%' THEN 4
              WHEN LOWER(${education.degree}) LIKE '%associate%' THEN 3
              WHEN LOWER(${education.degree}) LIKE '%diploma%' THEN 2
              WHEN LOWER(${education.degree}) LIKE '%certificate%' THEN 1
              ELSE 0
            END
          ) = 3 THEN 'Associate'
          WHEN MAX(
            CASE 
              WHEN LOWER(${education.degree}) LIKE '%doctorate%' OR LOWER(${education.degree}) LIKE '%phd%' THEN 7
              WHEN LOWER(${education.degree}) LIKE '%mba%' THEN 6
              WHEN LOWER(${education.degree}) LIKE '%master%' THEN 5
              WHEN LOWER(${education.degree}) LIKE '%bachelor%' THEN 4
              WHEN LOWER(${education.degree}) LIKE '%associate%' THEN 3
              WHEN LOWER(${education.degree}) LIKE '%diploma%' THEN 2
              WHEN LOWER(${education.degree}) LIKE '%certificate%' THEN 1
              ELSE 0
            END
          ) = 2 THEN 'Diploma'
          WHEN MAX(
            CASE 
              WHEN LOWER(${education.degree}) LIKE '%doctorate%' OR LOWER(${education.degree}) LIKE '%phd%' THEN 7
              WHEN LOWER(${education.degree}) LIKE '%mba%' THEN 6
              WHEN LOWER(${education.degree}) LIKE '%master%' THEN 5
              WHEN LOWER(${education.degree}) LIKE '%bachelor%' THEN 4
              WHEN LOWER(${education.degree}) LIKE '%associate%' THEN 3
              WHEN LOWER(${education.degree}) LIKE '%diploma%' THEN 2
              WHEN LOWER(${education.degree}) LIKE '%certificate%' THEN 1
              ELSE 0
            END
          ) = 1 THEN 'Certificate'
          ELSE 'Not specified'
        END
      `,
        }
    })
};
/**
 * Export the table and all related types/helpers
 */
export default education;
//# sourceMappingURL=education.js.map