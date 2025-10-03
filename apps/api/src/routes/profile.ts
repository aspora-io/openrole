/**
 * Profile Management API Routes
 * 
 * Handles candidate profile CRUD operations, privacy controls,
 * and profile management features.
 * 
 * @author OpenRole Team
 * @date 2025-09-30
 */

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { 
  authMiddleware, 
  optionalAuthMiddleware, 
  requireOwnership,
  authPatterns,
  type AuthContext 
} from '../middleware/auth';
import { 
  validateProfile, 
  commonSchemas, 
  validate,
  validationHelpers 
} from '../middleware/validation';
import { asyncHandler, ErrorFactory } from '../middleware/errors';
import { profileService } from '../services/profile-service';
import { privacyService } from '../services/privacy-service';

const app = new Hono<{ Variables: { user?: any; userId?: string } }>();

/**
 * GET /api/profile/:userId
 * Get candidate profile by user ID
 */
app.get(
  '/:userId',
  ...authPatterns.publicWithLimits,
  validate({
    params: commonSchemas.userId
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;
    const viewerUserId = c.userId;

    const profile = await profileService.getProfile(userId, viewerUserId);
    
    if (!profile) {
      throw ErrorFactory.notFoundError('Profile');
    }

    return c.json({
      success: true,
      data: profile
    });
  })
);

/**
 * POST /api/profile
 * Create new candidate profile
 */
app.post(
  '/',
  ...authPatterns.verifiedUser,
  validateProfile.create,
  asyncHandler(async (c: AuthContext) => {
    const profileData = validationHelpers.getValidated(c).body;
    const userId = c.userId!;

    // Check if profile already exists
    const existingProfile = await profileService.getProfile(userId, userId);
    if (existingProfile) {
      throw ErrorFactory.conflictError(
        'Profile already exists',
        { userId }
      );
    }

    const profile = await profileService.createProfile(userId, profileData);

    return c.json({
      success: true,
      data: profile,
      message: 'Profile created successfully'
    }, 201);
  })
);

/**
 * PUT /api/profile/:userId
 * Update candidate profile
 */
app.put(
  '/:userId',
  ...authPatterns.verifiedUser,
  requireOwnership('userId'),
  validateProfile.update,
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;
    const updateData = validationHelpers.getValidated(c).body;

    const profile = await profileService.updateProfile(userId, updateData);

    return c.json({
      success: true,
      data: profile,
      message: 'Profile updated successfully'
    });
  })
);

/**
 * DELETE /api/profile/:userId
 * Delete candidate profile
 */
app.delete(
  '/:userId',
  ...authPatterns.verifiedUser,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;

    const success = await profileService.deleteProfile(userId);
    
    if (!success) {
      throw ErrorFactory.notFoundError('Profile');
    }

    return c.json({
      success: true,
      message: 'Profile deleted successfully'
    });
  })
);

/**
 * GET /api/profile/:userId/completion
 * Get profile completion status
 */
app.get(
  '/:userId/completion',
  ...authPatterns.authenticated,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;

    const completion = await profileService.getProfileCompletion(userId);

    return c.json({
      success: true,
      data: completion
    });
  })
);

/**
 * POST /api/profile/:userId/verify
 * Request profile verification
 */
app.post(
  '/:userId/verify',
  ...authPatterns.verifiedUser,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId,
    body: z.object({
      documentType: z.enum(['passport', 'drivers_license', 'national_id']),
      documentNumber: z.string().min(1).max(50),
      additionalInfo: z.string().max(500).optional()
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;
    const verificationData = validationHelpers.getValidated(c).body;

    // TODO: Implement verification request logic
    // For now, return success message
    
    return c.json({
      success: true,
      message: 'Verification request submitted successfully',
      data: {
        status: 'pending',
        submittedAt: new Date(),
        expectedProcessingTime: '2-3 business days'
      }
    }, 202);
  })
);

/**
 * GET /api/profile/:userId/privacy
 * Get privacy settings
 */
app.get(
  '/:userId/privacy',
  ...authPatterns.authenticated,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;

    const settings = await privacyService.getPrivacySettings(userId);

    return c.json({
      success: true,
      data: settings
    });
  })
);

/**
 * PUT /api/profile/:userId/privacy
 * Update privacy settings
 */
app.put(
  '/:userId/privacy',
  ...authPatterns.authenticated,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId,
    body: z.object({
      privacyLevel: z.enum(['PUBLIC', 'SEMI_PRIVATE', 'PRIVATE']),
      profileVisibility: z.object({
        fullName: z.boolean(),
        email: z.boolean(),
        phoneNumber: z.boolean(),
        location: z.boolean(),
        workExperience: z.boolean(),
        education: z.boolean(),
        skills: z.boolean(),
        portfolio: z.boolean()
      }).optional(),
      searchableByRecruiters: z.boolean().optional(),
      allowDirectContact: z.boolean().optional(),
      showSalaryExpectations: z.boolean().optional()
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;
    const privacyData = validationHelpers.getValidated(c).body;

    const settings = await privacyService.updatePrivacySettings(userId, privacyData);

    return c.json({
      success: true,
      data: settings,
      message: 'Privacy settings updated successfully'
    });
  })
);

/**
 * GET /api/profile/:userId/analytics
 * Get profile analytics (views, searches, etc.)
 */
app.get(
  '/:userId/analytics',
  ...authPatterns.authenticated,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId,
    query: z.object({
      days: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 1 && val <= 365).optional().default('30')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;
    const { days } = validationHelpers.getValidated(c).query;

    const analytics = await profileService.getProfileAnalytics(userId, days);

    return c.json({
      success: true,
      data: analytics
    });
  })
);

/**
 * POST /api/profile/:userId/export
 * Export profile data (GDPR compliance)
 */
app.post(
  '/:userId/export',
  ...authPatterns.authenticated,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId,
    body: z.object({
      format: z.enum(['json', 'pdf', 'csv']).default('json'),
      includeAnalytics: z.boolean().default(false),
      includePrivateData: z.boolean().default(true)
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;
    const exportOptions = validationHelpers.getValidated(c).body;

    const exportResult = await privacyService.exportUserData(userId, exportOptions);

    return c.json({
      success: true,
      data: exportResult,
      message: 'Data export completed successfully'
    });
  })
);

/**
 * GET /api/profile/:userId/recommendations
 * Get profile improvement recommendations
 */
app.get(
  '/:userId/recommendations',
  ...authPatterns.authenticated,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;

    const recommendations = await profileService.getProfileRecommendations(userId);

    return c.json({
      success: true,
      data: recommendations
    });
  })
);

/**
 * POST /api/profile/:userId/contact
 * Contact candidate (for recruiters)
 */
app.post(
  '/:userId/contact',
  ...authPatterns.verifiedUser,
  validate({
    params: commonSchemas.userId,
    body: z.object({
      subject: z.string().min(1).max(200),
      message: z.string().min(10).max(2000),
      jobTitle: z.string().max(200).optional(),
      companyName: z.string().max(200).optional(),
      contactType: z.enum(['job_opportunity', 'networking', 'collaboration', 'other']).default('job_opportunity')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId: candidateId } = validationHelpers.getValidated(c).params;
    const contactData = validationHelpers.getValidated(c).body;
    const recruiterId = c.userId!;

    // Check if candidate allows direct contact
    const privacySettings = await privacyService.getPrivacySettings(candidateId);
    if (!privacySettings.allowDirectContact) {
      throw ErrorFactory.authorizationError('This candidate does not allow direct contact');
    }

    // TODO: Implement contact/messaging system
    // For now, return success message

    return c.json({
      success: true,
      message: 'Contact request sent successfully',
      data: {
        contactId: crypto.randomUUID(),
        status: 'sent',
        sentAt: new Date()
      }
    }, 201);
  })
);

/**
 * GET /api/profile/search/suggestions
 * Get search suggestions for profile discovery
 */
app.get(
  '/search/suggestions',
  optionalAuthMiddleware,
  validate({
    query: z.object({
      type: z.enum(['skills', 'locations', 'companies', 'industries']),
      query: z.string().min(1).max(100),
      limit: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 1 && val <= 20).optional().default('10')
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { type, query, limit } = validationHelpers.getValidated(c).query;

    let suggestions: string[] = [];

    switch (type) {
      case 'skills':
        suggestions = await profileService.suggestSkills(query, limit);
        break;
      case 'locations':
        suggestions = await profileService.suggestLocations(query, limit);
        break;
      case 'companies':
        suggestions = await profileService.suggestCompanies(query, limit);
        break;
      case 'industries':
        suggestions = await profileService.suggestIndustries(query, limit);
        break;
    }

    return c.json({
      success: true,
      data: {
        suggestions,
        type,
        query
      }
    });
  })
);

export default app;