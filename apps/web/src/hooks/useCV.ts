import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api';

export interface CVGenerationOptions {
  templateId: string;
  label: string;
  isDefault?: boolean;
  sections: {
    includePersonalDetails: boolean;
    includeWorkExperience: boolean;
    includeEducation: boolean;
    includeSkills: boolean;
    includePortfolio: boolean;
  };
  customizations?: {
    primaryColor?: string;
    fontSize?: 'small' | 'medium' | 'large';
    fontFamily?: string;
    spacing?: 'compact' | 'normal' | 'relaxed';
  };
  format: 'pdf' | 'html' | 'png';
}

export interface GeneratedCV {
  id: string;
  label: string;
  templateId: string;
  format: string;
  filePath: string;
  fileSize: number;
  isDefault: boolean;
  generatedAt: string;
}

export interface CVTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  previewImageUrl?: string;
  features: string[];
}

export function useCV() {
  const [generatedCVs, setGeneratedCVs] = useState<GeneratedCV[]>([]);
  const [templates, setTemplates] = useState<CVTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);

  const generateCV = useCallback(async (options: CVGenerationOptions) => {
    setLoading(true);
    setError(null);
    setGenerationProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 500);

      const response: any = await apiClient.post<GeneratedCV>('/api/cv/generate', options);
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      
      setGeneratedCVs(prev => [response, ...prev]);
      
      // Reset progress after a delay
      setTimeout(() => setGenerationProgress(0), 2000);
      
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'CV generation failed');
      setGenerationProgress(0);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGeneratedCVs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response: any = await apiClient.get<GeneratedCV[]>('/api/cv/generated');
      setGeneratedCVs(response);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch CVs');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response: any = await apiClient.get<CVTemplate[]>('/api/cv/templates');
      setTemplates(response);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch templates');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCV = useCallback(async (cvId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await apiClient.delete(`/api/cv/${cvId}`);
      setGeneratedCVs(prev => prev.filter(cv => cv.id !== cvId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete CV');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const setDefaultCV = useCallback(async (cvId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response: any = await apiClient.patch<GeneratedCV>(`/api/cv/${cvId}/default`);
      setGeneratedCVs(prev => prev.map(cv => ({
        ...cv,
        isDefault: cv.id === cvId
      })));
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to set default CV');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadCV = useCallback(async (cvId: string) => {
    try {
      const response: any = await apiClient.get(`/api/cv/${cvId}/download`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response as any]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from content-disposition header or use default
      const cv = generatedCVs.find(c => c.id === cvId);
      const filename = cv ? `${cv.label}.${cv.format}` : `cv.pdf`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Download failed');
      throw err;
    }
  }, [generatedCVs]);

  const previewCV = useCallback(async (cvId: string) => {
    try {
      const response: any = await apiClient.get<{ previewUrl: string }>(`/api/cv/${cvId}/preview`);
      return response.previewUrl;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Preview failed');
      throw err;
    }
  }, []);

  const regenerateCV = useCallback(async (cvId: string, newOptions?: Partial<CVGenerationOptions>) => {
    setLoading(true);
    setError(null);
    setGenerationProgress(0);
    
    try {
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 500);

      const response: any = await apiClient.post<GeneratedCV>(`/api/cv/${cvId}/regenerate`, newOptions);
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      
      setGeneratedCVs(prev => prev.map(cv => cv.id === cvId ? response : cv));
      
      setTimeout(() => setGenerationProgress(0), 2000);
      
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'CV regeneration failed');
      setGenerationProgress(0);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    generatedCVs,
    templates,
    loading,
    error,
    generationProgress,
    generateCV,
    fetchGeneratedCVs,
    fetchTemplates,
    deleteCV,
    setDefaultCV,
    downloadCV,
    previewCV,
    regenerateCV
  };
}