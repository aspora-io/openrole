'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  MapPin, 
  Building2, 
  Clock, 
  DollarSign, 
  Calendar,
  Users,
  Briefcase,
  Share2,
  Flag,
  ChevronLeft,
  CheckCircle,
  ExternalLink,
  Globe,
  Star
} from 'lucide-react';

// Mock job data - in real app this would come from API
const mockJobDetail = {
  id: '1',
  title: 'Senior Software Developer',
  company: 'Tech Corp',
  company_logo: '🏢',
  location: 'London',
  remote: false,
  salary_min: 60000,
  salary_max: 80000,
  type: 'permanent',
  posted_date: '2024-03-15',
  closing_date: '2024-04-15',
  description: `
    We are looking for an experienced Senior Software Developer to join our growing team in London. 
    
    This is an exciting opportunity to work on cutting-edge projects using the latest technologies. You'll be part of a collaborative team that values innovation, quality, and continuous learning.
    
    As a Senior Software Developer, you will be responsible for designing, developing, and maintaining high-quality software solutions. You'll work closely with product managers, designers, and other developers to deliver features that delight our users.
  `,
  responsibilities: [
    'Design and implement scalable software solutions',
    'Collaborate with cross-functional teams to deliver features',
    'Mentor junior developers and share knowledge',
    'Participate in code reviews and maintain high code quality',
    'Contribute to architectural decisions and technical strategy',
    'Debug and resolve complex technical issues'
  ],
  requirements: [
    '5+ years of experience in software development',
    'Strong proficiency in JavaScript/TypeScript, React, and Node.js',
    'Experience with cloud platforms (AWS, GCP, or Azure)',
    'Solid understanding of software design patterns and principles',
    'Excellent problem-solving and communication skills',
    'Bachelor\'s degree in Computer Science or related field'
  ],
  nice_to_have: [
    'Experience with microservices architecture',
    'Knowledge of DevOps practices and CI/CD',
    'Contributions to open-source projects',
    'Experience with agile methodologies'
  ],
  benefits: [
    'Competitive salary with annual reviews',
    '25 days holiday plus bank holidays',
    'Flexible working hours',
    'Health insurance for you and your family',
    'Generous pension contribution',
    'Professional development budget',
    'Modern office in central London',
    'Regular team social events'
  ],
  company_description: 'Tech Corp is a leading technology company specializing in innovative software solutions. With over 500 employees across 5 offices, we\'re committed to creating products that make a difference.',
  application_count: 47,
  views: 892,
  featured: true
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // In real app, fetch job details based on params.id
  const job = mockJobDetail;

  const formatSalary = (min: number, max: number) => {
    return `£${min.toLocaleString()} - £${max.toLocaleString()}`;
  };

  const getDaysRemaining = (closingDate: string) => {
    const closing = new Date(closingDate);
    const today = new Date();
    const diffTime = closing.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return `${Math.floor(diffInDays / 7)} weeks ago`;
  };

  const handleApply = () => {
    // In real app, check if user is logged in
    // If not, redirect to login with return URL
    setShowApplicationForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/jobs" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ChevronLeft className="w-5 h-5" />
            Back to job search
          </Link>
        </div>
      </div>

      {/* Job Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div>
              {job.featured && (
                <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full mb-3">
                  Featured Job
                </span>
              )}
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="text-2xl">{job.company_logo}</div>
                  <span className="font-medium">{job.company}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{job.location}</span>
                  {job.remote && <span className="text-teal-600">(Remote available)</span>}
                </div>
                <div className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  <span>{job.type.charAt(0).toUpperCase() + job.type.slice(1)}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {formatSalary(job.salary_min, job.salary_max)}
              </div>
              <div className="text-sm text-gray-500">per annum</div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-6 mt-6 pt-6 border-t text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Posted {getRelativeTime(job.posted_date)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{getDaysRemaining(job.closing_date)} days remaining</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{job.application_count} applicants</span>
            </div>
            <div className="flex items-center gap-1">
              <Globe className="w-4 h-4" />
              <span>{job.views} views</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={handleApply}
              className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
            >
              Apply now
            </button>
            <button
              onClick={() => setSaved(!saved)}
              className={`px-6 py-3 border rounded-lg font-medium transition-colors ${
                saved 
                  ? 'border-teal-600 text-teal-600 bg-teal-50' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Star className={`w-4 h-4 inline mr-2 ${saved ? 'fill-current' : ''}`} />
              {saved ? 'Saved' : 'Save job'}
            </button>
            <button className="p-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="p-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Job Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Job Description */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Job Description</h2>
              <div className="prose max-w-none text-gray-600 whitespace-pre-line">
                {job.description}
              </div>
            </section>

            {/* Responsibilities */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Key Responsibilities</h2>
              <ul className="space-y-2">
                {job.responsibilities.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Requirements */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Essential Requirements</h2>
              <ul className="space-y-2">
                {job.requirements.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-600">
                    <div className="w-2 h-2 bg-teal-600 rounded-full flex-shrink-0 mt-1.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Nice to Have */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Nice to Have</h2>
              <ul className="space-y-2">
                {job.nice_to_have.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-600">
                    <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0 mt-1.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Benefits */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Benefits & Perks</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {job.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column - Company Info & Apply */}
          <div className="space-y-6">
            {/* Company Info */}
            <section className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">{job.company_logo}</div>
                <h3 className="text-lg font-semibold">{job.company}</h3>
              </div>
              <p className="text-gray-600 mb-4">{job.company_description}</p>
              <Link 
                href={`/companies/${job.company.toLowerCase().replace(' ', '-')}`}
                className="flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium"
              >
                View company profile
                <ExternalLink className="w-4 h-4" />
              </Link>

              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={handleApply}
                  className="w-full px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Apply for this job
                </button>
                <p className="text-sm text-gray-500 text-center mt-3">
                  {getDaysRemaining(job.closing_date)} days left to apply
                </p>
              </div>
            </section>

            {/* Similar Jobs */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Similar Jobs</h3>
              <div className="space-y-3">
                <Link href="/jobs/2" className="block hover:bg-gray-50 p-3 rounded">
                  <h4 className="font-medium text-gray-900">Full Stack Developer</h4>
                  <p className="text-sm text-gray-600">Tech Corp • London</p>
                  <p className="text-sm text-green-600 font-medium">£50,000 - £70,000</p>
                </Link>
                <Link href="/jobs/3" className="block hover:bg-gray-50 p-3 rounded">
                  <h4 className="font-medium text-gray-900">Frontend Developer</h4>
                  <p className="text-sm text-gray-600">Digital Agency • Remote</p>
                  <p className="text-sm text-green-600 font-medium">£45,000 - £60,000</p>
                </Link>
                <Link href="/jobs/4" className="block hover:bg-gray-50 p-3 rounded">
                  <h4 className="font-medium text-gray-900">Software Engineer</h4>
                  <p className="text-sm text-gray-600">Startup Hub • Manchester</p>
                  <p className="text-sm text-green-600 font-medium">£55,000 - £75,000</p>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4">Apply for {job.title}</h2>
            <p className="text-gray-600 mb-6">
              Please log in or create an account to apply for this position.
            </p>
            <div className="flex gap-4">
              <Link
                href="/login?returnUrl=/jobs/1"
                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg"
              >
                Log in to apply
              </Link>
              <Link
                href="/register?returnUrl=/jobs/1"
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Create account
              </Link>
              <button
                onClick={() => setShowApplicationForm(false)}
                className="px-6 py-3 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}