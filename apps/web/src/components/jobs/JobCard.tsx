import React, { useState } from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Building, 
  Bookmark, 
  BookmarkCheck, 
  Star,
  Users,
  Briefcase,
  Calendar,
  ExternalLink,
  Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    description: string;
    company: {
      id: string;
      name: string;
      logo_url?: string;
      verified?: boolean;
      size_category?: string;
    };
    salary_min: number;
    salary_max: number;
    salary_currency: string;
    salary_type: string;
    location_general?: string;
    location_precise?: string;
    remote_type: string;
    employment_type: string;
    experience_level: string;
    core_skills: string[];
    nice_to_have_skills?: string[];
    featured?: boolean;
    urgent?: boolean;
    created_at: string;
    updated_at: string;
    application_count?: number;
    view_count?: number;
    expires_at?: string;
  };
  onSave: () => void;
  isSaved: boolean;
  saving?: boolean;
  featured?: boolean;
  compact?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onSave,
  isSaved,
  saving = false,
  featured = false,
  compact = false
}) => {
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Format salary
  const formatSalary = () => {
    const { salary_min, salary_max, salary_currency, salary_type } = job;
    
    const formatAmount = (amount: number) => {
      if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}M`;
      } else if (amount >= 1000) {
        return `${(amount / 1000).toFixed(0)}K`;
      }
      return amount.toString();
    };

    const range = salary_min === salary_max 
      ? formatAmount(salary_min)
      : `${formatAmount(salary_min)} - ${formatAmount(salary_max)}`;

    const typeMap: Record<string, string> = {
      annual: '/year',
      monthly: '/month',
      daily: '/day',
      hourly: '/hour'
    };

    return `${salary_currency} ${range}${typeMap[salary_type] || ''}`;
  };

  // Format location
  const formatLocation = () => {
    if (job.remote_type === 'remote') return 'Remote';
    if (job.remote_type === 'hybrid') {
      return job.location_general ? `${job.location_general} (Hybrid)` : 'Hybrid';
    }
    return job.location_general || job.location_precise || 'On-site';
  };

  // Get time ago
  const timeAgo = formatDistanceToNow(new Date(job.created_at), { addSuffix: true });

  // Get expires in
  const getExpiresIn = () => {
    if (!job.expires_at) return null;
    const expiryDate = new Date(job.expires_at);
    const now = new Date();
    if (expiryDate <= now) return 'Expired';
    return formatDistanceToNow(expiryDate, { addSuffix: true });
  };

  // Truncate description
  const truncateDescription = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Get employment type display
  const getEmploymentTypeDisplay = () => {
    const typeMap: Record<string, string> = {
      'full-time': 'Full-time',
      'part-time': 'Part-time',
      'contract': 'Contract',
      'internship': 'Internship'
    };
    return typeMap[job.employment_type] || job.employment_type;
  };

  // Get experience level display
  const getExperienceLevelDisplay = () => {
    const levelMap = {
      'entry': 'Entry Level',
      'mid': 'Mid Level',
      'senior': 'Senior Level',
      'lead': 'Lead',
      'executive': 'Executive'
    };
    return levelMap[job.experience_level] || job.experience_level;
  };

  const cardClassName = `
    block bg-white rounded-lg border transition-all duration-200 hover:shadow-lg hover:border-blue-300
    ${featured ? 'border-yellow-300 shadow-md' : 'border-gray-200 hover:shadow-md'}
    ${compact ? 'p-4' : 'p-6'}
  `;

  return (
    <div className={cardClassName}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          {/* Company Logo */}
          <div className="flex-shrink-0">
            {job.company.logo_url ? (
              <img
                src={job.company.logo_url}
                alt={`${job.company.name} logo`}
                className="w-12 h-12 rounded-lg object-cover border border-gray-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                <Building className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>

          {/* Job Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Link
                  href={`/jobs/${job.id}`}
                  className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                >
                  {job.title}
                  {job.urgent && (
                    <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                      <Zap className="w-3 h-3" />
                      Urgent
                    </span>
                  )}
                </Link>

                <div className="flex items-center gap-2 mt-1">
                  <Link
                    href={`/companies/${job.company.id}`}
                    className="text-base font-medium text-blue-600 hover:text-blue-700"
                  >
                    {job.company.name}
                  </Link>
                  {job.company.verified && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      ✓ Verified
                    </span>
                  )}
                </div>

                {/* Location and Type */}
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {formatLocation()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {getEmploymentTypeDisplay()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {getExperienceLevelDisplay()}
                  </div>
                </div>
              </div>

              {/* Featured Badge */}
              {featured && (
                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  <Star className="w-3 h-3" />
                  Featured
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50"
          title={isSaved ? 'Remove from saved jobs' : 'Save job'}
        >
          {isSaved ? (
            <BookmarkCheck className="w-5 h-5 text-blue-600" />
          ) : (
            <Bookmark className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>

      {/* Salary */}
      <div className="flex items-center gap-1 text-lg font-semibold text-green-600 mb-3">
        <DollarSign className="w-5 h-5" />
        {formatSalary()}
      </div>

      {/* Description */}
      {!compact && (
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed">
            {showFullDescription 
              ? job.description 
              : truncateDescription(job.description)
            }
            {job.description.length > 200 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-blue-600 hover:text-blue-700 ml-1"
              >
                {showFullDescription ? 'Show less' : 'Show more'}
              </button>
            )}
          </p>
        </div>
      )}

      {/* Skills */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {job.core_skills.slice(0, compact ? 3 : 6).map((skill, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
            >
              {skill}
            </span>
          ))}
          {job.core_skills.length > (compact ? 3 : 6) && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
              +{job.core_skills.length - (compact ? 3 : 6)} more
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {timeAgo}
          </div>
          
          {job.application_count !== undefined && (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {job.application_count} applicant{job.application_count !== 1 ? 's' : ''}
            </div>
          )}

          {getExpiresIn() && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Expires {getExpiresIn()}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/jobs/${job.id}`}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};