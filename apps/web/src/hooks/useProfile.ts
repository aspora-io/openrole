import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api';

export interface ProfileData {
  id: string;
  userId: string;
  headline?: string;
  summary?: string;
  location?: string;
  phoneNumber?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  skills: string[];
  industries: string[];
  salaryExpectationMin?: number;
  salaryExpectationMax?: number;
  remotePreference?: string;
  profileCompleteness: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpdateData {
  headline?: string;
  summary?: string;
  location?: string;
  phoneNumber?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  skills?: string[];
  industries?: string[];
  salaryExpectationMin?: number;
  salaryExpectationMax?: number;
  remotePreference?: string;
}

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (id?: string) => {
    if (!id && !userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiClient.get<ProfileData>(`/api/profile/${id || userId}`);
      setProfile(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateProfile = useCallback(async (data: ProfileUpdateData) => {
    if (!userId) throw new Error('No user ID provided');
    
    setLoading(true);
    setError(null);
    
    try {
      const updatedProfile = await apiClient.put<ProfileData>(`/api/profile/${userId}`, data);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createProfile = useCallback(async (data: ProfileUpdateData) => {
    if (!userId) throw new Error('No user ID provided');
    
    setLoading(true);
    setError(null);
    
    try {
      const newProfile = await apiClient.post<ProfileData>('/api/profile', {
        userId,
        ...data
      });
      setProfile(newProfile);
      return newProfile;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create profile');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const deleteProfile = useCallback(async () => {
    if (!userId) throw new Error('No user ID provided');
    
    setLoading(true);
    setError(null);
    
    try {
      await apiClient.delete(`/api/profile/${userId}`);
      setProfile(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete profile');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [fetchProfile, userId]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    createProfile,
    deleteProfile,
    refetch: () => fetchProfile()
  };
}