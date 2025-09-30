/**
 * Validation Schemas and Utilities
 * 
 * Placeholder implementation for validation schemas
 * until proper validation packages are implemented.
 * 
 * @author OpenRole Team
 * @date 2025-09-30
 */

import { z, ZodSchema } from 'zod';

// Validation result interface
export interface ValidationResult {
  success: boolean;
  data?: any;
  errors?: Array<{ message: string; path?: string[] }>;
}

// Profile validation schemas
export const profileSchemas = {
  profileCreate: z.object({
    headline: z.string().max(200).optional(),
    summary: z.string().max(2000).optional(),
    location: z.string().max(200).optional(),
    phoneNumber: z.string().max(20).optional(),
    linkedinUrl: z.string().url().optional(),
    portfolioUrl: z.string().url().optional(),
    githubUrl: z.string().url().optional(),
    skills: z.array(z.string()).max(50).optional(),
    industries: z.array(z.string()).max(10).optional(),
    salaryExpectationMin: z.number().min(0).optional(),
    salaryExpectationMax: z.number().min(0).optional(),
    remotePreference: z.enum(['REMOTE_ONLY', 'HYBRID', 'ON_SITE', 'NO_PREFERENCE']).optional()
  }),

  profileUpdate: z.object({
    headline: z.string().max(200).optional(),
    summary: z.string().max(2000).optional(),
    location: z.string().max(200).optional(),
    phoneNumber: z.string().max(20).optional(),
    linkedinUrl: z.string().url().optional(),
    portfolioUrl: z.string().url().optional(),
    githubUrl: z.string().url().optional(),
    skills: z.array(z.string()).max(50).optional(),
    industries: z.array(z.string()).max(10).optional(),
    salaryExpectationMin: z.number().min(0).optional(),
    salaryExpectationMax: z.number().min(0).optional(),
    remotePreference: z.enum(['REMOTE_ONLY', 'HYBRID', 'ON_SITE', 'NO_PREFERENCE']).optional()
  }),

  profileSearch: z.object({
    skills: z.array(z.string()).optional(),
    industries: z.array(z.string()).optional(),
    location: z.string().optional(),
    remotePreference: z.enum(['REMOTE_ONLY', 'HYBRID', 'ON_SITE', 'NO_PREFERENCE']).optional(),
    salaryMin: z.number().optional(),
    salaryMax: z.number().optional(),
    limit: z.number().min(1).max(100).optional().default(20)
  })
};

// CV validation schemas
export const cvSchemas = {
  cvGeneration: z.object({
    templateId: z.string().min(1),
    label: z.string().min(1).max(100),
    isDefault: z.boolean().optional(),
    sections: z.object({
      includePersonalDetails: z.boolean().default(true),
      includeWorkExperience: z.boolean().default(true),
      includeEducation: z.boolean().default(true),
      includeSkills: z.boolean().default(true),
      includePortfolio: z.boolean().default(false)
    }),
    format: z.enum(['pdf', 'html', 'png']).optional().default('pdf')
  }),

  cvUpdate: z.object({
    label: z.string().min(1).max(100).optional(),
    isDefault: z.boolean().optional()
  }),

  cvLabel: z.string().min(1).max(100),

  cvCustomizations: z.object({
    primaryColor: z.string().optional(),
    fontSize: z.enum(['small', 'medium', 'large']).optional(),
    fontFamily: z.string().optional()
  })
};

// Portfolio validation schemas
export const portfolioSchemas = {
  portfolioCreate: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    type: z.enum(['PROJECT', 'ARTICLE', 'DESIGN', 'CODE', 'VIDEO', 'PRESENTATION', 'CERTIFICATE', 'LINK']),
    externalUrl: z.string().url().optional(),
    technologies: z.array(z.string()).max(20).optional(),
    projectDate: z.string().optional(),
    role: z.string().max(100).optional(),
    isPublic: z.boolean().optional().default(true)
  }),

  portfolioUpdate: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    type: z.enum(['PROJECT', 'ARTICLE', 'DESIGN', 'CODE', 'VIDEO', 'PRESENTATION', 'CERTIFICATE', 'LINK']).optional(),
    externalUrl: z.string().url().optional(),
    technologies: z.array(z.string()).max(20).optional(),
    projectDate: z.string().optional(),
    role: z.string().max(100).optional(),
    isPublic: z.boolean().optional()
  })
};

// Profile search interfaces
export interface ProfileSearchCriteria {
  skills?: string[];
  industries?: string[];
  location?: string;
  remotePreference?: string;
  salaryMin?: number;
  salaryMax?: number;
  limit?: number;
}

export interface ProfileSearchResult {
  id: string;
  userId: string;
  headline: string | null;
  summary: string | null;
  location: string | null;
  skills: string[];
  industries: string[];
  salaryExpectationMin: number | null;
  salaryExpectationMax: number | null;
  remotePreference: string;
  isVerified: boolean;
  completionPercentage: number;
  updatedAt: Date;
}

// CV generation interfaces
export interface CVGenerationRequest {
  templateId: string;
  label: string;
  isDefault?: boolean;
  sections: CVSections;
  customizations?: CVCustomizations;
  format?: 'pdf' | 'html' | 'png';
}

export interface CVSections {
  includePersonalDetails: boolean;
  includeWorkExperience: boolean;
  includeEducation: boolean;
  includeSkills: boolean;
  includePortfolio: boolean;
  customSections?: Array<{
    title: string;
    content: string;
    order: number;
  }>;
}

export interface CVCustomizations {
  primaryColor?: string;
  fontSize?: 'small' | 'medium' | 'large';
  fontFamily?: string;
  spacing?: 'compact' | 'normal' | 'relaxed';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

// Portfolio item interfaces
export interface PortfolioItemCreateRequest {
  title: string;
  description?: string;
  type: string;
  externalUrl?: string;
  technologies?: string[];
  projectDate?: string;
  role?: string;
  isPublic?: boolean;
  sortOrder?: number;
}

export interface PortfolioItemUpdateRequest {
  title?: string;
  description?: string;
  type?: string;
  externalUrl?: string;
  technologies?: string[];
  projectDate?: string;
  role?: string;
  isPublic?: boolean;
  sortOrder?: number;
}

// Validation functions
export function validateProfileData<T>(schema: ZodSchema<T>, data: any): ValidationResult {
  try {
    const result = schema.parse(data);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          message: err.message,
          path: err.path.map(p => p.toString())
        }))
      };
    }
    return {
      success: false,
      errors: [{ message: 'Validation failed' }]
    };
  }
}

export function validateCVData<T>(schema: ZodSchema<T>, data: any): ValidationResult {
  return validateProfileData(schema, data);
}

export function validatePortfolioData<T>(schema: ZodSchema<T>, data: any): ValidationResult {
  return validateProfileData(schema, data);
}

// File validation functions
export function validateCVFile(file: File): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (file.size > 10 * 1024 * 1024) {
    errors.push('File size exceeds 10MB limit');
  }
  
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('Invalid file type. Only PDF, DOC, and DOCX files are allowed.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validatePortfolioFile(file: File): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (file.size > 20 * 1024 * 1024) {
    errors.push('File size exceeds 20MB limit');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}