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
import { z } from 'zod';
export type AchievementsArray = string[];
export type SkillsArray = string[];
/**
 * WorkExperience table schema
 *
 * Stores professional work history with detailed achievements tracking
 * and comprehensive timeline validation. Emphasizes measurable achievements
 * vs general responsibilities (FR-011).
 */
export declare const workExperience: any;
/**
 * Relations for WorkExperience
 */
export declare const workExperienceRelations: any;
export declare const insertWorkExperienceSchema: any;
export declare const selectWorkExperienceSchema: any;
export declare const updateWorkExperienceSchema: any;
/**
 * TypeScript types derived from schemas
 */
export type InsertWorkExperience = z.infer<typeof insertWorkExperienceSchema>;
export type SelectWorkExperience = z.infer<typeof selectWorkExperienceSchema>;
export type UpdateWorkExperience = z.infer<typeof updateWorkExperienceSchema>;
/**
 * Extended types with computed fields
 */
export type WorkExperienceWithDuration = SelectWorkExperience & {
    /**
     * Duration in months (calculated from start_date to end_date or current date)
     */
    durationMonths: number;
    /**
     * Duration in years (rounded to 1 decimal place)
     */
    durationYears: number;
    /**
     * Human-readable duration string (e.g., "2 years 3 months")
     */
    durationDisplay: string;
    /**
     * Whether this is the most recent position
     */
    isMostRecent: boolean;
};
/**
 * Timeline validation helpers
 */
export declare const workExperienceHelpers: {
    /**
     * Validate timeline (start <= end, current job logic)
     */
    validateTimeline: (startDate: Date, endDate: Date | null, isCurrent: boolean) => {
        valid: boolean;
        errors: string[];
    };
    /**
     * Validate achievements array (10-500 chars each, max 20)
     */
    validateAchievements: (achievements: string[]) => {
        valid: boolean;
        errors: string[];
    };
    /**
     * Calculate duration in months from start date to end date (or current date)
     */
    calculateDurationMonths: (startDate: Date, endDate?: Date | null) => number;
    /**
     * Calculate duration in years (rounded to 1 decimal place)
     */
    calculateDurationYears: (startDate: Date, endDate?: Date | null) => number;
    /**
     * Generate human-readable duration string
     */
    formatDuration: (startDate: Date, endDate?: Date | null) => string;
    /**
     * Calculate total experience years across all work experience entries
     */
    calculateTotalExperience: (experiences: SelectWorkExperience[]) => number;
    /**
     * Sort work experience entries by start date (most recent first) or sort order
     */
    sortExperiences: (experiences: SelectWorkExperience[], sortBy?: "date" | "sortOrder") => SelectWorkExperience[];
    /**
     * Add duration calculations to work experience entries
     */
    withDurationCalculations: (experiences: SelectWorkExperience[]) => WorkExperienceWithDuration[];
    /**
     * Generate next sort order for a new work experience entry
     */
    getNextSortOrder: (existingExperiences: SelectWorkExperience[]) => number;
    /**
     * Validate skills array format and content
     */
    validateSkills: (skills: string[]) => {
        valid: boolean;
        errors: string[];
    };
    /**
     * Check if work experience is sufficient for profile completion
     */
    isExperienceSufficientForCompletion: (experiences: SelectWorkExperience[]) => boolean;
    /**
     * Extract all unique skills from work experience entries
     */
    extractAllSkills: (experiences: SelectWorkExperience[]) => string[];
    /**
     * Format date for display
     */
    formatDate: (date: Date | string, format?: "short" | "long") => string;
    /**
     * Format date range for display
     */
    formatDateRange: (startDate: Date | string, endDate: Date | string | null, isCurrent?: boolean) => string;
};
/**
 * Database query helpers
 */
export declare const workExperienceQueries: {
    /**
     * Common select fields for work experience queries
     */
    selectFields: {
        id: any;
        profileId: any;
        jobTitle: any;
        companyName: any;
        companyWebsite: any;
        location: any;
        startDate: any;
        endDate: any;
        isCurrent: any;
        description: any;
        achievements: any;
        skills: any;
        sortOrder: any;
        createdAt: any;
        updatedAt: any;
    };
    /**
     * Select fields for public work experience display (excluding sensitive data)
     */
    publicSelectFields: {
        id: any;
        jobTitle: any;
        companyName: any;
        companyWebsite: any;
        location: any;
        startDate: any;
        endDate: any;
        isCurrent: any;
        description: any;
        achievements: any;
        skills: any;
        sortOrder: any;
    };
};
/**
 * Export the table and all related types/helpers
 */
export default workExperience;
//# sourceMappingURL=work-experience.d.ts.map