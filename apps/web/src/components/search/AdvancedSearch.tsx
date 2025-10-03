'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Search criteria validation schema
const searchCriteriaSchema = z.object({
  keywords: z.string().optional(),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
  remotePreference: z.enum(['REMOTE_ONLY', 'HYBRID', 'ON_SITE', 'NO_PREFERENCE']).optional(),
  industries: z.array(z.string()).optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  experienceMin: z.number().min(0).optional(),
  experienceMax: z.number().min(0).optional(),
  availability: z.enum(['IMMEDIATE', 'WITHIN_30_DAYS', 'WITHIN_60_DAYS', 'NOT_LOOKING']).optional(),
  hasPortfolio: z.boolean().optional()
});

type SearchCriteria = z.infer<typeof searchCriteriaSchema>;

interface SearchResult {
  id: string;
  userId: string;
  headline: string;
  summary?: string;
  location?: string;
  skills: string[];
  industries: string[];
  salaryExpectationMin?: number;
  salaryExpectationMax?: number;
  remotePreference?: string;
  availability?: string;
  profileCompleteness: number;
  lastActive: string;
  hasPortfolio: boolean;
  portfolioItemCount: number;
  score: number;
}

interface AdvancedSearchProps {
  onSearch?: (criteria: SearchCriteria) => Promise<SearchResult[]>;
  onSelectProfile?: (profileId: string) => void;
  initialCriteria?: Partial<SearchCriteria>;
  showSavedSearches?: boolean;
}

// Mock data for suggestions
const mockSkillSuggestions = [
  'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 
  'Java', 'AWS', 'Docker', 'Kubernetes', 'Machine Learning',
  'Data Science', 'UI/UX', 'Product Management', 'DevOps'
];

const mockLocationSuggestions = [
  'San Francisco, CA', 'New York, NY', 'Los Angeles, CA',
  'Chicago, IL', 'Austin, TX', 'Seattle, WA', 'Boston, MA',
  'Remote', 'London, UK', 'Toronto, Canada'
];

const mockIndustrySuggestions = [
  'Technology', 'Healthcare', 'Finance', 'E-commerce', 
  'Education', 'Marketing', 'Manufacturing', 'Consulting',
  'Media', 'Non-profit', 'Government', 'Retail'
];

export default function AdvancedSearch({
  onSearch,
  onSelectProfile,
  initialCriteria = {},
  showSavedSearches = false
}: AdvancedSearchProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(initialCriteria.skills || []);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(initialCriteria.industries || []);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'lastActive' | 'profileCompleteness'>('relevance');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  
  // Autocomplete states
  const [skillInput, setSkillInput] = useState('');
  const [industryInput, setIndustryInput] = useState('');
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const [showIndustrySuggestions, setShowIndustrySuggestions] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<SearchCriteria>({
    resolver: zodResolver(searchCriteriaSchema),
    defaultValues: initialCriteria
  });

  const watchedSalaryMin = watch('salaryMin');
  const watchedSalaryMax = watch('salaryMax');
  const watchedExperienceMin = watch('experienceMin');
  const watchedExperienceMax = watch('experienceMax');

  useEffect(() => {
    setValue('skills', selectedSkills);
  }, [selectedSkills, setValue]);

  useEffect(() => {
    setValue('industries', selectedIndustries);
  }, [selectedIndustries, setValue]);

  const onSubmit = async (data: SearchCriteria) => {
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      if (onSearch) {
        const results = await onSearch(data);
        setSearchResults(sortResults(results, sortBy));
      }
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const sortResults = (results: SearchResult[], sortType: typeof sortBy) => {
    switch (sortType) {
      case 'lastActive':
        return [...results].sort((a, b) => 
          new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
        );
      case 'profileCompleteness':
        return [...results].sort((a, b) => b.profileCompleteness - a.profileCompleteness);
      case 'relevance':
      default:
        return [...results].sort((a, b) => b.score - a.score);
    }
  };

  const handleSortChange = (newSortBy: typeof sortBy) => {
    setSortBy(newSortBy);
    setSearchResults(sortResults(searchResults, newSortBy));
  };

  const addSkill = (skill: string) => {
    if (skill && !selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
      setSkillInput('');
      setShowSkillSuggestions(false);
    }
  };

  const removeSkill = (index: number) => {
    setSelectedSkills(selectedSkills.filter((_, i) => i !== index));
  };

  const addIndustry = (industry: string) => {
    if (industry && !selectedIndustries.includes(industry)) {
      setSelectedIndustries([...selectedIndustries, industry]);
      setIndustryInput('');
      setShowIndustrySuggestions(false);
    }
  };

  const removeIndustry = (index: number) => {
    setSelectedIndustries(selectedIndustries.filter((_, i) => i !== index));
  };

  const getFilteredSkills = () => {
    return mockSkillSuggestions.filter(skill => 
      skill.toLowerCase().includes(skillInput.toLowerCase()) &&
      !selectedSkills.includes(skill)
    );
  };

  const getFilteredIndustries = () => {
    return mockIndustrySuggestions.filter(industry => 
      industry.toLowerCase().includes(industryInput.toLowerCase()) &&
      !selectedIndustries.includes(industry)
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedSkills.length > 0) count++;
    if (selectedIndustries.length > 0) count++;
    if (watchedSalaryMin || watchedSalaryMax) count++;
    if (watchedExperienceMin || watchedExperienceMax) count++;
    if (watch('remotePreference')) count++;
    if (watch('availability')) count++;
    if (watch('hasPortfolio')) count++;
    return count;
  };

  const clearAllFilters = () => {
    reset();
    setSelectedSkills([]);
    setSelectedIndustries([]);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Search Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Search Professionals</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Main Search Bar */}
          <div>
            <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
              Search Keywords
            </label>
            <input
              id="keywords"
              type="text"
              {...register('keywords')}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search by job title, skills, or keywords..."
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <span>Filters</span>
              {getActiveFilterCount() > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {getActiveFilterCount()}
                </span>
              )}
            </button>

            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="border-t pt-6 space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear All
                </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Skills Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills ({selectedSkills.length})
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onFocus={() => setShowSkillSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSkillSuggestions(false), 200)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add skills..."
                    />
                    {showSkillSuggestions && getFilteredSkills().length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {getFilteredSkills().map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => addSkill(skill)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50"
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(index)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Location Filter */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    {...register('location')}
                    list="location-suggestions"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="City, state, or remote"
                  />
                  <datalist id="location-suggestions">
                    {mockLocationSuggestions.map((location) => (
                      <option key={location} value={location} />
                    ))}
                  </datalist>
                </div>

                {/* Remote Preference */}
                <div>
                  <label htmlFor="remotePreference" className="block text-sm font-medium text-gray-700 mb-2">
                    Remote Preference
                  </label>
                  <select
                    id="remotePreference"
                    {...register('remotePreference')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Any</option>
                    <option value="REMOTE_ONLY">Remote Only</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ON_SITE">On-Site</option>
                  </select>
                </div>

                {/* Industries Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industries ({selectedIndustries.length})
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={industryInput}
                      onChange={(e) => setIndustryInput(e.target.value)}
                      onFocus={() => setShowIndustrySuggestions(true)}
                      onBlur={() => setTimeout(() => setShowIndustrySuggestions(false), 200)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add industries..."
                    />
                    {showIndustrySuggestions && getFilteredIndustries().length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {getFilteredIndustries().map((industry) => (
                          <button
                            key={industry}
                            type="button"
                            onClick={() => addIndustry(industry)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50"
                          >
                            {industry}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedIndustries.map((industry, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                      >
                        {industry}
                        <button
                          type="button"
                          onClick={() => removeIndustry(index)}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Salary Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salary Expectations (Annual)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        {...register('salaryMin', { valueAsNumber: true })}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Min"
                        min="0"
                      />
                    </div>
                    <span className="self-center text-gray-500">-</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        {...register('salaryMax', { valueAsNumber: true })}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Max"
                        min="0"
                      />
                    </div>
                  </div>
                  {watchedSalaryMin && watchedSalaryMax && watchedSalaryMax < watchedSalaryMin && (
                    <p className="mt-1 text-sm text-red-600">
                      Max salary must be greater than min
                    </p>
                  )}
                </div>

                {/* Experience Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      {...register('experienceMin', { valueAsNumber: true })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Min"
                      min="0"
                    />
                    <span className="self-center text-gray-500">-</span>
                    <input
                      type="number"
                      {...register('experienceMax', { valueAsNumber: true })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Max"
                      min="0"
                    />
                  </div>
                  {watchedExperienceMin && watchedExperienceMax && watchedExperienceMax < watchedExperienceMin && (
                    <p className="mt-1 text-sm text-red-600">
                      Max experience must be greater than min
                    </p>
                  )}
                </div>

                {/* Availability */}
                <div>
                  <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-2">
                    Availability
                  </label>
                  <select
                    id="availability"
                    {...register('availability')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Any</option>
                    <option value="IMMEDIATE">Immediate</option>
                    <option value="WITHIN_30_DAYS">Within 30 Days</option>
                    <option value="WITHIN_60_DAYS">Within 60 Days</option>
                    <option value="NOT_LOOKING">Not Looking</option>
                  </select>
                </div>

                {/* Has Portfolio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Filters
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('hasPortfolio')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Has portfolio items</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {isSearching ? 'Searching...' : `${searchResults.length} Results Found`}
            </h3>
            
            <div className="flex items-center gap-4">
              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="relevance">Relevance</option>
                <option value="lastActive">Last Active</option>
                <option value="profileCompleteness">Profile Completeness</option>
              </select>

              {/* View Mode */}
              <div className="flex border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-2 text-sm ${viewMode === 'cards' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">
                Try adjusting your search criteria or removing some filters
              </p>
            </div>
          ) : (
            <div className={viewMode === 'cards' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className={`border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer ${
                    viewMode === 'list' ? 'flex items-start gap-6' : ''
                  }`}
                  onClick={() => onSelectProfile?.(result.id)}
                >
                  <div className={viewMode === 'list' ? 'flex-1' : ''}>
                    <h4 className="font-semibold text-gray-900 mb-2">{result.headline}</h4>
                    
                    {result.summary && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                        {result.summary}
                      </p>
                    )}

                    <div className="space-y-2 text-sm text-gray-600">
                      {result.location && (
                        <div className="flex items-center gap-2">
                          <span>📍</span>
                          <span>{result.location}</span>
                        </div>
                      )}

                      {result.salaryExpectationMin && result.salaryExpectationMax && (
                        <div className="flex items-center gap-2">
                          <span>💰</span>
                          <span>
                            ${result.salaryExpectationMin.toLocaleString()} - 
                            ${result.salaryExpectationMax.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {result.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {result.skills.slice(0, 5).map((skill, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {skill}
                            </span>
                          ))}
                          {result.skills.length > 5 && (
                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              +{result.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          {result.profileCompleteness}% Complete
                        </span>
                        {result.hasPortfolio && (
                          <span>
                            🎨 {result.portfolioItemCount} Portfolio Items
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        Active {new Date(result.lastActive).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}