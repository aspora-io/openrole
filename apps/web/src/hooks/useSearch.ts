import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api';

export interface SearchCriteria {
  keywords?: string;
  skills?: string[];
  location?: string;
  remotePreference?: string;
  industries?: string[];
  salaryMin?: number;
  salaryMax?: number;
  experienceMin?: number;
  experienceMax?: number;
  availability?: string;
  hasPortfolio?: boolean;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  id: string;
  userId: string;
  headline: string;
  summary?: string;
  location?: string;
  skills: string[];
  industries: string[];
  salaryExpectationMin?: number;
  salaryExpectationMax?: number;
  remotePreference?: string;
  availability?: string;
  profileCompleteness: number;
  lastActive: string;
  hasPortfolio: boolean;
  portfolioItemCount: number;
  score: number;
}

export interface SearchResponse {
  results: SearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  suggestions: {
    skills: string[];
    locations: string[];
    industries: string[];
  };
}

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [pagination, setPagination] = useState<SearchResponse['pagination'] | null>(null);
  const [suggestions, setSuggestions] = useState<SearchResponse['suggestions'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (criteria: SearchCriteria) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post<SearchResponse>('/api/search/profiles', criteria);
      setResults(response.results);
      setPagination(response.pagination);
      setSuggestions(response.suggestions);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Search failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async (criteria: SearchCriteria, currentPage: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post<SearchResponse>('/api/search/profiles', {
        ...criteria,
        page: currentPage + 1
      });
      
      setResults(prev => [...prev, ...response.results]);
      setPagination(response.pagination);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load more results');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSkillSuggestions = useCallback(async (query: string) => {
    try {
      const response = await apiClient.get<string[]>(`/api/search/skills/suggestions?q=${encodeURIComponent(query)}`);
      return response;
    } catch (err: any) {
      console.error('Failed to fetch skill suggestions:', err);
      return [];
    }
  }, []);

  const getLocationSuggestions = useCallback(async (query: string) => {
    try {
      const response = await apiClient.get<string[]>(`/api/search/locations/suggestions?q=${encodeURIComponent(query)}`);
      return response;
    } catch (err: any) {
      console.error('Failed to fetch location suggestions:', err);
      return [];
    }
  }, []);

  const getIndustrySuggestions = useCallback(async (query: string) => {
    try {
      const response = await apiClient.get<string[]>(`/api/search/industries/suggestions?q=${encodeURIComponent(query)}`);
      return response;
    } catch (err: any) {
      console.error('Failed to fetch industry suggestions:', err);
      return [];
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setPagination(null);
    setSuggestions(null);
    setError(null);
  }, []);

  return {
    results,
    pagination,
    suggestions,
    loading,
    error,
    search,
    loadMore,
    getSkillSuggestions,
    getLocationSuggestions,
    getIndustrySuggestions,
    clearResults
  };
}