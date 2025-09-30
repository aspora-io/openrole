/**
 * Profile Validation Schemas
 *
 * Comprehensive Zod validation schemas for OpenRole CV & Profile Tools
 * Based on OpenAPI contracts (profile-api.yaml) and data model specifications
 *
 * @author OpenRole.net
 * @version 1.0.0
 */
import { z } from 'zod';
/**
 * UUID validation with custom error message
 */
export declare const uuidSchema: z.ZodString;
/**
 * Email validation with comprehensive format checking
 */
export declare const emailSchema: z.ZodString;
/**
 * Phone number validation (international format)
 */
export declare const phoneSchema: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
/**
 * URL validation with protocol requirement
 */
export declare const urlSchema: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
/**
 * Date string validation (YYYY-MM-DD format)
 */
export declare const dateStringSchema: z.ZodEffects<z.ZodString, string, string>;
/**
 * Future date validation (for availability dates)
 */
export declare const futureDateSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 * Past or present date validation (for experience/education dates)
 */
export declare const pastOrPresentDateSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 * Salary range validation with minimum requirement
 */
export declare const salaryRangeSchema: z.ZodEffects<z.ZodObject<{
    salaryExpectationMin: z.ZodNumber;
    salaryExpectationMax: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    salaryExpectationMin: number;
    salaryExpectationMax: number;
}, {
    salaryExpectationMin: number;
    salaryExpectationMax: number;
}>, {
    salaryExpectationMin: number;
    salaryExpectationMax: number;
}, {
    salaryExpectationMin: number;
    salaryExpectationMax: number;
}>;
/**
 * Date range validation for experience/education periods
 */
export declare const dateRangeSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    startDate: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    endDate: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>>;
    isCurrent: z.ZodOptional<z.ZodBoolean>;
    isOngoing: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    endDate?: string | null | undefined;
    isCurrent?: boolean | undefined;
    isOngoing?: boolean | undefined;
}, {
    startDate: string;
    endDate?: string | null | undefined;
    isCurrent?: boolean | undefined;
    isOngoing?: boolean | undefined;
}>, {
    startDate: string;
    endDate?: string | null | undefined;
    isCurrent?: boolean | undefined;
    isOngoing?: boolean | undefined;
}, {
    startDate: string;
    endDate?: string | null | undefined;
    isCurrent?: boolean | undefined;
    isOngoing?: boolean | undefined;
}>, {
    startDate: string;
    endDate?: string | null | undefined;
    isCurrent?: boolean | undefined;
    isOngoing?: boolean | undefined;
}, {
    startDate: string;
    endDate?: string | null | undefined;
    isCurrent?: boolean | undefined;
    isOngoing?: boolean | undefined;
}>;
/**
 * Skills array validation (1-50 items, 2-100 chars each)
 */
export declare const skillsArraySchema: z.ZodEffects<z.ZodArray<z.ZodString, "many">, string[], string[]>;
/**
 * Industries array validation
 */
export declare const industriesArraySchema: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
/**
 * Achievements array validation for work experience
 */
export declare const achievementsArraySchema: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
/**
 * Remote work preference validation
 */
export declare const remotePreferenceSchema: z.ZodEnum<["remote", "hybrid", "office"]>;
/**
 * Privacy level validation
 */
export declare const privacyLevelSchema: z.ZodEnum<["public", "semi-private", "anonymous"]>;
/**
 * Profile creation request validation
 * Matches ProfileCreateRequest from profile-api.yaml
 */
export declare const profileCreateRequestSchema: z.ZodEffects<z.ZodObject<{
    headline: z.ZodString;
    summary: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    location: z.ZodString;
    phoneNumber: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    portfolioUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    linkedinUrl: z.ZodEffects<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>, string | undefined, string | undefined>;
    githubUrl: z.ZodEffects<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>, string | undefined, string | undefined>;
    experienceYears: z.ZodNumber;
    skills: z.ZodEffects<z.ZodArray<z.ZodString, "many">, string[], string[]>;
    industries: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    salaryExpectationMin: z.ZodNumber;
    salaryExpectationMax: z.ZodNumber;
    availableFrom: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
    willingToRelocate: z.ZodOptional<z.ZodBoolean>;
    remotePreference: z.ZodEnum<["remote", "hybrid", "office"]>;
}, "strip", z.ZodTypeAny, {
    salaryExpectationMin: number;
    salaryExpectationMax: number;
    headline: string;
    location: string;
    experienceYears: number;
    skills: string[];
    remotePreference: "remote" | "hybrid" | "office";
    summary?: string | undefined;
    phoneNumber?: string | undefined;
    portfolioUrl?: string | undefined;
    linkedinUrl?: string | undefined;
    githubUrl?: string | undefined;
    industries?: string[] | undefined;
    availableFrom?: string | undefined;
    willingToRelocate?: boolean | undefined;
}, {
    salaryExpectationMin: number;
    salaryExpectationMax: number;
    headline: string;
    location: string;
    experienceYears: number;
    skills: string[];
    remotePreference: "remote" | "hybrid" | "office";
    summary?: string | undefined;
    phoneNumber?: string | undefined;
    portfolioUrl?: string | undefined;
    linkedinUrl?: string | undefined;
    githubUrl?: string | undefined;
    industries?: string[] | undefined;
    availableFrom?: string | undefined;
    willingToRelocate?: boolean | undefined;
}>, {
    salaryExpectationMin: number;
    salaryExpectationMax: number;
    headline: string;
    location: string;
    experienceYears: number;
    skills: string[];
    remotePreference: "remote" | "hybrid" | "office";
    summary?: string | undefined;
    phoneNumber?: string | undefined;
    portfolioUrl?: string | undefined;
    linkedinUrl?: string | undefined;
    githubUrl?: string | undefined;
    industries?: string[] | undefined;
    availableFrom?: string | undefined;
    willingToRelocate?: boolean | undefined;
}, {
    salaryExpectationMin: number;
    salaryExpectationMax: number;
    headline: string;
    location: string;
    experienceYears: number;
    skills: string[];
    remotePreference: "remote" | "hybrid" | "office";
    summary?: string | undefined;
    phoneNumber?: string | undefined;
    portfolioUrl?: string | undefined;
    linkedinUrl?: string | undefined;
    githubUrl?: string | undefined;
    industries?: string[] | undefined;
    availableFrom?: string | undefined;
    willingToRelocate?: boolean | undefined;
}>;
/**
 * Profile update request validation
 * Matches ProfileUpdateRequest from profile-api.yaml
 * All fields are optional for partial updates
 */
export declare const profileUpdateRequestSchema: z.ZodEffects<z.ZodObject<{
    headline: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    phoneNumber: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    portfolioUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    linkedinUrl: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>, string | undefined, string | undefined>>;
    githubUrl: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>, string | undefined, string | undefined>>;
    experienceYears: z.ZodOptional<z.ZodNumber>;
    skills: z.ZodOptional<z.ZodEffects<z.ZodArray<z.ZodString, "many">, string[], string[]>>;
    industries: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    salaryExpectationMin: z.ZodOptional<z.ZodNumber>;
    salaryExpectationMax: z.ZodOptional<z.ZodNumber>;
    availableFrom: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
    willingToRelocate: z.ZodOptional<z.ZodBoolean>;
    remotePreference: z.ZodOptional<z.ZodEnum<["remote", "hybrid", "office"]>>;
}, "strip", z.ZodTypeAny, {
    salaryExpectationMin?: number | undefined;
    salaryExpectationMax?: number | undefined;
    headline?: string | undefined;
    summary?: string | undefined;
    location?: string | undefined;
    phoneNumber?: string | undefined;
    portfolioUrl?: string | undefined;
    linkedinUrl?: string | undefined;
    githubUrl?: string | undefined;
    experienceYears?: number | undefined;
    skills?: string[] | undefined;
    industries?: string[] | undefined;
    availableFrom?: string | undefined;
    willingToRelocate?: boolean | undefined;
    remotePreference?: "remote" | "hybrid" | "office" | undefined;
}, {
    salaryExpectationMin?: number | undefined;
    salaryExpectationMax?: number | undefined;
    headline?: string | undefined;
    summary?: string | undefined;
    location?: string | undefined;
    phoneNumber?: string | undefined;
    portfolioUrl?: string | undefined;
    linkedinUrl?: string | undefined;
    githubUrl?: string | undefined;
    experienceYears?: number | undefined;
    skills?: string[] | undefined;
    industries?: string[] | undefined;
    availableFrom?: string | undefined;
    willingToRelocate?: boolean | undefined;
    remotePreference?: "remote" | "hybrid" | "office" | undefined;
}>, {
    salaryExpectationMin?: number | undefined;
    salaryExpectationMax?: number | undefined;
    headline?: string | undefined;
    summary?: string | undefined;
    location?: string | undefined;
    phoneNumber?: string | undefined;
    portfolioUrl?: string | undefined;
    linkedinUrl?: string | undefined;
    githubUrl?: string | undefined;
    experienceYears?: number | undefined;
    skills?: string[] | undefined;
    industries?: string[] | undefined;
    availableFrom?: string | undefined;
    willingToRelocate?: boolean | undefined;
    remotePreference?: "remote" | "hybrid" | "office" | undefined;
}, {
    salaryExpectationMin?: number | undefined;
    salaryExpectationMax?: number | undefined;
    headline?: string | undefined;
    summary?: string | undefined;
    location?: string | undefined;
    phoneNumber?: string | undefined;
    portfolioUrl?: string | undefined;
    linkedinUrl?: string | undefined;
    githubUrl?: string | undefined;
    experienceYears?: number | undefined;
    skills?: string[] | undefined;
    industries?: string[] | undefined;
    availableFrom?: string | undefined;
    willingToRelocate?: boolean | undefined;
    remotePreference?: "remote" | "hybrid" | "office" | undefined;
}>;
/**
 * Privacy settings request validation
 * Matches PrivacySettingsRequest from profile-api.yaml
 */
export declare const privacySettingsRequestSchema: z.ZodEffects<z.ZodObject<{
    privacyLevel: z.ZodEnum<["public", "semi-private", "anonymous"]>;
    profileVisibleToEmployers: z.ZodBoolean;
    contactInfoVisible: z.ZodBoolean;
    salaryVisible: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    privacyLevel: "public" | "semi-private" | "anonymous";
    profileVisibleToEmployers: boolean;
    contactInfoVisible: boolean;
    salaryVisible: boolean;
}, {
    privacyLevel: "public" | "semi-private" | "anonymous";
    profileVisibleToEmployers: boolean;
    contactInfoVisible: boolean;
    salaryVisible: boolean;
}>, {
    privacyLevel: "public" | "semi-private" | "anonymous";
    profileVisibleToEmployers: boolean;
    contactInfoVisible: boolean;
    salaryVisible: boolean;
}, {
    privacyLevel: "public" | "semi-private" | "anonymous";
    profileVisibleToEmployers: boolean;
    contactInfoVisible: boolean;
    salaryVisible: boolean;
}>;
/**
 * Work experience request validation
 * Matches WorkExperienceRequest from profile-api.yaml
 */
export declare const workExperienceRequestSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    jobTitle: z.ZodString;
    companyName: z.ZodString;
    companyWebsite: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    location: z.ZodString;
    startDate: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    endDate: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>>;
    isCurrent: z.ZodBoolean;
    description: z.ZodString;
    achievements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    skills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    isCurrent: boolean;
    location: string;
    jobTitle: string;
    companyName: string;
    description: string;
    endDate?: string | null | undefined;
    skills?: string[] | undefined;
    companyWebsite?: string | undefined;
    achievements?: string[] | undefined;
    sortOrder?: number | undefined;
}, {
    startDate: string;
    isCurrent: boolean;
    location: string;
    jobTitle: string;
    companyName: string;
    description: string;
    endDate?: string | null | undefined;
    skills?: string[] | undefined;
    companyWebsite?: string | undefined;
    achievements?: string[] | undefined;
    sortOrder?: number | undefined;
}>, {
    startDate: string;
    isCurrent: boolean;
    location: string;
    jobTitle: string;
    companyName: string;
    description: string;
    endDate?: string | null | undefined;
    skills?: string[] | undefined;
    companyWebsite?: string | undefined;
    achievements?: string[] | undefined;
    sortOrder?: number | undefined;
}, {
    startDate: string;
    isCurrent: boolean;
    location: string;
    jobTitle: string;
    companyName: string;
    description: string;
    endDate?: string | null | undefined;
    skills?: string[] | undefined;
    companyWebsite?: string | undefined;
    achievements?: string[] | undefined;
    sortOrder?: number | undefined;
}>, {
    startDate: string;
    isCurrent: boolean;
    location: string;
    jobTitle: string;
    companyName: string;
    description: string;
    endDate?: string | null | undefined;
    skills?: string[] | undefined;
    companyWebsite?: string | undefined;
    achievements?: string[] | undefined;
    sortOrder?: number | undefined;
}, {
    startDate: string;
    isCurrent: boolean;
    location: string;
    jobTitle: string;
    companyName: string;
    description: string;
    endDate?: string | null | undefined;
    skills?: string[] | undefined;
    companyWebsite?: string | undefined;
    achievements?: string[] | undefined;
    sortOrder?: number | undefined;
}>;
/**
 * Education request validation
 * Matches EducationRequest from profile-api.yaml
 */
export declare const educationRequestSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    institutionName: z.ZodString;
    degree: z.ZodString;
    fieldOfStudy: z.ZodString;
    location: z.ZodString;
    startDate: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    endDate: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>>;
    isOngoing: z.ZodBoolean;
    grade: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    description: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    isOngoing: boolean;
    location: string;
    institutionName: string;
    degree: string;
    fieldOfStudy: string;
    endDate?: string | null | undefined;
    description?: string | undefined;
    sortOrder?: number | undefined;
    grade?: string | undefined;
}, {
    startDate: string;
    isOngoing: boolean;
    location: string;
    institutionName: string;
    degree: string;
    fieldOfStudy: string;
    endDate?: string | null | undefined;
    description?: string | undefined;
    sortOrder?: number | undefined;
    grade?: string | undefined;
}>, {
    startDate: string;
    isOngoing: boolean;
    location: string;
    institutionName: string;
    degree: string;
    fieldOfStudy: string;
    endDate?: string | null | undefined;
    description?: string | undefined;
    sortOrder?: number | undefined;
    grade?: string | undefined;
}, {
    startDate: string;
    isOngoing: boolean;
    location: string;
    institutionName: string;
    degree: string;
    fieldOfStudy: string;
    endDate?: string | null | undefined;
    description?: string | undefined;
    sortOrder?: number | undefined;
    grade?: string | undefined;
}>, {
    startDate: string;
    isOngoing: boolean;
    location: string;
    institutionName: string;
    degree: string;
    fieldOfStudy: string;
    endDate?: string | null | undefined;
    description?: string | undefined;
    sortOrder?: number | undefined;
    grade?: string | undefined;
}, {
    startDate: string;
    isOngoing: boolean;
    location: string;
    institutionName: string;
    degree: string;
    fieldOfStudy: string;
    endDate?: string | null | undefined;
    description?: string | undefined;
    sortOrder?: number | undefined;
    grade?: string | undefined;
}>;
/**
 * Profile search query validation for employer searches
 * Matches the query parameters from /profiles GET endpoint
 */
export declare const profileSearchQuerySchema: z.ZodEffects<z.ZodObject<{
    skills: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    location: z.ZodOptional<z.ZodString>;
    salaryMin: z.ZodOptional<z.ZodNumber>;
    salaryMax: z.ZodOptional<z.ZodNumber>;
    experienceYears: z.ZodOptional<z.ZodNumber>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    location?: string | undefined;
    experienceYears?: number | undefined;
    skills?: string | undefined;
    salaryMin?: number | undefined;
    salaryMax?: number | undefined;
}, {
    location?: string | undefined;
    experienceYears?: number | undefined;
    skills?: string | undefined;
    salaryMin?: number | undefined;
    salaryMax?: number | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>, {
    page: number;
    limit: number;
    location?: string | undefined;
    experienceYears?: number | undefined;
    skills?: string | undefined;
    salaryMin?: number | undefined;
    salaryMax?: number | undefined;
}, {
    location?: string | undefined;
    experienceYears?: number | undefined;
    skills?: string | undefined;
    salaryMin?: number | undefined;
    salaryMax?: number | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type ProfileCreateRequest = z.infer<typeof profileCreateRequestSchema>;
export type ProfileUpdateRequest = z.infer<typeof profileUpdateRequestSchema>;
export type PrivacySettingsRequest = z.infer<typeof privacySettingsRequestSchema>;
export type WorkExperienceRequest = z.infer<typeof workExperienceRequestSchema>;
export type EducationRequest = z.infer<typeof educationRequestSchema>;
export type ProfileSearchQuery = z.infer<typeof profileSearchQuerySchema>;
export type UUID = z.infer<typeof uuidSchema>;
export type Email = z.infer<typeof emailSchema>;
export type Phone = z.infer<typeof phoneSchema>;
export type URL = z.infer<typeof urlSchema>;
export type DateString = z.infer<typeof dateStringSchema>;
export type SkillsArray = z.infer<typeof skillsArraySchema>;
export type RemotePreference = z.infer<typeof remotePreferenceSchema>;
export type PrivacyLevel = z.infer<typeof privacyLevelSchema>;
/**
 * Helper function to validate profile data and return formatted errors
 */
export declare function validateProfileData<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
};
/**
 * Helper to check if a URL is accessible (for portfolio validation)
 */
export declare function validateUrlAccessibility(url: string): Promise<boolean>;
/**
 * Helper to sanitize skills array (trim, dedupe, normalize)
 */
export declare function sanitizeSkills(skills: string[]): string[];
/**
 * Helper to validate business logic across related fields
 */
export declare function validateProfileBusinessLogic(profile: Partial<ProfileCreateRequest>): {
    isValid: boolean;
    errors: string[];
};
/**
 * Collection of all profile-related schemas for easy import
 */
export declare const profileSchemas: {
    profileCreate: z.ZodEffects<z.ZodObject<{
        headline: z.ZodString;
        summary: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        location: z.ZodString;
        phoneNumber: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        portfolioUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        linkedinUrl: z.ZodEffects<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>, string | undefined, string | undefined>;
        githubUrl: z.ZodEffects<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>, string | undefined, string | undefined>;
        experienceYears: z.ZodNumber;
        skills: z.ZodEffects<z.ZodArray<z.ZodString, "many">, string[], string[]>;
        industries: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        salaryExpectationMin: z.ZodNumber;
        salaryExpectationMax: z.ZodNumber;
        availableFrom: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
        willingToRelocate: z.ZodOptional<z.ZodBoolean>;
        remotePreference: z.ZodEnum<["remote", "hybrid", "office"]>;
    }, "strip", z.ZodTypeAny, {
        salaryExpectationMin: number;
        salaryExpectationMax: number;
        headline: string;
        location: string;
        experienceYears: number;
        skills: string[];
        remotePreference: "remote" | "hybrid" | "office";
        summary?: string | undefined;
        phoneNumber?: string | undefined;
        portfolioUrl?: string | undefined;
        linkedinUrl?: string | undefined;
        githubUrl?: string | undefined;
        industries?: string[] | undefined;
        availableFrom?: string | undefined;
        willingToRelocate?: boolean | undefined;
    }, {
        salaryExpectationMin: number;
        salaryExpectationMax: number;
        headline: string;
        location: string;
        experienceYears: number;
        skills: string[];
        remotePreference: "remote" | "hybrid" | "office";
        summary?: string | undefined;
        phoneNumber?: string | undefined;
        portfolioUrl?: string | undefined;
        linkedinUrl?: string | undefined;
        githubUrl?: string | undefined;
        industries?: string[] | undefined;
        availableFrom?: string | undefined;
        willingToRelocate?: boolean | undefined;
    }>, {
        salaryExpectationMin: number;
        salaryExpectationMax: number;
        headline: string;
        location: string;
        experienceYears: number;
        skills: string[];
        remotePreference: "remote" | "hybrid" | "office";
        summary?: string | undefined;
        phoneNumber?: string | undefined;
        portfolioUrl?: string | undefined;
        linkedinUrl?: string | undefined;
        githubUrl?: string | undefined;
        industries?: string[] | undefined;
        availableFrom?: string | undefined;
        willingToRelocate?: boolean | undefined;
    }, {
        salaryExpectationMin: number;
        salaryExpectationMax: number;
        headline: string;
        location: string;
        experienceYears: number;
        skills: string[];
        remotePreference: "remote" | "hybrid" | "office";
        summary?: string | undefined;
        phoneNumber?: string | undefined;
        portfolioUrl?: string | undefined;
        linkedinUrl?: string | undefined;
        githubUrl?: string | undefined;
        industries?: string[] | undefined;
        availableFrom?: string | undefined;
        willingToRelocate?: boolean | undefined;
    }>;
    profileUpdate: z.ZodEffects<z.ZodObject<{
        headline: z.ZodOptional<z.ZodString>;
        summary: z.ZodOptional<z.ZodString>;
        location: z.ZodOptional<z.ZodString>;
        phoneNumber: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        portfolioUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        linkedinUrl: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>, string | undefined, string | undefined>>;
        githubUrl: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>, string | undefined, string | undefined>>;
        experienceYears: z.ZodOptional<z.ZodNumber>;
        skills: z.ZodOptional<z.ZodEffects<z.ZodArray<z.ZodString, "many">, string[], string[]>>;
        industries: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        salaryExpectationMin: z.ZodOptional<z.ZodNumber>;
        salaryExpectationMax: z.ZodOptional<z.ZodNumber>;
        availableFrom: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
        willingToRelocate: z.ZodOptional<z.ZodBoolean>;
        remotePreference: z.ZodOptional<z.ZodEnum<["remote", "hybrid", "office"]>>;
    }, "strip", z.ZodTypeAny, {
        salaryExpectationMin?: number | undefined;
        salaryExpectationMax?: number | undefined;
        headline?: string | undefined;
        summary?: string | undefined;
        location?: string | undefined;
        phoneNumber?: string | undefined;
        portfolioUrl?: string | undefined;
        linkedinUrl?: string | undefined;
        githubUrl?: string | undefined;
        experienceYears?: number | undefined;
        skills?: string[] | undefined;
        industries?: string[] | undefined;
        availableFrom?: string | undefined;
        willingToRelocate?: boolean | undefined;
        remotePreference?: "remote" | "hybrid" | "office" | undefined;
    }, {
        salaryExpectationMin?: number | undefined;
        salaryExpectationMax?: number | undefined;
        headline?: string | undefined;
        summary?: string | undefined;
        location?: string | undefined;
        phoneNumber?: string | undefined;
        portfolioUrl?: string | undefined;
        linkedinUrl?: string | undefined;
        githubUrl?: string | undefined;
        experienceYears?: number | undefined;
        skills?: string[] | undefined;
        industries?: string[] | undefined;
        availableFrom?: string | undefined;
        willingToRelocate?: boolean | undefined;
        remotePreference?: "remote" | "hybrid" | "office" | undefined;
    }>, {
        salaryExpectationMin?: number | undefined;
        salaryExpectationMax?: number | undefined;
        headline?: string | undefined;
        summary?: string | undefined;
        location?: string | undefined;
        phoneNumber?: string | undefined;
        portfolioUrl?: string | undefined;
        linkedinUrl?: string | undefined;
        githubUrl?: string | undefined;
        experienceYears?: number | undefined;
        skills?: string[] | undefined;
        industries?: string[] | undefined;
        availableFrom?: string | undefined;
        willingToRelocate?: boolean | undefined;
        remotePreference?: "remote" | "hybrid" | "office" | undefined;
    }, {
        salaryExpectationMin?: number | undefined;
        salaryExpectationMax?: number | undefined;
        headline?: string | undefined;
        summary?: string | undefined;
        location?: string | undefined;
        phoneNumber?: string | undefined;
        portfolioUrl?: string | undefined;
        linkedinUrl?: string | undefined;
        githubUrl?: string | undefined;
        experienceYears?: number | undefined;
        skills?: string[] | undefined;
        industries?: string[] | undefined;
        availableFrom?: string | undefined;
        willingToRelocate?: boolean | undefined;
        remotePreference?: "remote" | "hybrid" | "office" | undefined;
    }>;
    privacySettings: z.ZodEffects<z.ZodObject<{
        privacyLevel: z.ZodEnum<["public", "semi-private", "anonymous"]>;
        profileVisibleToEmployers: z.ZodBoolean;
        contactInfoVisible: z.ZodBoolean;
        salaryVisible: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        privacyLevel: "public" | "semi-private" | "anonymous";
        profileVisibleToEmployers: boolean;
        contactInfoVisible: boolean;
        salaryVisible: boolean;
    }, {
        privacyLevel: "public" | "semi-private" | "anonymous";
        profileVisibleToEmployers: boolean;
        contactInfoVisible: boolean;
        salaryVisible: boolean;
    }>, {
        privacyLevel: "public" | "semi-private" | "anonymous";
        profileVisibleToEmployers: boolean;
        contactInfoVisible: boolean;
        salaryVisible: boolean;
    }, {
        privacyLevel: "public" | "semi-private" | "anonymous";
        profileVisibleToEmployers: boolean;
        contactInfoVisible: boolean;
        salaryVisible: boolean;
    }>;
    workExperience: z.ZodEffects<z.ZodEffects<z.ZodObject<{
        jobTitle: z.ZodString;
        companyName: z.ZodString;
        companyWebsite: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        location: z.ZodString;
        startDate: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
        endDate: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>>;
        isCurrent: z.ZodBoolean;
        description: z.ZodString;
        achievements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        skills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        sortOrder: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        startDate: string;
        isCurrent: boolean;
        location: string;
        jobTitle: string;
        companyName: string;
        description: string;
        endDate?: string | null | undefined;
        skills?: string[] | undefined;
        companyWebsite?: string | undefined;
        achievements?: string[] | undefined;
        sortOrder?: number | undefined;
    }, {
        startDate: string;
        isCurrent: boolean;
        location: string;
        jobTitle: string;
        companyName: string;
        description: string;
        endDate?: string | null | undefined;
        skills?: string[] | undefined;
        companyWebsite?: string | undefined;
        achievements?: string[] | undefined;
        sortOrder?: number | undefined;
    }>, {
        startDate: string;
        isCurrent: boolean;
        location: string;
        jobTitle: string;
        companyName: string;
        description: string;
        endDate?: string | null | undefined;
        skills?: string[] | undefined;
        companyWebsite?: string | undefined;
        achievements?: string[] | undefined;
        sortOrder?: number | undefined;
    }, {
        startDate: string;
        isCurrent: boolean;
        location: string;
        jobTitle: string;
        companyName: string;
        description: string;
        endDate?: string | null | undefined;
        skills?: string[] | undefined;
        companyWebsite?: string | undefined;
        achievements?: string[] | undefined;
        sortOrder?: number | undefined;
    }>, {
        startDate: string;
        isCurrent: boolean;
        location: string;
        jobTitle: string;
        companyName: string;
        description: string;
        endDate?: string | null | undefined;
        skills?: string[] | undefined;
        companyWebsite?: string | undefined;
        achievements?: string[] | undefined;
        sortOrder?: number | undefined;
    }, {
        startDate: string;
        isCurrent: boolean;
        location: string;
        jobTitle: string;
        companyName: string;
        description: string;
        endDate?: string | null | undefined;
        skills?: string[] | undefined;
        companyWebsite?: string | undefined;
        achievements?: string[] | undefined;
        sortOrder?: number | undefined;
    }>;
    education: z.ZodEffects<z.ZodEffects<z.ZodObject<{
        institutionName: z.ZodString;
        degree: z.ZodString;
        fieldOfStudy: z.ZodString;
        location: z.ZodString;
        startDate: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
        endDate: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>>;
        isOngoing: z.ZodBoolean;
        grade: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        description: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        sortOrder: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        startDate: string;
        isOngoing: boolean;
        location: string;
        institutionName: string;
        degree: string;
        fieldOfStudy: string;
        endDate?: string | null | undefined;
        description?: string | undefined;
        sortOrder?: number | undefined;
        grade?: string | undefined;
    }, {
        startDate: string;
        isOngoing: boolean;
        location: string;
        institutionName: string;
        degree: string;
        fieldOfStudy: string;
        endDate?: string | null | undefined;
        description?: string | undefined;
        sortOrder?: number | undefined;
        grade?: string | undefined;
    }>, {
        startDate: string;
        isOngoing: boolean;
        location: string;
        institutionName: string;
        degree: string;
        fieldOfStudy: string;
        endDate?: string | null | undefined;
        description?: string | undefined;
        sortOrder?: number | undefined;
        grade?: string | undefined;
    }, {
        startDate: string;
        isOngoing: boolean;
        location: string;
        institutionName: string;
        degree: string;
        fieldOfStudy: string;
        endDate?: string | null | undefined;
        description?: string | undefined;
        sortOrder?: number | undefined;
        grade?: string | undefined;
    }>, {
        startDate: string;
        isOngoing: boolean;
        location: string;
        institutionName: string;
        degree: string;
        fieldOfStudy: string;
        endDate?: string | null | undefined;
        description?: string | undefined;
        sortOrder?: number | undefined;
        grade?: string | undefined;
    }, {
        startDate: string;
        isOngoing: boolean;
        location: string;
        institutionName: string;
        degree: string;
        fieldOfStudy: string;
        endDate?: string | null | undefined;
        description?: string | undefined;
        sortOrder?: number | undefined;
        grade?: string | undefined;
    }>;
    profileSearch: z.ZodEffects<z.ZodObject<{
        skills: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
        location: z.ZodOptional<z.ZodString>;
        salaryMin: z.ZodOptional<z.ZodNumber>;
        salaryMax: z.ZodOptional<z.ZodNumber>;
        experienceYears: z.ZodOptional<z.ZodNumber>;
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        location?: string | undefined;
        experienceYears?: number | undefined;
        skills?: string | undefined;
        salaryMin?: number | undefined;
        salaryMax?: number | undefined;
    }, {
        location?: string | undefined;
        experienceYears?: number | undefined;
        skills?: string | undefined;
        salaryMin?: number | undefined;
        salaryMax?: number | undefined;
        page?: number | undefined;
        limit?: number | undefined;
    }>, {
        page: number;
        limit: number;
        location?: string | undefined;
        experienceYears?: number | undefined;
        skills?: string | undefined;
        salaryMin?: number | undefined;
        salaryMax?: number | undefined;
    }, {
        location?: string | undefined;
        experienceYears?: number | undefined;
        skills?: string | undefined;
        salaryMin?: number | undefined;
        salaryMax?: number | undefined;
        page?: number | undefined;
        limit?: number | undefined;
    }>;
    uuid: z.ZodString;
    email: z.ZodString;
    phone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    url: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    dateString: z.ZodEffects<z.ZodString, string, string>;
    futureDate: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    pastOrPresentDate: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    skills: z.ZodEffects<z.ZodArray<z.ZodString, "many">, string[], string[]>;
    industries: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    achievements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    remotePreference: z.ZodEnum<["remote", "hybrid", "office"]>;
    privacyLevel: z.ZodEnum<["public", "semi-private", "anonymous"]>;
    salaryRange: z.ZodEffects<z.ZodObject<{
        salaryExpectationMin: z.ZodNumber;
        salaryExpectationMax: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        salaryExpectationMin: number;
        salaryExpectationMax: number;
    }, {
        salaryExpectationMin: number;
        salaryExpectationMax: number;
    }>, {
        salaryExpectationMin: number;
        salaryExpectationMax: number;
    }, {
        salaryExpectationMin: number;
        salaryExpectationMax: number;
    }>;
    dateRange: z.ZodEffects<z.ZodEffects<z.ZodObject<{
        startDate: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
        endDate: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>>;
        isCurrent: z.ZodOptional<z.ZodBoolean>;
        isOngoing: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        startDate: string;
        endDate?: string | null | undefined;
        isCurrent?: boolean | undefined;
        isOngoing?: boolean | undefined;
    }, {
        startDate: string;
        endDate?: string | null | undefined;
        isCurrent?: boolean | undefined;
        isOngoing?: boolean | undefined;
    }>, {
        startDate: string;
        endDate?: string | null | undefined;
        isCurrent?: boolean | undefined;
        isOngoing?: boolean | undefined;
    }, {
        startDate: string;
        endDate?: string | null | undefined;
        isCurrent?: boolean | undefined;
        isOngoing?: boolean | undefined;
    }>, {
        startDate: string;
        endDate?: string | null | undefined;
        isCurrent?: boolean | undefined;
        isOngoing?: boolean | undefined;
    }, {
        startDate: string;
        endDate?: string | null | undefined;
        isCurrent?: boolean | undefined;
        isOngoing?: boolean | undefined;
    }>;
};
/**
 * Default export for easy access to all schemas
 */
export default profileSchemas;
//# sourceMappingURL=profile-schemas.d.ts.map