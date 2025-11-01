'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  X,
  Search,
  FileText,
  Building2,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { FEATURES } from '../../config/features';

export const Header: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, logout, isCandidate, isEmployer } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    router.push('/');
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-teal-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <span className="text-xl font-bold text-gray-900">OpenRole</span>
            </Link>

            {/* Main Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/jobs"
                className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
              >
                Find Jobs
              </Link>
              {FEATURES.CV_UPLOAD && (
                <Link
                  href="/cv-upload"
                  className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
                >
                  Upload CV
                </Link>
              )}
              {FEATURES.EMPLOYERS && (
                <Link
                  href="/employers"
                  className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
                >
                  Employers
                </Link>
              )}
              <Link
                href="/career-advice"
                className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
              >
                Career Advice
              </Link>
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-1 px-3 py-2 text-gray-700 hover:text-gray-900 font-medium"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {user?.firstName || 'Account'}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {/* Dropdown */}
                  {isUserMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                        <div className="py-1">
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">
                              {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                          </div>

                          {isCandidate && (
                            <>
                              <Link
                                href="/dashboard"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                My Dashboard
                              </Link>
                              <Link
                                href="/applications"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                My Applications
                              </Link>
                              <Link
                                href="/saved-jobs"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                Saved Jobs
                              </Link>
                              {FEATURES.JOB_ALERTS && (
                                <Link
                                  href="/job-alerts"
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  onClick={() => setIsUserMenuOpen(false)}
                                >
                                  Job Alerts
                                </Link>
                              )}
                              {FEATURES.CV_LIBRARY && (
                                <Link
                                  href="/cv-library"
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  onClick={() => setIsUserMenuOpen(false)}
                                >
                                  My CVs
                                </Link>
                              )}
                            </>
                          )}

                          {isEmployer && (
                            <>
                              <Link
                                href="/employer/dashboard"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                Employer Dashboard
                              </Link>
                              <Link
                                href="/employer/post-job"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                Post a Job
                              </Link>
                              <Link
                                href="/employer/jobs"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                Manage Jobs
                              </Link>
                              {FEATURES.CV_SEARCH && (
                                <Link
                                  href="/employer/candidates"
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  onClick={() => setIsUserMenuOpen(false)}
                                >
                                  Browse CVs
                                </Link>
                              )}
                            </>
                          )}

                          <Link
                            href="/profile"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            Profile Settings
                          </Link>

                          <div className="border-t border-gray-100">
                            <button
                              onClick={handleLogout}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Sign out
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 font-medium transition-colors"
                >
                  Register
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="space-y-2">
              <Link
                href="/jobs"
                className="block px-3 py-2 text-gray-700 hover:text-teal-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Find Jobs
              </Link>
              {FEATURES.CV_UPLOAD && (
                <Link
                  href="/cv-upload"
                  className="block px-3 py-2 text-gray-700 hover:text-teal-600 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Upload CV
                </Link>
              )}
              {FEATURES.EMPLOYERS && (
                <Link
                  href="/employers"
                  className="block px-3 py-2 text-gray-700 hover:text-teal-600 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Employers
                </Link>
              )}
              <Link
                href="/career-advice"
                className="block px-3 py-2 text-gray-700 hover:text-teal-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Career Advice
              </Link>

              {!isAuthenticated && (
                <div className="pt-4 border-t border-gray-100 space-y-2">
                  <Link
                    href="/login"
                    className="block px-3 py-2 text-gray-700 hover:text-teal-600 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="block px-3 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 font-medium text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};