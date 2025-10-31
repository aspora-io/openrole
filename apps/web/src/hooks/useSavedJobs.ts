import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from './useAuth';

export const useSavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  // Load saved jobs on mount and when user changes
  useEffect(() => {
    if (isAuthenticated) {
      loadSavedJobs();
    } else {
      setSavedJobs([]);
    }
  }, [isAuthenticated, user]);

  // Load saved jobs from API
  const loadSavedJobs = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      const response: any = await api.get('/jobs/saved');
      
      if (response.success) {
        setSavedJobs(response.data.saved_jobs || []);
      } else {
        throw new Error(response.error || 'Failed to load saved jobs');
      }
    } catch (err) {
      console.error('Load saved jobs error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load saved jobs');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Save a job
  const saveJob = useCallback(async (jobId: string) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to save jobs');
    }

    try {
      setLoading(true);
      setError(null);

      const response: any = await api.post(`/jobs/${jobId}/save`);
      
      if (response.success) {
        // Optimistically add to saved jobs
        // In a real implementation, you might want to fetch the full job data
        setSavedJobs(prev => [...prev, { id: jobId, saved_at: new Date().toISOString() }]);
        
        return true;
      } else {
        throw new Error(response.error || 'Failed to save job');
      }
    } catch (err) {
      console.error('Save job error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save job';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Unsave a job
  const unsaveJob = useCallback(async (jobId: string) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to manage saved jobs');
    }

    try {
      setLoading(true);
      setError(null);

      const response: any = await api.delete(`/jobs/${jobId}/save`);
      
      if (response.success) {
        // Optimistically remove from saved jobs
        setSavedJobs(prev => prev.filter(job => job.id !== jobId));
        
        return true;
      } else {
        throw new Error(response.error || 'Failed to unsave job');
      }
    } catch (err) {
      console.error('Unsave job error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsave job';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Toggle save status of a job
  const toggleSaveJob = useCallback(async (jobId: string) => {
    const isCurrentlySaved = savedJobs.some(job => job.id === jobId);
    
    if (isCurrentlySaved) {
      await unsaveJob(jobId);
    } else {
      await saveJob(jobId);
    }
  }, [savedJobs, saveJob, unsaveJob]);

  // Check if a job is saved
  const isJobSaved = useCallback((jobId: string) => {
    return savedJobs.some(job => job.id === jobId);
  }, [savedJobs]);

  // Get saved job count
  const savedJobCount = savedJobs.length;

  // Clear all saved jobs
  const clearAllSavedJobs = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      // Remove all saved jobs (this would need to be implemented in the API)
      const promises = savedJobs.map(job => unsaveJob(job.id));
      await Promise.all(promises);
      
      setSavedJobs([]);
    } catch (err) {
      console.error('Clear all saved jobs error:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear saved jobs');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, savedJobs, unsaveJob]);

  return {
    // State
    savedJobs,
    loading,
    error,
    savedJobCount,

    // Actions
    saveJob,
    unsaveJob,
    toggleSaveJob,
    isJobSaved,
    loadSavedJobs,
    clearAllSavedJobs
  };
};