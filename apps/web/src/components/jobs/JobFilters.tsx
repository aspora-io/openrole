import React, { useState, useCallback } from 'react';
import { 
  X, 
  MapPin, 
  DollarSign, 
  Briefcase, 
  Users, 
  Building, 
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface JobFiltersProps {
  filters: any;
  facets: {
    locations?: Array<{ value: string; count: number }>;
    remote_types?: Array<{ value: string; count: number }>;
    employment_types?: Array<{ value: string; count: number }>;
    experience_levels?: Array<{ value: string; count: number }>;
    departments?: Array<{ value: string; count: number }>;
    skills?: Array<{ skill: string; count: number }>;
  };
  onFilterChange: (filters: any) => void;
  onApply: () => void;
  onClear: () => void;
}

export const JobFilters: React.FC<JobFiltersProps> = ({
  filters,
  facets,
  onFilterChange,
  onApply,
  onClear
}) => {
  const [expandedSections, setExpandedSections] = useState({
    location: true,
    remote: true,
    employment: true,
    experience: true,
    salary: true,
    department: false,
    skills: false
  });

  const [salaryRange, setSalaryRange] = useState({
    min: filters.salary_min || '',
    max: filters.salary_max || ''
  });

  // Toggle section expansion
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // Handle filter updates
  const updateFilter = useCallback((key: string, value: any) => {
    const newFilters = { ...filters };
    
    if (value === null || value === undefined || value === '' || 
        (Array.isArray(value) && value.length === 0)) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    
    onFilterChange(newFilters);
  }, [filters, onFilterChange]);

  // Handle multi-select filters
  const handleMultiSelectChange = useCallback((key: string, value: string, checked: boolean) => {
    const currentValues = filters[key] || [];
    let newValues;
    
    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter((v: string) => v !== value);
    }
    
    updateFilter(key, newValues);
  }, [filters, updateFilter]);

  // Handle salary range changes
  const handleSalaryChange = useCallback((type: 'min' | 'max', value: string) => {
    const newRange = { ...salaryRange, [type]: value };
    setSalaryRange(newRange);
    
    if (value) {
      updateFilter(`salary_${type}`, parseInt(value));
    } else {
      updateFilter(`salary_${type}`, null);
    }
  }, [salaryRange, updateFilter]);

  // Filter sections configuration
  const filterSections = [
    {
      key: 'location',
      title: 'Location',
      icon: MapPin,
      expanded: expandedSections.location,
      content: (
        <div className="space-y-2">
          {facets.locations?.slice(0, 8).map(location => (
            <label key={location.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(filters.location || []).includes(location.value)}
                onChange={(e) => handleMultiSelectChange('location', location.value, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 flex-1">{location.value}</span>
              <span className="text-xs text-gray-500">({location.count})</span>
            </label>
          ))}
        </div>
      )
    },
    {
      key: 'remote',
      title: 'Work Type',
      icon: Building,
      expanded: expandedSections.remote,
      content: (
        <div className="space-y-2">
          {[
            { value: 'remote', label: 'Remote' },
            { value: 'hybrid', label: 'Hybrid' },
            { value: 'office', label: 'On-site' }
          ].map(option => {
            const facetData = facets.remote_types?.find(f => f.value === option.value);
            return (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="remote_type"
                  value={option.value}
                  checked={filters.remote_type === option.value}
                  onChange={(e) => updateFilter('remote_type', e.target.value)}
                  className="border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 flex-1">{option.label}</span>
                {facetData && (
                  <span className="text-xs text-gray-500">({facetData.count})</span>
                )}
              </label>
            );
          })}
        </div>
      )
    },
    {
      key: 'employment',
      title: 'Employment Type',
      icon: Briefcase,
      expanded: expandedSections.employment,
      content: (
        <div className="space-y-2">
          {[
            { value: 'full-time', label: 'Full-time' },
            { value: 'part-time', label: 'Part-time' },
            { value: 'contract', label: 'Contract' },
            { value: 'internship', label: 'Internship' }
          ].map(option => {
            const facetData = facets.employment_types?.find(f => f.value === option.value);
            return (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(filters.employment_type || []).includes(option.value)}
                  onChange={(e) => handleMultiSelectChange('employment_type', option.value, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 flex-1">{option.label}</span>
                {facetData && (
                  <span className="text-xs text-gray-500">({facetData.count})</span>
                )}
              </label>
            );
          })}
        </div>
      )
    },
    {
      key: 'experience',
      title: 'Experience Level',
      icon: Users,
      expanded: expandedSections.experience,
      content: (
        <div className="space-y-2">
          {[
            { value: 'entry', label: 'Entry Level' },
            { value: 'mid', label: 'Mid Level' },
            { value: 'senior', label: 'Senior Level' },
            { value: 'lead', label: 'Lead' },
            { value: 'executive', label: 'Executive' }
          ].map(option => {
            const facetData = facets.experience_levels?.find(f => f.value === option.value);
            return (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(filters.experience_level || []).includes(option.value)}
                  onChange={(e) => handleMultiSelectChange('experience_level', option.value, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 flex-1">{option.label}</span>
                {facetData && (
                  <span className="text-xs text-gray-500">({facetData.count})</span>
                )}
              </label>
            );
          })}
        </div>
      )
    },
    {
      key: 'salary',
      title: 'Salary Range',
      icon: DollarSign,
      expanded: expandedSections.salary,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Minimum
              </label>
              <input
                type="number"
                placeholder="€0"
                value={salaryRange.min}
                onChange={(e) => handleSalaryChange('min', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Maximum
              </label>
              <input
                type="number"
                placeholder="€200,000"
                value={salaryRange.max}
                onChange={(e) => handleSalaryChange('max', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Quick salary ranges */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-700">Quick ranges:</p>
            <div className="flex flex-wrap gap-1">
              {[
                { min: 30000, max: 50000, label: '€30-50K' },
                { min: 50000, max: 80000, label: '€50-80K' },
                { min: 80000, max: 120000, label: '€80-120K' },
                { min: 120000, max: null, label: '€120K+' }
              ].map(range => (
                <button
                  key={range.label}
                  onClick={() => {
                    setSalaryRange({ min: range.min.toString(), max: range.max?.toString() || '' });
                    updateFilter('salary_min', range.min);
                    updateFilter('salary_max', range.max);
                  }}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    }
  ];

  // Add departments section if facets are available
  if (facets.departments && facets.departments.length > 0) {
    filterSections.push({
      key: 'department',
      title: 'Department',
      icon: Building,
      expanded: expandedSections.department,
      content: (
        <div className="space-y-2">
          {facets.departments.slice(0, 6).map(dept => (
            <label key={dept.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(filters.department || []).includes(dept.value)}
                onChange={(e) => handleMultiSelectChange('department', dept.value, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 flex-1">{dept.value}</span>
              <span className="text-xs text-gray-500">({dept.count})</span>
            </label>
          ))}
        </div>
      )
    });
  }

  // Add skills section if facets are available
  if (facets.skills && facets.skills.length > 0) {
    filterSections.push({
      key: 'skills',
      title: 'Skills',
      icon: Filter,
      expanded: expandedSections.skills,
      content: (
        <div className="space-y-2">
          {facets.skills.slice(0, 10).map(skill => (
            <label key={skill.skill} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(filters.skills || []).includes(skill.skill)}
                onChange={(e) => handleMultiSelectChange('skills', skill.skill, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 flex-1">{skill.skill}</span>
              <span className="text-xs text-gray-500">({skill.count})</span>
            </label>
          ))}
        </div>
      )
    });
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filters
        </h3>
        <button
          onClick={onClear}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Clear all
        </button>
      </div>

      {/* Filter Sections */}
      <div className="space-y-6">
        {filterSections.map(section => (
          <div key={section.key} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
            <button
              onClick={() => toggleSection(section.key)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <section.icon className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">{section.title}</span>
              </div>
              {section.expanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            
            {section.expanded && (
              <div className="mt-3">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-6 pt-6 border-t border-gray-100">
        <button
          onClick={onApply}
          className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Apply Filters
        </button>
        <button
          onClick={onClear}
          className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Active Filter Count */}
      {Object.keys(filters).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            {Object.keys(filters).length} filter{Object.keys(filters).length !== 1 ? 's' : ''} active
          </p>
        </div>
      )}
    </div>
  );
};