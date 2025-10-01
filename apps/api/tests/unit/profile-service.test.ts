/**
 * Unit Tests for Profile Service
 * 
 * Tests the core business logic of profile management including
 * CRUD operations, validation, and data transformations.
 * 
 * @author OpenRole Team
 * @date 2025-10-01
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { profileService } from '../../src/services/profile-service';
import { privacyService } from '../../src/services/privacy-service';
import { db } from '../../src/lib/database';

// Mock dependencies
vi.mock('../../src/lib/database');
vi.mock('../../src/services/privacy-service');

describe('ProfileService', () => {
  const mockUserId = 'user-123';
  const mockViewerId = 'viewer-456';

  const mockProfileData = {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+1234567890',
    location: 'Dublin, Ireland',
    title: 'Senior Software Engineer',
    summary: 'Experienced full-stack developer with 5+ years in React and Node.js',
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
    industries: ['Technology', 'Fintech'],
    salaryMin: 80000,
    salaryMax: 120000,
    salaryCurrency: 'EUR',
    availabilityDate: '2025-01-01',
    workType: 'HYBRID' as const,
    experienceLevel: 'SENIOR' as const
  };

  const mockPrivacySettings = {
    privacyLevel: 'PUBLIC' as const,
    profileVisibility: {
      fullName: true,
      email: false,
      phoneNumber: false,
      location: true,
      workExperience: true,
      education: true,
      skills: true,
      portfolio: true
    },
    searchableByRecruiters: true,
    allowDirectContact: true,
    showSalaryExpectations: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createProfile', () => {
    it('should create a new profile with valid data', async () => {
      // Mock database response
      const mockCreatedProfile = {
        id: 'profile-123',
        userId: mockUserId,
        ...mockProfileData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockCreatedProfile])
        })
      } as any);

      const result = await profileService.createProfile(mockUserId, mockProfileData);

      expect(result).toEqual(mockCreatedProfile);
      expect(db.insert).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const invalidData = {
        fullName: '', // Empty required field
        email: 'invalid-email' // Invalid email format
      };

      await expect(
        profileService.createProfile(mockUserId, invalidData as any)
      ).rejects.toThrow('Validation failed');
    });

    it('should handle skills array properly', async () => {
      const profileWithSkills = {
        ...mockProfileData,
        skills: ['JavaScript', 'TypeScript', 'React']
      };

      const mockCreatedProfile = {
        id: 'profile-123',
        userId: mockUserId,
        ...profileWithSkills,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockCreatedProfile])
        })
      } as any);

      const result = await profileService.createProfile(mockUserId, profileWithSkills);

      expect(result.skills).toEqual(['JavaScript', 'TypeScript', 'React']);
    });

    it('should set default values for optional fields', async () => {
      const minimalData = {
        fullName: 'Jane Smith',
        email: 'jane@example.com'
      };

      const mockCreatedProfile = {
        id: 'profile-123',
        userId: mockUserId,
        ...minimalData,
        workType: 'REMOTE',
        experienceLevel: 'MID',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockCreatedProfile])
        })
      } as any);

      const result = await profileService.createProfile(mockUserId, minimalData as any);

      expect(result.workType).toBe('REMOTE');
      expect(result.experienceLevel).toBe('MID');
    });
  });

  describe('getProfile', () => {
    it('should return profile for owner', async () => {
      const mockProfile = {
        id: 'profile-123',
        userId: mockUserId,
        ...mockProfileData
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProfile])
          })
        })
      } as any);

      const result = await profileService.getProfile(mockUserId, mockUserId);

      expect(result).toEqual(mockProfile);
    });

    it('should apply privacy filtering for non-owners', async () => {
      const mockProfile = {
        id: 'profile-123',
        userId: mockUserId,
        ...mockProfileData
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProfile])
          })
        })
      } as any);

      vi.mocked(privacyService.getPrivacySettings).mockResolvedValue(mockPrivacySettings);

      const result = await profileService.getProfile(mockUserId, mockViewerId);

      // Should not include private fields
      expect(result.email).toBeUndefined();
      expect(result.phoneNumber).toBeUndefined();
      expect(result.fullName).toBeDefined(); // Public field
    });

    it('should return null for non-existent profile', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      } as any);

      const result = await profileService.getProfile('non-existent', mockViewerId);

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update profile with valid data', async () => {
      const updateData = {
        title: 'Lead Software Engineer',
        summary: 'Updated summary'
      };

      const mockUpdatedProfile = {
        id: 'profile-123',
        userId: mockUserId,
        ...mockProfileData,
        ...updateData,
        updatedAt: new Date()
      };

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUpdatedProfile])
          })
        })
      } as any);

      const result = await profileService.updateProfile(mockUserId, updateData);

      expect(result.title).toBe('Lead Software Engineer');
      expect(result.summary).toBe('Updated summary');
    });

    it('should validate update data', async () => {
      const invalidUpdate = {
        email: 'invalid-email-format'
      };

      await expect(
        profileService.updateProfile(mockUserId, invalidUpdate)
      ).rejects.toThrow('Validation failed');
    });

    it('should handle partial updates', async () => {
      const partialUpdate = {
        location: 'Cork, Ireland'
      };

      const mockUpdatedProfile = {
        id: 'profile-123',
        userId: mockUserId,
        ...mockProfileData,
        location: 'Cork, Ireland',
        updatedAt: new Date()
      };

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUpdatedProfile])
          })
        })
      } as any);

      const result = await profileService.updateProfile(mockUserId, partialUpdate);

      expect(result.location).toBe('Cork, Ireland');
      expect(result.title).toBe(mockProfileData.title); // Unchanged
    });
  });

  describe('deleteProfile', () => {
    it('should delete profile successfully', async () => {
      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'profile-123' }])
        })
      } as any);

      const result = await profileService.deleteProfile(mockUserId);

      expect(result).toBe(true);
      expect(db.delete).toHaveBeenCalled();
    });

    it('should return false for non-existent profile', async () => {
      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([])
        })
      } as any);

      const result = await profileService.deleteProfile('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('getProfileCompletion', () => {
    it('should calculate completion percentage correctly', async () => {
      const incompleteProfile = {
        id: 'profile-123',
        userId: mockUserId,
        fullName: 'John Doe',
        email: 'john@example.com',
        // Missing: phone, location, title, summary, skills, etc.
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([incompleteProfile])
          })
        })
      } as any);

      const result = await profileService.getProfileCompletion(mockUserId);

      expect(result.percentage).toBeLessThan(100);
      expect(result.missingFields).toContain('phoneNumber');
      expect(result.missingFields).toContain('location');
      expect(result.recommendations).toBeDefined();
    });

    it('should return 100% for complete profile', async () => {
      const completeProfile = {
        id: 'profile-123',
        userId: mockUserId,
        ...mockProfileData
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([completeProfile])
          })
        })
      } as any);

      const result = await profileService.getProfileCompletion(mockUserId);

      expect(result.percentage).toBe(100);
      expect(result.missingFields).toHaveLength(0);
    });
  });

  describe('getProfileAnalytics', () => {
    it('should return analytics data', async () => {
      const mockAnalytics = {
        views: 25,
        searches: 5,
        contacts: 3,
        profileViews: [
          { date: '2025-09-30', count: 5 },
          { date: '2025-10-01', count: 8 }
        ]
      };

      // Mock analytics query
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockAnalytics.profileViews)
            })
          })
        })
      } as any);

      const result = await profileService.getProfileAnalytics(mockUserId, 30);

      expect(result.views).toBeDefined();
      expect(result.period).toBe(30);
      expect(Array.isArray(result.viewHistory)).toBe(true);
    });
  });

  describe('searchProfiles', () => {
    it('should search profiles with filters', async () => {
      const searchQuery = 'React developer';
      const filters = {
        location: 'Dublin',
        experienceLevel: 'SENIOR' as const,
        skills: ['React', 'TypeScript']
      };

      const mockSearchResults = [
        {
          id: 'profile-1',
          userId: 'user-1',
          fullName: 'Alice Johnson',
          title: 'Senior React Developer',
          location: 'Dublin, Ireland',
          skills: ['React', 'TypeScript', 'Node.js']
        },
        {
          id: 'profile-2', 
          userId: 'user-2',
          fullName: 'Bob Smith',
          title: 'Frontend Developer',
          location: 'Dublin, Ireland',
          skills: ['React', 'JavaScript']
        }
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue(mockSearchResults)
              })
            })
          })
        })
      } as any);

      const result = await profileService.searchProfiles(searchQuery, filters);

      expect(result.profiles).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.profiles[0].title).toContain('React');
    });

    it('should handle empty search results', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue([])
              })
            })
          })
        })
      } as any);

      const result = await profileService.searchProfiles('nonexistent tech');

      expect(result.profiles).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('suggestSkills', () => {
    it('should return skill suggestions based on query', async () => {
      const mockSkills = [
        'React',
        'React Native',
        'Redux',
        'React Router'
      ];

      // Mock skills query
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(
                  mockSkills.map(skill => ({ skill }))
                )
              })
            })
          })
        })
      } as any);

      const result = await profileService.suggestSkills('React', 5);

      expect(result).toContain('React');
      expect(result).toContain('React Native');
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getProfileRecommendations', () => {
    it('should provide profile improvement recommendations', async () => {
      const incompleteProfile = {
        id: 'profile-123',
        userId: mockUserId,
        fullName: 'John Doe',
        email: 'john@example.com',
        title: 'Developer',
        // Missing: summary, skills, experience details
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([incompleteProfile])
          })
        })
      } as any);

      const result = await profileService.getProfileRecommendations(mockUserId);

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.priority).toBeDefined();
      expect(result.completionScore).toBeLessThan(100);
    });
  });

  describe('validation', () => {
    it('should validate email format', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        ''
      ];

      for (const email of invalidEmails) {
        expect(() => {
          profileService.validateProfileData({ email } as any);
        }).toThrow();
      }
    });

    it('should validate phone number format', () => {
      const validPhones = ['+1234567890', '+353851234567', '+44207123456'];
      const invalidPhones = ['123', 'abc123', '12345', ''];

      for (const phone of validPhones) {
        expect(() => {
          profileService.validateProfileData({ phoneNumber: phone } as any);
        }).not.toThrow();
      }

      for (const phone of invalidPhones) {
        expect(() => {
          profileService.validateProfileData({ phoneNumber: phone } as any);
        }).toThrow();
      }
    });

    it('should validate salary ranges', () => {
      const validSalary = { salaryMin: 50000, salaryMax: 80000 };
      const invalidSalary = { salaryMin: 80000, salaryMax: 50000 }; // min > max

      expect(() => {
        profileService.validateProfileData(validSalary as any);
      }).not.toThrow();

      expect(() => {
        profileService.validateProfileData(invalidSalary as any);
      }).toThrow('Minimum salary cannot be greater than maximum salary');
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors', async () => {
      vi.mocked(db.select).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await expect(
        profileService.getProfile(mockUserId, mockViewerId)
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid user IDs', async () => {
      await expect(
        profileService.getProfile('', mockViewerId)
      ).rejects.toThrow('Invalid user ID');

      await expect(
        profileService.getProfile('invalid-uuid', mockViewerId)
      ).rejects.toThrow('Invalid user ID format');
    });
  });
});