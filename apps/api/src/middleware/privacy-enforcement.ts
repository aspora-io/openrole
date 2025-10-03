/**
 * Privacy Enforcement Middleware
 * 
 * Enforces privacy controls, GDPR compliance, and data access restrictions
 * based on user privacy settings and profile visibility rules.
 * 
 * @author OpenRole Team
 * @date 2025-10-01
 */

import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { ErrorFactory } from './errors';
import { privacyService } from '../services/privacy-service';

// Privacy levels enum
export enum PrivacyLevel {
  PUBLIC = 'PUBLIC',
  SEMI_PRIVATE = 'SEMI_PRIVATE', 
  PRIVATE = 'PRIVATE'
}

// User role enum for privacy checks
export enum UserRole {
  CANDIDATE = 'CANDIDATE',
  RECRUITER = 'RECRUITER',
  ADMIN = 'ADMIN',
  ANONYMOUS = 'ANONYMOUS'
}

/**
 * Privacy settings interface
 */
interface PrivacySettings {
  privacyLevel: PrivacyLevel;
  profileVisibility: {
    fullName: boolean;
    email: boolean;
    phoneNumber: boolean;
    location: boolean;
    workExperience: boolean;
    education: boolean;
    skills: boolean;
    portfolio: boolean;
  };
  searchableByRecruiters: boolean;
  allowDirectContact: boolean;
  showSalaryExpectations: boolean;
  dataRetentionDays?: number;
  allowAnalytics?: boolean;
}

/**
 * Privacy context for middleware
 */
interface PrivacyContext {
  viewerUserId?: string;
  viewerRole: UserRole;
  targetUserId: string;
  requestedFields?: string[];
  action: 'read' | 'write' | 'delete' | 'export';
}

/**
 * Check if user can access another user's data
 */
async function canAccessUserData(context: PrivacyContext): Promise<boolean> {
  const { viewerUserId, viewerRole, targetUserId, action } = context;

  // Self-access is always allowed
  if (viewerUserId === targetUserId) {
    return true;
  }

  // Admin access (with audit logging)
  if (viewerRole === UserRole.ADMIN) {
    console.log(`[PRIVACY] Admin ${viewerUserId} accessing ${targetUserId} data for ${action}`);
    return true;
  }

  // Get target user's privacy settings
  const privacySettings = await privacyService.getPrivacySettings(targetUserId);
  
  if (!privacySettings) {
    // Default to private if no settings found
    return false;
  }

  // Check based on privacy level
  switch (privacySettings.privacyLevel) {
    case PrivacyLevel.PUBLIC:
      return action === 'read'; // Public profiles can be read by anyone
      
    case PrivacyLevel.SEMI_PRIVATE:
      // Semi-private profiles can be read by authenticated users
      return action === 'read' && viewerRole !== UserRole.ANONYMOUS;
      
    case PrivacyLevel.PRIVATE:
      // Private profiles cannot be accessed by others
      return false;
      
    default:
      return false;
  }
}

/**
 * Filter profile data based on visibility settings
 */
async function filterProfileData(
  profileData: any,
  context: PrivacyContext
): Promise<any> {
  const { viewerUserId, targetUserId } = context;

  // Self-access returns full data
  if (viewerUserId === targetUserId) {
    return profileData;
  }

  // Get privacy settings
  const privacySettings = await privacyService.getPrivacySettings(targetUserId);
  
  if (!privacySettings) {
    // Return minimal data if no privacy settings
    return {
      id: profileData.id,
      username: profileData.username,
      publicProfile: false
    };
  }

  const { profileVisibility } = privacySettings;
  const filteredData: any = {
    id: profileData.id,
    username: profileData.username
  };

  // Apply field-level visibility
  if (profileVisibility.fullName) {
    filteredData.fullName = profileData.fullName;
  }

  if (profileVisibility.email) {
    filteredData.email = profileData.email;
  }

  if (profileVisibility.phoneNumber) {
    filteredData.phoneNumber = profileData.phoneNumber;
  }

  if (profileVisibility.location) {
    filteredData.location = profileData.location;
  }

  if (profileVisibility.workExperience) {
    filteredData.workExperience = profileData.workExperience;
  }

  if (profileVisibility.education) {
    filteredData.education = profileData.education;
  }

  if (profileVisibility.skills) {
    filteredData.skills = profileData.skills;
  }

  if (profileVisibility.portfolio) {
    filteredData.portfolio = profileData.portfolio;
  }

  // Hide salary expectations if not allowed
  if (privacySettings.showSalaryExpectations) {
    filteredData.salaryExpectations = profileData.salaryExpectations;
  }

  return filteredData;
}

/**
 * Main privacy enforcement middleware
 */
export function enforcePrivacy(options: {
  action?: 'read' | 'write' | 'delete' | 'export';
  requireOwnership?: boolean;
  allowedRoles?: UserRole[];
  targetUserIdParam?: string;
} = {}) {
  const {
    action = 'read',
    requireOwnership = false,
    allowedRoles = [UserRole.CANDIDATE, UserRole.RECRUITER, UserRole.ADMIN],
    targetUserIdParam = 'userId'
  } = options;

  return async (c: Context, next: Next) => {
    try {
      const viewerUserId = c.get('userId') as string;
      const viewerRole = c.get('userRole') as UserRole || UserRole.ANONYMOUS;
      const targetUserId = c.req.param(targetUserIdParam);

      if (!targetUserId) {
        throw ErrorFactory.validationError(`Missing ${targetUserIdParam} parameter`);
      }

      // Check if user role is allowed
      if (!allowedRoles.includes(viewerRole)) {
        throw ErrorFactory.authorizationError(
          'Insufficient permissions for this action',
          { requiredRoles: allowedRoles, userRole: viewerRole }
        );
      }

      // Check ownership requirement
      if (requireOwnership && viewerUserId !== targetUserId) {
        throw ErrorFactory.authorizationError(
          'You can only access your own data',
          { action, targetUserId }
        );
      }

      // Create privacy context
      const privacyContext: PrivacyContext = {
        viewerUserId,
        viewerRole,
        targetUserId,
        action
      };

      // Check access permissions
      const canAccess = await canAccessUserData(privacyContext);
      
      if (!canAccess) {
        throw ErrorFactory.authorizationError(
          'Access denied due to privacy settings',
          { action, targetUserId }
        );
      }

      // Store privacy context for later use
      c.set('privacyContext', privacyContext);
      
      await next();
      
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      
      throw ErrorFactory.authorizationError(
        'Privacy enforcement failed',
        { error: error.message }
      );
    }
  };
}

/**
 * Data filtering middleware - applies after route handler
 */
export function filterResponseData(c: Context, responseData: any): any {
  const privacyContext = c.get('privacyContext') as PrivacyContext;
  
  if (!privacyContext) {
    return responseData;
  }

  // If it's a profile data response, filter it
  if (responseData && typeof responseData === 'object') {
    if (responseData.data && responseData.data.id) {
      // Single profile response
      return {
        ...responseData,
        data: filterProfileData(responseData.data, privacyContext)
      };
    }
    
    if (Array.isArray(responseData.data)) {
      // Multiple profiles response
      return {
        ...responseData,
        data: responseData.data.map((item: any) => 
          filterProfileData(item, privacyContext)
        )
      };
    }
  }
  
  return responseData;
}

/**
 * GDPR compliance middleware
 */
export function enforceGDPR(c: Context, next: Next) {
  return async () => {
    const userLocation = c.req.header('CF-IPCountry') || 
                        c.req.header('X-User-Location') || 
                        'unknown';
    
    // Enhanced privacy requirements for EU users
    const isEUUser = [
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
    ].includes(userLocation);

    if (isEUUser) {
      c.set('gdprRequired', true);
      c.set('userLocation', userLocation);
      
      // Add GDPR compliance headers
      c.header('X-Privacy-Policy', 'https://openrole.net/privacy');
      c.header('X-Data-Controller', 'OpenRole.net');
      c.header('X-GDPR-Compliant', 'true');
    }

    await next();
  };
}

/**
 * Data retention enforcement
 */
export async function enforceDataRetention(userId: string): Promise<void> {
  const privacySettings = await privacyService.getPrivacySettings(userId);
  
  if (!privacySettings?.dataRetentionDays) {
    return; // No custom retention policy
  }

  const retentionDays = privacySettings.dataRetentionDays;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  // TODO: Implement data cleanup based on retention policy
  console.log(`[PRIVACY] Data retention check for user ${userId}: ${retentionDays} days`);
}

/**
 * Audit logging for privacy-sensitive operations
 */
export function auditPrivacyAccess(
  action: string,
  viewerUserId: string,
  targetUserId: string,
  additionalData: any = {}
) {
  const auditLog = {
    timestamp: new Date().toISOString(),
    action,
    viewerUserId,
    targetUserId,
    success: true,
    ...additionalData
  };

  // TODO: Send to audit logging service
  console.log('[PRIVACY AUDIT]', JSON.stringify(auditLog));
}

/**
 * Contact permission middleware
 */
export function enforceContactPermissions() {
  return async (c: Context, next: Next) => {
    const viewerUserId = c.get('userId') as string;
    const targetUserId = c.req.param('userId');

    if (!targetUserId) {
      throw ErrorFactory.validationError('Missing userId parameter');
    }

    // Get target user's privacy settings
    const privacySettings = await privacyService.getPrivacySettings(targetUserId);
    
    if (!privacySettings?.allowDirectContact) {
      throw ErrorFactory.authorizationError(
        'This user does not allow direct contact',
        { targetUserId }
      );
    }

    // Audit the contact attempt
    auditPrivacyAccess('contact_attempt', viewerUserId, targetUserId);

    await next();
  };
}

/**
 * Search visibility enforcement
 */
export function enforceSearchVisibility() {
  return async (c: Context, next: Next) => {
    // This middleware filters search results based on privacy settings
    // Applied after search results are generated
    
    await next();
    
    // Post-process search results
    const response = await c.res.clone().json();
    
    if (response.data && Array.isArray(response.data.results)) {
      const filteredResults = [];
      
      for (const result of response.data.results) {
        const privacySettings = await privacyService.getPrivacySettings(result.userId);
        
        if (privacySettings?.searchableByRecruiters || 
            privacySettings?.privacyLevel === PrivacyLevel.PUBLIC) {
          filteredResults.push(result);
        }
      }
      
      // Update response with filtered results
      const newResponse = {
        ...response,
        data: {
          ...response.data,
          results: filteredResults,
          total: filteredResults.length
        }
      };
      
      return c.json(newResponse);
    }
  };
}

/**
 * Pre-configured privacy middleware exports
 */
export const privacyMiddleware = {
  // Basic privacy enforcement
  read: enforcePrivacy({ action: 'read' }),
  write: enforcePrivacy({ action: 'write', requireOwnership: true }),
  delete: enforcePrivacy({ action: 'delete', requireOwnership: true }),
  export: enforcePrivacy({ action: 'export', requireOwnership: true }),
  
  // Role-based access
  candidatesOnly: enforcePrivacy({ 
    allowedRoles: [UserRole.CANDIDATE, UserRole.ADMIN] 
  }),
  recruitersOnly: enforcePrivacy({ 
    allowedRoles: [UserRole.RECRUITER, UserRole.ADMIN] 
  }),
  
  // Contact permissions
  contact: enforceContactPermissions(),
  
  // Search visibility
  searchFilter: enforceSearchVisibility(),
  
  // GDPR compliance
  gdpr: enforceGDPR,
  
  // Combined middleware stacks
  profileAccess: [enforcePrivacy({ action: 'read' }), enforceGDPR],
  profileUpdate: [enforcePrivacy({ action: 'write', requireOwnership: true }), enforceGDPR],
  dataExport: [enforcePrivacy({ action: 'export', requireOwnership: true }), enforceGDPR]
};

export default privacyMiddleware;