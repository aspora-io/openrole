import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api';

export interface UploadedFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  isDefault?: boolean;
  label?: string;
  uploadType?: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export function useFileUpload() {
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map());
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadCV = useCallback(async (
    file: File, 
    label: string, 
    isDefault: boolean = false
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('label', label);
    formData.append('isDefault', isDefault.toString());

    setUploadProgress(prev => new Map(prev).set(file.name, {
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    }));

    try {
      const response = await apiClient.uploadFile<UploadedFile>(
        '/api/files/cv',
        formData,
        (progress) => {
          setUploadProgress(prev => new Map(prev).set(file.name, {
            fileName: file.name,
            progress,
            status: 'uploading'
          }));
        }
      );

      setUploadProgress(prev => new Map(prev).set(file.name, {
        fileName: file.name,
        progress: 100,
        status: 'completed'
      }));

      // Update files list
      setFiles(prev => [...prev, response]);
      
      return response;
    } catch (err: any) {
      setUploadProgress(prev => new Map(prev).set(file.name, {
        fileName: file.name,
        progress: 0,
        status: 'error',
        error: err.response?.data?.message || 'Upload failed'
      }));
      throw err;
    }
  }, []);

  const uploadPortfolioFile = useCallback(async (
    file: File,
    portfolioItemId: string
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('portfolioItemId', portfolioItemId);

    setUploadProgress(prev => new Map(prev).set(file.name, {
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    }));

    try {
      const response = await apiClient.uploadFile<UploadedFile>(
        '/api/files/portfolio',
        formData,
        (progress) => {
          setUploadProgress(prev => new Map(prev).set(file.name, {
            fileName: file.name,
            progress,
            status: 'uploading'
          }));
        }
      );

      setUploadProgress(prev => new Map(prev).set(file.name, {
        fileName: file.name,
        progress: 100,
        status: 'completed'
      }));

      setFiles(prev => [...prev, response]);
      
      return response;
    } catch (err: any) {
      setUploadProgress(prev => new Map(prev).set(file.name, {
        fileName: file.name,
        progress: 0,
        status: 'error',
        error: err.response?.data?.message || 'Upload failed'
      }));
      throw err;
    }
  }, []);

  const uploadProfilePhoto = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    setUploadProgress(prev => new Map(prev).set(file.name, {
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    }));

    try {
      const response = await apiClient.uploadFile<UploadedFile>(
        '/api/files/profile-photo',
        formData,
        (progress) => {
          setUploadProgress(prev => new Map(prev).set(file.name, {
            fileName: file.name,
            progress,
            status: 'uploading'
          }));
        }
      );

      setUploadProgress(prev => new Map(prev).set(file.name, {
        fileName: file.name,
        progress: 100,
        status: 'completed'
      }));

      setFiles(prev => [...prev, response]);
      
      return response;
    } catch (err: any) {
      setUploadProgress(prev => new Map(prev).set(file.name, {
        fileName: file.name,
        progress: 0,
        status: 'error',
        error: err.response?.data?.message || 'Upload failed'
      }));
      throw err;
    }
  }, []);

  const fetchUserFiles = useCallback(async (fileType?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = fileType ? `/api/files?type=${fileType}` : '/api/files';
      const response = await apiClient.get<UploadedFile[]>(url);
      setFiles(response);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch files');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFile = useCallback(async (fileId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await apiClient.delete(`/api/files/${fileId}`);
      setFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete file');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const setDefaultCV = useCallback(async (fileId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.patch<UploadedFile>(`/api/files/${fileId}/default`);
      setFiles(prev => prev.map(file => ({
        ...file,
        isDefault: file.id === fileId
      })));
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to set default CV');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearProgress = useCallback((fileName?: string) => {
    if (fileName) {
      setUploadProgress(prev => {
        const newMap = new Map(prev);
        newMap.delete(fileName);
        return newMap;
      });
    } else {
      setUploadProgress(new Map());
    }
  }, []);

  const getUploadQuota = useCallback(async () => {
    try {
      const response = await apiClient.get<{
        used: number;
        limit: number;
        remaining: number;
      }>('/api/files/quota');
      return response;
    } catch (err: any) {
      console.error('Failed to fetch upload quota:', err);
      return null;
    }
  }, []);

  return {
    uploadProgress: Array.from(uploadProgress.values()),
    files,
    loading,
    error,
    uploadCV,
    uploadPortfolioFile,
    uploadProfilePhoto,
    fetchUserFiles,
    deleteFile,
    setDefaultCV,
    clearProgress,
    getUploadQuota
  };
}