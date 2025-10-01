'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Filter, Briefcase, Clock, DollarSign, Building2, ChevronDown, ChevronRight, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock job data for MVP
const mockJobs = [
  {
    id: '1',
    title: 'Senior Software Developer',
    company: 'Tech Corp',
    location: 'London',
    salary_min: 60000,
    salary_max: 80000,
    type: 'permanent',
    posted_date: '2024-03-15',
    description: 'We are looking for an experienced software developer to join our team...',
    remote: false,
    featured: true
  },
  {
    id: '2',
    title: 'Marketing Manager',
    company: 'Global Marketing Ltd',
    location: 'Manchester',
    salary_min: 45000,
    salary_max: 55000,
    type: 'permanent',
    posted_date: '2024-03-14',
    description: 'Exciting opportunity for a marketing professional...',
    remote: true,
    featured: false
  },
  {
    id: '3',
    title: 'Data Analyst',
    company: 'Analytics Pro',
    location: 'Birmingham',
    salary_min: 35000,
    salary_max: 45000,
    type: 'contract',
    posted_date: '2024-03-13',
    description: 'Join our data team to help drive insights...',
    remote: true,
    featured: false
  },
  // Add more mock jobs as needed
];

export default function JobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState({
    jobType: [] as string[],
    salaryRange: '',
    datePosted: '',
    remote: false,
    industry: [] as string[]
  });
  const [sortBy, setSortBy] = useState('relevance');
  const [jobs, setJobs] = useState(mockJobs);

  // Filter options
  const jobTypes = ['Permanent', 'Temporary', 'Contract', 'Part Time'];
  const salaryRanges = [
    'Up to £20,000',
    '£20,000 - £30,000', 
    '£30,000 - £40,000',
    '£40,000 - £50,000',
    '£50,000 - £70,000',
    '£70,000+'
  ];
  const dateOptions = ['Today', 'Last 3 days', 'Last 7 days', 'Last 14 days', 'Last 30 days'];
  const industries = ['Technology', 'Healthcare', 'Finance', 'Marketing', 'Sales', 'Engineering'];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In real app, this would make an API call
    console.log('Searching for:', { searchQuery, location, filters: selectedFilters });
  };

  const toggleFilter = (category: string, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [category]: prev[category as keyof typeof prev] === value ? '' : value
    }));
  };

  const toggleArrayFilter = (category: string, value: string) => {
    setSelectedFilters(prev => {
      const currentValues = prev[category as keyof typeof prev] as string[];
      if (currentValues.includes(value)) {
        return {
          ...prev,
          [category]: currentValues.filter(v => v !== value)
        };
      } else {
        return {
          ...prev,
          [category]: [...currentValues, value]
        };
      }
    });
  };

  const formatSalary = (min: number, max: number) => {
    return `£${min.toLocaleString()} - £${max.toLocaleString()}`;
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <form onSubmit={handleSearch}>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Job title, keywords or company"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Location or postcode"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Results Header */}
      <div className="bg-gray-100 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? 'Hide filters' : 'Show filters'}
              </button>
              <span className="text-gray-600">
                {jobs.length} jobs found
              </span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="relevance">Most relevant</option>
              <option value="date">Date posted</option>
              <option value="salary">Salary</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <aside className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-4 space-y-6">
                {/* Job Type */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Job Type</h3>
                  <div className="space-y-2">
                    {jobTypes.map(type => (
                      <label key={type} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFilters.jobType.includes(type)}
                          onChange={() => toggleArrayFilter('jobType', type)}
                          className="mr-2 w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                        />
                        <span className="text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Salary Range */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Salary Range</h3>
                  <div className="space-y-2">
                    {salaryRanges.map(range => (
                      <label key={range} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="salary"
                          checked={selectedFilters.salaryRange === range}
                          onChange={() => toggleFilter('salaryRange', range)}
                          className="mr-2 w-4 h-4 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-gray-700">{range}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Date Posted */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Date Posted</h3>
                  <div className="space-y-2">
                    {dateOptions.map(option => (
                      <label key={option} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="date"
                          checked={selectedFilters.datePosted === option}
                          onChange={() => toggleFilter('datePosted', option)}
                          className="mr-2 w-4 h-4 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Remote Work */}
                <div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFilters.remote}
                      onChange={(e) => setSelectedFilters(prev => ({ ...prev, remote: e.target.checked }))}
                      className="mr-2 w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="font-semibold text-gray-800">Remote opportunities only</span>
                  </label>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={() => setSelectedFilters({
                    jobType: [],
                    salaryRange: '',
                    datePosted: '',
                    remote: false,
                    industry: []
                  })}
                  className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                >
                  Clear all filters
                </button>
              </div>
            </aside>
          )}

          {/* Job Listings */}
          <div className="flex-1">
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link href={`/jobs/${job.id}`} className="group">
                            <h2 className="text-xl font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">
                              {job.title}
                            </h2>
                          </Link>
                          <div className="flex items-center gap-4 mt-2 text-gray-600">
                            <div className="flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              <span>{job.company}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{job.location}</span>
                              {job.remote && <span className="text-teal-600 font-medium">(Remote)</span>}
                            </div>
                          </div>
                        </div>
                        {job.featured && (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            Featured
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1 text-green-600 font-semibold">
                          <DollarSign className="w-4 h-4" />
                          <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                        </div>
                        <span className="text-gray-500">
                          {job.type.charAt(0).toUpperCase() + job.type.slice(1)}
                        </span>
                        <span className="text-gray-500">
                          <Clock className="w-4 h-4 inline mr-1" />
                          {getRelativeTime(job.posted_date)}
                        </span>
                      </div>

                      <p className="mt-3 text-gray-600 line-clamp-2">
                        {job.description}
                      </p>

                      <div className="mt-4 flex items-center gap-4">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="text-teal-600 hover:text-teal-700 font-medium"
                        >
                          View details
                        </Link>
                        <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                          <Star className="w-4 h-4" />
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex justify-center">
              <nav className="flex items-center gap-2">
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50" disabled>
                  Previous
                </button>
                <button className="px-3 py-1 bg-teal-600 text-white rounded">1</button>
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">2</button>
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">3</button>
                <span className="px-2">...</span>
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">10</button>
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Job Alert CTA */}
      <div className="bg-teal-50 border-t">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Get job alerts for this search</h3>
              <p className="text-gray-600 text-sm">Be the first to know about new opportunities</p>
            </div>
            <button className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded transition-colors">
              Create job alert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}