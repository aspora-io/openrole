import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api';

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  grade?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrentlyEnrolled: boolean;
  description?: string;
  achievements: string[];
  activities: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EducationCreate {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  grade?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrentlyEnrolled?: boolean;
  description?: string;
  achievements?: string[];
  activities?: string[];
}

export function useEducation() {
  const [educations, setEducations] = useState<Education[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEducations = useCallback(async (userId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = userId ? `/api/education?userId=${userId}` : '/api/education';
      const response: any = await apiClient.get<Education[]>(url);
      
      // Sort by start date (most recent first)
      const sortedEducations = response.sort((a, b) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
      
      setEducations(sortedEducations);
      return sortedEducations;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch education history');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createEducation = useCallback(async (data: EducationCreate) => {
    setLoading(true);
    setError(null);
    
    try {
      const response: any = await apiClient.post<Education>('/api/education', data);
      
      // Add to educations and re-sort
      setEducations(prev => {
        const updated = [response, ...prev];
        return updated.sort((a, b) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
      });
      
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create education entry');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEducation = useCallback(async (id: string, data: Partial<EducationCreate>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response: any = await apiClient.put<Education>(`/api/education/${id}`, data);
      
      setEducations(prev => {
        const updated = prev.map(edu => edu.id === id ? response : edu);
        return updated.sort((a, b) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
      });
      
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update education entry');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEducation = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await apiClient.delete(`/api/education/${id}`);
      setEducations(prev => prev.filter(edu => edu.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete education entry');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getEducation = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response: any = await apiClient.get<Education>(`/api/education/${id}`);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch education entry');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getEducationStats = useCallback(async () => {
    try {
      const response: any = await apiClient.get<{
        totalEducations: number;
        highestDegree: string;
        fieldsOfStudy: Array<{ field: string; count: number }>;
        institutions: Array<{ institution: string; count: number }>;
        educationByLevel: Record<string, number>;
        currentEnrollments: number;
        totalAchievements: number;
        totalActivities: number;
        timeline: Array<{
          year: number;
          enrollments: number;
          graduations: number;
        }>;
      }>('/api/education/stats');
      
      return response;
    } catch (err: any) {
      console.error('Failed to fetch education stats:', err);
      return null;
    }
  }, []);

  const duplicateEducation = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response: any = await apiClient.post<Education>(`/api/education/${id}/duplicate`);
      
      setEducations(prev => {
        const updated = [response, ...prev];
        return updated.sort((a, b) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
      });
      
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to duplicate education entry');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const importFromLinkedIn = useCallback(async (linkedinData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response: any = await apiClient.post<Education[]>('/api/education/import/linkedin', {
        data: linkedinData
      });
      
      setEducations(prev => {
        const updated = [...response, ...prev];
        return updated.sort((a, b) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
      });
      
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'LinkedIn import failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCurrentEnrollments = useCallback(() => {
    return educations.filter(edu => edu.isCurrentlyEnrolled);
  }, [educations]);

  const getEducationByDegreeLevel = useCallback((level: string) => {
    return educations.filter(edu => 
      edu.degree.toLowerCase().includes(level.toLowerCase())
    );
  }, [educations]);

  const getEducationByField = useCallback((field: string) => {
    return educations.filter(edu => 
      edu.fieldOfStudy.toLowerCase().includes(field.toLowerCase())
    );
  }, [educations]);

  const getEducationByInstitution = useCallback((institution: string) => {
    return educations.filter(edu => 
      edu.institution.toLowerCase().includes(institution.toLowerCase())
    );
  }, [educations]);

  const calculateEducationDuration = useCallback((education: Education) => {
    const startDate = new Date(education.startDate);
    const endDate = education.endDate ? new Date(education.endDate) : new Date();
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                  (endDate.getMonth() - startDate.getMonth());
    return months;
  }, []);

  const getTotalEducationTime = useCallback(() => {
    return educations.reduce((total, edu) => {
      return total + calculateEducationDuration(edu);
    }, 0);
  }, [educations, calculateEducationDuration]);

  const getHighestDegree = useCallback(() => {
    const degreeHierarchy = [
      'phd', 'doctorate', 'doctor',
      'master', 'mba', 'ms', 'ma',
      'bachelor', 'ba', 'bs', 'bsc',
      'associate',
      'diploma',
      'certificate',
      'high school'
    ];

    for (const level of degreeHierarchy) {
      const foundEducation = educations.find(edu => 
        edu.degree.toLowerCase().includes(level)
      );
      if (foundEducation) {
        return foundEducation;
      }
    }

    return educations[0] || null;
  }, [educations]);

  const getAllSkillsFromEducations = useCallback(() => {
    const allSkills = new Set<string>();
    
    educations.forEach(edu => {
      // Extract skills from description
      if (edu.description) {
        const skillKeywords = [
          'programming', 'software', 'data', 'analysis', 'research',
          'project management', 'leadership', 'communication'
        ];
        
        skillKeywords.forEach(skill => {
          if (edu.description!.toLowerCase().includes(skill)) {
            allSkills.add(skill);
          }
        });
      }
      
      // Add field of study as a skill
      allSkills.add(edu.fieldOfStudy);
    });
    
    return Array.from(allSkills);
  }, [educations]);

  return {
    educations,
    loading,
    error,
    fetchEducations,
    createEducation,
    updateEducation,
    deleteEducation,
    getEducation,
    getEducationStats,
    duplicateEducation,
    importFromLinkedIn,
    getCurrentEnrollments,
    getEducationByDegreeLevel,
    getEducationByField,
    getEducationByInstitution,
    calculateEducationDuration,
    getTotalEducationTime,
    getHighestDegree,
    getAllSkillsFromEducations
  };
}