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
import { z } from 'zod';
/**
 * Education table schema
 *
 * Stores educational background and qualifications with comprehensive
 * timeline validation and academic achievement tracking.
 */
export declare const education: any;
/**
 * Relations for Education
 */
export declare const educationRelations: any;
/**
 * Education level hierarchy for ranking degrees
 */
export declare const EducationLevel: {
    readonly CERTIFICATE: "Certificate";
    readonly DIPLOMA: "Diploma";
    readonly ASSOCIATE: "Associate";
    readonly BACHELOR: "Bachelor";
    readonly MASTER: "Master";
    readonly MBA: "MBA";
    readonly PHD: "PhD";
    readonly DOCTORATE: "Doctorate";
};
export type EducationLevelType = typeof EducationLevel[keyof typeof EducationLevel];
/**
 * Education level hierarchy array for comparison
 */
export declare const EDUCATION_HIERARCHY: EducationLevelType[];
export declare const insertEducationSchema: any;
export declare const selectEducationSchema: any;
export declare const updateEducationSchema: any;
/**
 * TypeScript types derived from schemas
 */
export type InsertEducation = z.infer<typeof insertEducationSchema>;
export type SelectEducation = z.infer<typeof selectEducationSchema>;
export type UpdateEducation = z.infer<typeof updateEducationSchema>;
/**
 * Extended education type with calculated fields
 */
export type EducationWithDuration = SelectEducation & {
    /**
     * Duration in months
     */
    durationMonths: number;
    /**
     * Duration in years (rounded to 1 decimal place)
     */
    durationYears: number;
    /**
     * Status based on ongoing and end date
     */
    status: 'Ongoing' | 'Completed' | 'Unknown';
    /**
     * Education level rank (0-7, higher is better)
     */
    levelRank: number;
    /**
     * Standardized education level
     */
    standardizedLevel: EducationLevelType | 'Not specified';
};
/**
 * Education validation and utility helpers
 */
export declare const educationHelpers: {
    /**
     * Validate education timeline constraints
     */
    validateTimeline: (startDate: Date, endDate?: Date | null, isOngoing?: boolean) => {
        valid: boolean;
        errors: string[];
    };
    /**
     * Calculate duration from start and end dates
     */
    calculateDuration: (startDate: Date, endDate?: Date | null, isOngoing?: boolean) => {
        months: number;
        years: number;
    };
    /**
     * Get education status based on dates and ongoing flag
     */
    getStatus: (endDate?: Date | null, isOngoing?: boolean) => "Ongoing" | "Completed" | "Unknown";
    /**
     * Get education level rank from hierarchy
     */
    getEducationLevelRank: (degree: string) => number;
    /**
     * Get standardized education level
     */
    getStandardizedLevel: (degree: string) => EducationLevelType | "Not specified";
    /**
     * Get highest education level from a list of education entries
     */
    getHighestEducationLevel: (educationList: SelectEducation[]) => EducationLevelType | "Not specified";
    /**
     * Check for overlapping education periods (for data quality warnings)
     */
    detectOverlappingEducation: (educationList: SelectEducation[], excludeId?: string) => Array<{
        education1: SelectEducation;
        education2: SelectEducation;
        overlapType: "partial" | "complete" | "contains";
    }>;
    /**
     * Check if two date ranges overlap
     */
    checkDateOverlap: (start1: Date, end1: Date, start2: Date, end2: Date) => {
        hasOverlap: boolean;
        type: "partial" | "complete" | "contains";
    };
    /**
     * Calculate total education duration (sum of all education periods)
     */
    calculateTotalEducationYears: (educationList: SelectEducation[]) => number;
    /**
     * Enhance education entry with calculated fields
     */
    enhanceWithCalculatedFields: (edu: SelectEducation) => EducationWithDuration;
    /**
     * Sort education entries by date (most recent first) and level
     */
    sortEducationEntries: (educationList: SelectEducation[]) => SelectEducation[];
    /**
     * Generate suggested sort order for new education entry
     */
    generateSortOrder: (existingEducation: SelectEducation[]) => number;
};
/**
 * Database query helpers
 */
export declare const educationQueries: {
    /**
     * Common select fields for education queries
     */
    selectFields: {
        id: any;
        profileId: any;
        institutionName: any;
        degree: any;
        fieldOfStudy: any;
        location: any;
        startDate: any;
        endDate: any;
        isOngoing: any;
        grade: any;
        description: any;
        sortOrder: any;
        createdAt: any;
        updatedAt: any;
    };
    /**
     * Order by clause for education entries (most recent first)
     */
    defaultOrderBy: any[];
    /**
     * Where clause for active education (non-archived)
     */
    activeEducationWhere: any;
    /**
     * Where clause for ongoing education
     */
    ongoingEducationWhere: any;
    /**
     * Where clause for completed education
     */
    completedEducationWhere: any;
};
/**
 * Common education queries for specific use cases
 */
export declare const educationCommonQueries: {
    /**
     * Get education summary for profile completion calculation
     */
    getEducationSummary: (profileId: string) => {
        where: any;
        select: {
            count: any;
            hasOngoing: any;
            highestLevel: any;
        };
    };
};
/**
 * Export the table and all related types/helpers
 */
export default education;
//# sourceMappingURL=education.d.ts.map