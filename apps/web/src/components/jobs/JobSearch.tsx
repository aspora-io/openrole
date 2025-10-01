import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Filter, X, Star, Clock, Building, Users } from 'lucide-react';
import { JobCard } from './JobCard';
import { JobFilters } from './JobFilters';
import { useJobSearch } from '../../hooks/useJobSearch';
import { useSavedJobs } from '../../hooks/useSavedJobs';

interface JobSearchProps {
  initialQuery?: string;
  initialLocation?: string;
  initialFilters?: any;
}

export const JobSearch: React.FC<JobSearchProps> = ({
  initialQuery = '',
  initialLocation = '',
  initialFilters = {}
}) => {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [filters, setFilters] = useState(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationTerm, setLocationTerm] = useState('');

  // Custom hooks for job search functionality
  const {
    jobs,
    loading,
    error,
    pagination,
    facets,
    searchJobs,
    loadMore,
    resetSearch
  } = useJobSearch();

  const {
    savedJobs,
    saveJob,
    unsaveJob,
    loading: savingJob
  } = useSavedJobs();

  // Initial search on component mount
  useEffect(() => {
    handleSearch();
  }, []);

  // Handle search form submission
  const handleSearch = useCallback(async () => {
    const searchParams = {
      query: searchTerm || query,
      location: locationTerm || location,
      ...filters,
      page: 1
    };

    await searchJobs(searchParams);
    
    // Update URL with search parameters
    const urlParams = new URLSearchParams();
    if (searchParams.query) urlParams.set('q', searchParams.query);
    if (searchParams.location) urlParams.set('location', searchParams.location);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) urlParams.set(key, Array.isArray(value) ? value.join(',') : value.toString());
    });
    
    router.push(`/jobs?${urlParams.toString()}`);
  }, [searchTerm, locationTerm, query, location, filters, searchJobs, router]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters);
  }, []);

  // Handle filter application
  const handleApplyFilters = useCallback(() => {
    setShowFilters(false);
    handleSearch();
  }, [handleSearch]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    setLocationTerm('');
    resetSearch();
  }, [resetSearch]);

  // Handle job save/unsave
  const handleToggleSaveJob = useCallback(async (jobId: string) => {
    const isAlreadySaved = savedJobs.some(job => job.id === jobId);
    
    if (isAlreadySaved) {
      await unsaveJob(jobId);
    } else {
      await saveJob(jobId);
    }
  }, [savedJobs, saveJob, unsaveJob]);

  // Get active filter count
  const activeFilterCount = Object.values(filters).filter(value => 
    value !== null && value !== undefined && value !== '' && 
    (Array.isArray(value) ? value.length > 0 : true)
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Job title, keywords, or company"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Location Input */}
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="City, state, or remote"
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Button */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="relative px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Filter className="w-5 h-5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilterCount > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => {
                if (!value || (Array.isArray(value) && value.length === 0)) return null;
                
                const displayValue = Array.isArray(value) ? value.join(', ') : value.toString();
                return (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {key.replace('_', ' ')}: {displayValue}
                    <button
                      onClick={() => {
                        const newFilters = { ...filters };
                        delete newFilters[key];
                        setFilters(newFilters);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
              <button
                onClick={handleClearFilters}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-80 flex-shrink-0">
              <JobFilters
                filters={filters}
                facets={facets}
                onFilterChange={handleFilterChange}
                onApply={handleApplyFilters}
                onClear={handleClearFilters}
              />
            </div>
          )}

          {/* Job Results */}
          <div className="flex-1">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {pagination?.total ? (
                    <>
                      {pagination.total.toLocaleString()} job{pagination.total !== 1 ? 's' : ''} found
                    </>
                  ) : (
                    'Jobs'
                  )}
                </h1>
                {(query || location) && (
                  <p className="text-gray-600 mt-1">
                    {query && location 
                      ? `"${query}" in ${location}`
                      : query 
                        ? `"${query}"`
                        : `in ${location}`
                    }
                  </p>
                )}
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Sort by:</label>
                <select
                  value={filters.sort || 'relevance'}
                  onChange={(e) => {
                    const newFilters = { ...filters, sort: e.target.value };
                    setFilters(newFilters);
                    // Auto-apply sort change
                    setTimeout(() => handleSearch(), 100);
                  }}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date Posted</option>
                  <option value="salary_min">Salary (Low to High)</option>
                  <option value="salary_max">Salary (High to Low)</option>
                  <option value="company">Company</option>
                </select>
              </div>
            </div>

            {/* Featured Jobs */}
            {jobs.some(job => job.featured) && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Featured Jobs</h2>
                </div>
                <div className="grid gap-4">
                  {jobs
                    .filter(job => job.featured)
                    .slice(0, 3)
                    .map(job => (
                      <JobCard
                        key={job.id}
                        job={job}
                        onSave={() => handleToggleSaveJob(job.id)}
                        isSaved={savedJobs.some(savedJob => savedJob.id === job.id)}
                        saving={savingJob}
                        featured
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Regular Jobs */}
            <div className="space-y-4">
              {jobs
                .filter(job => !job.featured)
                .map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onSave={() => handleToggleSaveJob(job.id)}
                    isSaved={savedJobs.some(savedJob => savedJob.id === job.id)}
                    saving={savingJob}
                  />
                ))}
            </div>

            {/* Loading State */}
            {loading && jobs.length === 0 && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Searching for jobs...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && jobs.length === 0 && !error && (
              <div className="text-center py-12">
                <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or removing some filters
                </p>
                <button
                  onClick={handleClearFilters}
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Load More Button */}
            {pagination && pagination.page < pagination.totalPages && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Load More Jobs'}
                </button>
              </div>
            )}

            {/* Pagination Info */}
            {pagination && jobs.length > 0 && (
              <div className="text-center mt-6 text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total.toLocaleString()} jobs
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};