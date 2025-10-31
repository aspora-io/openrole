import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api';

export interface WorkExperience {
  id: string;
  jobTitle: string;
  companyName: string;
  location?: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE' | 'INTERNSHIP';
  startDate: string;
  endDate?: string;
  isCurrentPosition: boolean;
  description?: string;
  achievements: string[];
  skills: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkExperienceCreate {
  jobTitle: string;
  companyName: string;
  location?: string;
  employmentType: WorkExperience['employmentType'];
  startDate: string;
  endDate?: string;
  isCurrentPosition?: boolean;
  description?: string;
  achievements?: string[];
  skills?: string[];
}

export function useExperience() {
  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExperiences = useCallback(async (userId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = userId ? `/api/experience?userId=${userId}` : '/api/experience';
      const response: any = await apiClient.get<WorkExperience[]>(url);
      
      // Sort by start date (most recent first)
      const sortedExperiences = response.sort((a, b) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
      
      setExperiences(sortedExperiences);
      return sortedExperiences;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch work experiences');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createExperience = useCallback(async (data: WorkExperienceCreate) => {
    setLoading(true);
    setError(null);
    
    try {
      const response: any = await apiClient.post<WorkExperience>('/api/experience', data);
      
      // Add to experiences and re-sort
      setExperiences(prev => {
        const updated = [response, ...prev];
        return updated.sort((a, b) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
      });
      
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create work experience');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateExperience = useCallback(async (id: string, data: Partial<WorkExperienceCreate>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response: any = await apiClient.put<WorkExperience>(`/api/experience/${id}`, data);
      
      setExperiences(prev => {
        const updated = prev.map(exp => exp.id === id ? response : exp);
        return updated.sort((a, b) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
      });
      
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update work experience');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteExperience = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await apiClient.delete(`/api/experience/${id}`);
      setExperiences(prev => prev.filter(exp => exp.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete work experience');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getExperience = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response: any = await apiClient.get<WorkExperience>(`/api/experience/${id}`);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch work experience');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getExperienceStats = useCallback(async () => {
    try {
      const response: any = await apiClient.get<{
        totalExperiences: number;
        totalYearsExperience: number;
        currentPositions: number;
        mostCommonSkills: Array<{ skill: string; count: number }>;
        experienceByType: Record<string, number>;
        careerTimeline: Array<{
          year: number;
          positions: number;
          companies: string[];
        }>;
      }>('/api/experience/stats');
      
      return response;
    } catch (err: any) {
      console.error('Failed to fetch experience stats:', err);
      return null;
    }
  }, []);

  const duplicateExperience = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response: any = await apiClient.post<WorkExperience>(`/api/experience/${id}/duplicate`);
      
      setExperiences(prev => {
        const updated = [response, ...prev];
        return updated.sort((a, b) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
      });
      
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to duplicate experience');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const importFromLinkedIn = useCallback(async (linkedinData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response: any = await apiClient.post<WorkExperience[]>('/api/experience/import/linkedin', {
        data: linkedinData
      });
      
      setExperiences(prev => {
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

  const calculateTotalExperience = useCallback(() => {
    return experiences.reduce((total, exp) => {
      const startDate = new Date(exp.startDate);
      const endDate = exp.endDate ? new Date(exp.endDate) : new Date();
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                    (endDate.getMonth() - startDate.getMonth());
      return total + months;
    }, 0);
  }, [experiences]);

  const getCurrentPositions = useCallback(() => {
    return experiences.filter(exp => exp.isCurrentPosition);
  }, [experiences]);

  const getExperienceByPeriod = useCallback((startYear: number, endYear?: number) => {
    return experiences.filter(exp => {
      const expStartYear = new Date(exp.startDate).getFullYear();
      const expEndYear = exp.endDate ? new Date(exp.endDate).getFullYear() : new Date().getFullYear();
      
      return expStartYear >= startYear && (endYear ? expEndYear <= endYear : true);
    });
  }, [experiences]);

  return {
    experiences,
    loading,
    error,
    fetchExperiences,
    createExperience,
    updateExperience,
    deleteExperience,
    getExperience,
    getExperienceStats,
    duplicateExperience,
    importFromLinkedIn,
    calculateTotalExperience,
    getCurrentPositions,
    getExperienceByPeriod
  };
}