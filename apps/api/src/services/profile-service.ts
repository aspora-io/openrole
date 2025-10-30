/**
 * ProfileService - Core CRUD operations for candidate profiles
 * 
 * Handles all profile management operations including creation, reading,
 * updating, and privacy controls for candidate profiles.
 * 
 * @author OpenRole Team
 * @date 2025-09-30
 */

import { eq, and, or, sql, desc, asc } from 'drizzle-orm';
import { db, candidateProfiles, workExperience, education, portfolioItems } from '../lib/database';

// Type definitions
type InsertCandidateProfile = any; // TODO: Add proper types
type SelectCandidateProfile = any;
type ProfileCreateRequest = any;
type ProfileUpdateRequest = any;
type ProfileSearchCriteria = any;
type ProfileSearchResult = any;

// Enum definitions
enum PrivacyLevel {
  PUBLIC = 'PUBLIC',
  SEMI_PRIVATE = 'SEMI_PRIVATE',
  PRIVATE = 'PRIVATE'
}

enum RemotePreference {
  REMOTE_ONLY = 'REMOTE_ONLY',
  HYBRID = 'HYBRID',
  ON_SITE = 'ON_SITE',
  NO_PREFERENCE = 'NO_PREFERENCE'
}

export interface IProfileService {
  // Core CRUD operations
  createProfile(userId: string, data: ProfileCreateRequest): Promise<SelectCandidateProfile>;
  getProfile(userId: string): Promise<SelectCandidateProfile | null>;
  updateProfile(userId: string, data: ProfileUpdateRequest): Promise<SelectCandidateProfile>;
  deleteProfile(userId: string): Promise<boolean>;
  
  // Profile completion and verification
  updateProfileCompletion(userId: string, isComplete: boolean): Promise<SelectCandidateProfile>;
  calculateCompletionPercentage(profile: SelectCandidateProfile): number;
  calculateVerificationStatus(profile: SelectCandidateProfile): boolean;
  
  // Search and discovery
  searchProfiles(criteria: ProfileSearchCriteria): Promise<ProfileSearchResult[]>;
  getPublicProfile(profileId: string): Promise<SelectCandidateProfile | null>;
  
  // Privacy controls
  updatePrivacySettings(userId: string, privacyLevel: PrivacyLevel): Promise<SelectCandidateProfile>;
  canViewProfile(viewerUserId: string | null, targetProfile: SelectCandidateProfile): boolean;
  
  // Verification
  verifyEmail(userId: string): Promise<SelectCandidateProfile>;
  verifyIdentity(userId: string, verificationData: any): Promise<SelectCandidateProfile>;
  
  // Analytics
  getProfileStats(userId: string): Promise<{
    viewCount: number;
    lastViewed: Date | null;
    completionPercentage: number;
    verificationStatus: boolean;
  }>;
}

export class ProfileService implements IProfileService {
  /**
   * Create a new candidate profile
   */
  async createProfile(userId: string, data: ProfileCreateRequest): Promise<SelectCandidateProfile> {
    // TODO: Add proper Zod validation
    // Simple validation for now
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid profile data');
    }

    // Check if profile already exists
    const existingProfile = await this.getProfile(userId);
    if (existingProfile) {
      throw new Error('Profile already exists for this user');
    }

    // Prepare profile data
    const profileData: InsertCandidateProfile = {
      userId,
      headline: data.headline,
      summary: data.summary || null,
      location: data.location || null,
      phoneNumber: data.phoneNumber || null,
      linkedinUrl: data.linkedinUrl || null,
      portfolioUrl: data.portfolioUrl || null,
      githubUrl: data.githubUrl || null,
      skills: data.skills || [],
      industries: data.industries || [],
      salaryExpectationMin: data.salaryExpectationMin || null,
      salaryExpectationMax: data.salaryExpectationMax || null,
      remotePreference: data.remotePreference || RemotePreference.HYBRID,
      privacyLevel: data.privacyLevel || PrivacyLevel.SEMI_PRIVATE,
      isComplete: false,
      isVerified: false,
      emailVerified: false,
      identityVerified: false,
      viewCount: 0,
      lastViewedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert profile
    const [profile] = await db
      .insert(candidateProfiles)
      .values(profileData)
      .returning();

    // Calculate and update completion percentage
    const completionPercentage = this.calculateCompletionPercentage(profile);
    const isComplete = completionPercentage >= 80;

    if (completionPercentage > 0) {
      const [updatedProfile] = await db
        .update(candidateProfiles)
        .set({ 
          completionPercentage,
          isComplete,
          updatedAt: new Date()
        })
        .where(eq(candidateProfiles.id, profile.id))
        .returning();

      return updatedProfile;
    }

    return profile;
  }

  /**
   * Get candidate profile by user ID
   */
  async getProfile(userId: string): Promise<SelectCandidateProfile | null> {
    const [profile] = await db
      .select()
      .from(candidateProfiles)
      .where(eq(candidateProfiles.userId, userId))
      .limit(1);

    return profile || null;
  }

  /**
   * Update candidate profile
   */
  async updateProfile(userId: string, data: ProfileUpdateRequest): Promise<SelectCandidateProfile> {
    // TODO: Add proper Zod validation
    // Simple validation for now
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid profile data');
    }

    // Check if profile exists
    const existingProfile = await this.getProfile(userId);
    if (!existingProfile) {
      throw new Error('Profile not found');
    }

    // Prepare update data (only include provided fields)
    const updateData: Partial<InsertCandidateProfile> = {
      updatedAt: new Date()
    };

    if (data.headline !== undefined) updateData.headline = data.headline;
    if (data.summary !== undefined) updateData.summary = data.summary;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
    if (data.linkedinUrl !== undefined) updateData.linkedinUrl = data.linkedinUrl;
    if (data.portfolioUrl !== undefined) updateData.portfolioUrl = data.portfolioUrl;
    if (data.githubUrl !== undefined) updateData.githubUrl = data.githubUrl;
    if (data.skills !== undefined) updateData.skills = data.skills;
    if (data.industries !== undefined) updateData.industries = data.industries;
    if (data.salaryExpectationMin !== undefined) updateData.salaryExpectationMin = data.salaryExpectationMin;
    if (data.salaryExpectationMax !== undefined) updateData.salaryExpectationMax = data.salaryExpectationMax;
    if (data.remotePreference !== undefined) updateData.remotePreference = data.remotePreference;

    // Update profile
    const [updatedProfile] = await db
      .update(candidateProfiles)
      .set(updateData)
      .where(eq(candidateProfiles.userId, userId))
      .returning();

    // Recalculate completion percentage
    const completionPercentage = this.calculateCompletionPercentage(updatedProfile);
    const isComplete = completionPercentage >= 80;
    const isVerified = this.calculateVerificationStatus(updatedProfile);

    // Update completion and verification status if changed
    if (updatedProfile.completionPercentage !== completionPercentage || 
        updatedProfile.isComplete !== isComplete ||
        updatedProfile.isVerified !== isVerified) {
      
      const [finalProfile] = await db
        .update(candidateProfiles)
        .set({ 
          completionPercentage,
          isComplete,
          isVerified,
          updatedAt: new Date()
        })
        .where(eq(candidateProfiles.id, updatedProfile.id))
        .returning();

      return finalProfile;
    }

    return updatedProfile;
  }

  /**
   * Delete candidate profile (soft delete by setting privacy to private)
   */
  async deleteProfile(userId: string): Promise<boolean> {
    const result = await db
      .update(candidateProfiles)
      .set({ 
        privacyLevel: PrivacyLevel.PRIVATE,
        isComplete: false,
        updatedAt: new Date()
      })
      .where(eq(candidateProfiles.userId, userId));

    return result.rowCount > 0;
  }

  /**
   * Update profile completion status
   */
  async updateProfileCompletion(userId: string, isComplete: boolean): Promise<SelectCandidateProfile> {
    const [profile] = await db
      .update(candidateProfiles)
      .set({ 
        isComplete,
        updatedAt: new Date()
      })
      .where(eq(candidateProfiles.userId, userId))
      .returning();

    if (!profile) {
      throw new Error('Profile not found');
    }

    return profile;
  }

  /**
   * Calculate profile completion percentage based on filled fields
   */
  calculateCompletionPercentage(profile: SelectCandidateProfile): number {
    const fields = [
      profile.headline,
      profile.summary,
      profile.location,
      profile.skills && profile.skills.length > 0,
      profile.industries && profile.industries.length > 0,
      profile.salaryExpectationMin,
      profile.remotePreference,
      profile.linkedinUrl || profile.portfolioUrl || profile.githubUrl
    ];

    const filledFields = fields.filter(field => 
      field !== null && field !== undefined && field !== ''
    ).length;

    return Math.round((filledFields / fields.length) * 100);
  }

  /**
   * Calculate verification status based on email and identity verification
   */
  calculateVerificationStatus(profile: SelectCandidateProfile): boolean {
    return profile.emailVerified && profile.identityVerified;
  }

  /**
   * Search profiles based on criteria
   */
  async searchProfiles(criteria: ProfileSearchCriteria): Promise<ProfileSearchResult[]> {
    // TODO: Add proper Zod validation
    // Simple validation for now
    if (!criteria) {
      criteria = {};
    }

    let query = db
      .select({
        id: candidateProfiles.id,
        userId: candidateProfiles.userId,
        headline: candidateProfiles.headline,
        summary: candidateProfiles.summary,
        location: candidateProfiles.location,
        skills: candidateProfiles.skills,
        industries: candidateProfiles.industries,
        salaryExpectationMin: candidateProfiles.salaryExpectationMin,
        salaryExpectationMax: candidateProfiles.salaryExpectationMax,
        remotePreference: candidateProfiles.remotePreference,
        isVerified: candidateProfiles.isVerified,
        completionPercentage: candidateProfiles.completionPercentage,
        updatedAt: candidateProfiles.updatedAt
      })
      .from(candidateProfiles)
      .where(
        and(
          eq(candidateProfiles.isComplete, true),
          or(
            eq(candidateProfiles.privacyLevel, PrivacyLevel.PUBLIC),
            eq(candidateProfiles.privacyLevel, PrivacyLevel.SEMI_PRIVATE)
          )
        )
      );

    // Apply filters
    const conditions = [];

    if (criteria.skills && criteria.skills.length > 0) {
      // Search for profiles that have any of the specified skills
      conditions.push(
        sql`${candidateProfiles.skills} @> ${JSON.stringify(criteria.skills)}`
      );
    }

    if (criteria.industries && criteria.industries.length > 0) {
      // Search for profiles in any of the specified industries
      conditions.push(
        sql`${candidateProfiles.industries} && ${JSON.stringify(criteria.industries)}`
      );
    }

    if (criteria.location) {
      conditions.push(
        sql`${candidateProfiles.location} ILIKE ${'%' + criteria.location + '%'}`
      );
    }

    if (criteria.remotePreference) {
      conditions.push(eq(candidateProfiles.remotePreference, criteria.remotePreference));
    }

    if (criteria.salaryMin || criteria.salaryMax) {
      if (criteria.salaryMin) {
        conditions.push(sql`${candidateProfiles.salaryExpectationMax} >= ${criteria.salaryMin}`);
      }
      if (criteria.salaryMax) {
        conditions.push(sql`${candidateProfiles.salaryExpectationMin} <= ${criteria.salaryMax}`);
      }
    }

    if (criteria.isVerified !== undefined) {
      conditions.push(eq(candidateProfiles.isVerified, criteria.isVerified));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortField = criteria.sortBy || 'updatedAt';
    const sortOrder = criteria.sortOrder || 'desc';

    switch (sortField) {
      case 'completionPercentage':
        query = sortOrder === 'asc'
          ? query.orderBy(asc(candidateProfiles.completionPercentage))
          : query.orderBy(desc(candidateProfiles.completionPercentage));
        break;
      case 'updatedAt':
      default:
        query = sortOrder === 'asc'
          ? query.orderBy(asc(candidateProfiles.updatedAt))
          : query.orderBy(desc(candidateProfiles.updatedAt));
        break;
    }

    // Apply pagination
    const limit = Math.min(criteria.limit || 20, 100); // Max 100 results
    const offset = ((criteria.page || 1) - 1) * limit;

    const results = await query.limit(limit).offset(offset);

    return results;
  }

  /**
   * Get public profile by profile ID
   */
  async getPublicProfile(profileId: string): Promise<SelectCandidateProfile | null> {
    const [profile] = await db
      .select()
      .from(candidateProfiles)
      .where(
        and(
          eq(candidateProfiles.id, profileId),
          eq(candidateProfiles.privacyLevel, PrivacyLevel.PUBLIC)
        )
      )
      .limit(1);

    if (profile) {
      // Increment view count
      await db
        .update(candidateProfiles)
        .set({ 
          viewCount: sql`${candidateProfiles.viewCount} + 1`,
          lastViewedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(candidateProfiles.id, profileId));
    }

    return profile || null;
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(userId: string, privacyLevel: PrivacyLevel): Promise<SelectCandidateProfile> {
    const [profile] = await db
      .update(candidateProfiles)
      .set({ 
        privacyLevel,
        updatedAt: new Date()
      })
      .where(eq(candidateProfiles.userId, userId))
      .returning();

    if (!profile) {
      throw new Error('Profile not found');
    }

    return profile;
  }

  /**
   * Check if viewer can view target profile based on privacy settings
   */
  canViewProfile(viewerUserId: string | null, targetProfile: SelectCandidateProfile): boolean {
    // Owner can always view their own profile
    if (viewerUserId === targetProfile.userId) {
      return true;
    }

    // Public profiles can be viewed by anyone
    if (targetProfile.privacyLevel === PrivacyLevel.PUBLIC) {
      return true;
    }

    // Semi-private profiles can be viewed by logged-in users
    if (targetProfile.privacyLevel === PrivacyLevel.SEMI_PRIVATE && viewerUserId) {
      return true;
    }

    // Anonymous profiles and private profiles cannot be viewed
    return false;
  }

  /**
   * Verify email address
   */
  async verifyEmail(userId: string): Promise<SelectCandidateProfile> {
    const [profile] = await db
      .update(candidateProfiles)
      .set({ 
        emailVerified: true,
        updatedAt: new Date()
      })
      .where(eq(candidateProfiles.userId, userId))
      .returning();

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Recalculate verification status
    const isVerified = this.calculateVerificationStatus(profile);
    
    if (profile.isVerified !== isVerified) {
      const [updatedProfile] = await db
        .update(candidateProfiles)
        .set({ 
          isVerified,
          updatedAt: new Date()
        })
        .where(eq(candidateProfiles.id, profile.id))
        .returning();

      return updatedProfile;
    }

    return profile;
  }

  /**
   * Verify identity with documentation
   */
  async verifyIdentity(userId: string, verificationData: any): Promise<SelectCandidateProfile> {
    // TODO: Implement identity verification logic
    // This would typically involve document verification, background checks, etc.
    
    const [profile] = await db
      .update(candidateProfiles)
      .set({ 
        identityVerified: true,
        updatedAt: new Date()
      })
      .where(eq(candidateProfiles.userId, userId))
      .returning();

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Recalculate verification status
    const isVerified = this.calculateVerificationStatus(profile);
    
    if (profile.isVerified !== isVerified) {
      const [updatedProfile] = await db
        .update(candidateProfiles)
        .set({ 
          isVerified,
          updatedAt: new Date()
        })
        .where(eq(candidateProfiles.id, profile.id))
        .returning();

      return updatedProfile;
    }

    return profile;
  }

  /**
   * Get profile analytics and stats
   */
  async getProfileStats(userId: string): Promise<{
    viewCount: number;
    lastViewed: Date | null;
    completionPercentage: number;
    verificationStatus: boolean;
  }> {
    const profile = await this.getProfile(userId);
    
    if (!profile) {
      throw new Error('Profile not found');
    }

    return {
      viewCount: profile.viewCount,
      lastViewed: profile.lastViewedAt,
      completionPercentage: profile.completionPercentage,
      verificationStatus: profile.isVerified
    };
  }
}

// Export singleton instance
export const profileService = new ProfileService();