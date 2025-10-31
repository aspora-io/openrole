import { useState, useCallback } from 'react';
import { api } from '../lib/api';

interface JobSearchParams {
  query?: string;
  location?: string;
  remote_type?: string;
  employment_type?: string;
  experience_level?: string;
  salary_min?: number;
  salary_max?: number;
  skills?: string[];
  company_id?: string;
  department?: string;
  featured?: boolean;
  urgent?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
}

interface JobSearchResult {
  jobs: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface JobSearchFacets {
  locations?: Array<{ value: string; count: number }>;
  remote_types?: Array<{ value: string; count: number }>;
  employment_types?: Array<{ value: string; count: number }>;
  experience_levels?: Array<{ value: string; count: number }>;
  departments?: Array<{ value: string; count: number }>;
  skills?: Array<{ skill: string; count: number }>;
}

export const useJobSearch = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [facets, setFacets] = useState<JobSearchFacets>({});
  const [lastSearchParams, setLastSearchParams] = useState<JobSearchParams>({});

  // Search jobs with filters
  const searchJobs = useCallback(async (params: JobSearchParams) => {
    try {
      setLoading(true);
      setError(null);
      setLastSearchParams(params);

      // Build query string
      const searchParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            if (value.length > 0) {
              searchParams.append(key, value.join(','));
            }
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });

      const response: any = await api.get(`/jobs?${searchParams.toString()}`);
      
      if (response.success) {
        const { data, pagination: paginationData, filters } = response.data;
        
        // If this is page 1, replace jobs; otherwise, append for infinite scroll
        if (params.page === 1) {
          setJobs(data);
        } else {
          setJobs(prev => [...prev, ...data]);
        }
        
        setPagination(paginationData);
        setFacets(filters || {});
      } else {
        throw new Error(response.error || 'Failed to search jobs');
      }
    } catch (err) {
      console.error('Job search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search jobs');
      
      // Clear results on error
      setJobs([]);
      setPagination(null);
      setFacets({});
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more jobs (for pagination/infinite scroll)
  const loadMore = useCallback(async () => {
    if (!pagination || pagination.page >= pagination.totalPages || loading) {
      return;
    }

    const nextPageParams = {
      ...lastSearchParams,
      page: pagination.page + 1
    };

    await searchJobs(nextPageParams);
  }, [pagination, lastSearchParams, loading, searchJobs]);

  // Reset search state
  const resetSearch = useCallback(() => {
    setJobs([]);
    setLoading(false);
    setError(null);
    setPagination(null);
    setFacets({});
    setLastSearchParams({});
  }, []);

  // Get trending jobs
  const getTrendingJobs = useCallback(async (limit: number = 10, days: number = 7) => {
    try {
      setLoading(true);
      setError(null);

      const response: any = await api.get(`/jobs/trending?limit=${limit}&days=${days}`);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to get trending jobs');
      }
    } catch (err) {
      console.error('Get trending jobs error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get trending jobs');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get search suggestions
  const getSearchSuggestions = useCallback(async (
    query: string, 
    type: 'skills' | 'locations' | 'companies' | 'titles'
  ) => {
    try {
      if (!query.trim()) return [];

      const response: any = await api.get(`/jobs/suggestions?query=${encodeURIComponent(query)}&type=${type}`);
      
      if (response.success) {
        return response.data;
      } else {
        return [];
      }
    } catch (err) {
      console.error('Get search suggestions error:', err);
      return [];
    }
  }, []);

  // Get job by ID
  const getJobById = useCallback(async (jobId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response: any = await api.get(`/jobs/${jobId}`);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Job not found');
      }
    } catch (err) {
      console.error('Get job by ID error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get job');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get similar jobs
  const getSimilarJobs = useCallback(async (jobId: string, limit: number = 5) => {
    try {
      const response: any = await api.get(`/jobs/${jobId}/similar?limit=${limit}`);
      
      if (response.success) {
        return response.data;
      } else {
        return [];
      }
    } catch (err) {
      console.error('Get similar jobs error:', err);
      return [];
    }
  }, []);

  return {
    // State
    jobs,
    loading,
    error,
    pagination,
    facets,
    lastSearchParams,

    // Actions
    searchJobs,
    loadMore,
    resetSearch,
    getTrendingJobs,
    getSearchSuggestions,
    getJobById,
    getSimilarJobs
  };
};