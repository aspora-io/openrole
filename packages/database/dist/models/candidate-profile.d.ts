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
import { z } from 'zod';
export type SkillsArray = string[];
export type IndustriesArray = string[];
export declare const RemotePreference: {
    readonly REMOTE: "remote";
    readonly HYBRID: "hybrid";
    readonly OFFICE: "office";
};
export declare const PrivacyLevel: {
    readonly PUBLIC: "public";
    readonly SEMI_PRIVATE: "semi-private";
    readonly ANONYMOUS: "anonymous";
};
export type RemotePreferenceType = typeof RemotePreference[keyof typeof RemotePreference];
export type PrivacyLevelType = typeof PrivacyLevel[keyof typeof PrivacyLevel];
/**
 * CandidateProfile table schema
 *
 * Stores extended professional profile information for job seekers with
 * comprehensive privacy controls and verification status tracking.
 */
export declare const candidateProfiles: any;
/**
 * Relations for CandidateProfile
 */
export declare const candidateProfilesRelations: any;
export declare const insertCandidateProfileSchema: any;
export declare const selectCandidateProfileSchema: any;
export declare const updateCandidateProfileSchema: any;
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
export declare const candidateProfileHelpers: {
    /**
     * Calculate verified badge status
     */
    calculateVerifiedBadge: (profile: SelectCandidateProfile) => boolean;
    /**
     * Calculate profile completion percentage
     */
    calculateCompletionPercentage: (profile: SelectCandidateProfile) => number;
    /**
     * Check if profile meets completion criteria
     */
    isProfileComplete: (profile: SelectCandidateProfile) => boolean;
    /**
     * Generate display name based on privacy settings
     */
    getDisplayName: (profile: SelectCandidateProfile, userFirstName?: string, userLastName?: string) => string;
    /**
     * Get masked contact information based on privacy settings
     */
    getMaskedContactInfo: (profile: SelectCandidateProfile, userEmail?: string) => CandidateProfileWithComputed["maskedContactInfo"];
    /**
     * Validate skill format and content
     */
    validateSkills: (skills: string[]) => {
        valid: boolean;
        errors: string[];
    };
    /**
     * Validate URL format
     */
    validateUrl: (url: string | null | undefined, fieldName: string) => {
        valid: boolean;
        error?: string;
    };
};
/**
 * Database query helpers
 */
export declare const candidateProfileQueries: {
    /**
     * Common select fields for public profiles
     */
    publicSelectFields: {
        id: any;
        headline: any;
        summary: any;
        location: any;
        experienceYears: any;
        skills: any;
        industries: any;
        remotePreference: any;
        privacyLevel: any;
        emailVerified: any;
        profileComplete: any;
        idVerified: any;
        profileViews: any;
        lastActiveAt: any;
        createdAt: any;
    };
    /**
     * Privacy-filtered fields based on profile privacy level
     */
    getSelectFieldsByPrivacy: (privacyLevel: PrivacyLevelType) => {
        id: any;
        headline: any;
        summary: any;
        location: any;
        experienceYears: any;
        skills: any;
        industries: any;
        remotePreference: any;
        privacyLevel: any;
        emailVerified: any;
        profileComplete: any;
        idVerified: any;
        profileViews: any;
        lastActiveAt: any;
        createdAt: any;
    } | {
        portfolioUrl: any;
        linkedinUrl: any;
        githubUrl: any;
        salaryExpectationMin: any;
        salaryExpectationMax: any;
        id: any;
        headline: any;
        summary: any;
        location: any;
        experienceYears: any;
        skills: any;
        industries: any;
        remotePreference: any;
        privacyLevel: any;
        emailVerified: any;
        profileComplete: any;
        idVerified: any;
        profileViews: any;
        lastActiveAt: any;
        createdAt: any;
    } | {
        portfolioUrl: any;
        linkedinUrl: any;
        githubUrl: any;
        id: any;
        headline: any;
        summary: any;
        location: any;
        experienceYears: any;
        skills: any;
        industries: any;
        remotePreference: any;
        privacyLevel: any;
        emailVerified: any;
        profileComplete: any;
        idVerified: any;
        profileViews: any;
        lastActiveAt: any;
        createdAt: any;
    };
};
/**
 * Export the table and all related types/helpers
 */
export default candidateProfiles;
//# sourceMappingURL=candidate-profile.d.ts.map