import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api';

export interface PrivacySettings {
  profileVisibility: 'PUBLIC' | 'REGISTERED_ONLY' | 'EMPLOYERS_ONLY' | 'PRIVATE';
  showEmail: boolean;
  showPhoneNumber: boolean;
  showLinkedin: boolean;
  showPortfolio: boolean;
  showGitHub: boolean;
  showSalaryExpectations: boolean;
  showLocation: boolean;
  showWorkExperience: boolean;
  showEducation: boolean;
  searchableByRecruiters: boolean;
  allowContactFromRecruiters: boolean;
  receiveJobAlerts: boolean;
  receiveNewsletters: boolean;
}

export interface DataExportResult {
  downloadUrl: string;
  expiresAt: string;
  fileSize: number;
  format: 'json' | 'csv';
}

export interface DataDeletionResult {
  scheduledAt: string;
  completionDate: string;
  confirmationCode: string;
}

export function usePrivacy() {
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrivacySettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response: any = await apiClient.get<PrivacySettings>('/api/privacy/settings');
      setPrivacySettings(response);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch privacy settings');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePrivacySettings = useCallback(async (settings: Partial<PrivacySettings>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response: any = await apiClient.put<PrivacySettings>('/api/privacy/settings', settings);
      setPrivacySettings(response);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update privacy settings');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportUserData = useCallback(async (format: 'json' | 'csv' = 'json') => {
    setLoading(true);
    setError(null);
    
    try {
      const response: any = await apiClient.post<DataExportResult>('/api/privacy/export', { format });
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Data export failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const requestDataDeletion = useCallback(async (confirmationText: string) => {
    if (confirmationText !== 'DELETE') {
      throw new Error('Invalid confirmation text');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response: any = await apiClient.post<DataDeletionResult>('/api/privacy/delete', {
        confirmation: confirmationText
      });
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Data deletion request failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const anonymizeUserData = useCallback(async (confirmationText: string) => {
    if (confirmationText !== 'ANONYMIZE') {
      throw new Error('Invalid confirmation text');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response: any = await apiClient.post('/api/privacy/anonymize', {
        confirmation: confirmationText
      });
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Data anonymization failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDataProcessingInfo = useCallback(async () => {
    try {
      const response: any = await apiClient.get<{
        dataCollected: Array<{
          category: string;
          description: string;
          purpose: string;
          retention: string;
        }>;
        legalBasis: string;
        thirdParties: Array<{
          name: string;
          purpose: string;
          dataShared: string[];
        }>;
        rights: Array<{
          right: string;
          description: string;
          howToExercise: string;
        }>;
      }>('/api/privacy/data-processing-info');
      
      return response;
    } catch (err: any) {
      console.error('Failed to fetch data processing info:', err);
      return null;
    }
  }, []);

  const downloadDataExport = useCallback(async (exportId: string) => {
    try {
      const response: any = await apiClient.get(`/api/privacy/export/${exportId}/download`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response as any]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `openrole-data-export-${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Download failed');
      throw err;
    }
  }, []);

  const getConsentHistory = useCallback(async () => {
    try {
      const response: any = await apiClient.get<Array<{
        consentType: string;
        granted: boolean;
        timestamp: string;
        ipAddress: string;
        userAgent: string;
      }>>('/api/privacy/consent-history');
      
      return response;
    } catch (err: any) {
      console.error('Failed to fetch consent history:', err);
      return [];
    }
  }, []);

  const updateConsent = useCallback(async (consentType: string, granted: boolean) => {
    setLoading(true);
    setError(null);
    
    try {
      const response: any = await apiClient.post('/api/privacy/consent', {
        consentType,
        granted
      });
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update consent');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkDataPortability = useCallback(async () => {
    try {
      const response: any = await apiClient.get<{
        canExport: boolean;
        lastExport?: string;
        cooldownPeriod: number;
        nextAvailableExport?: string;
      }>('/api/privacy/portability-check');
      
      return response;
    } catch (err: any) {
      console.error('Failed to check data portability:', err);
      return null;
    }
  }, []);

  const reportDataBreach = useCallback(async (description: string, affectedData: string[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const response: any = await apiClient.post('/api/privacy/breach-report', {
        description,
        affectedData
      });
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to report data breach');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPrivacyDashboard = useCallback(async () => {
    try {
      const response: any = await apiClient.get<{
        profileVisibility: string;
        dataSharing: {
          recruiters: boolean;
          analytics: boolean;
          thirdParty: boolean;
        };
        communications: {
          jobAlerts: boolean;
          newsletters: boolean;
          marketing: boolean;
        };
        dataRetention: {
          profileData: string;
          activityLogs: string;
          backups: string;
        };
        recentActivity: Array<{
          action: string;
          timestamp: string;
          ipAddress: string;
        }>;
      }>('/api/privacy/dashboard');
      
      return response;
    } catch (err: any) {
      console.error('Failed to fetch privacy dashboard:', err);
      return null;
    }
  }, []);

  return {
    privacySettings,
    loading,
    error,
    fetchPrivacySettings,
    updatePrivacySettings,
    exportUserData,
    requestDataDeletion,
    anonymizeUserData,
    getDataProcessingInfo,
    downloadDataExport,
    getConsentHistory,
    updateConsent,
    checkDataPortability,
    reportDataBreach,
    getPrivacyDashboard
  };
}