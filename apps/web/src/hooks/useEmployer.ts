import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from './useAuth';

interface EmployerDashboard {
  overview: {
    period_days: number;
    total_jobs: number;
    active_jobs: number;
    total_applications: number;
    new_applications: number;
    applications_this_week: number;
    response_rate: number;
    time_to_hire: number;
    offers_extended: number;
    hires_made: number;
  };
  job_statistics: any;
  application_statistics: any;
  recent_applications: any[];
  top_performing_jobs: any[];
  hiring_metrics: any;
  pipeline_statistics: any[];
}

interface EmployerJob {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  application_count: number;
  view_count: number;
  company: {
    id: string;
    name: string;
  };
}

interface JobTemplate {
  id: string;
  name: string;
  description?: string;
  template_data: any;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export const useEmployer = () => {
  const [dashboard, setDashboard] = useState<EmployerDashboard | null>(null);
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated }: any = useAuth();

  // Load employer data on mount
  useEffect(() => {
    if (isAuthenticated && user?.role === 'employer') {
      loadDashboard();
      loadJobs();
      loadTemplates();
    }
  }, [isAuthenticated, user]);

  // Load dashboard overview
  const loadDashboard = useCallback(async (days: number = 30) => {
    try {
      setLoading(true);
      setError(null);

      const response: any = await api.get(`/employer/dashboard?days=${days}`);
      
      if (response.success) {
        setDashboard(response.data);
      } else {
        throw new Error(response.error || 'Failed to load dashboard');
      }
    } catch (err) {
      console.error('Load dashboard error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load employer jobs
  const loadJobs = useCallback(async (options: {
    page?: number;
    limit?: number;
    status?: string;
    sort?: string;
  } = {}) => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (options.page) searchParams.append('page', options.page.toString());
      if (options.limit) searchParams.append('limit', options.limit.toString());
      if (options.status) searchParams.append('status', options.status);
      if (options.sort) searchParams.append('sort', options.sort);

      const response: any = await api.get(`/employer/jobs?${searchParams.toString()}`);
      
      if (response.success) {
        setJobs(response.data.jobs || []);
      } else {
        throw new Error(response.error || 'Failed to load jobs');
      }
    } catch (err) {
      console.error('Load jobs error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new job
  const createJob = useCallback(async (jobData: any) => {
    try {
      setLoading(true);
      setError(null);

      const response: any = await api.post('/jobs', jobData);
      
      if (response.success) {
        // Refresh jobs list
        await loadJobs();
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create job');
      }
    } catch (err) {
      console.error('Create job error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create job';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadJobs]);

  // Update job
  const updateJob = useCallback(async (jobId: string, jobData: any) => {
    try {
      setLoading(true);
      setError(null);

      const response: any = await api.put(`/jobs/${jobId}`, jobData);
      
      if (response.success) {
        // Update jobs list
        setJobs(prev => 
          prev.map(job => 
            job.id === jobId ? { ...job, ...response.data } : job
          )
        );
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update job');
      }
    } catch (err) {
      console.error('Update job error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update job';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete job
  const deleteJob = useCallback(async (jobId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response: any = await api.delete(`/jobs/${jobId}`);
      
      if (response.success) {
        // Remove from jobs list
        setJobs(prev => prev.filter(job => job.id !== jobId));
        return true;
      } else {
        throw new Error(response.error || 'Failed to delete job');
      }
    } catch (err) {
      console.error('Delete job error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete job';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Publish job
  const publishJob = useCallback(async (jobId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response: any = await api.post(`/jobs/${jobId}/publish`);
      
      if (response.success) {
        // Update job status
        setJobs(prev => 
          prev.map(job => 
            job.id === jobId ? { ...job, status: 'active' } : job
          )
        );
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to publish job');
      }
    } catch (err) {
      console.error('Publish job error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to publish job';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Pause job
  const pauseJob = useCallback(async (jobId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response: any = await api.post(`/jobs/${jobId}/pause`);
      
      if (response.success) {
        // Update job status
        setJobs(prev => 
          prev.map(job => 
            job.id === jobId ? { ...job, status: 'paused' } : job
          )
        );
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to pause job');
      }
    } catch (err) {
      console.error('Pause job error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to pause job';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Clone job
  const cloneJob = useCallback(async (jobId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response: any = await api.post(`/jobs/${jobId}/clone`);
      
      if (response.success) {
        // Refresh jobs list
        await loadJobs();
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to clone job');
      }
    } catch (err) {
      console.error('Clone job error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to clone job';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadJobs]);

  // Load job applications
  const loadApplications = useCallback(async (options: {
    page?: number;
    limit?: number;
    status?: string;
    jobId?: string;
    sort?: string;
  } = {}) => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (options.page) searchParams.append('page', options.page.toString());
      if (options.limit) searchParams.append('limit', options.limit.toString());
      if (options.status) searchParams.append('status', options.status);
      if (options.jobId) searchParams.append('job_id', options.jobId);
      if (options.sort) searchParams.append('sort', options.sort);

      const response: any = await api.get(`/employer/applications?${searchParams.toString()}`);
      
      if (response.success) {
        setApplications(response.data.applications || []);
      } else {
        throw new Error(response.error || 'Failed to load applications');
      }
    } catch (err) {
      console.error('Load applications error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update application status
  const updateApplicationStatus = useCallback(async (
    applicationId: string, 
    statusData: {
      status: string;
      notes?: string;
      interview_type?: string;
      interview_scheduled_at?: string;
      rejection_reason?: string;
      rejection_feedback?: string;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response: any = await api.put(`/applications/${applicationId}/status`, statusData);
      
      if (response.success) {
        // Update applications list
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId ? { ...app, ...response.data } : app
          )
        );
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update application status');
      }
    } catch (err) {
      console.error('Update application status error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update application status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load job templates
  const loadTemplates = useCallback(async () => {
    try {
      const response: any = await api.get('/employer/templates');
      
      if (response.success) {
        setTemplates(response.data);
      } else {
        console.error('Failed to load templates:', response.error);
      }
    } catch (err) {
      console.error('Load templates error:', err);
    }
  }, []);

  // Create job template
  const createTemplate = useCallback(async (templateData: {
    name: string;
    description?: string;
    template_data: any;
    is_public?: boolean;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const response: any = await api.post('/employer/templates', templateData);
      
      if (response.success) {
        // Refresh templates list
        await loadTemplates();
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create template');
      }
    } catch (err) {
      console.error('Create template error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadTemplates]);

  // Load analytics
  const loadAnalytics = useCallback(async (options: {
    days?: number;
    jobId?: string;
  } = {}) => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (options.days) searchParams.append('days', options.days.toString());
      if (options.jobId) searchParams.append('job_id', options.jobId);

      const response: any = await api.get(`/employer/analytics?${searchParams.toString()}`);
      
      if (response.success) {
        setAnalytics(response.data);
      } else {
        throw new Error(response.error || 'Failed to load analytics');
      }
    } catch (err) {
      console.error('Load analytics error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  // Export applications
  const exportApplications = useCallback(async (options: {
    format: 'csv' | 'pdf' | 'json';
    jobId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      searchParams.append('format', options.format);
      if (options.jobId) searchParams.append('job_id', options.jobId);
      if (options.status) searchParams.append('status', options.status);
      if (options.dateFrom) searchParams.append('date_from', options.dateFrom);
      if (options.dateTo) searchParams.append('date_to', options.dateTo);

      const response = await fetch(`${api.baseURL}/employer/export/applications?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${api.getToken()}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `applications_${new Date().toISOString().split('T')[0]}.${options.format}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        return true;
      } else {
        throw new Error('Failed to export applications');
      }
    } catch (err) {
      console.error('Export applications error:', err);
      setError(err instanceof Error ? err.message : 'Failed to export applications');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper functions
  const getJobsByStatus = useCallback((status: string) => {
    return jobs.filter(job => job.status === status);
  }, [jobs]);

  const getApplicationsByStatus = useCallback((status: string) => {
    return applications.filter(app => app.status === status);
  }, [applications]);

  return {
    // State
    dashboard,
    jobs,
    applications,
    templates,
    analytics,
    loading,
    error,

    // Actions
    loadDashboard,
    loadJobs,
    createJob,
    updateJob,
    deleteJob,
    publishJob,
    pauseJob,
    cloneJob,
    loadApplications,
    updateApplicationStatus,
    loadTemplates,
    createTemplate,
    loadAnalytics,
    exportApplications,

    // Helpers
    getJobsByStatus,
    getApplicationsByStatus
  };
};