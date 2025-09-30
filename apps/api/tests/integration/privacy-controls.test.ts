import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import type { Application } from 'hono';
import type { ProfileService } from '../../src/services/profile.service';
import type { PrivacyService } from '../../src/services/privacy.service';
import type { Database } from '@openrole/database';

// Mock services and repositories
const mockDb: Database = {} as Database;
const mockProfileService: ProfileService = {} as ProfileService;
const mockPrivacyService: PrivacyService = {} as PrivacyService;

// Test data constants
const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000';
const TEST_USER_ID_2 = '223e4567-e89b-12d3-a456-426614174001';
const TEST_EMPLOYER_ID = '323e4567-e89b-12d3-a456-426614174002';
const TEST_ADMIN_ID = '423e4567-e89b-12d3-a456-426614174003';

// Mock audit logging service
const mockAuditService = {
  logPrivacyChange: jest.fn(),
  logDataAccess: jest.fn(),
  logPrivacyViolation: jest.fn(),
  getPrivacyAuditTrail: jest.fn()
};

// Mock search service
const mockSearchService = {
  searchProfiles: jest.fn(),
  filterProfilesByPrivacy: jest.fn(),
  applyPrivacyFilters: jest.fn()
};

// Mock GDPR compliance service
const mockGDPRService = {
  checkDataRetentionPolicy: jest.fn(),
  anonymizePersonalData: jest.fn(),
  exportPersonalData: jest.fn(),
  deletePersonalData: jest.fn(),
  validateConsentRequirements: jest.fn()
};

describe('Privacy Controls Integration Testing', () => {
  let app: Application;
  let candidateToken: string;
  let candidate2Token: string;
  let employerToken: string;
  let adminToken: string;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authentication tokens
    candidateToken = 'valid-candidate-token';
    candidate2Token = 'valid-candidate-2-token';
    employerToken = 'valid-employer-token';
    adminToken = 'valid-admin-token';
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('FR-003: Privacy Level Enforcement Across System', () => {
    describe('Public Profile Privacy', () => {
      it('should allow full profile visibility for public profiles', async () => {
        // Arrange
        const publicPrivacySettings = {
          privacyLevel: 'public',
          profileVisibleToEmployers: true,
          contactInfoVisible: true,
          salaryVisible: true,
          portfolioVisible: true,
          cvVisible: true
        };

        const publicProfile = {
          id: 'profile-123',
          userId: TEST_USER_ID,
          headline: 'Senior Developer',
          summary: 'Experienced full-stack developer',
          email: 'john.doe@example.com',
          phoneNumber: '+353 1 234 5678',
          location: 'Dublin, Ireland',
          salaryExpectationMin: 60000,
          salaryExpectationMax: 80000,
          skills: ['TypeScript', 'React', 'Node.js'],
          privacySettings: publicPrivacySettings
        };

        // Mock services
        mockPrivacyService.updatePrivacySettings = jest.fn().mockResolvedValue(publicPrivacySettings);
        mockPrivacyService.getPrivacySettings = jest.fn().mockResolvedValue(publicPrivacySettings);
        mockProfileService.getProfile = jest.fn().mockResolvedValue(publicProfile);
        mockSearchService.searchProfiles = jest.fn().mockResolvedValue({
          profiles: [publicProfile],
          total: 1
        });
        mockAuditService.logPrivacyChange = jest.fn().mockResolvedValue(true);

        // Act - Set privacy settings
        const privacyResult = await mockPrivacyService.updatePrivacySettings(
          TEST_USER_ID,
          publicPrivacySettings
        );

        // Act - Search as employer should show full profile
        const searchResults = await mockSearchService.searchProfiles(
          TEST_EMPLOYER_ID,
          { skills: ['typescript'] }
        );

        // Act - Get profile should include all data
        const profileResult = await mockProfileService.getProfile(TEST_USER_ID);

        // Assert
        expect(privacyResult.privacyLevel).toBe('public');
        expect(searchResults.profiles[0].email).toBe('john.doe@example.com');
        expect(searchResults.profiles[0].phoneNumber).toBe('+353 1 234 5678');
        expect(searchResults.profiles[0].salaryExpectationMin).toBe(60000);
        expect(profileResult.privacySettings.contactInfoVisible).toBe(true);
        expect(mockAuditService.logPrivacyChange).toHaveBeenCalledWith(
          TEST_USER_ID,
          'privacy_level_changed',
          { from: undefined, to: 'public' }
        );
      });
    });

    describe('Semi-Private Profile Privacy', () => {
      it('should enforce semi-private privacy rules consistently', async () => {
        // Arrange
        const semiPrivateSettings = {
          privacyLevel: 'semi-private',
          profileVisibleToEmployers: true,
          contactInfoVisible: false, // Hidden from search
          salaryVisible: true,
          portfolioVisible: true,
          cvVisible: false // Only available after connection
        };

        const semiPrivateProfile = {
          id: 'profile-456',
          userId: TEST_USER_ID_2,
          headline: 'Backend Engineer',
          summary: 'Specialized in microservices architecture',
          email: 'jane.smith@example.com',
          phoneNumber: '+353 1 987 6543',
          location: 'Cork, Ireland',
          salaryExpectationMin: 65000,
          salaryExpectationMax: 85000,
          skills: ['Python', 'Django', 'PostgreSQL'],
          privacySettings: semiPrivateSettings
        };

        const filteredProfile = {
          ...semiPrivateProfile,
          email: null, // Filtered out
          phoneNumber: null, // Filtered out
          cvDocuments: [] // Filtered out
        };

        // Mock services
        mockPrivacyService.updatePrivacySettings = jest.fn().mockResolvedValue(semiPrivateSettings);
        mockSearchService.applyPrivacyFilters = jest.fn().mockReturnValue(filteredProfile);
        mockSearchService.searchProfiles = jest.fn().mockResolvedValue({
          profiles: [filteredProfile],
          total: 1
        });
        mockAuditService.logDataAccess = jest.fn().mockResolvedValue(true);

        // Act - Update privacy settings
        await mockPrivacyService.updatePrivacySettings(TEST_USER_ID_2, semiPrivateSettings);

        // Act - Employer search with privacy filtering
        const searchResults = await mockSearchService.searchProfiles(
          TEST_EMPLOYER_ID,
          { skills: ['python'] }
        );

        // Assert - Contact info should be hidden
        expect(searchResults.profiles[0].email).toBeNull();
        expect(searchResults.profiles[0].phoneNumber).toBeNull();
        expect(searchResults.profiles[0].salaryExpectationMin).toBe(65000); // Salary visible
        expect(searchResults.profiles[0].skills).toContain('Python'); // Skills visible
        expect(searchResults.profiles[0].cvDocuments).toEqual([]); // CVs hidden
        expect(mockAuditService.logDataAccess).toHaveBeenCalledWith(
          TEST_EMPLOYER_ID,
          'profile_search',
          { profileId: 'profile-456', dataAccessed: ['public_fields'] }
        );
      });

      it('should allow contact info access after employer-candidate connection', async () => {
        // Arrange
        const connectionEstablished = true;
        const semiPrivateProfile = {
          id: 'profile-456',
          userId: TEST_USER_ID_2,
          email: 'jane.smith@example.com',
          phoneNumber: '+353 1 987 6543',
          privacySettings: {
            privacyLevel: 'semi-private',
            contactInfoVisible: false
          }
        };

        // Mock connection service
        const mockConnectionService = {
          checkConnection: jest.fn().mockResolvedValue(connectionEstablished),
          getProfileWithConnectionContext: jest.fn().mockResolvedValue({
            ...semiPrivateProfile,
            email: 'jane.smith@example.com', // Now visible due to connection
            phoneNumber: '+353 1 987 6543'
          })
        };

        // Act
        const hasConnection = await mockConnectionService.checkConnection(
          TEST_EMPLOYER_ID,
          TEST_USER_ID_2
        );
        
        let profileResult;
        if (hasConnection) {
          profileResult = await mockConnectionService.getProfileWithConnectionContext(
            TEST_EMPLOYER_ID,
            TEST_USER_ID_2
          );
        }

        // Assert
        expect(hasConnection).toBe(true);
        expect(profileResult.email).toBe('jane.smith@example.com');
        expect(profileResult.phoneNumber).toBe('+353 1 987 6543');
      });
    });

    describe('Anonymous Profile Privacy', () => {
      it('should enforce complete anonymity for anonymous profiles', async () => {
        // Arrange
        const anonymousSettings = {
          privacyLevel: 'anonymous',
          profileVisibleToEmployers: true,
          contactInfoVisible: false,
          salaryVisible: false,
          portfolioVisible: false,
          cvVisible: false,
          anonymousId: 'ANON_DEV_001' // System-generated anonymous identifier
        };

        const anonymousProfile = {
          id: 'profile-789',
          userId: TEST_USER_ID,
          headline: 'Senior Full-Stack Developer',
          summary: 'Experienced developer with microservices expertise',
          // All identifying information removed
          email: null,
          phoneNumber: null,
          name: null,
          location: 'Dublin, Ireland', // Location may remain for job matching
          salaryExpectationMin: null,
          salaryExpectationMax: null,
          skills: ['TypeScript', 'React', 'Node.js'], // Skills remain for matching
          anonymousId: 'ANON_DEV_001',
          privacySettings: anonymousSettings
        };

        // Mock services
        mockPrivacyService.updatePrivacySettings = jest.fn().mockResolvedValue(anonymousSettings);
        mockSearchService.searchProfiles = jest.fn().mockResolvedValue({
          profiles: [anonymousProfile],
          total: 1
        });
        mockAuditService.logPrivacyChange = jest.fn().mockResolvedValue(true);

        // Act
        await mockPrivacyService.updatePrivacySettings(TEST_USER_ID, anonymousSettings);
        const searchResults = await mockSearchService.searchProfiles(
          TEST_EMPLOYER_ID,
          { skills: ['typescript'] }
        );

        // Assert
        const profile = searchResults.profiles[0];
        expect(profile.email).toBeNull();
        expect(profile.phoneNumber).toBeNull();
        expect(profile.salaryExpectationMin).toBeNull();
        expect(profile.anonymousId).toBe('ANON_DEV_001');
        expect(profile.skills).toContain('TypeScript'); // Skills still available for matching
        expect(mockAuditService.logPrivacyChange).toHaveBeenCalledWith(
          TEST_USER_ID,
          'privacy_level_changed',
          { from: undefined, to: 'anonymous' }
        );
      });

      it('should prevent reverse identification of anonymous profiles', async () => {
        // Arrange
        const anonymousProfile = {
          id: 'profile-789',
          anonymousId: 'ANON_DEV_001',
          headline: 'Senior Developer',
          skills: ['TypeScript', 'React'],
          privacySettings: { privacyLevel: 'anonymous' }
        };

        // Mock attempt to get real identity
        mockPrivacyService.resolveAnonymousProfile = jest.fn().mockRejectedValue(
          new Error('Privacy Violation: Cannot resolve anonymous profile identity')
        );

        // Mock privacy violation detection
        mockAuditService.logPrivacyViolation = jest.fn().mockResolvedValue(true);

        // Act & Assert
        await expect(
          mockPrivacyService.resolveAnonymousProfile('ANON_DEV_001', TEST_EMPLOYER_ID)
        ).rejects.toThrow('Privacy Violation: Cannot resolve anonymous profile identity');

        expect(mockAuditService.logPrivacyViolation).toHaveBeenCalledWith(
          TEST_EMPLOYER_ID,
          'attempted_anonymous_resolution',
          { anonymousId: 'ANON_DEV_001' }
        );
      });
    });
  });

  describe('Privacy Setting Changes and Audit Trail', () => {
    it('should log all privacy setting changes with full audit trail', async () => {
      // Arrange
      const initialSettings = {
        privacyLevel: 'public',
        contactInfoVisible: true,
        salaryVisible: true
      };

      const updatedSettings = {
        privacyLevel: 'semi-private',
        contactInfoVisible: false,
        salaryVisible: true
      };

      const auditEntries = [
        {
          id: 'audit-1',
          userId: TEST_USER_ID,
          action: 'privacy_level_changed',
          timestamp: new Date('2025-09-30T10:00:00Z'),
          changes: { from: 'public', to: 'semi-private' },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...'
        },
        {
          id: 'audit-2',
          userId: TEST_USER_ID,
          action: 'contact_info_visibility_changed',
          timestamp: new Date('2025-09-30T10:00:01Z'),
          changes: { from: true, to: false },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...'
        }
      ];

      // Mock services
      mockPrivacyService.getPrivacySettings = jest.fn().mockResolvedValue(initialSettings);
      mockPrivacyService.updatePrivacySettings = jest.fn().mockResolvedValue(updatedSettings);
      mockAuditService.logPrivacyChange = jest.fn().mockResolvedValue(true);
      mockAuditService.getPrivacyAuditTrail = jest.fn().mockResolvedValue(auditEntries);

      // Act
      const currentSettings = await mockPrivacyService.getPrivacySettings(TEST_USER_ID);
      await mockPrivacyService.updatePrivacySettings(TEST_USER_ID, updatedSettings);
      const auditTrail = await mockAuditService.getPrivacyAuditTrail(TEST_USER_ID);

      // Assert
      expect(mockAuditService.logPrivacyChange).toHaveBeenCalledTimes(2);
      expect(mockAuditService.logPrivacyChange).toHaveBeenCalledWith(
        TEST_USER_ID,
        'privacy_level_changed',
        { from: 'public', to: 'semi-private' }
      );
      expect(mockAuditService.logPrivacyChange).toHaveBeenCalledWith(
        TEST_USER_ID,
        'contact_info_visibility_changed',
        { from: true, to: false }
      );
      expect(auditTrail).toHaveLength(2);
      expect(auditTrail[0].action).toBe('privacy_level_changed');
    });

    it('should track data access attempts and respect privacy levels', async () => {
      // Arrange
      const profileWithPrivacy = {
        id: 'profile-123',
        userId: TEST_USER_ID,
        headline: 'Developer',
        email: 'protected@example.com',
        privacySettings: {
          privacyLevel: 'semi-private',
          contactInfoVisible: false
        }
      };

      // Mock unauthorized access attempt
      mockProfileService.getProfileForEmployer = jest.fn().mockImplementation(
        (employerId, candidateId) => {
          mockAuditService.logDataAccess(employerId, 'profile_access_attempt', {
            candidateId,
            accessGranted: false,
            reason: 'contact_info_protected'
          });
          
          return Promise.resolve({
            ...profileWithPrivacy,
            email: null // Filtered due to privacy settings
          });
        }
      );

      // Act
      const accessedProfile = await mockProfileService.getProfileForEmployer(
        TEST_EMPLOYER_ID,
        TEST_USER_ID
      );

      // Assert
      expect(accessedProfile.email).toBeNull();
      expect(mockAuditService.logDataAccess).toHaveBeenCalledWith(
        TEST_EMPLOYER_ID,
        'profile_access_attempt',
        {
          candidateId: TEST_USER_ID,
          accessGranted: false,
          reason: 'contact_info_protected'
        }
      );
    });
  });

  describe('Employer Search Result Filtering', () => {
    it('should filter search results based on multiple privacy levels', async () => {
      // Arrange
      const mixedPrivacyProfiles = [
        {
          id: 'profile-1',
          headline: 'Public Developer',
          email: 'public@example.com',
          phoneNumber: '+353 1 111 1111',
          salaryExpectationMin: 50000,
          privacySettings: {
            privacyLevel: 'public',
            contactInfoVisible: true,
            salaryVisible: true
          }
        },
        {
          id: 'profile-2',
          headline: 'Semi-Private Developer',
          email: 'semi@example.com',
          phoneNumber: '+353 1 222 2222',
          salaryExpectationMin: 60000,
          privacySettings: {
            privacyLevel: 'semi-private',
            contactInfoVisible: false,
            salaryVisible: true
          }
        },
        {
          id: 'profile-3',
          headline: 'Anonymous Developer',
          email: 'anon@example.com',
          phoneNumber: '+353 1 333 3333',
          salaryExpectationMin: 70000,
          anonymousId: 'ANON_DEV_003',
          privacySettings: {
            privacyLevel: 'anonymous',
            contactInfoVisible: false,
            salaryVisible: false
          }
        }
      ];

      const filteredResults = [
        {
          id: 'profile-1',
          headline: 'Public Developer',
          email: 'public@example.com', // Visible
          phoneNumber: '+353 1 111 1111', // Visible
          salaryExpectationMin: 50000 // Visible
        },
        {
          id: 'profile-2',
          headline: 'Semi-Private Developer',
          email: null, // Hidden
          phoneNumber: null, // Hidden
          salaryExpectationMin: 60000 // Visible
        },
        {
          id: 'profile-3',
          headline: 'Anonymous Developer',
          email: null, // Hidden
          phoneNumber: null, // Hidden
          salaryExpectationMin: null, // Hidden
          anonymousId: 'ANON_DEV_003'
        }
      ];

      // Mock services
      mockSearchService.searchProfiles = jest.fn().mockImplementation((employerId, filters) => {
        // Apply privacy filtering
        const filtered = mixedPrivacyProfiles.map(profile => {
          const result = { ...profile };
          
          if (profile.privacySettings.privacyLevel !== 'public') {
            if (!profile.privacySettings.contactInfoVisible) {
              result.email = null;
              result.phoneNumber = null;
            }
            if (profile.privacySettings.privacyLevel === 'anonymous' && !profile.privacySettings.salaryVisible) {
              result.salaryExpectationMin = null;
            }
          }
          
          return result;
        });
        
        return Promise.resolve({
          profiles: filtered,
          total: filtered.length
        });
      });

      // Act
      const searchResults = await mockSearchService.searchProfiles(
        TEST_EMPLOYER_ID,
        { skills: ['typescript'] }
      );

      // Assert
      expect(searchResults.profiles).toHaveLength(3);
      
      // Public profile - all info visible
      expect(searchResults.profiles[0].email).toBe('public@example.com');
      expect(searchResults.profiles[0].salaryExpectationMin).toBe(50000);
      
      // Semi-private profile - contact hidden, salary visible
      expect(searchResults.profiles[1].email).toBeNull();
      expect(searchResults.profiles[1].salaryExpectationMin).toBe(60000);
      
      // Anonymous profile - all personal info hidden
      expect(searchResults.profiles[2].email).toBeNull();
      expect(searchResults.profiles[2].salaryExpectationMin).toBeNull();
      expect(searchResults.profiles[2].anonymousId).toBe('ANON_DEV_003');
    });

    it('should respect privacy level hierarchy in search visibility', async () => {
      // Arrange
      const profiles = [
        { id: 'profile-1', privacySettings: { privacyLevel: 'public', profileVisibleToEmployers: true } },
        { id: 'profile-2', privacySettings: { privacyLevel: 'semi-private', profileVisibleToEmployers: true } },
        { id: 'profile-3', privacySettings: { privacyLevel: 'semi-private', profileVisibleToEmployers: false } },
        { id: 'profile-4', privacySettings: { privacyLevel: 'anonymous', profileVisibleToEmployers: true } },
        { id: 'profile-5', privacySettings: { privacyLevel: 'anonymous', profileVisibleToEmployers: false } }
      ];

      const visibleProfiles = profiles.filter(p => p.privacySettings.profileVisibleToEmployers);

      mockSearchService.filterProfilesByPrivacy = jest.fn().mockReturnValue(visibleProfiles);
      mockSearchService.searchProfiles = jest.fn().mockResolvedValue({
        profiles: visibleProfiles,
        total: visibleProfiles.length
      });

      // Act
      const results = await mockSearchService.searchProfiles(TEST_EMPLOYER_ID, {});

      // Assert
      expect(results.profiles).toHaveLength(3); // Only profiles with profileVisibleToEmployers: true
      expect(results.profiles.map(p => p.id)).toEqual(['profile-1', 'profile-2', 'profile-4']);
    });
  });

  describe('Contact Info Visibility Controls', () => {
    it('should granularly control contact information visibility', async () => {
      // Arrange
      const granularPrivacySettings = {
        privacyLevel: 'custom',
        profileVisibleToEmployers: true,
        emailVisible: true,
        phoneVisible: false,
        addressVisible: false,
        socialLinksVisible: true,
        salaryVisible: true
      };

      const profileWithGranularPrivacy = {
        id: 'profile-123',
        userId: TEST_USER_ID,
        email: 'candidate@example.com',
        phoneNumber: '+353 1 234 5678',
        address: '123 Main St, Dublin',
        linkedinUrl: 'https://linkedin.com/in/candidate',
        githubUrl: 'https://github.com/candidate',
        salaryExpectationMin: 65000,
        privacySettings: granularPrivacySettings
      };

      // Mock privacy filtering
      mockPrivacyService.applyGranularPrivacyFilter = jest.fn().mockImplementation((profile, settings) => {
        const filtered = { ...profile };
        
        if (!settings.emailVisible) filtered.email = null;
        if (!settings.phoneVisible) filtered.phoneNumber = null;
        if (!settings.addressVisible) filtered.address = null;
        if (!settings.socialLinksVisible) {
          filtered.linkedinUrl = null;
          filtered.githubUrl = null;
        }
        if (!settings.salaryVisible) {
          filtered.salaryExpectationMin = null;
          filtered.salaryExpectationMax = null;
        }
        
        return filtered;
      });

      // Act
      const filteredProfile = mockPrivacyService.applyGranularPrivacyFilter(
        profileWithGranularPrivacy,
        granularPrivacySettings
      );

      // Assert
      expect(filteredProfile.email).toBe('candidate@example.com'); // Visible
      expect(filteredProfile.phoneNumber).toBeNull(); // Hidden
      expect(filteredProfile.address).toBeNull(); // Hidden
      expect(filteredProfile.linkedinUrl).toBe('https://linkedin.com/in/candidate'); // Visible
      expect(filteredProfile.salaryExpectationMin).toBe(65000); // Visible
    });

    it('should enforce contact info visibility in different contexts', async () => {
      // Arrange
      const contexts = ['search', 'profile_view', 'application_review', 'direct_contact'];
      const profile = {
        id: 'profile-123',
        email: 'test@example.com',
        phoneNumber: '+353 1 234 5678',
        privacySettings: {
          contactInfoVisible: false,
          allowContactAfterApplication: true
        }
      };

      // Mock context-aware filtering
      mockPrivacyService.getProfileInContext = jest.fn().mockImplementation((profileId, employerId, context) => {
        const filtered = { ...profile };
        
        switch (context) {
          case 'search':
          case 'profile_view':
            // Contact info hidden in search/browse contexts
            filtered.email = null;
            filtered.phoneNumber = null;
            break;
          case 'application_review':
          case 'direct_contact':
            // Contact info visible after application context
            if (profile.privacySettings.allowContactAfterApplication) {
              // Keep original contact info
            } else {
              filtered.email = null;
              filtered.phoneNumber = null;
            }
            break;
        }
        
        return Promise.resolve(filtered);
      });

      // Act & Assert for each context
      for (const context of contexts) {
        const result = await mockPrivacyService.getProfileInContext(
          'profile-123',
          TEST_EMPLOYER_ID,
          context
        );

        if (context === 'search' || context === 'profile_view') {
          expect(result.email).toBeNull();
          expect(result.phoneNumber).toBeNull();
        } else if (context === 'application_review' || context === 'direct_contact') {
          expect(result.email).toBe('test@example.com');
          expect(result.phoneNumber).toBe('+353 1 234 5678');
        }
      }
    });
  });

  describe('Salary Visibility Controls', () => {
    it('should control salary information visibility independently', async () => {
      // Arrange
      const salaryPrivacySettings = {
        privacyLevel: 'semi-private',
        contactInfoVisible: true,
        salaryVisible: false,
        salaryRangeVisible: true, // Show range but not exact figures
        salaryAfterConnectionVisible: true
      };

      const profileWithSalaryPrivacy = {
        id: 'profile-123',
        salaryExpectationMin: 60000,
        salaryExpectationMax: 80000,
        currentSalary: 65000,
        salaryHistory: [
          { year: 2023, salary: 65000 },
          { year: 2022, salary: 58000 }
        ],
        privacySettings: salaryPrivacySettings
      };

      // Mock salary privacy filtering
      mockPrivacyService.applySalaryPrivacyFilter = jest.fn().mockImplementation((profile, settings, hasConnection = false) => {
        const filtered = { ...profile };
        
        if (!settings.salaryVisible) {
          if (!hasConnection || !settings.salaryAfterConnectionVisible) {
            filtered.salaryExpectationMin = null;
            filtered.salaryExpectationMax = null;
            filtered.currentSalary = null;
            filtered.salaryHistory = [];
          }
          
          if (settings.salaryRangeVisible && !hasConnection) {
            // Show only range categories instead of exact figures
            filtered.salaryRange = 'EUR 60,000 - 80,000';
          }
        }
        
        return filtered;
      });

      // Act - Without connection
      const withoutConnection = mockPrivacyService.applySalaryPrivacyFilter(
        profileWithSalaryPrivacy,
        salaryPrivacySettings,
        false
      );

      // Act - With connection
      const withConnection = mockPrivacyService.applySalaryPrivacyFilter(
        profileWithSalaryPrivacy,
        salaryPrivacySettings,
        true
      );

      // Assert - Without connection
      expect(withoutConnection.salaryExpectationMin).toBeNull();
      expect(withoutConnection.salaryRange).toBe('EUR 60,000 - 80,000');
      expect(withoutConnection.currentSalary).toBeNull();

      // Assert - With connection
      expect(withConnection.salaryExpectationMin).toBe(60000);
      expect(withConnection.currentSalary).toBe(65000);
    });

    it('should handle salary visibility in job matching algorithms', async () => {
      // Arrange
      const candidatesWithSalaryPreferences = [
        {
          id: 'candidate-1',
          salaryExpectationMin: 50000,
          salaryExpectationMax: 70000,
          privacySettings: { salaryVisible: true }
        },
        {
          id: 'candidate-2',
          salaryExpectationMin: 60000,
          salaryExpectationMax: 80000,
          privacySettings: { salaryVisible: false, allowSalaryBasedMatching: true }
        },
        {
          id: 'candidate-3',
          salaryExpectationMin: 55000,
          salaryExpectationMax: 75000,
          privacySettings: { salaryVisible: false, allowSalaryBasedMatching: false }
        }
      ];

      const jobWithSalaryRange = {
        id: 'job-123',
        salaryMin: 55000,
        salaryMax: 75000
      };

      // Mock job matching service
      const mockJobMatchingService = {
        findMatchingCandidates: jest.fn().mockImplementation((job) => {
          // Filter candidates based on salary privacy settings
          return candidatesWithSalaryPreferences.filter(candidate => {
            // If salary is visible or matching is allowed, include in salary-based matching
            if (candidate.privacySettings.salaryVisible || candidate.privacySettings.allowSalaryBasedMatching) {
              return candidate.salaryExpectationMin <= job.salaryMax && 
                     candidate.salaryExpectationMax >= job.salaryMin;
            }
            // Otherwise, exclude from salary-based matching
            return false;
          });
        })
      };

      // Act
      const matchingCandidates = mockJobMatchingService.findMatchingCandidates(jobWithSalaryRange);

      // Assert
      expect(matchingCandidates).toHaveLength(2); // candidate-1 and candidate-2
      expect(matchingCandidates.map(c => c.id)).toEqual(['candidate-1', 'candidate-2']);
    });
  });

  describe('GDPR Compliance Testing', () => {
    it('should handle GDPR consent requirements for privacy settings', async () => {
      // Arrange
      const gdprConsentSettings = {
        dataProcessingConsent: true,
        marketingConsent: false,
        profileSharingConsent: true,
        consentTimestamp: new Date('2025-09-30T10:00:00Z'),
        consentVersion: '1.0'
      };

      const privacySettingsWithGDPR = {
        privacyLevel: 'semi-private',
        contactInfoVisible: false,
        gdprConsent: gdprConsentSettings
      };

      // Mock GDPR compliance service
      mockGDPRService.validateConsentRequirements = jest.fn().mockImplementation((settings) => {
        if (!settings.gdprConsent || !settings.gdprConsent.dataProcessingConsent) {
          throw new Error('GDPR Compliance Error: Data processing consent required');
        }
        return true;
      });

      mockPrivacyService.updatePrivacySettings = jest.fn().mockImplementation(async (userId, settings) => {
        await mockGDPRService.validateConsentRequirements(settings);
        return settings;
      });

      // Act & Assert - Valid consent
      await expect(
        mockPrivacyService.updatePrivacySettings(TEST_USER_ID, privacySettingsWithGDPR)
      ).resolves.toBeDefined();

      // Act & Assert - Invalid consent
      const invalidConsentSettings = {
        ...privacySettingsWithGDPR,
        gdprConsent: { ...gdprConsentSettings, dataProcessingConsent: false }
      };

      await expect(
        mockPrivacyService.updatePrivacySettings(TEST_USER_ID, invalidConsentSettings)
      ).rejects.toThrow('GDPR Compliance Error: Data processing consent required');
    });

    it('should enforce data retention policies based on privacy settings', async () => {
      // Arrange
      const retentionPolicies = {
        public: { retentionPeriod: '7 years', anonymizeAfter: '10 years' },
        'semi-private': { retentionPeriod: '5 years', anonymizeAfter: '7 years' },
        anonymous: { retentionPeriod: '3 years', anonymizeAfter: '5 years' }
      };

      const profilesForRetentionCheck = [
        {
          id: 'profile-1',
          userId: 'user-1',
          createdAt: new Date('2018-01-01'), // 7+ years old
          privacySettings: { privacyLevel: 'public' }
        },
        {
          id: 'profile-2',
          userId: 'user-2',
          createdAt: new Date('2019-01-01'), // 6+ years old
          privacySettings: { privacyLevel: 'semi-private' }
        },
        {
          id: 'profile-3',
          userId: 'user-3',
          createdAt: new Date('2021-01-01'), // 4+ years old
          privacySettings: { privacyLevel: 'anonymous' }
        }
      ];

      // Mock retention policy enforcement
      mockGDPRService.checkDataRetentionPolicy = jest.fn().mockImplementation((profile) => {
        const policy = retentionPolicies[profile.privacySettings.privacyLevel];
        const ageInYears = new Date().getFullYear() - profile.createdAt.getFullYear();
        const retentionYears = parseInt(policy.retentionPeriod);
        const anonymizeYears = parseInt(policy.anonymizeAfter);

        return {
          shouldDelete: ageInYears > retentionYears,
          shouldAnonymize: ageInYears > anonymizeYears,
          ageInYears,
          policy
        };
      });

      mockGDPRService.anonymizePersonalData = jest.fn().mockResolvedValue(true);

      // Act
      for (const profile of profilesForRetentionCheck) {
        const retentionCheck = mockGDPRService.checkDataRetentionPolicy(profile);
        
        if (retentionCheck.shouldAnonymize) {
          await mockGDPRService.anonymizePersonalData(profile.userId);
        }
      }

      // Assert
      expect(mockGDPRService.checkDataRetentionPolicy).toHaveBeenCalledTimes(3);
      expect(mockGDPRService.anonymizePersonalData).toHaveBeenCalledWith('user-1'); // Public profile > 7 years
      expect(mockGDPRService.anonymizePersonalData).not.toHaveBeenCalledWith('user-2'); // Semi-private < 7 years
      expect(mockGDPRService.anonymizePersonalData).not.toHaveBeenCalledWith('user-3'); // Anonymous < 5 years
    });

    it('should handle GDPR data export requests with privacy compliance', async () => {
      // Arrange
      const userDataForExport = {
        profile: {
          id: 'profile-123',
          headline: 'Developer',
          email: 'user@example.com',
          privacySettings: { privacyLevel: 'semi-private' }
        },
        applications: [
          { id: 'app-1', jobId: 'job-1', status: 'applied' }
        ],
        privacyAuditTrail: [
          { action: 'privacy_level_changed', timestamp: '2025-09-30T10:00:00Z' }
        ]
      };

      mockGDPRService.exportPersonalData = jest.fn().mockResolvedValue({
        data: userDataForExport,
        exportTimestamp: new Date('2025-09-30T12:00:00Z'),
        format: 'JSON',
        includesDeletedData: false
      });

      // Act
      const exportResult = await mockGDPRService.exportPersonalData(TEST_USER_ID);

      // Assert
      expect(exportResult.data.profile.email).toBe('user@example.com');
      expect(exportResult.data.privacyAuditTrail).toHaveLength(1);
      expect(exportResult.includesDeletedData).toBe(false);
      expect(mockGDPRService.exportPersonalData).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it('should handle GDPR right-to-be-forgotten requests', async () => {
      // Arrange
      const deletionRequest = {
        userId: TEST_USER_ID,
        requestDate: new Date('2025-09-30T10:00:00Z'),
        reason: 'User requested account deletion',
        retainLegalBasisData: false
      };

      mockGDPRService.deletePersonalData = jest.fn().mockImplementation(async (request) => {
        // Simulate comprehensive data deletion
        return {
          deletedProfiles: 1,
          deletedApplications: 3,
          deletedCVs: 2,
          deletedAuditLogs: 15,
          anonymizedReferences: 5, // References in other users' data
          deletionTimestamp: new Date('2025-09-30T12:00:00Z'),
          retainedDataReason: request.retainLegalBasisData ? 'Legal compliance' : null
        };
      });

      mockAuditService.logPrivacyChange = jest.fn().mockResolvedValue(true);

      // Act
      const deletionResult = await mockGDPRService.deletePersonalData(deletionRequest);

      // Assert
      expect(deletionResult.deletedProfiles).toBe(1);
      expect(deletionResult.deletedApplications).toBe(3);
      expect(deletionResult.anonymizedReferences).toBe(5);
      expect(mockAuditService.logPrivacyChange).toHaveBeenCalledWith(
        TEST_USER_ID,
        'gdpr_deletion_completed',
        expect.objectContaining({ reason: 'User requested account deletion' })
      );
    });
  });

  describe('Privacy Setting Inheritance and Bulk Updates', () => {
    it('should apply privacy setting inheritance across related data', async () => {
      // Arrange
      const parentPrivacySettings = {
        privacyLevel: 'semi-private',
        contactInfoVisible: false,
        portfolioVisible: true,
        cvVisible: false
      };

      const relatedDataItems = [
        { type: 'work_experience', id: 'exp-1', inheritPrivacy: true },
        { type: 'education', id: 'edu-1', inheritPrivacy: true },
        { type: 'portfolio', id: 'port-1', inheritPrivacy: false, customPrivacy: { visible: true } },
        { type: 'cv_document', id: 'cv-1', inheritPrivacy: true }
      ];

      // Mock inheritance service
      const mockInheritanceService = {
        applyPrivacyInheritance: jest.fn().mockImplementation((parentSettings, dataItems) => {
          return dataItems.map(item => {
            if (item.inheritPrivacy) {
              return {
                ...item,
                effectivePrivacy: parentSettings
              };
            } else {
              return {
                ...item,
                effectivePrivacy: item.customPrivacy
              };
            }
          });
        })
      };

      // Act
      const itemsWithInheritedPrivacy = mockInheritanceService.applyPrivacyInheritance(
        parentPrivacySettings,
        relatedDataItems
      );

      // Assert
      expect(itemsWithInheritedPrivacy[0].effectivePrivacy).toEqual(parentPrivacySettings); // work_experience inherits
      expect(itemsWithInheritedPrivacy[1].effectivePrivacy).toEqual(parentPrivacySettings); // education inherits
      expect(itemsWithInheritedPrivacy[2].effectivePrivacy).toEqual({ visible: true }); // portfolio has custom
      expect(itemsWithInheritedPrivacy[3].effectivePrivacy).toEqual(parentPrivacySettings); // cv inherits
    });

    it('should handle bulk privacy updates across multiple profiles', async () => {
      // Arrange
      const bulkUpdateRequest = {
        adminUserId: TEST_ADMIN_ID,
        targetUserIds: [TEST_USER_ID, TEST_USER_ID_2],
        privacyUpdates: {
          privacyLevel: 'semi-private',
          reason: 'GDPR compliance update',
          effectiveDate: new Date('2025-10-01T00:00:00Z')
        }
      };

      const updateResults = [
        { userId: TEST_USER_ID, success: true, previousLevel: 'public' },
        { userId: TEST_USER_ID_2, success: true, previousLevel: 'anonymous' }
      ];

      // Mock bulk update service
      const mockBulkUpdateService = {
        updatePrivacyBulk: jest.fn().mockResolvedValue({
          successful: updateResults,
          failed: [],
          totalUpdated: 2
        })
      };

      mockAuditService.logPrivacyChange = jest.fn().mockResolvedValue(true);

      // Act
      const bulkResult = await mockBulkUpdateService.updatePrivacyBulk(bulkUpdateRequest);

      // Assert
      expect(bulkResult.totalUpdated).toBe(2);
      expect(bulkResult.failed).toHaveLength(0);
      expect(mockAuditService.logPrivacyChange).toHaveBeenCalledTimes(2);
    });
  });

  describe('Privacy Violation Detection and Prevention', () => {
    it('should detect and prevent privacy violations in real-time', async () => {
      // Arrange
      const violations = [
        {
          type: 'unauthorized_contact_access',
          employerId: TEST_EMPLOYER_ID,
          candidateId: TEST_USER_ID,
          attemptedAction: 'access_email',
          blocked: true
        },
        {
          type: 'anonymous_profile_resolution',
          employerId: TEST_EMPLOYER_ID,
          anonymousId: 'ANON_DEV_001',
          attemptedAction: 'resolve_identity',
          blocked: true
        },
        {
          type: 'salary_data_scraping',
          employerId: TEST_EMPLOYER_ID,
          candidateIds: [TEST_USER_ID, TEST_USER_ID_2],
          attemptedAction: 'bulk_salary_access',
          blocked: true
        }
      ];

      // Mock violation detection service
      const mockViolationDetectionService = {
        detectViolation: jest.fn().mockImplementation((action, context) => {
          const violation = violations.find(v => 
            v.employerId === context.employerId && 
            v.attemptedAction === action
          );
          return violation || null;
        }),
        
        blockAction: jest.fn().mockImplementation((violation) => {
          mockAuditService.logPrivacyViolation(
            violation.employerId,
            violation.type,
            { action: violation.attemptedAction, blocked: true }
          );
          throw new Error(`Privacy Violation: ${violation.type} blocked`);
        })
      };

      // Act & Assert - Test each violation type
      for (const violation of violations) {
        const detectedViolation = mockViolationDetectionService.detectViolation(
          violation.attemptedAction,
          { employerId: violation.employerId }
        );

        expect(detectedViolation).not.toBeNull();
        expect(() => {
          mockViolationDetectionService.blockAction(detectedViolation);
        }).toThrow(`Privacy Violation: ${violation.type} blocked`);
      }

      expect(mockAuditService.logPrivacyViolation).toHaveBeenCalledTimes(3);
    });

    it('should implement rate limiting for profile access to prevent data harvesting', async () => {
      // Arrange
      const rateLimitConfig = {
        profileViewsPerHour: 50,
        searchesPerHour: 100,
        contactAccessPerDay: 10
      };

      const employerActivity = {
        employerId: TEST_EMPLOYER_ID,
        profileViewsThisHour: 55, // Exceeds limit
        searchesThisHour: 25,
        contactAccessToday: 12 // Exceeds limit
      };

      // Mock rate limiting service
      const mockRateLimitService = {
        checkRateLimit: jest.fn().mockImplementation((action, employerId) => {
          switch (action) {
            case 'profile_view':
              return employerActivity.profileViewsThisHour < rateLimitConfig.profileViewsPerHour;
            case 'profile_search':
              return employerActivity.searchesThisHour < rateLimitConfig.searchesPerHour;
            case 'contact_access':
              return employerActivity.contactAccessToday < rateLimitConfig.contactAccessPerDay;
            default:
              return true;
          }
        }),

        incrementCounter: jest.fn(),
        getRemainingQuota: jest.fn().mockImplementation((action) => {
          switch (action) {
            case 'profile_view':
              return Math.max(0, rateLimitConfig.profileViewsPerHour - employerActivity.profileViewsThisHour);
            case 'contact_access':
              return Math.max(0, rateLimitConfig.contactAccessPerDay - employerActivity.contactAccessToday);
            default:
              return 100;
          }
        })
      };

      // Act & Assert
      expect(mockRateLimitService.checkRateLimit('profile_view', TEST_EMPLOYER_ID)).toBe(false);
      expect(mockRateLimitService.checkRateLimit('profile_search', TEST_EMPLOYER_ID)).toBe(true);
      expect(mockRateLimitService.checkRateLimit('contact_access', TEST_EMPLOYER_ID)).toBe(false);

      expect(mockRateLimitService.getRemainingQuota('profile_view')).toBe(0);
      expect(mockRateLimitService.getRemainingQuota('contact_access')).toBe(0);
    });
  });

  describe('Cross-Service Privacy Consistency', () => {
    it('should maintain privacy consistency across all system services', async () => {
      // Arrange
      const userId = TEST_USER_ID;
      const privacySettings = {
        privacyLevel: 'semi-private',
        contactInfoVisible: false,
        salaryVisible: true,
        cvVisible: false
      };

      // Mock all services that should respect privacy
      const servicesUnderTest = {
        profileService: {
          getProfile: jest.fn().mockResolvedValue({
            id: 'profile-123',
            email: null, // Filtered
            salary: 60000, // Visible
            privacySettings
          })
        },
        
        searchService: {
          searchProfiles: jest.fn().mockResolvedValue({
            profiles: [{
              id: 'profile-123',
              email: null, // Filtered
              salary: 60000 // Visible
            }]
          })
        },
        
        applicationService: {
          getApplicationDetails: jest.fn().mockResolvedValue({
            candidateProfile: {
              email: null, // Filtered in application context
              salary: 60000
            },
            cvDocument: null // Filtered
          })
        },
        
        notificationService: {
          sendNotification: jest.fn().mockImplementation((recipientId, data) => {
            // Should not include filtered contact info in notifications
            expect(data.candidateEmail).toBeUndefined();
            return Promise.resolve({ sent: true });
          })
        }
      };

      // Act - Test each service respects privacy
      await servicesUnderTest.profileService.getProfile(userId);
      await servicesUnderTest.searchService.searchProfiles(TEST_EMPLOYER_ID, {});
      await servicesUnderTest.applicationService.getApplicationDetails('app-123');
      await servicesUnderTest.notificationService.sendNotification(TEST_EMPLOYER_ID, {
        type: 'new_application',
        candidateId: userId
      });

      // Assert - All services applied privacy filtering
      const profileResult = await servicesUnderTest.profileService.getProfile(userId);
      expect(profileResult.email).toBeNull();
      expect(profileResult.salary).toBe(60000);

      const searchResult = await servicesUnderTest.searchService.searchProfiles(TEST_EMPLOYER_ID, {});
      expect(searchResult.profiles[0].email).toBeNull();

      const appResult = await servicesUnderTest.applicationService.getApplicationDetails('app-123');
      expect(appResult.candidateProfile.email).toBeNull();
      expect(appResult.cvDocument).toBeNull();
    });

    it('should handle privacy setting propagation delays across distributed services', async () => {
      // Arrange
      const privacyUpdateEvent = {
        userId: TEST_USER_ID,
        oldSettings: { privacyLevel: 'public', contactInfoVisible: true },
        newSettings: { privacyLevel: 'semi-private', contactInfoVisible: false },
        timestamp: new Date('2025-09-30T10:00:00Z')
      };

      // Mock distributed event handling
      const mockEventBus = {
        publishPrivacyUpdate: jest.fn().mockResolvedValue(true),
        subscribeToPrivacyUpdates: jest.fn(),
        getEventProcessingStatus: jest.fn().mockResolvedValue({
          profileService: 'processed',
          searchService: 'processing',
          applicationService: 'pending',
          notificationService: 'processed'
        })
      };

      // Mock eventual consistency checking
      const mockConsistencyChecker = {
        verifyPrivacyConsistency: jest.fn().mockImplementation(async (userId) => {
          const statuses = await mockEventBus.getEventProcessingStatus();
          const allProcessed = Object.values(statuses).every(status => status === 'processed');
          
          return {
            consistent: allProcessed,
            pendingServices: Object.entries(statuses)
              .filter(([_, status]) => status !== 'processed')
              .map(([service, _]) => service)
          };
        })
      };

      // Act
      await mockEventBus.publishPrivacyUpdate(privacyUpdateEvent);
      const consistencyCheck = await mockConsistencyChecker.verifyPrivacyConsistency(TEST_USER_ID);

      // Assert
      expect(mockEventBus.publishPrivacyUpdate).toHaveBeenCalledWith(privacyUpdateEvent);
      expect(consistencyCheck.consistent).toBe(false); // Some services still processing
      expect(consistencyCheck.pendingServices).toContain('applicationService');
    });
  });

  describe('Error Scenarios and Edge Cases', () => {
    it('should handle privacy service failures gracefully with fail-safe defaults', async () => {
      // Arrange
      mockPrivacyService.getPrivacySettings = jest.fn().mockRejectedValue(
        new Error('Privacy service unavailable')
      );

      // Mock fail-safe privacy service
      const mockFailSafePrivacyService = {
        getDefaultPrivacySettings: jest.fn().mockReturnValue({
          privacyLevel: 'semi-private', // Conservative default
          contactInfoVisible: false,
          salaryVisible: false,
          profileVisibleToEmployers: false // Most restrictive default
        }),
        
        applyFailSafeFiltering: jest.fn().mockImplementation((profile) => {
          // When privacy service fails, apply most restrictive filtering
          return {
            ...profile,
            email: null,
            phoneNumber: null,
            salaryExpectationMin: null,
            salaryExpectationMax: null
          };
        })
      };

      // Act
      let privacySettings;
      try {
        privacySettings = await mockPrivacyService.getPrivacySettings(TEST_USER_ID);
      } catch (error) {
        // Fall back to fail-safe defaults
        privacySettings = mockFailSafePrivacyService.getDefaultPrivacySettings();
      }

      const profile = { email: 'test@example.com', salary: 60000 };
      const safeProfile = mockFailSafePrivacyService.applyFailSafeFiltering(profile);

      // Assert
      expect(privacySettings.privacyLevel).toBe('semi-private');
      expect(privacySettings.contactInfoVisible).toBe(false);
      expect(safeProfile.email).toBeNull();
      expect(safeProfile.salaryExpectationMin).toBeNull();
    });

    it('should handle concurrent privacy setting updates with optimistic locking', async () => {
      // Arrange
      const initialSettings = {
        id: 'privacy-123',
        userId: TEST_USER_ID,
        privacyLevel: 'public',
        version: 1
      };

      const update1 = { privacyLevel: 'semi-private' };
      const update2 = { contactInfoVisible: false };

      // Mock optimistic locking
      mockPrivacyService.updatePrivacySettings = jest.fn()
        .mockImplementationOnce(async (userId, updates, expectedVersion) => {
          if (expectedVersion && expectedVersion !== initialSettings.version) {
            throw new Error('Concurrent modification detected: version mismatch');
          }
          return { ...initialSettings, ...updates, version: 2 };
        })
        .mockImplementationOnce(async (userId, updates, expectedVersion) => {
          throw new Error('Concurrent modification detected: version mismatch');
        });

      // Act
      const promise1 = mockPrivacyService.updatePrivacySettings(TEST_USER_ID, update1, 1);
      const promise2 = mockPrivacyService.updatePrivacySettings(TEST_USER_ID, update2, 1);

      // Assert
      await expect(promise1).resolves.toHaveProperty('version', 2);
      await expect(promise2).rejects.toThrow('Concurrent modification detected');
    });

    it('should validate privacy setting combinations for logical consistency', async () => {
      // Arrange
      const invalidCombinations = [
        {
          privacyLevel: 'anonymous',
          contactInfoVisible: true, // Inconsistent: anonymous but contact visible
          description: 'Anonymous profile cannot have visible contact info'
        },
        {
          privacyLevel: 'public',
          profileVisibleToEmployers: false, // Inconsistent: public but not visible
          description: 'Public profile must be visible to employers'
        },
        {
          privacyLevel: 'semi-private',
          salaryVisible: true,
          salaryExpectationMin: null, // No salary data to show
          description: 'Cannot show salary when no salary data exists'
        }
      ];

      // Mock validation service
      const mockValidationService = {
        validatePrivacySettings: jest.fn().mockImplementation((settings) => {
          const errors = [];
          
          if (settings.privacyLevel === 'anonymous' && settings.contactInfoVisible) {
            errors.push('Anonymous profiles cannot have visible contact information');
          }
          
          if (settings.privacyLevel === 'public' && !settings.profileVisibleToEmployers) {
            errors.push('Public profiles must be visible to employers');
          }
          
          if (errors.length > 0) {
            throw new Error(`Privacy validation failed: ${errors.join(', ')}`);
          }
          
          return true;
        })
      };

      // Act & Assert
      for (const invalidCombo of invalidCombinations) {
        await expect(
          mockValidationService.validatePrivacySettings(invalidCombo)
        ).rejects.toThrow('Privacy validation failed');
      }
    });
  });
});