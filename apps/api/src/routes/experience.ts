/**
 * Work Experience API Routes
 * 
 * Handles work experience CRUD operations, validation,
 * and professional history management.
 * 
 * @author OpenRole Team
 * @date 2025-09-30
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { 
  authPatterns,
  requireOwnership,
  type AuthContext 
} from '../middleware/auth';
import { 
  validate,
  commonSchemas,
  validationHelpers 
} from '../middleware/validation';
import { asyncHandler, ErrorFactory } from '../middleware/errors';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db, workExperience as workExperienceTable, candidateProfiles } from '../lib/database';

// Type definitions for work experience
type InsertWorkExperience = any; // TODO: Add proper types when work_experience schema is in schema.ts
type SelectWorkExperience = any;

// Enum definitions
enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  FREELANCE = 'FREELANCE',
  INTERNSHIP = 'INTERNSHIP',
  VOLUNTEER = 'VOLUNTEER'
}

enum CompanySize {
  STARTUP = 'STARTUP',
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
  ENTERPRISE = 'ENTERPRISE'
}

// Alias for consistency
const workExperience = workExperienceTable;

const app = new Hono<{ Variables: { user?: any; userId?: string } }>();

/**
 * Work experience creation schema
 */
const workExperienceCreateSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required').max(200),
  companyName: z.string().min(1, 'Company name is required').max(200),
  location: z.string().max(200).optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP', 'VOLUNTEER']),
  companySize: z.enum(['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']).optional(),
  industry: z.string().max(100).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  isCurrentRole: z.boolean().default(false),
  description: z.string().max(2000).optional(),
  achievements: z.array(z.string().max(500)).max(10).optional(),
  technologies: z.array(z.string().max(50)).max(30).optional(),
  salary: z.object({
    amount: z.number().min(0).max(10000000).optional(),
    currency: z.string().length(3).optional(),
    period: z.enum(['hourly', 'daily', 'monthly', 'yearly']).optional()
  }).optional(),
  references: z.array(z.object({
    name: z.string().max(100),
    title: z.string().max(100),
    email: z.string().email().optional(),
    phone: z.string().max(20).optional(),
    relationship: z.string().max(100)
  })).max(3).optional()
}).refine(data => {
  // If not current role, end date is required
  if (!data.isCurrentRole && !data.endDate) {
    return false;
  }
  return true;
}, {
  message: 'End date is required unless this is your current role'
}).refine(data => {
  // End date must be after start date
  if (data.endDate && data.startDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: 'End date must be after start date'
});

/**
 * Work experience update schema (partial)
 */
const workExperienceUpdateSchema = workExperienceCreateSchema.partial();

/**
 * GET /api/experience/user/:userId
 * Get work experience for a user
 */
app.get(
  '/user/:userId',
  ...authPatterns.authenticated,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId,
    query: z.object({
      includePrivate: z.string().transform(val => val === 'true').optional().default(false),
      sortBy: z.enum(['startDate', 'endDate', 'companyName', 'jobTitle']).optional().default('startDate'),
      sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;
    const { includePrivate, sortBy, sortOrder } = validationHelpers.getValidated(c).query;

    let query = db
      .select()
      .from(workExperience)
      .where(eq(workExperience.userId, userId));

    // Apply sorting
    const sortColumn = workExperience[sortBy as keyof typeof workExperience];
    if (sortOrder === 'desc') {
      query = query.orderBy(desc(sortColumn));
    } else {
      query = query.orderBy(sortColumn);
    }

    const experiences = await query;

    return c.json({
      success: true,
      data: {
        experiences,
        total: experiences.length,
        userId
      }
    });
  })
);

/**
 * POST /api/experience
 * Create new work experience
 */
app.post(
  '/',
  ...authPatterns.verifiedUser,
  validate({
    body: workExperienceCreateSchema
  }),
  asyncHandler(async (c: AuthContext) => {
    const userId = c.userId!;
    const experienceData = validationHelpers.getValidated(c).body;

    // If marking as current role, unset other current roles
    if (experienceData.isCurrentRole) {
      await db
        .update(workExperience)
        .set({ 
          isCurrentRole: false,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(workExperience.userId, userId),
            eq(workExperience.isCurrentRole, true)
          )
        );
    }

    // Prepare data for insertion
    const insertData: InsertWorkExperience = {
      userId,
      jobTitle: experienceData.jobTitle,
      companyName: experienceData.companyName,
      location: experienceData.location || null,
      employmentType: experienceData.employmentType as EmploymentType,
      companySize: experienceData.companySize as CompanySize || null,
      industry: experienceData.industry || null,
      startDate: new Date(experienceData.startDate),
      endDate: experienceData.endDate ? new Date(experienceData.endDate) : null,
      isCurrentRole: experienceData.isCurrentRole,
      description: experienceData.description || null,
      achievements: experienceData.achievements || [],
      technologies: experienceData.technologies || [],
      salary: experienceData.salary as any || null,
      references: experienceData.references as any || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [newExperience] = await db
      .insert(workExperience)
      .values(insertData)
      .returning();

    return c.json({
      success: true,
      data: newExperience,
      message: 'Work experience added successfully'
    }, 201);
  })
);

/**
 * GET /api/experience/:experienceId
 * Get specific work experience
 */
app.get(
  '/:experienceId',
  ...authPatterns.authenticated,
  validate({
    params: z.object({
      experienceId: z.string().uuid('Invalid experience ID')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { experienceId } = validationHelpers.getValidated(c).params;
    const userId = c.userId!;

    const [experience] = await db
      .select()
      .from(workExperience)
      .where(
        and(
          eq(workExperience.id, experienceId),
          eq(workExperience.userId, userId)
        )
      )
      .limit(1);

    if (!experience) {
      throw ErrorFactory.notFoundError('Work experience');
    }

    return c.json({
      success: true,
      data: experience
    });
  })
);

/**
 * PUT /api/experience/:experienceId
 * Update work experience
 */
app.put(
  '/:experienceId',
  ...authPatterns.verifiedUser,
  validate({
    params: z.object({
      experienceId: z.string().uuid('Invalid experience ID')
    }),
    body: workExperienceUpdateSchema
  }),
  asyncHandler(async (c: AuthContext) => {
    const { experienceId } = validationHelpers.getValidated(c).params;
    const updateData = validationHelpers.getValidated(c).body;
    const userId = c.userId!;

    // Check if experience exists and belongs to user
    const [existingExperience] = await db
      .select()
      .from(workExperience)
      .where(
        and(
          eq(workExperience.id, experienceId),
          eq(workExperience.userId, userId)
        )
      )
      .limit(1);

    if (!existingExperience) {
      throw ErrorFactory.notFoundError('Work experience');
    }

    // If marking as current role, unset other current roles
    if (updateData.isCurrentRole === true) {
      await db
        .update(workExperience)
        .set({ 
          isCurrentRole: false,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(workExperience.userId, userId),
            eq(workExperience.isCurrentRole, true)
          )
        );
    }

    // Prepare update data
    const updateFields: Partial<InsertWorkExperience> = {
      updatedAt: new Date()
    };

    if (updateData.jobTitle !== undefined) updateFields.jobTitle = updateData.jobTitle;
    if (updateData.companyName !== undefined) updateFields.companyName = updateData.companyName;
    if (updateData.location !== undefined) updateFields.location = updateData.location;
    if (updateData.employmentType !== undefined) updateFields.employmentType = updateData.employmentType as EmploymentType;
    if (updateData.companySize !== undefined) updateFields.companySize = updateData.companySize as CompanySize;
    if (updateData.industry !== undefined) updateFields.industry = updateData.industry;
    if (updateData.startDate !== undefined) updateFields.startDate = new Date(updateData.startDate);
    if (updateData.endDate !== undefined) updateFields.endDate = updateData.endDate ? new Date(updateData.endDate) : null;
    if (updateData.isCurrentRole !== undefined) updateFields.isCurrentRole = updateData.isCurrentRole;
    if (updateData.description !== undefined) updateFields.description = updateData.description;
    if (updateData.achievements !== undefined) updateFields.achievements = updateData.achievements;
    if (updateData.technologies !== undefined) updateFields.technologies = updateData.technologies;
    if (updateData.salary !== undefined) updateFields.salary = updateData.salary as any;
    if (updateData.references !== undefined) updateFields.references = updateData.references as any;

    const [updatedExperience] = await db
      .update(workExperience)
      .set(updateFields)
      .where(eq(workExperience.id, experienceId))
      .returning();

    return c.json({
      success: true,
      data: updatedExperience,
      message: 'Work experience updated successfully'
    });
  })
);

/**
 * DELETE /api/experience/:experienceId
 * Delete work experience
 */
app.delete(
  '/:experienceId',
  ...authPatterns.authenticated,
  validate({
    params: z.object({
      experienceId: z.string().uuid('Invalid experience ID')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { experienceId } = validationHelpers.getValidated(c).params;
    const userId = c.userId!;

    // Check if experience exists and belongs to user
    const [existingExperience] = await db
      .select()
      .from(workExperience)
      .where(
        and(
          eq(workExperience.id, experienceId),
          eq(workExperience.userId, userId)
        )
      )
      .limit(1);

    if (!existingExperience) {
      throw ErrorFactory.notFoundError('Work experience');
    }

    await db
      .delete(workExperience)
      .where(eq(workExperience.id, experienceId));

    return c.json({
      success: true,
      message: 'Work experience deleted successfully'
    });
  })
);

/**
 * POST /api/experience/:experienceId/validate
 * Validate work experience data
 */
app.post(
  '/:experienceId/validate',
  ...authPatterns.authenticated,
  validate({
    params: z.object({
      experienceId: z.string().uuid('Invalid experience ID')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { experienceId } = validationHelpers.getValidated(c).params;
    const userId = c.userId!;

    const [experience] = await db
      .select()
      .from(workExperience)
      .where(
        and(
          eq(workExperience.id, experienceId),
          eq(workExperience.userId, userId)
        )
      )
      .limit(1);

    if (!experience) {
      throw ErrorFactory.notFoundError('Work experience');
    }

    // Perform validation checks
    const validationResult = {
      isValid: true,
      score: 100,
      issues: [] as Array<{type: string, field: string, message: string}>,
      suggestions: [] as string[]
    };

    // Check for missing fields
    if (!experience.description || experience.description.length < 50) {
      validationResult.issues.push({
        type: 'warning',
        field: 'description',
        message: 'Consider adding a more detailed job description'
      });
      validationResult.score -= 15;
    }

    if (!experience.achievements || experience.achievements.length === 0) {
      validationResult.suggestions.push('Add specific achievements to highlight your impact');
      validationResult.score -= 10;
    }

    if (!experience.technologies || experience.technologies.length === 0) {
      validationResult.suggestions.push('List technologies and tools you used in this role');
      validationResult.score -= 10;
    }

    // Date validation
    const now = new Date();
    const startDate = new Date(experience.startDate);
    
    if (startDate > now) {
      validationResult.issues.push({
        type: 'error',
        field: 'startDate',
        message: 'Start date cannot be in the future'
      });
      validationResult.isValid = false;
      validationResult.score -= 30;
    }

    if (experience.endDate) {
      const endDate = new Date(experience.endDate);
      if (endDate > now) {
        validationResult.issues.push({
          type: 'warning',
          field: 'endDate',
          message: 'End date is in the future - consider marking as current role'
        });
        validationResult.score -= 5;
      }
    }

    // Role duration check
    const endDate = experience.endDate ? new Date(experience.endDate) : now;
    const durationMonths = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (durationMonths < 1) {
      validationResult.suggestions.push('Very short role duration - consider adding context in description');
    }

    return c.json({
      success: true,
      data: validationResult
    });
  })
);

/**
 * GET /api/experience/suggestions/companies
 * Get company name suggestions
 */
app.get(
  '/suggestions/companies',
  ...authPatterns.authenticated,
  validate({
    query: z.object({
      query: z.string().min(1).max(100),
      limit: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 1 && val <= 20).optional().default('10')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { query, limit } = validationHelpers.getValidated(c).query;

    // Get company suggestions from existing work experience records
    const companies = await db
      .selectDistinct({ companyName: workExperience.companyName })
      .from(workExperience)
      .where(sql`${workExperience.companyName} ILIKE ${'%' + query + '%'}`)
      .limit(limit);

    const suggestions = companies.map(c => c.companyName).filter(Boolean);

    return c.json({
      success: true,
      data: {
        suggestions,
        query
      }
    });
  })
);

/**
 * GET /api/experience/suggestions/job-titles
 * Get job title suggestions
 */
app.get(
  '/suggestions/job-titles',
  ...authPatterns.authenticated,
  validate({
    query: z.object({
      query: z.string().min(1).max(100),
      limit: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 1 && val <= 20).optional().default('10')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { query, limit } = validationHelpers.getValidated(c).query;

    // Get job title suggestions from existing work experience records
    const jobTitles = await db
      .selectDistinct({ jobTitle: workExperience.jobTitle })
      .from(workExperience)
      .where(sql`${workExperience.jobTitle} ILIKE ${'%' + query + '%'}`)
      .limit(limit);

    const suggestions = jobTitles.map(jt => jt.jobTitle).filter(Boolean);

    return c.json({
      success: true,
      data: {
        suggestions,
        query
      }
    });
  })
);

/**
 * GET /api/experience/user/:userId/summary
 * Get work experience summary and statistics
 */
app.get(
  '/user/:userId/summary',
  ...authPatterns.authenticated,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;

    const experiences = await db
      .select()
      .from(workExperience)
      .where(eq(workExperience.userId, userId))
      .orderBy(desc(workExperience.startDate));

    // Calculate summary statistics
    const totalExperience = experiences.length;
    let totalMonths = 0;
    const companies = new Set<string>();
    const industries = new Set<string>();
    const technologies = new Set<string>();
    const employmentTypes = new Map<string, number>();

    experiences.forEach(exp => {
      companies.add(exp.companyName);
      if (exp.industry) industries.add(exp.industry);
      
      exp.technologies?.forEach(tech => technologies.add(tech));
      
      const empType = exp.employmentType;
      employmentTypes.set(empType, (employmentTypes.get(empType) || 0) + 1);

      // Calculate duration
      const startDate = new Date(exp.startDate);
      const endDate = exp.endDate ? new Date(exp.endDate) : new Date();
      const months = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      totalMonths += months;
    });

    const currentRole = experiences.find(exp => exp.isCurrentRole);
    const totalYears = Math.round((totalMonths / 12) * 10) / 10;

    const summary = {
      totalPositions: totalExperience,
      totalExperienceYears: totalYears,
      uniqueCompanies: companies.size,
      industries: Array.from(industries),
      technologies: Array.from(technologies).slice(0, 20), // Top 20 technologies
      employmentTypeDistribution: Object.fromEntries(employmentTypes),
      currentRole: currentRole ? {
        title: currentRole.jobTitle,
        company: currentRole.companyName,
        startDate: currentRole.startDate,
        duration: currentRole.startDate ? 
          Math.round(((new Date().getTime() - new Date(currentRole.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30)) * 10) / 10 
          : 0
      } : null,
      careerProgression: experiences.slice(0, 5).map(exp => ({
        title: exp.jobTitle,
        company: exp.companyName,
        startDate: exp.startDate,
        endDate: exp.endDate,
        isCurrent: exp.isCurrentRole
      }))
    };

    return c.json({
      success: true,
      data: summary
    });
  })
);

export default app;