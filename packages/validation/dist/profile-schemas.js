"use strict";
/**
 * Profile Validation Schemas
 *
 * Comprehensive Zod validation schemas for OpenRole CV & Profile Tools
 * Based on OpenAPI contracts (profile-api.yaml) and data model specifications
 *
 * @author OpenRole.net
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileSchemas = exports.profileSearchQuerySchema = exports.educationRequestSchema = exports.workExperienceRequestSchema = exports.privacySettingsRequestSchema = exports.profileUpdateRequestSchema = exports.profileCreateRequestSchema = exports.privacyLevelSchema = exports.remotePreferenceSchema = exports.achievementsArraySchema = exports.industriesArraySchema = exports.skillsArraySchema = exports.dateRangeSchema = exports.salaryRangeSchema = exports.pastOrPresentDateSchema = exports.futureDateSchema = exports.dateStringSchema = exports.urlSchema = exports.phoneSchema = exports.emailSchema = exports.uuidSchema = void 0;
exports.validateProfileData = validateProfileData;
exports.validateUrlAccessibility = validateUrlAccessibility;
exports.sanitizeSkills = sanitizeSkills;
exports.validateProfileBusinessLogic = validateProfileBusinessLogic;
const zod_1 = require("zod");
// =============================================================================
// COMMON FIELD VALIDATORS
// =============================================================================
/**
 * UUID validation with custom error message
 */
exports.uuidSchema = zod_1.z
    .string()
    .uuid({ message: 'Must be a valid UUID' });
/**
 * Email validation with comprehensive format checking
 */
exports.emailSchema = zod_1.z
    .string()
    .email({ message: 'Must be a valid email address' })
    .max(254, { message: 'Email must not exceed 254 characters' });
/**
 * Phone number validation (international format)
 */
exports.phoneSchema = zod_1.z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, {
    message: 'Must be a valid international phone number starting with +'
})
    .optional()
    .or(zod_1.z.literal(''));
/**
 * URL validation with protocol requirement
 */
exports.urlSchema = zod_1.z
    .string()
    .url({ message: 'Must be a valid URL with protocol (http/https)' })
    .optional()
    .or(zod_1.z.literal(''));
/**
 * Date string validation (YYYY-MM-DD format)
 */
exports.dateStringSchema = zod_1.z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Must be a valid date in YYYY-MM-DD format'
})
    .refine((date) => {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
}, { message: 'Must be a valid date' });
/**
 * Future date validation (for availability dates)
 */
exports.futureDateSchema = exports.dateStringSchema
    .refine((date) => {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate >= today;
}, { message: 'Date must be today or in the future' });
/**
 * Past or present date validation (for experience/education dates)
 */
exports.pastOrPresentDateSchema = exports.dateStringSchema
    .refine((date) => {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return inputDate <= today;
}, { message: 'Date cannot be in the future' });
// =============================================================================
// BUSINESS LOGIC VALIDATORS
// =============================================================================
/**
 * Salary range validation with minimum requirement
 */
exports.salaryRangeSchema = zod_1.z.object({
    salaryExpectationMin: zod_1.z
        .number()
        .int({ message: 'Minimum salary must be a whole number' })
        .min(20000, { message: 'Minimum salary must be at least €20,000' })
        .max(1000000, { message: 'Minimum salary cannot exceed €1,000,000' }),
    salaryExpectationMax: zod_1.z
        .number()
        .int({ message: 'Maximum salary must be a whole number' })
        .min(20000, { message: 'Maximum salary must be at least €20,000' })
        .max(1000000, { message: 'Maximum salary cannot exceed €1,000,000' })
}).refine((data) => data.salaryExpectationMax >= data.salaryExpectationMin, {
    message: 'Maximum salary must be greater than or equal to minimum salary',
    path: ['salaryExpectationMax']
});
/**
 * Date range validation for experience/education periods
 */
exports.dateRangeSchema = zod_1.z.object({
    startDate: exports.pastOrPresentDateSchema,
    endDate: exports.pastOrPresentDateSchema.optional().nullable(),
    isCurrent: zod_1.z.boolean().optional(),
    isOngoing: zod_1.z.boolean().optional()
}).refine((data) => {
    if (data.endDate && data.startDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
}, {
    message: 'End date must be after start date',
    path: ['endDate']
}).refine((data) => {
    // If marked as current/ongoing, endDate should be null/undefined
    if ((data.isCurrent || data.isOngoing) && data.endDate) {
        return false;
    }
    return true;
}, {
    message: 'End date must be empty for current/ongoing positions',
    path: ['endDate']
});
// =============================================================================
// ARRAY VALIDATORS
// =============================================================================
/**
 * Skills array validation (1-50 items, 2-100 chars each)
 */
exports.skillsArraySchema = zod_1.z
    .array(zod_1.z.string()
    .min(2, { message: 'Each skill must be at least 2 characters' })
    .max(100, { message: 'Each skill must not exceed 100 characters' })
    .regex(/^[a-zA-Z0-9\s\.\-\+\#]+$/, {
    message: 'Skills can only contain letters, numbers, spaces, dots, hyphens, plus signs, and hashtags'
}))
    .min(1, { message: 'At least 1 skill is required' })
    .max(50, { message: 'Cannot have more than 50 skills' })
    .refine((skills) => {
    const uniqueSkills = new Set(skills.map((skill) => skill.toLowerCase().trim()));
    return uniqueSkills.size === skills.length;
}, { message: 'Skills must be unique (case-insensitive)' });
/**
 * Industries array validation
 */
exports.industriesArraySchema = zod_1.z
    .array(zod_1.z.string()
    .min(2, { message: 'Each industry must be at least 2 characters' })
    .max(100, { message: 'Each industry must not exceed 100 characters' }))
    .max(10, { message: 'Cannot have more than 10 industries' })
    .optional();
/**
 * Achievements array validation for work experience
 */
exports.achievementsArraySchema = zod_1.z
    .array(zod_1.z.string()
    .min(10, { message: 'Each achievement must be at least 10 characters' })
    .max(500, { message: 'Each achievement must not exceed 500 characters' }))
    .max(20, { message: 'Cannot have more than 20 achievements' })
    .optional();
// =============================================================================
// ENUM VALIDATORS
// =============================================================================
/**
 * Remote work preference validation
 */
exports.remotePreferenceSchema = zod_1.z.enum(['remote', 'hybrid', 'office'], {
    errorMap: () => ({ message: 'Remote preference must be remote, hybrid, or office' })
});
/**
 * Privacy level validation
 */
exports.privacyLevelSchema = zod_1.z.enum(['public', 'semi-private', 'anonymous'], {
    errorMap: () => ({ message: 'Privacy level must be public, semi-private, or anonymous' })
});
// =============================================================================
// PROFILE VALIDATION SCHEMAS
// =============================================================================
/**
 * Profile creation request validation
 * Matches ProfileCreateRequest from profile-api.yaml
 */
exports.profileCreateRequestSchema = zod_1.z.object({
    headline: zod_1.z
        .string()
        .min(10, { message: 'Headline must be at least 10 characters' })
        .max(255, { message: 'Headline must not exceed 255 characters' })
        .regex(/^[a-zA-Z0-9\s\.\-\,\(\)]+$/, {
        message: 'Headline can only contain letters, numbers, spaces, and basic punctuation'
    }),
    summary: zod_1.z
        .string()
        .max(2000, { message: 'Summary must not exceed 2000 characters' })
        .optional()
        .or(zod_1.z.literal('')),
    location: zod_1.z
        .string()
        .min(2, { message: 'Location must be at least 2 characters' })
        .max(100, { message: 'Location must not exceed 100 characters' }),
    phoneNumber: exports.phoneSchema,
    portfolioUrl: exports.urlSchema,
    linkedinUrl: exports.urlSchema.refine((url) => {
        if (!url)
            return true;
        return url.includes('linkedin.com');
    }, { message: 'LinkedIn URL must be from linkedin.com domain' }),
    githubUrl: exports.urlSchema.refine((url) => {
        if (!url)
            return true;
        return url.includes('github.com');
    }, { message: 'GitHub URL must be from github.com domain' }),
    experienceYears: zod_1.z
        .number()
        .int({ message: 'Experience years must be a whole number' })
        .min(0, { message: 'Experience years cannot be negative' })
        .max(50, { message: 'Experience years cannot exceed 50' }),
    skills: exports.skillsArraySchema,
    industries: exports.industriesArraySchema,
    salaryExpectationMin: zod_1.z
        .number()
        .int({ message: 'Minimum salary must be a whole number' })
        .min(20000, { message: 'Minimum salary must be at least €20,000' })
        .max(1000000, { message: 'Minimum salary cannot exceed €1,000,000' }),
    salaryExpectationMax: zod_1.z
        .number()
        .int({ message: 'Maximum salary must be a whole number' })
        .min(20000, { message: 'Maximum salary must be at least €20,000' })
        .max(1000000, { message: 'Maximum salary cannot exceed €1,000,000' }),
    availableFrom: exports.futureDateSchema.optional(),
    willingToRelocate: zod_1.z.boolean().optional(),
    remotePreference: exports.remotePreferenceSchema
}).refine((data) => data.salaryExpectationMax >= data.salaryExpectationMin, {
    message: 'Maximum salary must be greater than or equal to minimum salary',
    path: ['salaryExpectationMax']
});
/**
 * Profile update request validation
 * Matches ProfileUpdateRequest from profile-api.yaml
 * All fields are optional for partial updates
 */
exports.profileUpdateRequestSchema = zod_1.z.object({
    headline: zod_1.z
        .string()
        .min(10, { message: 'Headline must be at least 10 characters' })
        .max(255, { message: 'Headline must not exceed 255 characters' })
        .regex(/^[a-zA-Z0-9\s\.\-\,\(\)]+$/, {
        message: 'Headline can only contain letters, numbers, spaces, and basic punctuation'
    })
        .optional(),
    summary: zod_1.z
        .string()
        .max(2000, { message: 'Summary must not exceed 2000 characters' })
        .optional(),
    location: zod_1.z
        .string()
        .min(2, { message: 'Location must be at least 2 characters' })
        .max(100, { message: 'Location must not exceed 100 characters' })
        .optional(),
    phoneNumber: exports.phoneSchema,
    portfolioUrl: exports.urlSchema,
    linkedinUrl: exports.urlSchema.refine((url) => {
        if (!url)
            return true;
        return url.includes('linkedin.com');
    }, { message: 'LinkedIn URL must be from linkedin.com domain' })
        .optional(),
    githubUrl: exports.urlSchema.refine((url) => {
        if (!url)
            return true;
        return url.includes('github.com');
    }, { message: 'GitHub URL must be from github.com domain' })
        .optional(),
    experienceYears: zod_1.z
        .number()
        .int({ message: 'Experience years must be a whole number' })
        .min(0, { message: 'Experience years cannot be negative' })
        .max(50, { message: 'Experience years cannot exceed 50' })
        .optional(),
    skills: exports.skillsArraySchema.optional(),
    industries: exports.industriesArraySchema,
    salaryExpectationMin: zod_1.z
        .number()
        .int({ message: 'Minimum salary must be a whole number' })
        .min(20000, { message: 'Minimum salary must be at least €20,000' })
        .max(1000000, { message: 'Minimum salary cannot exceed €1,000,000' })
        .optional(),
    salaryExpectationMax: zod_1.z
        .number()
        .int({ message: 'Maximum salary must be a whole number' })
        .min(20000, { message: 'Maximum salary must be at least €20,000' })
        .max(1000000, { message: 'Maximum salary cannot exceed €1,000,000' })
        .optional(),
    availableFrom: exports.futureDateSchema.optional(),
    willingToRelocate: zod_1.z.boolean().optional(),
    remotePreference: exports.remotePreferenceSchema.optional()
}).refine((data) => {
    if (data.salaryExpectationMin !== undefined && data.salaryExpectationMax !== undefined) {
        return data.salaryExpectationMax >= data.salaryExpectationMin;
    }
    return true;
}, {
    message: 'Maximum salary must be greater than or equal to minimum salary',
    path: ['salaryExpectationMax']
});
/**
 * Privacy settings request validation
 * Matches PrivacySettingsRequest from profile-api.yaml
 */
exports.privacySettingsRequestSchema = zod_1.z.object({
    privacyLevel: exports.privacyLevelSchema,
    profileVisibleToEmployers: zod_1.z.boolean({
        required_error: 'Profile visibility setting is required',
        invalid_type_error: 'Profile visibility must be a boolean'
    }),
    contactInfoVisible: zod_1.z.boolean({
        required_error: 'Contact info visibility setting is required',
        invalid_type_error: 'Contact info visibility must be a boolean'
    }),
    salaryVisible: zod_1.z.boolean({
        required_error: 'Salary visibility setting is required',
        invalid_type_error: 'Salary visibility must be a boolean'
    })
}).refine((data) => {
    // If profile is not visible to employers, other visibility settings are irrelevant
    if (!data.profileVisibleToEmployers) {
        return true;
    }
    // If privacy level is anonymous, contact info should not be visible
    if (data.privacyLevel === 'anonymous' && data.contactInfoVisible) {
        return false;
    }
    return true;
}, {
    message: 'Contact info cannot be visible when privacy level is anonymous',
    path: ['contactInfoVisible']
});
// =============================================================================
// WORK EXPERIENCE VALIDATION SCHEMAS
// =============================================================================
/**
 * Work experience request validation
 * Matches WorkExperienceRequest from profile-api.yaml
 */
exports.workExperienceRequestSchema = zod_1.z.object({
    jobTitle: zod_1.z
        .string()
        .min(2, { message: 'Job title must be at least 2 characters' })
        .max(200, { message: 'Job title must not exceed 200 characters' }),
    companyName: zod_1.z
        .string()
        .min(2, { message: 'Company name must be at least 2 characters' })
        .max(200, { message: 'Company name must not exceed 200 characters' }),
    companyWebsite: exports.urlSchema,
    location: zod_1.z
        .string()
        .min(2, { message: 'Location must be at least 2 characters' })
        .max(100, { message: 'Location must not exceed 100 characters' }),
    startDate: exports.pastOrPresentDateSchema,
    endDate: exports.pastOrPresentDateSchema.optional().nullable(),
    isCurrent: zod_1.z.boolean({
        required_error: 'Current position status is required',
        invalid_type_error: 'Current position status must be a boolean'
    }),
    description: zod_1.z
        .string()
        .min(10, { message: 'Description must be at least 10 characters' })
        .max(2000, { message: 'Description must not exceed 2000 characters' }),
    achievements: exports.achievementsArraySchema,
    skills: zod_1.z
        .array(zod_1.z.string()
        .min(2, { message: 'Each skill must be at least 2 characters' })
        .max(100, { message: 'Each skill must not exceed 100 characters' }))
        .max(30, { message: 'Cannot have more than 30 skills per experience' })
        .optional(),
    sortOrder: zod_1.z
        .number()
        .int({ message: 'Sort order must be a whole number' })
        .min(0, { message: 'Sort order cannot be negative' })
        .optional()
}).refine((data) => {
    if (data.endDate && data.startDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
}, {
    message: 'End date must be after start date',
    path: ['endDate']
}).refine((data) => {
    // If marked as current, endDate should be null/undefined
    if (data.isCurrent && data.endDate) {
        return false;
    }
    return true;
}, {
    message: 'End date must be empty for current positions',
    path: ['endDate']
});
// =============================================================================
// EDUCATION VALIDATION SCHEMAS
// =============================================================================
/**
 * Education request validation
 * Matches EducationRequest from profile-api.yaml
 */
exports.educationRequestSchema = zod_1.z.object({
    institutionName: zod_1.z
        .string()
        .min(2, { message: 'Institution name must be at least 2 characters' })
        .max(200, { message: 'Institution name must not exceed 200 characters' }),
    degree: zod_1.z
        .string()
        .min(2, { message: 'Degree must be at least 2 characters' })
        .max(200, { message: 'Degree must not exceed 200 characters' }),
    fieldOfStudy: zod_1.z
        .string()
        .min(2, { message: 'Field of study must be at least 2 characters' })
        .max(200, { message: 'Field of study must not exceed 200 characters' }),
    location: zod_1.z
        .string()
        .min(2, { message: 'Location must be at least 2 characters' })
        .max(100, { message: 'Location must not exceed 100 characters' }),
    startDate: exports.pastOrPresentDateSchema,
    endDate: exports.pastOrPresentDateSchema.optional().nullable(),
    isOngoing: zod_1.z.boolean({
        required_error: 'Ongoing status is required',
        invalid_type_error: 'Ongoing status must be a boolean'
    }),
    grade: zod_1.z
        .string()
        .max(100, { message: 'Grade must not exceed 100 characters' })
        .optional()
        .or(zod_1.z.literal('')),
    description: zod_1.z
        .string()
        .max(1000, { message: 'Description must not exceed 1000 characters' })
        .optional()
        .or(zod_1.z.literal('')),
    sortOrder: zod_1.z
        .number()
        .int({ message: 'Sort order must be a whole number' })
        .min(0, { message: 'Sort order cannot be negative' })
        .optional()
}).refine((data) => {
    if (data.endDate && data.startDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
}, {
    message: 'End date must be after start date',
    path: ['endDate']
}).refine((data) => {
    // If marked as ongoing, endDate should be null/undefined
    if (data.isOngoing && data.endDate) {
        return false;
    }
    return true;
}, {
    message: 'End date must be empty for ongoing education',
    path: ['endDate']
});
// =============================================================================
// PUBLIC PROFILE SEARCH/FILTER VALIDATION
// =============================================================================
/**
 * Profile search query validation for employer searches
 * Matches the query parameters from /profiles GET endpoint
 */
exports.profileSearchQuerySchema = zod_1.z.object({
    skills: zod_1.z
        .string()
        .optional()
        .refine((skills) => {
        if (!skills)
            return true;
        const skillArray = skills.split(',').map((s) => s.trim());
        return skillArray.length <= 10 && skillArray.every((skill) => skill.length >= 2 && skill.length <= 100);
    }, { message: 'Skills must be comma-separated, max 10 items, each 2-100 characters' }),
    location: zod_1.z
        .string()
        .max(100, { message: 'Location filter must not exceed 100 characters' })
        .optional(),
    salaryMin: zod_1.z
        .number()
        .int({ message: 'Minimum salary must be a whole number' })
        .min(20000, { message: 'Minimum salary must be at least €20,000' })
        .optional(),
    salaryMax: zod_1.z
        .number()
        .int({ message: 'Maximum salary must be a whole number' })
        .max(500000, { message: 'Maximum salary cannot exceed €500,000' })
        .optional(),
    experienceYears: zod_1.z
        .number()
        .int({ message: 'Experience years must be a whole number' })
        .min(0, { message: 'Experience years cannot be negative' })
        .max(50, { message: 'Experience years cannot exceed 50' })
        .optional(),
    page: zod_1.z
        .number()
        .int({ message: 'Page must be a whole number' })
        .min(1, { message: 'Page must be at least 1' })
        .default(1),
    limit: zod_1.z
        .number()
        .int({ message: 'Limit must be a whole number' })
        .min(1, { message: 'Limit must be at least 1' })
        .max(50, { message: 'Limit cannot exceed 50' })
        .default(20)
}).refine((data) => {
    if (data.salaryMin && data.salaryMax) {
        return data.salaryMax >= data.salaryMin;
    }
    return true;
}, {
    message: 'Maximum salary must be greater than or equal to minimum salary',
    path: ['salaryMax']
});
// =============================================================================
// VALIDATION HELPER FUNCTIONS
// =============================================================================
/**
 * Helper function to validate profile data and return formatted errors
 */
function validateProfileData(schema, data) {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    const errors = result.error.errors.map((error) => ({
        field: error.path.join('.'),
        message: error.message,
        code: error.code
    }));
    return { success: false, errors };
}
/**
 * Helper to check if a URL is accessible (for portfolio validation)
 */
async function validateUrlAccessibility(url) {
    try {
        const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
        return response.ok;
    }
    catch {
        return false;
    }
}
/**
 * Helper to sanitize skills array (trim, dedupe, normalize)
 */
function sanitizeSkills(skills) {
    return Array.from(new Set(skills
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0)
        .map(skill => skill.charAt(0).toUpperCase() + skill.slice(1).toLowerCase())));
}
/**
 * Helper to validate business logic across related fields
 */
function validateProfileBusinessLogic(profile) {
    const errors = [];
    // Check salary range consistency
    if (profile.salaryExpectationMin && profile.salaryExpectationMax) {
        if (profile.salaryExpectationMax < profile.salaryExpectationMin) {
            errors.push('Maximum salary must be greater than or equal to minimum salary');
        }
    }
    // Check experience years vs skills count
    if (profile.experienceYears !== undefined && profile.skills) {
        if (profile.experienceYears === 0 && profile.skills.length > 10) {
            errors.push('Entry-level profiles should have fewer skills listed');
        }
    }
    // Check LinkedIn URL format
    if (profile.linkedinUrl && !profile.linkedinUrl.includes('/in/')) {
        errors.push('LinkedIn URL should be a profile URL (containing /in/)');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
// =============================================================================
// SCHEMA COLLECTIONS
// =============================================================================
/**
 * Collection of all profile-related schemas for easy import
 */
exports.profileSchemas = {
    // Main profile schemas
    profileCreate: exports.profileCreateRequestSchema,
    profileUpdate: exports.profileUpdateRequestSchema,
    privacySettings: exports.privacySettingsRequestSchema,
    // Related entity schemas
    workExperience: exports.workExperienceRequestSchema,
    education: exports.educationRequestSchema,
    // Search and filtering
    profileSearch: exports.profileSearchQuerySchema,
    // Common field validators
    uuid: exports.uuidSchema,
    email: exports.emailSchema,
    phone: exports.phoneSchema,
    url: exports.urlSchema,
    dateString: exports.dateStringSchema,
    futureDate: exports.futureDateSchema,
    pastOrPresentDate: exports.pastOrPresentDateSchema,
    // Array validators
    skills: exports.skillsArraySchema,
    industries: exports.industriesArraySchema,
    achievements: exports.achievementsArraySchema,
    // Enum validators
    remotePreference: exports.remotePreferenceSchema,
    privacyLevel: exports.privacyLevelSchema,
    // Business logic validators
    salaryRange: exports.salaryRangeSchema,
    dateRange: exports.dateRangeSchema
};
/**
 * Default export for easy access to all schemas
 */
exports.default = exports.profileSchemas;
//# sourceMappingURL=profile-schemas.js.map