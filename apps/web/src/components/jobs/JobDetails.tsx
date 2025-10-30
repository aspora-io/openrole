import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Building, 
  Users, 
  Briefcase,
  Calendar,
  Star,
  Bookmark,
  BookmarkCheck,
  Share2,
  Flag,
  ExternalLink,
  ChevronRight,
  Award,
  Target,
  Heart,
  Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ApplicationForm } from './ApplicationForm';
// import { SimilarJobs } from './SimilarJobs'; // TODO: Create this component
// import { CompanyInfo } from './CompanyInfo'; // TODO: Create this component

interface JobDetailsProps {
  jobId: string;
}

export const JobDetails: React.FC<JobDetailsProps> = ({ jobId }) => {
  const [job, setJob] = useState(null);
  const [similarJobs, setSimilarJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applying, setApplying] = useState(false);

  // Load job details
  useEffect(() => {
    const loadJobDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch job details and similar jobs in parallel
        const [jobResponse, similarResponse] = await Promise.all([
          fetch(`/api/v1/jobs/${jobId}`),
          fetch(`/api/v1/jobs/${jobId}/similar`)
        ]);

        if (!jobResponse.ok) {
          throw new Error('Job not found');
        }

        const jobData = await jobResponse.json();
        const similarData = await similarResponse.json();

        setJob(jobData.data);
        setSimilarJobs(similarData.data || []);

        // Check if job is saved (if user is logged in)
        // TODO: Implement saved job check
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      loadJobDetails();
    }
  }, [jobId]);

  // Handle save/unsave job
  const handleToggleSave = async () => {
    try {
      const method = isSaved ? 'DELETE' : 'POST';
      const response = await fetch(`/api/v1/jobs/${jobId}/save`, {
        method,
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setIsSaved(!isSaved);
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  // Handle application submission
  const handleApply = async (applicationData) => {
    try {
      setApplying(true);
      
      const response = await fetch(`/api/v1/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationData)
      });

      if (response.ok) {
        setShowApplicationForm(false);
        // Show success message or redirect
        alert('Application submitted successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit application');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setApplying(false);
    }
  };

  // Handle share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: job.title,
          text: `Check out this job at ${job.company.name}`,
          url: window.location.href
        });
      } catch (err) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Job link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/jobs" className="text-blue-600 hover:text-blue-700">
            ← Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  if (!job) return null;

  // Format salary
  const formatSalary = () => {
    const { salary_min, salary_max, salary_currency, salary_type } = job;
    
    const formatAmount = (amount) => {
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

    const typeMap = {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/jobs" className="hover:text-blue-600">Jobs</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href={`/companies/${job.company.id}`} className="hover:text-blue-600">
              {job.company.name}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">{job.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Job Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  {/* Company Logo */}
                  <div className="flex-shrink-0">
                    {job.company.logo_url ? (
                      <img
                        src={job.company.logo_url}
                        alt={`${job.company.name} logo`}
                        className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                        <Building className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Job Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-2">
                      <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                      {job.featured && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                          <Star className="w-4 h-4" />
                          Featured
                        </span>
                      )}
                      {job.urgent && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                          <Zap className="w-4 h-4" />
                          Urgent
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/companies/${job.company.id}`}
                      className="text-xl font-semibold text-blue-600 hover:text-blue-700 mb-3 inline-flex items-center gap-2"
                    >
                      {job.company.name}
                      {job.company.verified && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          ✓ Verified
                        </span>
                      )}
                      <ExternalLink className="w-4 h-4" />
                    </Link>

                    {/* Job Meta */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {formatLocation()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        {job.employment_type.replace('-', ' ')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {job.experience_level} level
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                      </div>
                    </div>

                    {/* Salary */}
                    <div className="flex items-center gap-2 text-2xl font-bold text-green-600 mt-4">
                      <DollarSign className="w-6 h-6" />
                      {formatSalary()}
                      {job.equity_offered && (
                        <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                          + Equity
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleSave}
                    className="p-2 rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    title={isSaved ? 'Remove from saved jobs' : 'Save job'}
                  >
                    {isSaved ? (
                      <BookmarkCheck className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Bookmark className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    title="Share job"
                  >
                    <Share2 className="w-5 h-5 text-gray-400" />
                  </button>

                  <button className="p-2 rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-400">
                    <Flag className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {job.application_count || 0}
                  </div>
                  <div className="text-sm text-gray-600">Applicants</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {job.view_count || 0}
                  </div>
                  <div className="text-sm text-gray-600">Views</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {job.expires_at ? (
                      formatDistanceToNow(new Date(job.expires_at))
                    ) : (
                      'No limit'
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {job.expires_at ? 'Time left' : 'Application deadline'}
                  </div>
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About this role</h2>
              <div 
                className="prose prose-gray max-w-none"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            </div>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Requirements
                </h2>
                <ul className="space-y-2">
                  {job.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-gray-700">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Responsibilities
                </h2>
                <ul className="space-y-2">
                  {job.responsibilities.map((responsibility, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-gray-700">{responsibility}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Benefits & Perks
                </h2>
                <ul className="space-y-2">
                  {job.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Skills & Technologies</h2>
              
              {/* Required Skills */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.core_skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Nice to Have Skills */}
              {job.nice_to_have_skills && job.nice_to_have_skills.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Nice to Have</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.nice_to_have_skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Company Information */}
            {/* TODO: <CompanyInfo company={job.company} /> */}

            {/* Similar Jobs */}
            {/* TODO: <SimilarJobs jobs={similarJobs} /> */}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <button
                onClick={() => setShowApplicationForm(true)}
                className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply for this job
              </button>

              {job.external_application_url && (
                <div className="mt-3">
                  <div className="text-center text-sm text-gray-500 mb-2">or</div>
                  <a
                    href={job.external_application_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Apply on company website
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 space-y-2">
                {job.requires_cover_letter && (
                  <p>• Cover letter required</p>
                )}
                {job.requires_portfolio && (
                  <p>• Portfolio required</p>
                )}
                {job.application_deadline && (
                  <p>• Apply by {new Date(job.application_deadline).toLocaleDateString()}</p>
                )}
              </div>
            </div>

            {/* Job Insights */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Job Insights</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Application Activity</span>
                  <span className="font-medium">
                    {job.application_count < 10 ? 'Low' : 
                     job.application_count < 50 ? 'Medium' : 'High'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Response Rate</span>
                  <span className="font-medium">Usually responds within 3 days</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Company Growth</span>
                  <span className="font-medium text-green-600">Growing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Form Modal */}
      {showApplicationForm && (
        <ApplicationForm
          job={job}
          onSubmit={handleApply}
          onClose={() => setShowApplicationForm(false)}
          submitting={applying}
        />
      )}
    </div>
  );
};