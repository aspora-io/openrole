import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

class ApiClient {
  private client: AxiosInstance;
  public baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('openrole_token');
    }
    return null;
  }

  getToken(): string | null {
    return this.getAuthToken();
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('openrole_token', token);
    }
  }

  clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('openrole_token');
      localStorage.removeItem('user_data');
    }
  }

  private handleUnauthorized(): void {
    this.clearToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  // File upload with progress
  async uploadFile<T>(
    url: string, 
    formData: FormData, 
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const response = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  }

  // Download file
  async download(url: string, filename?: string): Promise<boolean> {
    try {
      const response = await this.client.get(url, {
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Try to get filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition && contentDisposition.includes('filename=')) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          link.download = matches[1].replace(/['"]/g, '');
        }
      } else if (filename) {
        link.download = filename;
      } else {
        link.download = 'download';
      }
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      return true;
    } catch (error) {
      console.error('Download failed:', error);
      return false;
    }
  }
}

// Create singleton instance
export const api = new ApiClient();

// Legacy export for backward compatibility
export const apiClient = api;

// Export types for TypeScript support
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

// Job board specific API endpoints
export const jobsApi = {
  // Job search and listing
  searchJobs: (params: Record<string, any>) => api.get('/jobs', { params }),
  getJob: (jobId: string) => api.get(`/jobs/${jobId}`),
  getSimilarJobs: (jobId: string, limit?: number) => api.get(`/jobs/${jobId}/similar`, { params: { limit } }),
  getTrendingJobs: (limit?: number, days?: number) => api.get('/jobs/trending', { params: { limit, days } }),
  getSearchSuggestions: (query: string, type: string) => api.get('/jobs/suggestions', { params: { query, type } }),

  // Job management (employer)
  createJob: (jobData: any) => api.post('/jobs', jobData),
  updateJob: (jobId: string, jobData: any) => api.put(`/jobs/${jobId}`, jobData),
  deleteJob: (jobId: string) => api.delete(`/jobs/${jobId}`),
  publishJob: (jobId: string) => api.post(`/jobs/${jobId}/publish`),
  pauseJob: (jobId: string) => api.post(`/jobs/${jobId}/pause`),
  cloneJob: (jobId: string) => api.post(`/jobs/${jobId}/clone`),
  
  // Job analytics
  getJobAnalytics: (jobId: string, days?: number) => api.get(`/jobs/${jobId}/analytics`, { params: { days } }),
  
  // Saved jobs (candidate)
  getSavedJobs: (params?: Record<string, any>) => api.get('/jobs/saved', { params }),
  saveJob: (jobId: string) => api.post(`/jobs/${jobId}/save`),
  unsaveJob: (jobId: string) => api.delete(`/jobs/${jobId}/save`),
};

export const applicationsApi = {
  // Application management
  getApplications: (params?: Record<string, any>) => api.get('/applications', { params }),
  getApplication: (applicationId: string) => api.get(`/applications/${applicationId}`),
  submitApplication: (jobId: string, applicationData: any) => api.post(`/jobs/${jobId}/apply`, applicationData),
  withdrawApplication: (applicationId: string) => api.delete(`/applications/${applicationId}`),
  getApplicationStats: () => api.get('/applications/stats'),
  getApplicationTimeline: (applicationId: string) => api.get(`/applications/${applicationId}/timeline`),
  
  // Application status updates (employer)
  updateApplicationStatus: (applicationId: string, statusData: any) => 
    api.put(`/applications/${applicationId}/status`, statusData),
  addApplicationFeedback: (applicationId: string, feedbackData: any) => 
    api.post(`/applications/${applicationId}/feedback`, feedbackData),
  bulkUpdateApplications: (bulkData: any) => api.post('/applications/bulk-action', bulkData),
  
  // Export
  exportApplications: (format: string, params?: Record<string, any>) => 
    api.download(`/applications/export?format=${format}&${new URLSearchParams(params || {})}`),
};

export const employerApi = {
  // Dashboard
  getDashboard: (days?: number) => api.get('/employer/dashboard', { params: { days } }),
  getStats: () => api.get('/employer/stats'),
  
  // Job management
  getJobs: (params?: Record<string, any>) => api.get('/employer/jobs', { params }),
  getJobDrafts: () => api.get('/employer/jobs/drafts'),
  bulkJobAction: (actionData: any) => api.post('/employer/jobs/bulk-action', actionData),
  
  // Application management
  getApplications: (params?: Record<string, any>) => api.get('/employer/applications', { params }),
  getCandidatePipeline: (params?: Record<string, any>) => api.get('/employer/candidates', { params }),
  
  // Analytics
  getAnalytics: (params?: Record<string, any>) => api.get('/employer/analytics', { params }),
  getHiringFunnel: (params?: Record<string, any>) => api.get('/employer/analytics/hiring-funnel', { params }),
  getDiversityAnalytics: (days?: number) => api.get('/employer/analytics/diversity', { params: { days } }),
  getSourceAttribution: (days?: number) => api.get('/employer/analytics/source-attribution', { params: { days } }),
  
  // Company management
  getCompanyProfile: () => api.get('/employer/company'),
  updateCompanyProfile: (companyData: any) => api.put('/employer/company', companyData),
  
  // Templates
  getTemplates: () => api.get('/employer/templates'),
  createTemplate: (templateData: any) => api.post('/employer/templates', templateData),
  updateTemplate: (templateId: string, templateData: any) => api.put(`/employer/templates/${templateId}`, templateData),
  deleteTemplate: (templateId: string) => api.delete(`/employer/templates/${templateId}`),
  
  // Team management
  getTeamMembers: () => api.get('/employer/team'),
  inviteTeamMember: (inviteData: any) => api.post('/employer/team/invite', inviteData),
  
  // Export
  exportApplicationsReport: (params: Record<string, any>) => 
    api.download(`/employer/export/applications?${new URLSearchParams(params)}`),
  exportAnalyticsReport: (params: Record<string, any>) => 
    api.download(`/employer/export/analytics?${new URLSearchParams(params)}`),
};

// Integration with existing CV & Profile Tools
export const integrationApi = {
  // Profile integration
  getProfile: () => api.get('/profile/me'),
  getCVDocuments: () => api.get('/cv/documents'),
  getPortfolioItems: () => api.get('/portfolio'),
  
  // Privacy integration
  getPrivacySettings: () => api.get('/privacy/settings/me'),
  updatePrivacySettings: (settings: any) => api.put('/privacy/settings/me', settings),
  
  // File integration
  uploadCV: (file: File, metadata: any) => {
    const formData = new FormData();
    formData.append('cv', file);
    Object.entries(metadata).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    return api.uploadFile('/files/cv/upload', formData);
  },
  
  uploadPortfolioFile: (file: File, metadata: any) => {
    const formData = new FormData();
    formData.append('portfolio', file);
    Object.entries(metadata).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    return api.uploadFile('/files/portfolio/upload', formData);
  },
};