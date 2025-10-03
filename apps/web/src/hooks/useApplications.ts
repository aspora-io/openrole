import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from './useAuth';

interface Application {
  id: string;
  job_id: string;
  job: {
    id: string;
    title: string;
    company: {
      id: string;
      name: string;
      logo_url?: string;
      verified?: boolean;
    };
  };
  status: string;
  cv_document_id?: string;
  cover_letter?: string;
  portfolio_items?: string[];
  custom_responses?: Record<string, any>;
  applied_at: string;
  updated_at: string;
  status_updated_at?: string;
  interview_scheduled_at?: string;
  interview_type?: string;
  rejection_reason?: string;
  rejection_feedback?: string;
  feedback_shared_with_candidate?: boolean;
}

interface ApplicationStats {
  total: number;
  submitted: number;
  in_progress: number;
  offers: number;
  hired: number;
  rejected: number;
  withdrawn: number;
}

export const useApplications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  // Load applications on mount and when user changes
  useEffect(() => {
    if (isAuthenticated) {
      loadApplications();
      loadApplicationStats();
    } else {
      setApplications([]);
      setStats(null);
    }
  }, [isAuthenticated, user]);

  // Load candidate's applications
  const loadApplications = useCallback(async (options: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}) => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (options.page) searchParams.append('page', options.page.toString());
      if (options.limit) searchParams.append('limit', options.limit.toString());
      if (options.status) searchParams.append('status', options.status);

      const response = await api.get(`/applications?${searchParams.toString()}`);
      
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
  }, [isAuthenticated]);

  // Load application statistics
  const loadApplicationStats = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await api.get('/applications/stats');
      
      if (response.success) {
        setStats(response.data);
      } else {
        console.error('Failed to load application stats:', response.error);
      }
    } catch (err) {
      console.error('Load application stats error:', err);
    }
  }, [isAuthenticated]);

  // Submit job application
  const submitApplication = useCallback(async (jobId: string, applicationData: {
    cv_document_id?: string;
    cover_letter?: string;
    portfolio_items?: string[];
    custom_responses?: Record<string, any>;
  }) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to apply for jobs');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.post(`/jobs/${jobId}/apply`, applicationData);
      
      if (response.success) {
        // Refresh applications list
        await loadApplications();
        await loadApplicationStats();
        
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to submit application');
      }
    } catch (err) {
      console.error('Submit application error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit application';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, loadApplications, loadApplicationStats]);

  // Withdraw application
  const withdrawApplication = useCallback(async (applicationId: string) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to manage applications');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.delete(`/applications/${applicationId}`);
      
      if (response.success) {
        // Optimistically update the applications list
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId 
              ? { ...app, status: 'withdrawn', updated_at: new Date().toISOString() }
              : app
          )
        );
        
        // Refresh stats
        await loadApplicationStats();
        
        return true;
      } else {
        throw new Error(response.error || 'Failed to withdraw application');
      }
    } catch (err) {
      console.error('Withdraw application error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to withdraw application';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, loadApplicationStats]);

  // Get application by ID
  const getApplicationById = useCallback(async (applicationId: string) => {
    if (!isAuthenticated) return null;

    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/applications/${applicationId}`);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Application not found');
      }
    } catch (err) {
      console.error('Get application by ID error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get application');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Get application timeline/history
  const getApplicationTimeline = useCallback(async (applicationId: string) => {
    if (!isAuthenticated) return [];

    try {
      const response = await api.get(`/applications/${applicationId}/timeline`);
      
      if (response.success) {
        return response.data;
      } else {
        return [];
      }
    } catch (err) {
      console.error('Get application timeline error:', err);
      return [];
    }
  }, [isAuthenticated]);

  // Export applications
  const exportApplications = useCallback(async (format: 'csv' | 'pdf' | 'json' = 'csv') => {
    if (!isAuthenticated) return null;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${api.baseURL}/applications/export?format=${format}`, {
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
        link.download = `applications_${new Date().toISOString().split('T')[0]}.${format}`;
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
  }, [isAuthenticated]);

  // Helper functions
  const getApplicationsByStatus = useCallback((status: string) => {
    return applications.filter(app => app.status === status);
  }, [applications]);

  const getRecentApplications = useCallback((limit: number = 5) => {
    return [...applications]
      .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
      .slice(0, limit);
  }, [applications]);

  const getApplicationsInProgress = useCallback(() => {
    const inProgressStatuses = [
      'screening', 'phone_interview', 'technical_interview', 
      'final_interview', 'reference_check', 'offer_extended'
    ];
    return applications.filter(app => inProgressStatuses.includes(app.status));
  }, [applications]);

  // Status display helpers
  const getStatusDisplay = useCallback((status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      submitted: { label: 'Submitted', color: 'blue' },
      screening: { label: 'Under Review', color: 'yellow' },
      phone_interview: { label: 'Phone Interview', color: 'purple' },
      technical_interview: { label: 'Technical Interview', color: 'purple' },
      final_interview: { label: 'Final Interview', color: 'purple' },
      reference_check: { label: 'Reference Check', color: 'orange' },
      offer_extended: { label: 'Offer Extended', color: 'green' },
      hired: { label: 'Hired', color: 'green' },
      rejected: { label: 'Not Selected', color: 'red' },
      withdrawn: { label: 'Withdrawn', color: 'gray' }
    };
    
    return statusMap[status] || { label: status, color: 'gray' };
  }, []);

  const canWithdraw = useCallback((application: Application) => {
    const nonWithdrawableStatuses = ['hired', 'rejected', 'withdrawn'];
    return !nonWithdrawableStatuses.includes(application.status);
  }, []);

  return {
    // State
    applications,
    stats,
    loading,
    error,

    // Actions
    loadApplications,
    loadApplicationStats,
    submitApplication,
    withdrawApplication,
    getApplicationById,
    getApplicationTimeline,
    exportApplications,

    // Helpers
    getApplicationsByStatus,
    getRecentApplications,
    getApplicationsInProgress,
    getStatusDisplay,
    canWithdraw
  };
};