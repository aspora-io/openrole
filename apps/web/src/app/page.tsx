'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Briefcase, Clock, Building2, TrendingUp, Users, CheckCircle } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState({
    permanent: false,
    temporary: false,
    partTime: false,
    contract: false
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('query', searchQuery);
    if (location) params.set('location', location);
    
    // Add job type filters
    const selectedTypes = Object.entries(jobType)
      .filter(([_, selected]) => selected)
      .map(([type]) => type);
    if (selectedTypes.length > 0) {
      params.set('types', selectedTypes.join(','));
    }
    
    router.push(`/jobs?${params.toString()}`);
  };

  const popularSearches = [
    'Software Developer',
    'Data Analyst',
    'Project Manager',
    'Marketing Manager',
    'Sales Executive',
    'Customer Service'
  ];

  const topLocations = [
    'London',
    'Manchester',
    'Birmingham',
    'Edinburgh',
    'Bristol',
    'Leeds'
  ];

  const featuredEmployers = [
    { name: 'Tech Corp', logo: '🏢', jobs: 45 },
    { name: 'Health Plus', logo: '🏥', jobs: 32 },
    { name: 'Finance Pro', logo: '🏦', jobs: 28 },
    { name: 'Retail Giant', logo: '🛍️', jobs: 56 },
    { name: 'Startup Hub', logo: '🚀', jobs: 23 },
    { name: 'Global Consulting', logo: '🌐', jobs: 41 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Section - Jobsite Style */}
      <section className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Find your perfect job
          </h1>
          
          <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Job title, keywords or company"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Location or postcode"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Job Type Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={jobType.permanent}
                    onChange={(e) => setJobType({...jobType, permanent: e.target.checked})}
                    className="mr-2 w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-gray-700">Permanent</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={jobType.temporary}
                    onChange={(e) => setJobType({...jobType, temporary: e.target.checked})}
                    className="mr-2 w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-gray-700">Temporary</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={jobType.partTime}
                    onChange={(e) => setJobType({...jobType, partTime: e.target.checked})}
                    className="mr-2 w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-gray-700">Part Time</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={jobType.contract}
                    onChange={(e) => setJobType({...jobType, contract: e.target.checked})}
                    className="mr-2 w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-gray-700">Contract</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full md:w-auto px-12 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded transition-colors"
              >
                Search jobs
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <Link href="/jobs" className="text-teal-600 hover:underline">
              View all jobs
            </Link>
            <span className="mx-2 text-gray-400">•</span>
            <Link href="/cv-search" className="text-teal-600 hover:underline">
              Post your CV
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Stats Bar */}
      <section className="bg-teal-600 text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 text-center">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              <span className="font-semibold">15,847</span>
              <span>jobs available</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              <span className="font-semibold">5,234</span>
              <span>companies hiring</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">523</span>
              <span>jobs added today</span>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Searches & Locations */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Popular Searches */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-teal-600" />
                Popular Searches
              </h2>
              <div className="space-y-2">
                {popularSearches.map((search) => (
                  <Link
                    key={search}
                    href={`/jobs?query=${encodeURIComponent(search)}`}
                    className="block py-2 px-3 hover:bg-gray-50 rounded transition-colors text-gray-700 hover:text-teal-600"
                  >
                    {search}
                  </Link>
                ))}
              </div>
            </div>

            {/* Top Locations */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-teal-600" />
                Top Locations
              </h2>
              <div className="space-y-2">
                {topLocations.map((city) => (
                  <Link
                    key={city}
                    href={`/jobs?location=${encodeURIComponent(city)}`}
                    className="block py-2 px-3 hover:bg-gray-50 rounded transition-colors text-gray-700 hover:text-teal-600"
                  >
                    {city}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Employers */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
            Featured Employers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredEmployers.map((employer) => (
              <Link
                key={employer.name}
                href={`/companies/${employer.name.toLowerCase().replace(' ', '-')}`}
                className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition-shadow text-center"
              >
                <div className="text-4xl mb-2">{employer.logo}</div>
                <h3 className="font-medium text-gray-800">{employer.name}</h3>
                <p className="text-sm text-gray-600">{employer.jobs} jobs</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose OpenRole */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
            Why job seekers choose OpenRole
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-teal-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Salary Transparency</h3>
              <p className="text-gray-600">Every job shows salary range upfront</p>
            </div>
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-teal-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Verified Employers</h3>
              <p className="text-gray-600">All companies are verified and legitimate</p>
            </div>
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-teal-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">No Ghost Jobs</h3>
              <p className="text-gray-600">Only real, active job opportunities</p>
            </div>
          </div>
        </div>
      </section>

      {/* Employer CTA */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Employers: Find your next hire</h2>
          <p className="mb-6 text-gray-300">Post jobs and access our CV database</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/employer/post-job"
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded transition-colors"
            >
              Post a job
            </Link>
            <Link
              href="/employer/cv-search"
              className="px-6 py-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded transition-colors"
            >
              Search CVs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}