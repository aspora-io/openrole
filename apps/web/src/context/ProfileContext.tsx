'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useProfile, useExperience, useEducation, usePortfolio } from '../hooks';
import { useAuth } from './AuthContext';

interface ProfileContextType {
  // Profile data and methods
  profile: ReturnType<typeof useProfile>;
  experience: ReturnType<typeof useExperience>;
  education: ReturnType<typeof useEducation>;
  portfolio: ReturnType<typeof usePortfolio>;
  
  // Computed values
  profileCompleteness: number;
  missingFields: string[];
  recommendations: string[];
  
  // Actions
  refreshAllData: () => Promise<void>;
  calculateCompleteness: () => number;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function useProfileContext() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfileContext must be used within a ProfileProvider');
  }
  return context;
}

interface ProfileProviderProps {
  children: ReactNode;
}

export function ProfileProvider({ children }: ProfileProviderProps) {
  const { state: authState } = useAuth();
  const userId = authState.user?.id;

  // Initialize all hooks
  const profile = useProfile(userId);
  const experience = useExperience();
  const education = useEducation();
  const portfolio = usePortfolio();

  // Load data when user is available
  React.useEffect(() => {
    if (userId) {
      Promise.all([
        experience.fetchExperiences(),
        education.fetchEducations(),
        portfolio.fetchPortfolioItems()
      ]).catch(console.error);
    }
  }, [userId, experience.fetchExperiences, education.fetchEducations, portfolio.fetchPortfolioItems]);

  const calculateCompleteness = React.useCallback((): number => {
    if (!profile.profile) return 0;

    const fields = [
      { key: 'headline', weight: 10, value: profile.profile.headline },
      { key: 'summary', weight: 15, value: profile.profile.summary },
      { key: 'location', weight: 5, value: profile.profile.location },
      { key: 'phoneNumber', weight: 5, value: profile.profile.phoneNumber },
      { key: 'linkedinUrl', weight: 8, value: profile.profile.linkedinUrl },
      { key: 'githubUrl', weight: 8, value: profile.profile.githubUrl },
      { key: 'skills', weight: 12, value: profile.profile.skills?.length > 0 },
      { key: 'industries', weight: 7, value: profile.profile.industries?.length > 0 },
      { key: 'salaryExpectations', weight: 5, value: profile.profile.salaryExpectationMin && profile.profile.salaryExpectationMax },
      { key: 'workExperience', weight: 15, value: experience.experiences.length > 0 },
      { key: 'education', weight: 10, value: education.educations.length > 0 }
    ];

    const totalWeight = fields.reduce((sum, field) => sum + field.weight, 0);
    const completedWeight = fields.reduce((sum, field) => {
      return sum + (field.value ? field.weight : 0);
    }, 0);

    return Math.round((completedWeight / totalWeight) * 100);
  }, [profile.profile, experience.experiences, education.educations]);

  const getMissingFields = React.useCallback((): string[] => {
    if (!profile.profile) return [];

    const missing: string[] = [];

    if (!profile.profile.headline) missing.push('Professional headline');
    if (!profile.profile.summary) missing.push('Professional summary');
    if (!profile.profile.location) missing.push('Location');
    if (!profile.profile.skills || profile.profile.skills.length === 0) missing.push('Skills');
    if (!profile.profile.industries || profile.profile.industries.length === 0) missing.push('Industries');
    if (experience.experiences.length === 0) missing.push('Work experience');
    if (education.educations.length === 0) missing.push('Education');
    if (!profile.profile.linkedinUrl) missing.push('LinkedIn profile');

    return missing;
  }, [profile.profile, experience.experiences, education.educations]);

  const getRecommendations = React.useCallback((): string[] => {
    const recommendations: string[] = [];
    const completeness = calculateCompleteness();

    if (completeness < 50) {
      recommendations.push('Complete your basic profile information to increase visibility');
    }

    if (!profile.profile?.headline) {
      recommendations.push('Add a compelling professional headline');
    }

    if (!profile.profile?.summary) {
      recommendations.push('Write a professional summary to stand out');
    }

    if (experience.experiences.length === 0) {
      recommendations.push('Add your work experience to showcase your background');
    }

    if (education.educations.length === 0) {
      recommendations.push('Add your education history');
    }

    if (!profile.profile?.skills || profile.profile.skills.length < 5) {
      recommendations.push('Add at least 5 relevant skills');
    }

    if (portfolio.portfolioItems.length === 0) {
      recommendations.push('Create a portfolio to showcase your work');
    }

    if (!profile.profile?.linkedinUrl) {
      recommendations.push('Connect your LinkedIn profile');
    }

    if (!profile.profile?.githubUrl && profile.profile?.skills?.some(skill => 
      ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript'].includes(skill)
    )) {
      recommendations.push('Add your GitHub profile to showcase code projects');
    }

    if (experience.experiences.length > 0 && experience.experiences.every(exp => !exp.achievements || exp.achievements.length === 0)) {
      recommendations.push('Add achievements to your work experience entries');
    }

    return recommendations;
  }, [profile.profile, experience.experiences, education.educations, portfolio.portfolioItems, calculateCompleteness]);

  const refreshAllData = React.useCallback(async () => {
    if (!userId) return;

    await Promise.all([
      profile.refetch(),
      experience.fetchExperiences(),
      education.fetchEducations(),
      portfolio.fetchPortfolioItems()
    ]);
  }, [userId, profile.refetch, experience.fetchExperiences, education.fetchEducations, portfolio.fetchPortfolioItems]);

  const profileCompleteness = React.useMemo(() => calculateCompleteness(), [calculateCompleteness]);
  const missingFields = React.useMemo(() => getMissingFields(), [getMissingFields]);
  const recommendations = React.useMemo(() => getRecommendations(), [getRecommendations]);

  const value: ProfileContextType = {
    profile,
    experience,
    education,
    portfolio,
    profileCompleteness,
    missingFields,
    recommendations,
    refreshAllData,
    calculateCompleteness,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}