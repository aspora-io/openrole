'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Briefcase, 
  FileText, 
  Heart, 
  TrendingUp, 
  Calendar,
  Bell,
  Settings,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Award,
  Building
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useApplications } from '../../hooks/useApplications';
import { useSavedJobs } from '../../hooks/useSavedJobs';
import { useEmployer } from '../../hooks/useEmployer';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, isCandidate, isEmployer } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const {
    applications,
    stats: applicationStats,
    loading: applicationsLoading,
    loadApplications,
    loadApplicationStats
  } = useApplications();

  const {
    savedJobs,
    loading: savedJobsLoading,
    loadSavedJobs
  } = useSavedJobs();

  const {
    dashboard: employerDashboard,
    jobs: employerJobs,
    loading: employerLoading,
    loadDashboard,
    loadJobs
  } = useEmployer();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Load data based on user type
  useEffect(() => {
    if (isAuthenticated && user) {
      if (isCandidate) {
        loadApplications();
        loadApplicationStats();
        loadSavedJobs();
      } else if (isEmployer) {
        loadDashboard();
        loadJobs();
      }
    }
  }, [isAuthenticated, user, isCandidate, isEmployer]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = isCandidate ? [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'saved', label: 'Saved Jobs', icon: Heart },
    { id: 'profile', label: 'Profile', icon: User }
  ] : [
    { id: 'overview', label: 'Dashboard', icon: TrendingUp },
    { id: 'jobs', label: 'My Jobs', icon: Briefcase },
    { id: 'candidates', label: 'Candidates', icon: User },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'screening': return 'bg-yellow-100 text-yellow-800';
      case 'interview': return 'bg-purple-100 text-purple-800';
      case 'offer': return 'bg-green-100 text-green-800';
      case 'hired': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'hired': 
      case 'offer': return CheckCircle;
      case 'rejected': return XCircle;
      case 'interview': return Calendar;
      default: return Clock;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="text-gray-600 mt-1">
                {isCandidate ? 'Track your job applications and discover new opportunities' : 'Manage your job postings and candidates'}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Bell className="h-5 w-5" />
              </button>
              <button 
                onClick={() => router.push('/settings')}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Candidate Dashboard */}
        {isCandidate && (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Applications</p>
                        <p className="text-3xl font-bold text-gray-900">{applicationStats?.total || 0}</p>
                      </div>
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">In Progress</p>
                        <p className="text-3xl font-bold text-gray-900">{applicationStats?.in_progress || 0}</p>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Offers</p>
                        <p className="text-3xl font-bold text-gray-900">{applicationStats?.offers || 0}</p>
                      </div>
                      <Award className="h-8 w-8 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Saved Jobs</p>
                        <p className="text-3xl font-bold text-gray-900">{savedJobs.length}</p>
                      </div>
                      <Heart className="h-8 w-8 text-red-600" />
                    </div>
                  </div>
                </div>

                {/* Recent Applications */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
                  </div>
                  <div className="p-6">
                    {applicationsLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse flex space-x-4">
                            <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                            <div className="flex-1 space-y-2 py-1">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : applications.length > 0 ? (
                      <div className="space-y-4">
                        {applications.slice(0, 5).map((application) => {
                          const StatusIcon = getStatusIcon(application.status);
                          return (
                            <div key={application.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                              <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                  <StatusIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{application.job.title}</p>
                                  <p className="text-sm text-gray-600">{application.job.company.name}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}>
                                  {application.status.replace('_', ' ').toUpperCase()}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(application.applied_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No applications yet</p>
                        <button 
                          onClick={() => router.push('/jobs')}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Browse Jobs
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'applications' && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">All Applications</h3>
                </div>
                <div className="p-6">
                  {applicationsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : applications.length > 0 ? (
                    <div className="space-y-4">
                      {applications.map((application) => {
                        const StatusIcon = getStatusIcon(application.status);
                        return (
                          <div key={application.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-4">
                                <StatusIcon className="h-6 w-6 text-gray-400 mt-1" />
                                <div>
                                  <h4 className="font-medium text-gray-900">{application.job.title}</h4>
                                  <p className="text-sm text-gray-600 flex items-center space-x-2">
                                    <Building className="h-4 w-4" />
                                    <span>{application.job.company.name}</span>
                                  </p>
                                  {application.cover_letter && (
                                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                      {application.cover_letter}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}>
                                  {application.status.replace('_', ' ').toUpperCase()}
                                </span>
                                <p className="text-xs text-gray-500 mt-2">
                                  Applied {new Date(application.applied_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                      <p className="text-gray-600 mb-6">Start applying to jobs to see them here</p>
                      <button 
                        onClick={() => router.push('/jobs')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Browse Jobs
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Saved Jobs</h3>
                </div>
                <div className="p-6">
                  {savedJobsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : savedJobs.length > 0 ? (
                    <div className="space-y-4">
                      {savedJobs.map((job) => (
                        <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{job.title}</h4>
                              <p className="text-sm text-gray-600 flex items-center space-x-2">
                                <Building className="h-4 w-4" />
                                <span>{job.company?.name}</span>
                              </p>
                              <p className="text-sm text-gray-500 mt-2">
                                Saved {new Date(job.saved_at).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() => router.push(`/jobs/${job.id}`)}
                              className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                            >
                              View Job
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No saved jobs</h3>
                      <p className="text-gray-600 mb-6">Save jobs you're interested in to easily find them later</p>
                      <button 
                        onClick={() => router.push('/jobs')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Browse Jobs
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Employer Dashboard */}
        {isEmployer && (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Cards */}
                {employerDashboard?.overview && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                          <p className="text-3xl font-bold text-gray-900">{employerDashboard.overview.active_jobs}</p>
                        </div>
                        <Briefcase className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Applications</p>
                          <p className="text-3xl font-bold text-gray-900">{employerDashboard.overview.total_applications}</p>
                        </div>
                        <FileText className="h-8 w-8 text-green-600" />
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">New This Week</p>
                          <p className="text-3xl font-bold text-gray-900">{employerDashboard.overview.applications_this_week}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-purple-600" />
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Hires Made</p>
                          <p className="text-3xl font-bold text-gray-900">{employerDashboard.overview.hires_made}</p>
                        </div>
                        <Award className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Applications */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
                  </div>
                  <div className="p-6">
                    {employerDashboard?.recent_applications && employerDashboard.recent_applications.length > 0 ? (
                      <div className="space-y-4">
                        {employerDashboard.recent_applications.slice(0, 5).map((application: any) => (
                          <div key={application.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                            <div className="flex items-center space-x-4">
                              <User className="h-8 w-8 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{application.candidate_name}</p>
                                <p className="text-sm text-gray-600">{application.job_title}</p>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(application.applied_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No recent applications</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}