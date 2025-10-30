/**
 * Education API Routes
 * 
 * Handles educational background CRUD operations, validation,
 * and academic history management.
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
import { db, candidateProfiles, education as educationTable, workExperience } from '../lib/database';

// Type definitions for education
type InsertEducation = any; // TODO: Add proper types when education schema is in schema.ts
type SelectEducation = any;

// Enum for degree types
enum DegreeType {
  HIGH_SCHOOL = 'HIGH_SCHOOL',
  ASSOCIATE = 'ASSOCIATE',
  BACHELOR = 'BACHELOR',
  MASTER = 'MASTER',
  PHD = 'PHD',
  CERTIFICATE = 'CERTIFICATE',
  DIPLOMA = 'DIPLOMA',
  OTHER = 'OTHER'
}

// Alias for consistency
const education = educationTable;

const app = new Hono<{ Variables: { user?: any; userId?: string } }>();

/**
 * Education creation schema
 */
const educationCreateSchema = z.object({
  institution: z.string().min(1, 'Institution name is required').max(200),
  degree: z.string().min(1, 'Degree is required').max(200),
  degreeType: z.enum(['HIGH_SCHOOL', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'PHD', 'CERTIFICATE', 'DIPLOMA', 'OTHER']),
  fieldOfStudy: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  graduationYear: z.number().min(1950).max(new Date().getFullYear() + 10).optional(),
  isCurrentlyEnrolled: z.boolean().default(false),
  gpa: z.number().min(0).max(4.0).optional(),
  maxGpa: z.number().min(0).max(4.0).optional(),
  description: z.string().max(1000).optional(),
  achievements: z.array(z.string().max(300)).max(10).optional(),
  coursework: z.array(z.string().max(100)).max(20).optional(),
  activities: z.array(z.string().max(200)).max(10).optional(),
  honors: z.array(z.string().max(200)).max(10).optional(),
  thesis: z.object({
    title: z.string().max(300),
    description: z.string().max(1000).optional(),
    advisor: z.string().max(100).optional(),
    url: z.string().url().optional()
  }).optional(),
  isVerified: z.boolean().default(false)
}).refine(data => {
  // If not currently enrolled, end date or graduation year is required
  if (!data.isCurrentlyEnrolled && !data.endDate && !data.graduationYear) {
    return false;
  }
  return true;
}, {
  message: 'End date or graduation year is required unless currently enrolled'
}).refine(data => {
  // End date must be after start date
  if (data.endDate && data.startDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: 'End date must be after start date'
}).refine(data => {
  // GPA validation
  if (data.gpa !== undefined && data.maxGpa !== undefined) {
    return data.gpa <= data.maxGpa;
  }
  return true;
}, {
  message: 'GPA cannot exceed maximum GPA'
});

/**
 * Education update schema (partial)
 * Note: Using explicit optional fields since the base schema has refinements
 */
const educationUpdateSchema = z.object({
  institution: z.string().min(1).max(200).optional(),
  degree: z.string().min(1).max(200).optional(),
  degreeType: z.enum(['HIGH_SCHOOL', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'PHD', 'CERTIFICATE', 'DIPLOMA', 'OTHER']).optional(),
  fieldOfStudy: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  graduationYear: z.number().min(1950).max(new Date().getFullYear() + 10).optional(),
  isCurrentlyEnrolled: z.boolean().optional(),
  gpa: z.number().min(0).max(4.0).optional(),
  maxGpa: z.number().min(0).max(4.0).optional(),
  description: z.string().max(1000).optional(),
  achievements: z.array(z.string().max(300)).max(10).optional(),
  coursework: z.array(z.string().max(100)).max(20).optional(),
  activities: z.array(z.string().max(200)).max(10).optional(),
  honors: z.array(z.string().max(200)).max(10).optional(),
  thesis: z.object({
    title: z.string().max(300),
    description: z.string().max(1000).optional(),
    advisor: z.string().max(100).optional(),
    url: z.string().url().optional()
  }).optional(),
  isVerified: z.boolean().optional()
}).passthrough();

/**
 * GET /api/education/user/:userId
 * Get education records for a user
 */
app.get(
  '/user/:userId',
  ...authPatterns.authenticated,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId,
    query: z.object({
      degreeType: z.enum(['HIGH_SCHOOL', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'PHD', 'CERTIFICATE', 'DIPLOMA', 'OTHER']).optional(),
      verified: z.string().transform(val => val === 'true').optional(),
      sortBy: z.enum(['startDate', 'endDate', 'graduationYear', 'institution', 'degree']).optional().default('startDate'),
      sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;
    const { degreeType, verified, sortBy, sortOrder } = validationHelpers.getValidated(c).query;

    let query = db
      .select()
      .from(education)
      .where(eq(education.userId, userId));

    // Apply filters
    if (degreeType) {
      query = query.where(
        and(
          eq(education.userId, userId),
          eq(education.degreeType, degreeType as DegreeType)
        )
      );
    }

    if (verified !== undefined) {
      query = query.where(
        and(
          eq(education.userId, userId),
          eq(education.isVerified, verified)
        )
      );
    }

    // Apply sorting
    const sortColumn = education[sortBy as keyof typeof education];
    if (sortOrder === 'desc') {
      query = query.orderBy(desc(sortColumn));
    } else {
      query = query.orderBy(sortColumn);
    }

    const educationRecords = await query;

    return c.json({
      success: true,
      data: {
        education: educationRecords,
        total: educationRecords.length,
        userId
      }
    });
  })
);

/**
 * POST /api/education
 * Create new education record
 */
app.post(
  '/',
  ...authPatterns.verifiedUser,
  validate({
    body: educationCreateSchema
  }),
  asyncHandler(async (c: AuthContext) => {
    const userId = c.userId!;
    const educationData = validationHelpers.getValidated(c).body;

    // Prepare data for insertion
    const insertData: InsertEducation = {
      userId,
      institution: educationData.institution,
      degree: educationData.degree,
      degreeType: educationData.degreeType as DegreeType,
      fieldOfStudy: educationData.fieldOfStudy || null,
      location: educationData.location || null,
      startDate: new Date(educationData.startDate),
      endDate: educationData.endDate ? new Date(educationData.endDate) : null,
      graduationYear: educationData.graduationYear || null,
      isCurrentlyEnrolled: educationData.isCurrentlyEnrolled,
      gpa: educationData.gpa || null,
      maxGpa: educationData.maxGpa || null,
      description: educationData.description || null,
      achievements: educationData.achievements || [],
      coursework: educationData.coursework || [],
      activities: educationData.activities || [],
      honors: educationData.honors || [],
      thesis: educationData.thesis as any || null,
      isVerified: educationData.isVerified,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [newEducation] = await db
      .insert(education)
      .values(insertData)
      .returning();

    return c.json({
      success: true,
      data: newEducation,
      message: 'Education record added successfully'
    }, 201);
  })
);

/**
 * GET /api/education/:educationId
 * Get specific education record
 */
app.get(
  '/:educationId',
  ...authPatterns.authenticated,
  validate({
    params: z.object({
      educationId: z.string().uuid('Invalid education ID')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { educationId } = validationHelpers.getValidated(c).params;
    const userId = c.userId!;

    const [educationRecord] = await db
      .select()
      .from(education)
      .where(
        and(
          eq(education.id, educationId),
          eq(education.userId, userId)
        )
      )
      .limit(1);

    if (!educationRecord) {
      throw ErrorFactory.notFoundError('Education record');
    }

    return c.json({
      success: true,
      data: educationRecord
    });
  })
);

/**
 * PUT /api/education/:educationId
 * Update education record
 */
app.put(
  '/:educationId',
  ...authPatterns.verifiedUser,
  validate({
    params: z.object({
      educationId: z.string().uuid('Invalid education ID')
    }),
    body: educationUpdateSchema
  }),
  asyncHandler(async (c: AuthContext) => {
    const { educationId } = validationHelpers.getValidated(c).params;
    const updateData = validationHelpers.getValidated(c).body;
    const userId = c.userId!;

    // Check if education record exists and belongs to user
    const [existingEducation] = await db
      .select()
      .from(education)
      .where(
        and(
          eq(education.id, educationId),
          eq(education.userId, userId)
        )
      )
      .limit(1);

    if (!existingEducation) {
      throw ErrorFactory.notFoundError('Education record');
    }

    // Prepare update data
    const updateFields: Partial<InsertEducation> = {
      updatedAt: new Date()
    };

    if (updateData.institution !== undefined) updateFields.institution = updateData.institution;
    if (updateData.degree !== undefined) updateFields.degree = updateData.degree;
    if (updateData.degreeType !== undefined) updateFields.degreeType = updateData.degreeType as DegreeType;
    if (updateData.fieldOfStudy !== undefined) updateFields.fieldOfStudy = updateData.fieldOfStudy;
    if (updateData.location !== undefined) updateFields.location = updateData.location;
    if (updateData.startDate !== undefined) updateFields.startDate = new Date(updateData.startDate);
    if (updateData.endDate !== undefined) updateFields.endDate = updateData.endDate ? new Date(updateData.endDate) : null;
    if (updateData.graduationYear !== undefined) updateFields.graduationYear = updateData.graduationYear;
    if (updateData.isCurrentlyEnrolled !== undefined) updateFields.isCurrentlyEnrolled = updateData.isCurrentlyEnrolled;
    if (updateData.gpa !== undefined) updateFields.gpa = updateData.gpa;
    if (updateData.maxGpa !== undefined) updateFields.maxGpa = updateData.maxGpa;
    if (updateData.description !== undefined) updateFields.description = updateData.description;
    if (updateData.achievements !== undefined) updateFields.achievements = updateData.achievements;
    if (updateData.coursework !== undefined) updateFields.coursework = updateData.coursework;
    if (updateData.activities !== undefined) updateFields.activities = updateData.activities;
    if (updateData.honors !== undefined) updateFields.honors = updateData.honors;
    if (updateData.thesis !== undefined) updateFields.thesis = updateData.thesis as any;
    if (updateData.isVerified !== undefined) updateFields.isVerified = updateData.isVerified;

    const [updatedEducation] = await db
      .update(education)
      .set(updateFields)
      .where(eq(education.id, educationId))
      .returning();

    return c.json({
      success: true,
      data: updatedEducation,
      message: 'Education record updated successfully'
    });
  })
);

/**
 * DELETE /api/education/:educationId
 * Delete education record
 */
app.delete(
  '/:educationId',
  ...authPatterns.authenticated,
  validate({
    params: z.object({
      educationId: z.string().uuid('Invalid education ID')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { educationId } = validationHelpers.getValidated(c).params;
    const userId = c.userId!;

    // Check if education record exists and belongs to user
    const [existingEducation] = await db
      .select()
      .from(education)
      .where(
        and(
          eq(education.id, educationId),
          eq(education.userId, userId)
        )
      )
      .limit(1);

    if (!existingEducation) {
      throw ErrorFactory.notFoundError('Education record');
    }

    await db
      .delete(education)
      .where(eq(education.id, educationId));

    return c.json({
      success: true,
      message: 'Education record deleted successfully'
    });
  })
);

/**
 * POST /api/education/:educationId/validate
 * Validate education record data
 */
app.post(
  '/:educationId/validate',
  ...authPatterns.authenticated,
  validate({
    params: z.object({
      educationId: z.string().uuid('Invalid education ID')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { educationId } = validationHelpers.getValidated(c).params;
    const userId = c.userId!;

    const [educationRecord] = await db
      .select()
      .from(education)
      .where(
        and(
          eq(education.id, educationId),
          eq(education.userId, userId)
        )
      )
      .limit(1);

    if (!educationRecord) {
      throw ErrorFactory.notFoundError('Education record');
    }

    // Perform validation checks
    const validationResult = {
      isValid: true,
      score: 100,
      issues: [] as Array<{type: string, field: string, message: string}>,
      suggestions: [] as string[]
    };

    // Check for missing fields
    if (!educationRecord.fieldOfStudy) {
      validationResult.issues.push({
        type: 'warning',
        field: 'fieldOfStudy',
        message: 'Consider adding field of study for better context'
      });
      validationResult.score -= 10;
    }

    if (!educationRecord.description || educationRecord.description.length < 20) {
      validationResult.suggestions.push('Add a description of your studies or key learning outcomes');
      validationResult.score -= 10;
    }

    if (!educationRecord.achievements || educationRecord.achievements.length === 0) {
      validationResult.suggestions.push('Add academic achievements, awards, or notable accomplishments');
      validationResult.score -= 15;
    }

    if (!educationRecord.coursework || educationRecord.coursework.length === 0) {
      validationResult.suggestions.push('List relevant coursework to showcase your academic focus');
      validationResult.score -= 10;
    }

    // Date validation
    const now = new Date();
    const startDate = new Date(educationRecord.startDate);
    
    if (startDate > now && !educationRecord.isCurrentlyEnrolled) {
      validationResult.issues.push({
        type: 'error',
        field: 'startDate',
        message: 'Start date cannot be in the future unless currently enrolled'
      });
      validationResult.isValid = false;
      validationResult.score -= 30;
    }

    if (educationRecord.endDate) {
      const endDate = new Date(educationRecord.endDate);
      if (endDate > now && !educationRecord.isCurrentlyEnrolled) {
        validationResult.issues.push({
          type: 'warning',
          field: 'endDate',
          message: 'End date is in the future - consider marking as currently enrolled'
        });
        validationResult.score -= 5;
      }
    }

    // GPA validation
    if (educationRecord.gpa && !educationRecord.maxGpa) {
      validationResult.suggestions.push('Add maximum GPA scale for context (e.g., 4.0, 5.0)');
      validationResult.score -= 5;
    }

    // Graduation year consistency
    if (educationRecord.graduationYear && educationRecord.endDate) {
      const endYear = new Date(educationRecord.endDate).getFullYear();
      if (Math.abs(educationRecord.graduationYear - endYear) > 1) {
        validationResult.issues.push({
          type: 'warning',
          field: 'graduationYear',
          message: 'Graduation year doesn\'t match end date'
        });
        validationResult.score -= 5;
      }
    }

    return c.json({
      success: true,
      data: validationResult
    });
  })
);

/**
 * GET /api/education/suggestions/institutions
 * Get institution name suggestions
 */
app.get(
  '/suggestions/institutions',
  ...authPatterns.authenticated,
  validate({
    query: z.object({
      query: z.string().min(1).max(100),
      limit: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 1 && val <= 20).optional().default('10')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { query, limit } = validationHelpers.getValidated(c).query;

    // Get institution suggestions from existing education records
    const institutions = await db
      .selectDistinct({ institution: education.institution })
      .from(education)
      .where(sql`${education.institution} ILIKE ${'%' + query + '%'}`)
      .limit(limit);

    const suggestions = institutions.map(i => i.institution).filter(Boolean);

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
 * GET /api/education/suggestions/degrees
 * Get degree name suggestions
 */
app.get(
  '/suggestions/degrees',
  ...authPatterns.authenticated,
  validate({
    query: z.object({
      query: z.string().min(1).max(100),
      degreeType: z.enum(['HIGH_SCHOOL', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'PHD', 'CERTIFICATE', 'DIPLOMA', 'OTHER']).optional(),
      limit: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 1 && val <= 20).optional().default('10')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { query, degreeType, limit } = validationHelpers.getValidated(c).query;

    let dbQuery = db
      .selectDistinct({ degree: education.degree })
      .from(education)
      .where(sql`${education.degree} ILIKE ${'%' + query + '%'}`);

    if (degreeType) {
      dbQuery = dbQuery.where(
        and(
          sql`${education.degree} ILIKE ${'%' + query + '%'}`,
          eq(education.degreeType, degreeType as DegreeType)
        )
      );
    }

    const degrees = await dbQuery.limit(limit);
    const suggestions = degrees.map(d => d.degree).filter(Boolean);

    return c.json({
      success: true,
      data: {
        suggestions,
        query,
        degreeType
      }
    });
  })
);

/**
 * GET /api/education/suggestions/fields
 * Get field of study suggestions
 */
app.get(
  '/suggestions/fields',
  ...authPatterns.authenticated,
  validate({
    query: z.object({
      query: z.string().min(1).max(100),
      limit: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 1 && val <= 20).optional().default('10')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { query, limit } = validationHelpers.getValidated(c).query;

    const fields = await db
      .selectDistinct({ fieldOfStudy: education.fieldOfStudy })
      .from(education)
      .where(
        and(
          sql`${education.fieldOfStudy} ILIKE ${'%' + query + '%'}`,
          sql`${education.fieldOfStudy} IS NOT NULL`
        )
      )
      .limit(limit);

    const suggestions = fields.map(f => f.fieldOfStudy).filter(Boolean);

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
 * GET /api/education/user/:userId/summary
 * Get education summary and statistics
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

    const educationRecords = await db
      .select()
      .from(education)
      .where(eq(education.userId, userId))
      .orderBy(desc(education.graduationYear));

    // Calculate summary statistics
    const totalEducation = educationRecords.length;
    const institutions = new Set<string>();
    const fields = new Set<string>();
    const degreeTypes = new Map<string, number>();
    let highestDegreeLevel = 0;
    let totalGPA = 0;
    let gpaCount = 0;

    const degreeHierarchy = {
      'HIGH_SCHOOL': 1,
      'CERTIFICATE': 2,
      'DIPLOMA': 2,
      'ASSOCIATE': 3,
      'BACHELOR': 4,
      'MASTER': 5,
      'PHD': 6,
      'OTHER': 0
    };

    educationRecords.forEach(edu => {
      institutions.add(edu.institution);
      if (edu.fieldOfStudy) fields.add(edu.fieldOfStudy);
      
      const degreeType = edu.degreeType;
      degreeTypes.set(degreeType, (degreeTypes.get(degreeType) || 0) + 1);

      const degreeLevel = degreeHierarchy[degreeType] || 0;
      if (degreeLevel > highestDegreeLevel) {
        highestDegreeLevel = degreeLevel;
      }

      if (edu.gpa && edu.maxGpa) {
        // Normalize GPA to 4.0 scale for averaging
        const normalizedGPA = (edu.gpa / edu.maxGpa) * 4.0;
        totalGPA += normalizedGPA;
        gpaCount++;
      }
    });

    const highestDegree = educationRecords.find(edu => 
      degreeHierarchy[edu.degreeType] === highestDegreeLevel
    );

    const currentEducation = educationRecords.find(edu => edu.isCurrentlyEnrolled);
    const averageGPA = gpaCount > 0 ? Math.round((totalGPA / gpaCount) * 100) / 100 : null;

    const summary = {
      totalEducation,
      uniqueInstitutions: institutions.size,
      fieldsOfStudy: Array.from(fields),
      degreeTypeDistribution: Object.fromEntries(degreeTypes),
      highestDegree: highestDegree ? {
        degree: highestDegree.degree,
        degreeType: highestDegree.degreeType,
        institution: highestDegree.institution,
        graduationYear: highestDegree.graduationYear,
        fieldOfStudy: highestDegree.fieldOfStudy
      } : null,
      currentEducation: currentEducation ? {
        degree: currentEducation.degree,
        institution: currentEducation.institution,
        startDate: currentEducation.startDate,
        fieldOfStudy: currentEducation.fieldOfStudy
      } : null,
      averageGPA: averageGPA,
      totalAchievements: educationRecords.reduce((total, edu) => total + (edu.achievements?.length || 0), 0),
      totalHonors: educationRecords.reduce((total, edu) => total + (edu.honors?.length || 0), 0),
      verifiedRecords: educationRecords.filter(edu => edu.isVerified).length,
      educationTimeline: educationRecords.slice(0, 5).map(edu => ({
        degree: edu.degree,
        institution: edu.institution,
        startDate: edu.startDate,
        endDate: edu.endDate,
        graduationYear: edu.graduationYear,
        isCurrentlyEnrolled: edu.isCurrentlyEnrolled
      }))
    };

    return c.json({
      success: true,
      data: summary
    });
  })
);

/**
 * POST /api/education/:educationId/verify
 * Request verification for education record
 */
app.post(
  '/:educationId/verify',
  ...authPatterns.verifiedUser,
  validate({
    params: z.object({
      educationId: z.string().uuid('Invalid education ID')
    }),
    body: z.object({
      verificationMethod: z.enum(['transcript', 'diploma', 'registrar_contact']),
      documents: z.array(z.string().url()).optional(),
      additionalInfo: z.string().max(500).optional()
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { educationId } = validationHelpers.getValidated(c).params;
    const verificationData = validationHelpers.getValidated(c).body;
    const userId = c.userId!;

    // Check if education record exists and belongs to user
    const [educationRecord] = await db
      .select()
      .from(education)
      .where(
        and(
          eq(education.id, educationId),
          eq(education.userId, userId)
        )
      )
      .limit(1);

    if (!educationRecord) {
      throw ErrorFactory.notFoundError('Education record');
    }

    // TODO: Implement actual verification process
    // For now, return success message

    return c.json({
      success: true,
      message: 'Verification request submitted successfully',
      data: {
        verificationId: crypto.randomUUID(),
        status: 'pending',
        submittedAt: new Date(),
        estimatedProcessingTime: '5-7 business days',
        method: verificationData.verificationMethod
      }
    }, 202);
  })
);

export default app;