import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api';

export interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  type: 'PROJECT' | 'ARTICLE' | 'DESIGN' | 'CODE' | 'VIDEO' | 'PRESENTATION' | 'CERTIFICATE' | 'LINK';
  externalUrl?: string;
  technologies: string[];
  projectDate?: string;
  role?: string;
  isPublic: boolean;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  validationStatus: 'PENDING' | 'VALID' | 'INVALID' | 'UNREACHABLE';
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioItemCreate {
  title: string;
  description?: string;
  type: PortfolioItem['type'];
  externalUrl?: string;
  technologies?: string[];
  projectDate?: string;
  role?: string;
  isPublic?: boolean;
}

export interface GitHubRepository {
  name: string;
  description: string;
  htmlUrl: string;
  language: string;
  stargazersCount: number;
  updatedAt: string;
}

export function usePortfolio() {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolioItems = useCallback(async (userId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = userId ? `/api/portfolio?userId=${userId}` : '/api/portfolio';
      const response = await apiClient.get<PortfolioItem[]>(url);
      setPortfolioItems(response);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch portfolio items');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createPortfolioItem = useCallback(async (data: PortfolioItemCreate, file?: File) => {
    setLoading(true);
    setError(null);
    
    try {
      let response: PortfolioItem;
      
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        Object.entries(data).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else if (value !== undefined) {
            formData.append(key, value.toString());
          }
        });
        
        response = await apiClient.uploadFile<PortfolioItem>('/api/portfolio', formData);
      } else {
        response = await apiClient.post<PortfolioItem>('/api/portfolio', data);
      }
      
      setPortfolioItems(prev => [response, ...prev]);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create portfolio item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePortfolioItem = useCallback(async (id: string, data: Partial<PortfolioItemCreate>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.put<PortfolioItem>(`/api/portfolio/${id}`, data);
      setPortfolioItems(prev => prev.map(item => item.id === id ? response : item));
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update portfolio item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePortfolioItem = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await apiClient.delete(`/api/portfolio/${id}`);
      setPortfolioItems(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete portfolio item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const importFromGitHub = useCallback(async (githubUsername: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post<PortfolioItem[]>('/api/portfolio/import/github', {
        githubUsername
      });
      
      setPortfolioItems(prev => [...response, ...prev]);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'GitHub import failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const validateUrls = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post<{
        validated: number;
        errors: Array<{ id: string; error: string }>;
      }>('/api/portfolio/validate-urls');
      
      // Refresh portfolio items to get updated validation status
      await fetchPortfolioItems();
      
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'URL validation failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPortfolioItems]);

  const getPortfolioStats = useCallback(async () => {
    try {
      const response = await apiClient.get<{
        totalItems: number;
        itemsByType: Record<string, number>;
        publicItems: number;
        recentActivity: {
          itemsThisMonth: number;
          itemsThisWeek: number;
        };
      }>('/api/portfolio/stats');
      
      return response;
    } catch (err: any) {
      console.error('Failed to fetch portfolio stats:', err);
      return null;
    }
  }, []);

  const reorderPortfolioItems = useCallback(async (orderedIds: string[]) => {
    setLoading(true);
    setError(null);
    
    try {
      await apiClient.post('/api/portfolio/reorder', { orderedIds });
      
      // Update local state to match new order
      const reorderedItems = orderedIds
        .map(id => portfolioItems.find(item => item.id === id))
        .filter(Boolean) as PortfolioItem[];
      
      setPortfolioItems(reorderedItems);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reorder items');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [portfolioItems]);

  const duplicatePortfolioItem = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post<PortfolioItem>(`/api/portfolio/${id}/duplicate`);
      setPortfolioItems(prev => [response, ...prev]);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to duplicate item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPortfolioItem = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<PortfolioItem>(`/api/portfolio/${id}`);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch portfolio item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    portfolioItems,
    loading,
    error,
    fetchPortfolioItems,
    createPortfolioItem,
    updatePortfolioItem,
    deletePortfolioItem,
    importFromGitHub,
    validateUrls,
    getPortfolioStats,
    reorderPortfolioItems,
    duplicatePortfolioItem,
    getPortfolioItem
  };
}