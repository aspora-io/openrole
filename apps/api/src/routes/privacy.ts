/**
 * Privacy and Settings API Routes
 * 
 * Handles GDPR compliance, privacy controls, data export/deletion,
 * and user preference management.
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
import { privacyService } from '../services/privacy-service';

const app = new Hono<{ Variables: { user?: any; userId?: string } }>();

/**
 * Privacy settings schema
 */
const privacySettingsSchema = z.object({
  privacyLevel: z.enum(['PUBLIC', 'SEMI_PRIVATE', 'PRIVATE']),
  profileVisibility: z.object({
    fullName: z.boolean(),
    email: z.boolean(),
    phoneNumber: z.boolean(),
    location: z.boolean(),
    workExperience: z.boolean(),
    education: z.boolean(),
    skills: z.boolean(),
    portfolio: z.boolean(),
    profileImage: z.boolean().optional(),
    socialLinks: z.boolean().optional()
  }),
  searchableByRecruiters: z.boolean(),
  allowDirectContact: z.boolean(),
  showSalaryExpectations: z.boolean(),
  showAvailability: z.boolean().optional(),
  allowLinkedInSync: z.boolean().optional(),
  allowGitHubSync: z.boolean().optional()
});

/**
 * Data export options schema
 */
const dataExportSchema = z.object({
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
  includeAnalytics: z.boolean().default(false),
  includePrivateData: z.boolean().default(true),
  includeFiles: z.boolean().default(false),
  dateRange: z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional()
  }).optional()
});

/**
 * Data deletion options schema
 */
const dataDeletionSchema = z.object({
  deleteType: z.enum(['profile_only', 'all_data', 'selective']),
  keepAnalytics: z.boolean().default(false),
  reason: z.string().max(500).optional(),
  confirmationCode: z.string().min(6).max(20).optional(),
  selectiveData: z.object({
    profile: z.boolean().optional(),
    workExperience: z.boolean().optional(),
    education: z.boolean().optional(),
    portfolio: z.boolean().optional(),
    cvDocuments: z.boolean().optional(),
    files: z.boolean().optional(),
    analytics: z.boolean().optional()
  }).optional()
});

/**
 * GET /api/privacy/settings/:userId
 * Get user's privacy settings
 */
app.get(
  '/settings/:userId',
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
 * PUT /api/privacy/settings/:userId
 * Update user's privacy settings
 */
app.put(
  '/settings/:userId',
  ...authPatterns.authenticated,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId,
    body: privacySettingsSchema.partial()
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;
    const settingsUpdate = validationHelpers.getValidated(c).body;

    const updatedSettings = await privacyService.updatePrivacySettings(userId, settingsUpdate);

    return c.json({
      success: true,
      data: updatedSettings,
      message: 'Privacy settings updated successfully'
    });
  })
);

/**
 * POST /api/privacy/export/:userId
 * Export user data (GDPR Article 20 - Right to data portability)
 */
app.post(
  '/export/:userId',
  ...authPatterns.authenticated,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId,
    body: dataExportSchema
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;
    const exportOptions = validationHelpers.getValidated(c).body;

    const exportResult = await privacyService.exportUserData(userId, exportOptions);

    if (exportOptions.format === 'json') {
      return c.json({
        success: true,
        data: exportResult,
        message: 'Data export completed successfully'
      });
    } else {
      // For CSV/PDF, return as file download
      const contentType = exportOptions.format === 'csv' ? 'text/csv' : 'application/pdf';
      const filename = `user-data-export-${userId}.${exportOptions.format}`;

      return c.body(exportResult.data as Buffer, 200, {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': (exportResult.data as Buffer).length.toString()
      });
    }
  })
);

/**
 * POST /api/privacy/delete/:userId
 * Delete user data (GDPR Article 17 - Right to erasure)
 */
app.post(
  '/delete/:userId',
  ...authPatterns.authenticated,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId,
    body: dataDeletionSchema
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;
    const deletionOptions = validationHelpers.getValidated(c).body;

    // TODO: Implement confirmation code verification for security
    if (deletionOptions.deleteType === 'all_data' && !deletionOptions.confirmationCode) {
      throw ErrorFactory.validationError(
        'Confirmation code required for complete data deletion'
      );
    }

    const deletionResult = await privacyService.deleteUserData(userId, deletionOptions);

    return c.json({
      success: true,
      data: deletionResult,
      message: 'Data deletion completed successfully'
    });
  })
);

/**
 * POST /api/privacy/anonymize/:userId
 * Anonymize user data (GDPR compliance)
 */
app.post(
  '/anonymize/:userId',
  ...authPatterns.authenticated,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId,
    body: z.object({
      keepAnalytics: z.boolean().default(true),
      reason: z.string().max(500).optional()
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;
    const anonymizeOptions = validationHelpers.getValidated(c).body;

    const anonymizeResult = await privacyService.anonymizeUserData(userId, anonymizeOptions);

    return c.json({
      success: true,
      data: anonymizeResult,
      message: 'User data anonymized successfully'
    });
  })
);

/**
 * GET /api/privacy/compliance/:userId
 * Get GDPR compliance status
 */
app.get(
  '/compliance/:userId',
  ...authPatterns.authenticated,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;

    const complianceStatus = await privacyService.getGDPRComplianceStatus(userId);

    return c.json({
      success: true,
      data: complianceStatus
    });
  })
);

/**
 * POST /api/privacy/consent/:userId
 * Record user consent for data processing
 */
app.post(
  '/consent/:userId',
  ...authPatterns.authenticated,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId,
    body: z.object({
      consentType: z.enum([
        'data_processing',
        'marketing_communications',
        'analytics_tracking',
        'third_party_sharing',
        'ai_processing'
      ]),
      granted: z.boolean(),
      version: z.string().optional(),
      ipAddress: z.string().optional(),
      userAgent: z.string().optional()
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;
    const consentData = validationHelpers.getValidated(c).body;

    // Add request metadata
    const consentRecord = {
      ...consentData,
      ipAddress: consentData.ipAddress || c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP'),
      userAgent: consentData.userAgent || c.req.header('User-Agent'),
      timestamp: new Date()
    };

    const result = await privacyService.recordConsent(userId, consentRecord);

    return c.json({
      success: true,
      data: result,
      message: 'Consent recorded successfully'
    });
  })
);

/**
 * GET /api/privacy/consent/:userId
 * Get user's consent history
 */
app.get(
  '/consent/:userId',
  ...authPatterns.authenticated,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId,
    query: z.object({
      type: z.enum([
        'data_processing',
        'marketing_communications',
        'analytics_tracking',
        'third_party_sharing',
        'ai_processing'
      ]).optional(),
      ...commonSchemas.pagination.shape
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;
    const { type, page, limit } = validationHelpers.getValidated(c).query;

    const consentHistory = await privacyService.getConsentHistory(userId, type);

    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedHistory = consentHistory.slice(startIndex, endIndex);

    return c.json({
      success: true,
      data: {
        consent: paginatedHistory,
        pagination: {
          page,
          limit,
          total: consentHistory.length,
          hasMore: endIndex < consentHistory.length
        }
      }
    });
  })
);

/**
 * GET /api/privacy/data-sources/:userId
 * Get information about what data is collected and why
 */
app.get(
  '/data-sources/:userId',
  ...authPatterns.authenticated,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;

    const dataSources = await privacyService.getDataSources(userId);

    return c.json({
      success: true,
      data: dataSources
    });
  })
);

/**
 * GET /api/privacy/third-party-sharing/:userId
 * Get information about third-party data sharing
 */
app.get(
  '/third-party-sharing/:userId',
  ...authPatterns.authenticated,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;

    const sharingInfo = await privacyService.getThirdPartySharing(userId);

    return c.json({
      success: true,
      data: sharingInfo
    });
  })
);

/**
 * POST /api/privacy/opt-out/:userId
 * Opt out of specific data processing activities
 */
app.post(
  '/opt-out/:userId',
  ...authPatterns.authenticated,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId,
    body: z.object({
      optOutType: z.enum([
        'marketing_emails',
        'analytics_tracking',
        'profile_recommendations',
        'search_indexing',
        'ai_training_data'
      ]),
      reason: z.string().max(500).optional()
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;
    const optOutData = validationHelpers.getValidated(c).body;

    const result = await privacyService.processOptOut(userId, optOutData);

    return c.json({
      success: true,
      data: result,
      message: 'Opt-out processed successfully'
    });
  })
);

/**
 * POST /api/privacy/data-correction/:userId
 * Request data correction (GDPR Article 16 - Right to rectification)
 */
app.post(
  '/data-correction/:userId',
  ...authPatterns.authenticated,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId,
    body: z.object({
      dataType: z.enum(['profile', 'work_experience', 'education', 'portfolio', 'other']),
      field: z.string().max(100),
      currentValue: z.string().max(1000),
      correctedValue: z.string().max(1000),
      reason: z.string().max(500),
      evidence: z.array(z.string().url()).optional() // URLs to supporting documents
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;
    const correctionRequest = validationHelpers.getValidated(c).body;

    const result = await privacyService.requestDataCorrection(userId, correctionRequest);

    return c.json({
      success: true,
      data: result,
      message: 'Data correction request submitted successfully'
    });
  })
);

/**
 * GET /api/privacy/requests/:userId
 * Get user's privacy-related requests (exports, deletions, corrections)
 */
app.get(
  '/requests/:userId',
  ...authPatterns.authenticated,
  requireOwnership('userId'),
  validate({
    params: commonSchemas.userId,
    query: z.object({
      type: z.enum(['export', 'deletion', 'correction', 'opt_out']).optional(),
      status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
      ...commonSchemas.pagination.shape
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const { userId } = validationHelpers.getValidated(c).params;
    const { type, status, page, limit } = validationHelpers.getValidated(c).query;

    const requests = await privacyService.getPrivacyRequests(userId, { type, status });

    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRequests = requests.slice(startIndex, endIndex);

    return c.json({
      success: true,
      data: {
        requests: paginatedRequests,
        pagination: {
          page,
          limit,
          total: requests.length,
          hasMore: endIndex < requests.length
        }
      }
    });
  })
);

/**
 * GET /api/privacy/policy
 * Get current privacy policy information
 */
app.get(
  '/policy',
  asyncHandler(async (c: AuthContext) => {
    const policyInfo = {
      version: '1.0.0',
      effectiveDate: '2025-01-01',
      lastUpdated: '2025-09-30',
      gdprCompliant: true,
      ccpaCompliant: true,
      dataRetentionPeriod: '7 years',
      contactEmail: 'privacy@openrole.net',
      dpoContact: 'dpo@openrole.net',
      keyPrinciples: [
        'Data minimization - We only collect necessary data',
        'Purpose limitation - Data used only for stated purposes',
        'Transparency - Clear information about data use',
        'User control - Users control their data',
        'Security - Strong protection measures'
      ],
      userRights: [
        'Right to access your data',
        'Right to correct inaccurate data',
        'Right to delete your data',
        'Right to data portability',
        'Right to object to processing',
        'Right to restrict processing'
      ]
    };

    return c.json({
      success: true,
      data: policyInfo
    });
  })
);

/**
 * POST /api/privacy/verify-identity
 * Verify user identity for sensitive privacy operations
 */
app.post(
  '/verify-identity',
  ...authPatterns.authenticated,
  validate({
    body: z.object({
      verificationMethod: z.enum(['email_code', 'sms_code', 'security_questions']),
      verificationData: z.record(z.any())
    })
  }),
  asyncHandler(async (c: AuthContext) => {
    const userId = c.userId!;
    const { verificationMethod, verificationData } = validationHelpers.getValidated(c).body;

    const result = await privacyService.verifyIdentity(userId, verificationMethod, verificationData);

    return c.json({
      success: true,
      data: result,
      message: 'Identity verification completed'
    });
  })
);

export default app;