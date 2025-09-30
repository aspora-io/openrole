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

// =============================================================================
// COMMON FIELD VALIDATORS
// =============================================================================

/**
 * UUID validation with custom error message
 */
export const uuidSchema = z
  .string()
  .uuid({ message: 'Must be a valid UUID' });

/**
 * Email validation with comprehensive format checking
 */
export const emailSchema = z
  .string()
  .email({ message: 'Must be a valid email address' })
  .max(254, { message: 'Email must not exceed 254 characters' });

/**
 * Phone number validation (international format)
 */
export const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, { 
    message: 'Must be a valid international phone number starting with +' 
  })
  .optional()
  .or(z.literal(''));

/**
 * URL validation with protocol requirement
 */
export const urlSchema = z
  .string()
  .url({ message: 'Must be a valid URL with protocol (http/https)' })
  .optional()
  .or(z.literal(''));

/**
 * Date string validation (YYYY-MM-DD format)
 */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { 
    message: 'Must be a valid date in YYYY-MM-DD format' 
  })
  .refine((date: string) => {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }, { message: 'Must be a valid date' });

/**
 * Future date validation (for availability dates)
 */
export const futureDateSchema = dateStringSchema
  .refine((date: string) => {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate >= today;
  }, { message: 'Date must be today or in the future' });

/**
 * Past or present date validation (for experience/education dates)
 */
export const pastOrPresentDateSchema = dateStringSchema
  .refine((date: string) => {
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
export const salaryRangeSchema = z.object({
  salaryExpectationMin: z
    .number()
    .int({ message: 'Minimum salary must be a whole number' })
    .min(20000, { message: 'Minimum salary must be at least €20,000' })
    .max(1000000, { message: 'Minimum salary cannot exceed €1,000,000' }),
  salaryExpectationMax: z
    .number()
    .int({ message: 'Maximum salary must be a whole number' })
    .min(20000, { message: 'Maximum salary must be at least €20,000' })
    .max(1000000, { message: 'Maximum salary cannot exceed €1,000,000' })
}).refine((data: { salaryExpectationMin: number; salaryExpectationMax: number }) => data.salaryExpectationMax >= data.salaryExpectationMin, {
  message: 'Maximum salary must be greater than or equal to minimum salary',
  path: ['salaryExpectationMax']
});

/**
 * Date range validation for experience/education periods
 */
export const dateRangeSchema = z.object({
  startDate: pastOrPresentDateSchema,
  endDate: pastOrPresentDateSchema.optional().nullable(),
  isCurrent: z.boolean().optional(),
  isOngoing: z.boolean().optional()
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
export const skillsArraySchema = z
  .array(
    z.string()
      .min(2, { message: 'Each skill must be at least 2 characters' })
      .max(100, { message: 'Each skill must not exceed 100 characters' })
      .regex(/^[a-zA-Z0-9\s\.\-\+\#]+$/, { 
        message: 'Skills can only contain letters, numbers, spaces, dots, hyphens, plus signs, and hashtags' 
      })
  )
  .min(1, { message: 'At least 1 skill is required' })
  .max(50, { message: 'Cannot have more than 50 skills' })
  .refine((skills: string[]) => {
    const uniqueSkills = new Set(skills.map((skill: string) => skill.toLowerCase().trim()));
    return uniqueSkills.size === skills.length;
  }, { message: 'Skills must be unique (case-insensitive)' });

/**
 * Industries array validation
 */
export const industriesArraySchema = z
  .array(
    z.string()
      .min(2, { message: 'Each industry must be at least 2 characters' })
      .max(100, { message: 'Each industry must not exceed 100 characters' })
  )
  .max(10, { message: 'Cannot have more than 10 industries' })
  .optional();

/**
 * Achievements array validation for work experience
 */
export const achievementsArraySchema = z
  .array(
    z.string()
      .min(10, { message: 'Each achievement must be at least 10 characters' })
      .max(500, { message: 'Each achievement must not exceed 500 characters' })
  )
  .max(20, { message: 'Cannot have more than 20 achievements' })
  .optional();

// =============================================================================
// ENUM VALIDATORS
// =============================================================================

/**
 * Remote work preference validation
 */
export const remotePreferenceSchema = z.enum(['remote', 'hybrid', 'office'], {
  errorMap: () => ({ message: 'Remote preference must be remote, hybrid, or office' })
});

/**
 * Privacy level validation
 */
export const privacyLevelSchema = z.enum(['public', 'semi-private', 'anonymous'], {
  errorMap: () => ({ message: 'Privacy level must be public, semi-private, or anonymous' })
});

// =============================================================================
// PROFILE VALIDATION SCHEMAS
// =============================================================================

/**
 * Profile creation request validation
 * Matches ProfileCreateRequest from profile-api.yaml
 */
export const profileCreateRequestSchema = z.object({
  headline: z
    .string()
    .min(10, { message: 'Headline must be at least 10 characters' })
    .max(255, { message: 'Headline must not exceed 255 characters' })
    .regex(/^[a-zA-Z0-9\s\.\-\,\(\)]+$/, { 
      message: 'Headline can only contain letters, numbers, spaces, and basic punctuation' 
    }),
  
  summary: z
    .string()
    .max(2000, { message: 'Summary must not exceed 2000 characters' })
    .optional()
    .or(z.literal('')),
  
  location: z
    .string()
    .min(2, { message: 'Location must be at least 2 characters' })
    .max(100, { message: 'Location must not exceed 100 characters' }),
  
  phoneNumber: phoneSchema,
  portfolioUrl: urlSchema,
  linkedinUrl: urlSchema.refine((url: string | undefined) => {
    if (!url) return true;
    return url.includes('linkedin.com');
  }, { message: 'LinkedIn URL must be from linkedin.com domain' }),
  
  githubUrl: urlSchema.refine((url: string | undefined) => {
    if (!url) return true;
    return url.includes('github.com');
  }, { message: 'GitHub URL must be from github.com domain' }),
  
  experienceYears: z
    .number()
    .int({ message: 'Experience years must be a whole number' })
    .min(0, { message: 'Experience years cannot be negative' })
    .max(50, { message: 'Experience years cannot exceed 50' }),
  
  skills: skillsArraySchema,
  industries: industriesArraySchema,
  
  salaryExpectationMin: z
    .number()
    .int({ message: 'Minimum salary must be a whole number' })
    .min(20000, { message: 'Minimum salary must be at least €20,000' })
    .max(1000000, { message: 'Minimum salary cannot exceed €1,000,000' }),
  
  salaryExpectationMax: z
    .number()
    .int({ message: 'Maximum salary must be a whole number' })
    .min(20000, { message: 'Maximum salary must be at least €20,000' })
    .max(1000000, { message: 'Maximum salary cannot exceed €1,000,000' }),
  
  availableFrom: futureDateSchema.optional(),
  
  willingToRelocate: z.boolean().optional(),
  
  remotePreference: remotePreferenceSchema
}).refine((data: { salaryExpectationMin: number; salaryExpectationMax: number }) => data.salaryExpectationMax >= data.salaryExpectationMin, {
  message: 'Maximum salary must be greater than or equal to minimum salary',
  path: ['salaryExpectationMax']
});

/**
 * Profile update request validation
 * Matches ProfileUpdateRequest from profile-api.yaml
 * All fields are optional for partial updates
 */
export const profileUpdateRequestSchema = z.object({
  headline: z
    .string()
    .min(10, { message: 'Headline must be at least 10 characters' })
    .max(255, { message: 'Headline must not exceed 255 characters' })
    .regex(/^[a-zA-Z0-9\s\.\-\,\(\)]+$/, { 
      message: 'Headline can only contain letters, numbers, spaces, and basic punctuation' 
    })
    .optional(),
  
  summary: z
    .string()
    .max(2000, { message: 'Summary must not exceed 2000 characters' })
    .optional(),
  
  location: z
    .string()
    .min(2, { message: 'Location must be at least 2 characters' })
    .max(100, { message: 'Location must not exceed 100 characters' })
    .optional(),
  
  phoneNumber: phoneSchema,
  portfolioUrl: urlSchema,
  linkedinUrl: urlSchema.refine((url: string | undefined) => {
    if (!url) return true;
    return url.includes('linkedin.com');
  }, { message: 'LinkedIn URL must be from linkedin.com domain' })
    .optional(),
  
  githubUrl: urlSchema.refine((url: string | undefined) => {
    if (!url) return true;
    return url.includes('github.com');
  }, { message: 'GitHub URL must be from github.com domain' })
    .optional(),
  
  experienceYears: z
    .number()
    .int({ message: 'Experience years must be a whole number' })
    .min(0, { message: 'Experience years cannot be negative' })
    .max(50, { message: 'Experience years cannot exceed 50' })
    .optional(),
  
  skills: skillsArraySchema.optional(),
  industries: industriesArraySchema,
  
  salaryExpectationMin: z
    .number()
    .int({ message: 'Minimum salary must be a whole number' })
    .min(20000, { message: 'Minimum salary must be at least €20,000' })
    .max(1000000, { message: 'Minimum salary cannot exceed €1,000,000' })
    .optional(),
  
  salaryExpectationMax: z
    .number()
    .int({ message: 'Maximum salary must be a whole number' })
    .min(20000, { message: 'Maximum salary must be at least €20,000' })
    .max(1000000, { message: 'Maximum salary cannot exceed €1,000,000' })
    .optional(),
  
  availableFrom: futureDateSchema.optional(),
  
  willingToRelocate: z.boolean().optional(),
  
  remotePreference: remotePreferenceSchema.optional()
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
export const privacySettingsRequestSchema = z.object({
  privacyLevel: privacyLevelSchema,
  profileVisibleToEmployers: z.boolean({
    required_error: 'Profile visibility setting is required',
    invalid_type_error: 'Profile visibility must be a boolean'
  }),
  contactInfoVisible: z.boolean({
    required_error: 'Contact info visibility setting is required',
    invalid_type_error: 'Contact info visibility must be a boolean'
  }),
  salaryVisible: z.boolean({
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
export const workExperienceRequestSchema = z.object({
  jobTitle: z
    .string()
    .min(2, { message: 'Job title must be at least 2 characters' })
    .max(200, { message: 'Job title must not exceed 200 characters' }),
  
  companyName: z
    .string()
    .min(2, { message: 'Company name must be at least 2 characters' })
    .max(200, { message: 'Company name must not exceed 200 characters' }),
  
  companyWebsite: urlSchema,
  
  location: z
    .string()
    .min(2, { message: 'Location must be at least 2 characters' })
    .max(100, { message: 'Location must not exceed 100 characters' }),
  
  startDate: pastOrPresentDateSchema,
  
  endDate: pastOrPresentDateSchema.optional().nullable(),
  
  isCurrent: z.boolean({
    required_error: 'Current position status is required',
    invalid_type_error: 'Current position status must be a boolean'
  }),
  
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters' })
    .max(2000, { message: 'Description must not exceed 2000 characters' }),
  
  achievements: achievementsArraySchema,
  
  skills: z
    .array(
      z.string()
        .min(2, { message: 'Each skill must be at least 2 characters' })
        .max(100, { message: 'Each skill must not exceed 100 characters' })
    )
    .max(30, { message: 'Cannot have more than 30 skills per experience' })
    .optional(),
  
  sortOrder: z
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
export const educationRequestSchema = z.object({
  institutionName: z
    .string()
    .min(2, { message: 'Institution name must be at least 2 characters' })
    .max(200, { message: 'Institution name must not exceed 200 characters' }),
  
  degree: z
    .string()
    .min(2, { message: 'Degree must be at least 2 characters' })
    .max(200, { message: 'Degree must not exceed 200 characters' }),
  
  fieldOfStudy: z
    .string()
    .min(2, { message: 'Field of study must be at least 2 characters' })
    .max(200, { message: 'Field of study must not exceed 200 characters' }),
  
  location: z
    .string()
    .min(2, { message: 'Location must be at least 2 characters' })
    .max(100, { message: 'Location must not exceed 100 characters' }),
  
  startDate: pastOrPresentDateSchema,
  
  endDate: pastOrPresentDateSchema.optional().nullable(),
  
  isOngoing: z.boolean({
    required_error: 'Ongoing status is required',
    invalid_type_error: 'Ongoing status must be a boolean'
  }),
  
  grade: z
    .string()
    .max(100, { message: 'Grade must not exceed 100 characters' })
    .optional()
    .or(z.literal('')),
  
  description: z
    .string()
    .max(1000, { message: 'Description must not exceed 1000 characters' })
    .optional()
    .or(z.literal('')),
  
  sortOrder: z
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
export const profileSearchQuerySchema = z.object({
  skills: z
    .string()
    .optional()
    .refine((skills: string | undefined) => {
      if (!skills) return true;
      const skillArray = skills.split(',').map((s: string) => s.trim());
      return skillArray.length <= 10 && skillArray.every((skill: string) => skill.length >= 2 && skill.length <= 100);
    }, { message: 'Skills must be comma-separated, max 10 items, each 2-100 characters' }),
  
  location: z
    .string()
    .max(100, { message: 'Location filter must not exceed 100 characters' })
    .optional(),
  
  salaryMin: z
    .number()
    .int({ message: 'Minimum salary must be a whole number' })
    .min(20000, { message: 'Minimum salary must be at least €20,000' })
    .optional(),
  
  salaryMax: z
    .number()
    .int({ message: 'Maximum salary must be a whole number' })
    .max(500000, { message: 'Maximum salary cannot exceed €500,000' })
    .optional(),
  
  experienceYears: z
    .number()
    .int({ message: 'Experience years must be a whole number' })
    .min(0, { message: 'Experience years cannot be negative' })
    .max(50, { message: 'Experience years cannot exceed 50' })
    .optional(),
  
  page: z
    .number()
    .int({ message: 'Page must be a whole number' })
    .min(1, { message: 'Page must be at least 1' })
    .default(1),
  
  limit: z
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
// TYPE EXPORTS
// =============================================================================

// Export TypeScript types inferred from schemas
export type ProfileCreateRequest = z.infer<typeof profileCreateRequestSchema>;
export type ProfileUpdateRequest = z.infer<typeof profileUpdateRequestSchema>;
export type PrivacySettingsRequest = z.infer<typeof privacySettingsRequestSchema>;
export type WorkExperienceRequest = z.infer<typeof workExperienceRequestSchema>;
export type EducationRequest = z.infer<typeof educationRequestSchema>;
export type ProfileSearchQuery = z.infer<typeof profileSearchQuerySchema>;

// Export common validators for reuse
export type UUID = z.infer<typeof uuidSchema>;
export type Email = z.infer<typeof emailSchema>;
export type Phone = z.infer<typeof phoneSchema>;
export type URL = z.infer<typeof urlSchema>;
export type DateString = z.infer<typeof dateStringSchema>;
export type SkillsArray = z.infer<typeof skillsArraySchema>;
export type RemotePreference = z.infer<typeof remotePreferenceSchema>;
export type PrivacyLevel = z.infer<typeof privacyLevelSchema>;

// =============================================================================
// VALIDATION HELPER FUNCTIONS
// =============================================================================

/**
 * Helper function to validate profile data and return formatted errors
 */
export function validateProfileData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Array<{ field: string; message: string; code: string }>;
} {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map((error: any) => ({
    field: error.path.join('.'),
    message: error.message,
    code: error.code
  }));
  
  return { success: false, errors };
}

/**
 * Helper to check if a URL is accessible (for portfolio validation)
 */
export async function validateUrlAccessibility(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Helper to sanitize skills array (trim, dedupe, normalize)
 */
export function sanitizeSkills(skills: string[]): string[] {
  return Array.from(new Set(
    skills
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0)
      .map(skill => skill.charAt(0).toUpperCase() + skill.slice(1).toLowerCase())
  ));
}

/**
 * Helper to validate business logic across related fields
 */
export function validateProfileBusinessLogic(profile: Partial<ProfileCreateRequest>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
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
export const profileSchemas = {
  // Main profile schemas
  profileCreate: profileCreateRequestSchema,
  profileUpdate: profileUpdateRequestSchema,
  privacySettings: privacySettingsRequestSchema,
  
  // Related entity schemas
  workExperience: workExperienceRequestSchema,
  education: educationRequestSchema,
  
  // Search and filtering
  profileSearch: profileSearchQuerySchema,
  
  // Common field validators
  uuid: uuidSchema,
  email: emailSchema,
  phone: phoneSchema,
  url: urlSchema,
  dateString: dateStringSchema,
  futureDate: futureDateSchema,
  pastOrPresentDate: pastOrPresentDateSchema,
  
  // Array validators
  skills: skillsArraySchema,
  industries: industriesArraySchema,
  achievements: achievementsArraySchema,
  
  // Enum validators
  remotePreference: remotePreferenceSchema,
  privacyLevel: privacyLevelSchema,
  
  // Business logic validators
  salaryRange: salaryRangeSchema,
  dateRange: dateRangeSchema
};

/**
 * Default export for easy access to all schemas
 */
export default profileSchemas;