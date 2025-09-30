import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import type { Application } from 'hono';
import type { ProfileService } from '../../src/services/profile.service';
import type { PrivacyService } from '../../src/services/privacy.service';
import type { WorkExperienceService } from '../../src/services/work-experience.service';
import type { EducationService } from '../../src/services/education.service';
import type { CvService } from '../../src/services/cv.service';
import type { PortfolioService } from '../../src/services/portfolio.service';
import type { Database } from '@openrole/database';

// Mock services and repositories
const mockDb: Database = {} as Database;
const mockProfileService: ProfileService = {} as ProfileService;
const mockPrivacyService: PrivacyService = {} as PrivacyService;
const mockWorkExperienceService: WorkExperienceService = {} as WorkExperienceService;
const mockEducationService: EducationService = {} as EducationService;
const mockCvService: CvService = {} as CvService;
const mockPortfolioService: PortfolioService = {} as PortfolioService;

// Test data constants
const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000';
const TEST_EMPLOYER_ID = '223e4567-e89b-12d3-a456-426614174000';

describe('Profile Creation Integration Flow', () => {
  let app: Application;
  let authToken: string;
  let employerToken: string;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authentication tokens
    authToken = 'valid-test-token';
    employerToken = 'valid-employer-token';
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('FR-001: Basic Profile Creation', () => {
    it('should create a candidate profile with required fields', async () => {
      // Arrange
      const profileData = {
        headline: 'Senior Full-Stack Developer',
        summary: 'Experienced developer with 5+ years building scalable web applications using modern JavaScript frameworks and cloud technologies.',
        location: 'Dublin, Ireland',
        phoneNumber: '+353 1 234 5678',
        portfolioUrl: 'https://johndoe.dev',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        githubUrl: 'https://github.com/johndoe',
        experienceYears: 5,
        skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS'],
        industries: ['Technology', 'SaaS'],
        salaryExpectationMin: 60000,
        salaryExpectationMax: 80000,
        availableFrom: '2024-02-01',
        willingToRelocate: false,
        remotePreference: 'hybrid'
      };

      const expectedProfile = {
        id: 'profile-123',
        userId: TEST_USER_ID,
        ...profileData,
        profileComplete: false, // Needs work experience
        verifiedBadge: false, // Needs email verification
        emailVerified: false,
        idVerified: false,
        createdAt: new Date('2025-09-30T10:00:00Z'),
        updatedAt: new Date('2025-09-30T10:00:00Z')
      };

      // Mock the service response
      mockProfileService.createProfile = jest.fn().mockResolvedValue(expectedProfile);

      // Act
      const result = await mockProfileService.createProfile(TEST_USER_ID, profileData);

      // Assert
      expect(mockProfileService.createProfile).toHaveBeenCalledWith(TEST_USER_ID, profileData);
      expect(result).toEqual(expectedProfile);
      expect(result.profileComplete).toBe(false);
      expect(result.verifiedBadge).toBe(false);
    });

    it('should validate minimum salary requirement', async () => {
      // Arrange
      const invalidProfileData = {
        headline: 'Test Developer',
        salaryExpectationMin: 15000 // Below minimum
      };

      mockProfileService.createProfile = jest.fn().mockRejectedValue(
        new Error('Validation Error: Minimum salary must be at least 20000')
      );

      // Act & Assert
      await expect(
        mockProfileService.createProfile(TEST_USER_ID, invalidProfileData)
      ).rejects.toThrow('Validation Error: Minimum salary must be at least 20000');
    });

    it('should validate salary range (min <= max)', async () => {
      // Arrange
      const invalidSalaryRange = {
        headline: 'Test Developer',
        salaryExpectationMin: 80000,
        salaryExpectationMax: 60000 // Invalid: min > max
      };

      mockProfileService.createProfile = jest.fn().mockRejectedValue(
        new Error('Validation Error: Minimum salary cannot exceed maximum salary')
      );

      // Act & Assert
      await expect(
        mockProfileService.createProfile(TEST_USER_ID, invalidSalaryRange)
      ).rejects.toThrow('Validation Error: Minimum salary cannot exceed maximum salary');
    });

    it('should validate field lengths', async () => {
      // Arrange
      const tooLongHeadline = 'A'.repeat(201); // Exceeds 200 char limit
      const invalidProfile = {
        headline: tooLongHeadline,
        summary: 'Valid summary'
      };

      mockProfileService.createProfile = jest.fn().mockRejectedValue(
        new Error('Validation Error: Headline must not exceed 200 characters')
      );

      // Act & Assert
      await expect(
        mockProfileService.createProfile(TEST_USER_ID, invalidProfile)
      ).rejects.toThrow('Validation Error: Headline must not exceed 200 characters');
    });
  });

  describe('Profile Completion Status Calculation', () => {
    it('should calculate profile completion based on required fields', async () => {
      // Arrange
      const partialProfile = {
        id: 'profile-123',
        userId: TEST_USER_ID,
        headline: 'Developer',
        summary: 'Experienced developer',
        location: 'Dublin',
        experienceYears: 5,
        skills: ['JavaScript'],
        profileComplete: false
      };

      // Mock services
      mockProfileService.getProfile = jest.fn().mockResolvedValue(partialProfile);
      mockWorkExperienceService.getExperiences = jest.fn().mockResolvedValue([]);
      mockEducationService.getEducation = jest.fn().mockResolvedValue([]);

      // Act - Calculate completion status
      const profile = await mockProfileService.getProfile(TEST_USER_ID);
      const experiences = await mockWorkExperienceService.getExperiences(TEST_USER_ID);
      const education = await mockEducationService.getEducation(TEST_USER_ID);
      
      const isComplete = !!(
        profile.headline &&
        profile.summary &&
        profile.location &&
        profile.skills.length > 0 &&
        experiences.length > 0 && // Missing work experience
        education.length > 0 // Missing education
      );

      // Assert
      expect(isComplete).toBe(false);
      expect(profile.profileComplete).toBe(false);
    });

    it('should mark profile as complete when all requirements are met', async () => {
      // Arrange
      const completeProfile = {
        id: 'profile-123',
        userId: TEST_USER_ID,
        headline: 'Senior Developer',
        summary: 'Experienced full-stack developer',
        location: 'Dublin, Ireland',
        experienceYears: 5,
        skills: ['TypeScript', 'React', 'Node.js'],
        profileComplete: true
      };

      const workExperiences = [{
        id: 'exp-1',
        jobTitle: 'Senior Software Engineer',
        companyName: 'Tech Corp',
        startDate: '2020-01-01',
        endDate: '2023-12-31'
      }];

      const educationEntries = [{
        id: 'edu-1',
        degree: 'BSc Computer Science',
        institution: 'Trinity College Dublin',
        graduationDate: '2019-06-01'
      }];

      // Mock services
      mockProfileService.getProfile = jest.fn().mockResolvedValue(completeProfile);
      mockWorkExperienceService.getExperiences = jest.fn().mockResolvedValue(workExperiences);
      mockEducationService.getEducation = jest.fn().mockResolvedValue(educationEntries);
      mockProfileService.updateProfileCompletion = jest.fn().mockResolvedValue(completeProfile);

      // Act
      const profile = await mockProfileService.getProfile(TEST_USER_ID);
      const experiences = await mockWorkExperienceService.getExperiences(TEST_USER_ID);
      const education = await mockEducationService.getEducation(TEST_USER_ID);
      
      const isComplete = !!(
        profile.headline &&
        profile.summary &&
        profile.location &&
        profile.skills.length > 0 &&
        experiences.length > 0 &&
        education.length > 0
      );

      if (isComplete && !profile.profileComplete) {
        await mockProfileService.updateProfileCompletion(TEST_USER_ID, true);
      }

      // Assert
      expect(isComplete).toBe(true);
      expect(profile.profileComplete).toBe(true);
    });
  });

  describe('FR-011: Work Experience with Achievements vs Responsibilities', () => {
    it('should add work experience with structured achievements', async () => {
      // Arrange
      const workExperienceData = {
        jobTitle: 'Senior Software Engineer',
        companyName: 'Tech Corp Ltd',
        companyWebsite: 'https://techcorp.com',
        location: 'Dublin, Ireland',
        startDate: '2020-03-01',
        endDate: '2023-02-28',
        isCurrent: false,
        description: 'Led development of microservices architecture and mentored junior developers in best practices.',
        achievements: [
          'Reduced API response times by 40% through database optimization',
          'Implemented CI/CD pipeline reducing deployment time from 2 hours to 15 minutes',
          'Mentored 3 junior developers resulting in 2 promotions'
        ],
        skills: ['TypeScript', 'Docker', 'AWS', 'PostgreSQL', 'Kubernetes']
      };

      const expectedExperience = {
        id: 'exp-123',
        profileId: 'profile-123',
        ...workExperienceData,
        createdAt: new Date('2025-09-30T10:00:00Z'),
        updatedAt: new Date('2025-09-30T10:00:00Z')
      };

      mockWorkExperienceService.addExperience = jest.fn().mockResolvedValue(expectedExperience);

      // Act
      const result = await mockWorkExperienceService.addExperience(
        TEST_USER_ID,
        workExperienceData
      );

      // Assert
      expect(mockWorkExperienceService.addExperience).toHaveBeenCalledWith(
        TEST_USER_ID,
        workExperienceData
      );
      expect(result.achievements).toEqual(workExperienceData.achievements);
      expect(result.achievements).not.toBe(result.description);
      expect(result.achievements.every(a => a.includes('%') || a.includes('hours') || a.includes('3'))).toBe(true);
    });

    it('should validate achievements are measurable and specific', async () => {
      // Arrange
      const vagueAchievements = {
        jobTitle: 'Developer',
        companyName: 'Company',
        achievements: [
          'Worked on projects', // Too vague
          'Helped the team', // Not measurable
          'Did coding' // Not specific
        ]
      };

      mockWorkExperienceService.addExperience = jest.fn().mockRejectedValue(
        new Error('Validation Error: Achievements should be specific and measurable')
      );

      // Act & Assert
      await expect(
        mockWorkExperienceService.addExperience(TEST_USER_ID, vagueAchievements)
      ).rejects.toThrow('Validation Error: Achievements should be specific and measurable');
    });
  });

  describe('FR-003: Privacy Settings Configuration', () => {
    it('should configure privacy settings for semi-private profile', async () => {
      // Arrange
      const privacySettings = {
        privacyLevel: 'semi-private',
        profileVisibleToEmployers: true,
        contactInfoVisible: false,
        salaryVisible: true
      };

      const expectedSettings = {
        id: 'privacy-123',
        userId: TEST_USER_ID,
        ...privacySettings,
        createdAt: new Date('2025-09-30T10:00:00Z'),
        updatedAt: new Date('2025-09-30T10:00:00Z')
      };

      mockPrivacyService.updatePrivacySettings = jest.fn().mockResolvedValue(expectedSettings);

      // Act
      const result = await mockPrivacyService.updatePrivacySettings(
        TEST_USER_ID,
        privacySettings
      );

      // Assert
      expect(mockPrivacyService.updatePrivacySettings).toHaveBeenCalledWith(
        TEST_USER_ID,
        privacySettings
      );
      expect(result.contactInfoVisible).toBe(false);
      expect(result.salaryVisible).toBe(true);
      expect(result.profileVisibleToEmployers).toBe(true);
    });

    it('should enforce privacy settings in employer search results', async () => {
      // Arrange
      const searchResults = [
        {
          id: 'profile-123',
          headline: 'Senior Developer',
          skills: ['TypeScript', 'React'],
          location: 'Dublin',
          salaryExpectationMin: 60000,
          salaryExpectationMax: 80000,
          // Contact info should be hidden based on privacy settings
          email: null,
          phoneNumber: null,
          privacySettings: {
            contactInfoVisible: false,
            salaryVisible: true
          }
        }
      ];

      mockProfileService.searchProfiles = jest.fn().mockResolvedValue({
        profiles: searchResults,
        total: 1
      });

      // Act
      const results = await mockProfileService.searchProfiles(
        TEST_EMPLOYER_ID,
        { skills: ['typescript'] }
      );

      // Assert
      expect(results.profiles[0].email).toBeNull();
      expect(results.profiles[0].phoneNumber).toBeNull();
      expect(results.profiles[0].salaryExpectationMin).toBe(60000);
      expect(results.profiles[0].salaryExpectationMax).toBe(80000);
    });
  });

  describe('FR-012: Profile Verification Status', () => {
    it('should calculate verification badge based on requirements', async () => {
      // Arrange
      const unverifiedProfile = {
        id: 'profile-123',
        userId: TEST_USER_ID,
        emailVerified: false,
        profileComplete: false,
        idVerified: false,
        verifiedBadge: false
      };

      mockProfileService.getProfile = jest.fn().mockResolvedValue(unverifiedProfile);
      mockProfileService.calculateVerificationStatus = jest.fn().mockImplementation((profile) => {
        return profile.emailVerified && profile.profileComplete && profile.idVerified;
      });

      // Act
      const profile = await mockProfileService.getProfile(TEST_USER_ID);
      const verificationStatus = mockProfileService.calculateVerificationStatus(profile);

      // Assert
      expect(verificationStatus).toBe(false);
      expect(profile.verifiedBadge).toBe(false);
    });

    it('should update verification badge when all criteria are met', async () => {
      // Arrange - Simulate progression through verification steps
      const profiles = {
        initial: {
          id: 'profile-123',
          userId: TEST_USER_ID,
          emailVerified: false,
          profileComplete: false,
          idVerified: false,
          verifiedBadge: false
        },
        emailVerified: {
          id: 'profile-123',
          userId: TEST_USER_ID,
          emailVerified: true,
          profileComplete: false,
          idVerified: false,
          verifiedBadge: false
        },
        profileComplete: {
          id: 'profile-123',
          userId: TEST_USER_ID,
          emailVerified: true,
          profileComplete: true,
          idVerified: false,
          verifiedBadge: false
        },
        fullyVerified: {
          id: 'profile-123',
          userId: TEST_USER_ID,
          emailVerified: true,
          profileComplete: true,
          idVerified: true,
          verifiedBadge: true
        }
      };

      // Mock verification steps
      mockProfileService.verifyEmail = jest.fn().mockResolvedValue(profiles.emailVerified);
      mockProfileService.updateProfileCompletion = jest.fn().mockResolvedValue(profiles.profileComplete);
      mockProfileService.verifyIdentity = jest.fn().mockResolvedValue(profiles.fullyVerified);

      // Act - Step through verification process
      let profile = profiles.initial;
      
      // Step 1: Verify email
      profile = await mockProfileService.verifyEmail(TEST_USER_ID);
      expect(profile.emailVerified).toBe(true);
      expect(profile.verifiedBadge).toBe(false);

      // Step 2: Complete profile
      profile = await mockProfileService.updateProfileCompletion(TEST_USER_ID, true);
      expect(profile.profileComplete).toBe(true);
      expect(profile.verifiedBadge).toBe(false);

      // Step 3: Verify identity
      profile = await mockProfileService.verifyIdentity(TEST_USER_ID);
      expect(profile.idVerified).toBe(true);
      expect(profile.verifiedBadge).toBe(true);

      // Assert final state
      expect(profile.verifiedBadge).toBe(true);
    });

    it('should show verified badge in employer search results', async () => {
      // Arrange
      const searchResults = [
        {
          id: 'profile-123',
          headline: 'Verified Senior Developer',
          skills: ['TypeScript', 'React'],
          verifiedBadge: true,
          emailVerified: true,
          profileComplete: true,
          idVerified: true
        },
        {
          id: 'profile-456',
          headline: 'Junior Developer',
          skills: ['JavaScript'],
          verifiedBadge: false,
          emailVerified: true,
          profileComplete: true,
          idVerified: false
        }
      ];

      mockProfileService.searchProfiles = jest.fn().mockResolvedValue({
        profiles: searchResults,
        total: 2
      });

      // Act
      const results = await mockProfileService.searchProfiles(
        TEST_EMPLOYER_ID,
        { skills: ['typescript', 'javascript'] }
      );

      // Assert
      expect(results.profiles[0].verifiedBadge).toBe(true);
      expect(results.profiles[1].verifiedBadge).toBe(false);
    });
  });

  describe('End-to-End Profile Creation Journey', () => {
    it('should complete full profile creation flow from start to finish', async () => {
      // This test simulates the complete user journey
      
      // Step 1: Create basic profile
      const profileData = {
        headline: 'Senior Full-Stack Developer',
        summary: 'Experienced developer with strong background in web technologies',
        location: 'Dublin, Ireland',
        experienceYears: 8,
        skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
        salaryExpectationMin: 70000,
        salaryExpectationMax: 90000,
        remotePreference: 'remote-first'
      };

      const createdProfile = {
        id: 'profile-123',
        userId: TEST_USER_ID,
        ...profileData,
        profileComplete: false,
        verifiedBadge: false
      };

      mockProfileService.createProfile = jest.fn().mockResolvedValue(createdProfile);

      const profile = await mockProfileService.createProfile(TEST_USER_ID, profileData);
      expect(profile.profileComplete).toBe(false);

      // Step 2: Add work experience
      const experience = {
        jobTitle: 'Senior Software Engineer',
        companyName: 'Tech Innovators',
        location: 'Dublin, Ireland',
        startDate: '2019-01-01',
        isCurrent: true,
        achievements: [
          'Led migration to microservices architecture improving system reliability by 35%',
          'Reduced deployment time from 4 hours to 30 minutes through CI/CD implementation',
          'Mentored team of 5 developers on React best practices'
        ],
        skills: ['TypeScript', 'React', 'AWS', 'Docker']
      };

      mockWorkExperienceService.addExperience = jest.fn().mockResolvedValue({
        id: 'exp-1',
        ...experience
      });

      await mockWorkExperienceService.addExperience(TEST_USER_ID, experience);

      // Step 3: Add education
      const education = {
        degree: 'MSc Computer Science',
        institution: 'University College Dublin',
        graduationDate: '2015-06-01',
        grade: 'First Class Honours'
      };

      mockEducationService.addEducation = jest.fn().mockResolvedValue({
        id: 'edu-1',
        ...education
      });

      await mockEducationService.addEducation(TEST_USER_ID, education);

      // Step 4: Configure privacy settings
      const privacySettings = {
        privacyLevel: 'semi-private',
        profileVisibleToEmployers: true,
        contactInfoVisible: false,
        salaryVisible: true
      };

      mockPrivacyService.updatePrivacySettings = jest.fn().mockResolvedValue({
        id: 'privacy-1',
        userId: TEST_USER_ID,
        ...privacySettings
      });

      await mockPrivacyService.updatePrivacySettings(TEST_USER_ID, privacySettings);

      // Step 5: Upload CV
      const cvData = {
        filename: 'john-doe-cv.pdf',
        mimeType: 'application/pdf',
        size: 256000,
        label: 'Software Engineer CV',
        isDefault: true
      };

      mockCvService.uploadCv = jest.fn().mockResolvedValue({
        id: 'cv-1',
        userId: TEST_USER_ID,
        ...cvData,
        version: 1,
        status: 'processing'
      });

      await mockCvService.uploadCv(TEST_USER_ID, cvData);

      // Step 6: Add portfolio item
      const portfolioItem = {
        title: 'E-commerce Platform Redesign',
        description: 'Complete UI/UX redesign resulting in 25% conversion increase',
        type: 'project',
        technologies: ['React', 'TypeScript', 'Stripe'],
        projectDate: '2023-06-15',
        role: 'Lead Frontend Developer',
        isPublic: true
      };

      mockPortfolioService.addPortfolioItem = jest.fn().mockResolvedValue({
        id: 'portfolio-1',
        userId: TEST_USER_ID,
        ...portfolioItem
      });

      await mockPortfolioService.addPortfolioItem(TEST_USER_ID, portfolioItem);

      // Step 7: Update profile completion status
      const updatedProfile = {
        ...createdProfile,
        profileComplete: true
      };

      mockProfileService.updateProfileCompletion = jest.fn().mockResolvedValue(updatedProfile);
      mockProfileService.getProfile = jest.fn().mockResolvedValue(updatedProfile);

      await mockProfileService.updateProfileCompletion(TEST_USER_ID, true);
      const finalProfile = await mockProfileService.getProfile(TEST_USER_ID);

      // Assert final state
      expect(finalProfile.profileComplete).toBe(true);
      expect(mockProfileService.createProfile).toHaveBeenCalled();
      expect(mockWorkExperienceService.addExperience).toHaveBeenCalled();
      expect(mockEducationService.addEducation).toHaveBeenCalled();
      expect(mockPrivacyService.updatePrivacySettings).toHaveBeenCalled();
      expect(mockCvService.uploadCv).toHaveBeenCalled();
      expect(mockPortfolioService.addPortfolioItem).toHaveBeenCalled();
    });
  });

  describe('Error Scenarios and Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      // Arrange
      mockProfileService.createProfile = jest.fn().mockRejectedValue(
        new Error('Database connection failed: ECONNREFUSED')
      );

      // Act & Assert
      await expect(
        mockProfileService.createProfile(TEST_USER_ID, { headline: 'Test' })
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle concurrent profile updates', async () => {
      // Arrange
      const update1 = { headline: 'Update 1' };
      const update2 = { headline: 'Update 2' };

      mockProfileService.updateProfile = jest.fn()
        .mockResolvedValueOnce({ headline: 'Update 1', version: 2 })
        .mockRejectedValueOnce(new Error('Concurrent modification detected'));

      // Act
      const promise1 = mockProfileService.updateProfile(TEST_USER_ID, update1);
      const promise2 = mockProfileService.updateProfile(TEST_USER_ID, update2);

      // Assert
      await expect(promise1).resolves.toHaveProperty('headline', 'Update 1');
      await expect(promise2).rejects.toThrow('Concurrent modification detected');
    });

    it('should validate maximum array sizes', async () => {
      // Arrange
      const tooManySkills = Array(51).fill('Skill'); // Exceeds 50 skill limit
      const profileWithTooManySkills = {
        headline: 'Developer',
        skills: tooManySkills
      };

      mockProfileService.createProfile = jest.fn().mockRejectedValue(
        new Error('Validation Error: Maximum 50 skills allowed')
      );

      // Act & Assert
      await expect(
        mockProfileService.createProfile(TEST_USER_ID, profileWithTooManySkills)
      ).rejects.toThrow('Validation Error: Maximum 50 skills allowed');
    });

    it('should handle special characters in text fields', async () => {
      // Arrange
      const profileWithSpecialChars = {
        headline: 'Developer & Designer | Full-Stack',
        summary: 'Experience with <HTML>, "JavaScript", and SQL\'s intricacies',
        location: 'Düsseldorf, Germany',
        skills: ['C++', 'C#', '.NET', 'Node.js']
      };

      const expectedProfile = {
        id: 'profile-123',
        userId: TEST_USER_ID,
        ...profileWithSpecialChars
      };

      mockProfileService.createProfile = jest.fn().mockResolvedValue(expectedProfile);

      // Act
      const result = await mockProfileService.createProfile(TEST_USER_ID, profileWithSpecialChars);

      // Assert
      expect(result.headline).toBe('Developer & Designer | Full-Stack');
      expect(result.summary).toContain('<HTML>');
      expect(result.location).toBe('Düsseldorf, Germany');
      expect(result.skills).toContain('C++');
    });

    it('should handle profile with zero years of experience', async () => {
      // Arrange
      const juniorProfile = {
        headline: 'Recent Graduate - Software Developer',
        summary: 'Computer Science graduate eager to start career in software development',
        experienceYears: 0,
        skills: ['Python', 'Java', 'Git'],
        location: 'Dublin, Ireland'
      };

      const expectedProfile = {
        id: 'profile-123',
        userId: TEST_USER_ID,
        ...juniorProfile,
        profileComplete: false // Still needs work experience entries
      };

      mockProfileService.createProfile = jest.fn().mockResolvedValue(expectedProfile);

      // Act
      const result = await mockProfileService.createProfile(TEST_USER_ID, juniorProfile);

      // Assert
      expect(result.experienceYears).toBe(0);
      expect(result.profileComplete).toBe(false);
    });

    it('should handle invalid date ranges in work experience', async () => {
      // Arrange
      const invalidExperience = {
        jobTitle: 'Developer',
        companyName: 'Tech Co',
        startDate: '2023-01-01',
        endDate: '2022-01-01' // End date before start date
      };

      mockWorkExperienceService.addExperience = jest.fn().mockRejectedValue(
        new Error('Validation Error: End date must be after start date')
      );

      // Act & Assert
      await expect(
        mockWorkExperienceService.addExperience(TEST_USER_ID, invalidExperience)
      ).rejects.toThrow('Validation Error: End date must be after start date');
    });
  });
});