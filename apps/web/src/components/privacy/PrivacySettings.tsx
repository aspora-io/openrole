'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Privacy settings validation schema
const privacySettingsSchema = z.object({
  profileVisibility: z.enum(['PUBLIC', 'REGISTERED_ONLY', 'EMPLOYERS_ONLY', 'PRIVATE']),
  showEmail: z.boolean(),
  showPhoneNumber: z.boolean(),
  showLinkedin: z.boolean(),
  showPortfolio: z.boolean(),
  showGitHub: z.boolean(),
  showSalaryExpectations: z.boolean(),
  showLocation: z.boolean(),
  showWorkExperience: z.boolean(),
  showEducation: z.boolean(),
  searchableByRecruiters: z.boolean(),
  allowContactFromRecruiters: z.boolean(),
  receiveJobAlerts: z.boolean(),
  receiveNewsletters: z.boolean()
});

type PrivacySettingsData = z.infer<typeof privacySettingsSchema>;

interface PrivacySettingsProps {
  userId: string;
  initialSettings?: Partial<PrivacySettingsData>;
  onSave?: (settings: PrivacySettingsData) => Promise<void>;
  onExportData?: () => Promise<void>;
  onDeleteAccount?: () => Promise<void>;
  onAnonymizeData?: () => Promise<void>;
}

const visibilityOptions = [
  { value: 'PUBLIC', label: 'Public', description: 'Anyone can view your profile', icon: '🌍' },
  { value: 'REGISTERED_ONLY', label: 'Registered Users Only', description: 'Only logged-in users can view', icon: '👥' },
  { value: 'EMPLOYERS_ONLY', label: 'Verified Employers Only', description: 'Only verified employers can view', icon: '🏢' },
  { value: 'PRIVATE', label: 'Private', description: 'Only you can view your profile', icon: '🔒' }
];

export default function PrivacySettings({
  userId,
  initialSettings = {
    profileVisibility: 'REGISTERED_ONLY',
    showEmail: false,
    showPhoneNumber: false,
    showLinkedin: true,
    showPortfolio: true,
    showGitHub: true,
    showSalaryExpectations: false,
    showLocation: true,
    showWorkExperience: true,
    showEducation: true,
    searchableByRecruiters: true,
    allowContactFromRecruiters: true,
    receiveJobAlerts: true,
    receiveNewsletters: false
  },
  onSave,
  onExportData,
  onDeleteAccount,
  onAnonymizeData
}: PrivacySettingsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'visibility' | 'communications' | 'data'>('visibility');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    reset
  } = useForm<PrivacySettingsData>({
    resolver: zodResolver(privacySettingsSchema),
    defaultValues: initialSettings
  });

  const watchedVisibility = watch('profileVisibility');
  const isPrivate = watchedVisibility === 'PRIVATE';

  const onSubmit = async (data: PrivacySettingsData) => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(data);
      }
      reset(data);
    } catch (error) {
      console.error('Error saving privacy settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    if (!onExportData) return;
    
    if (confirm('This will export all your data in a downloadable format. Continue?')) {
      try {
        await onExportData();
      } catch (error) {
        console.error('Error exporting data:', error);
      }
    }
  };

  const handleAnonymizeData = async () => {
    if (!onAnonymizeData) return;
    
    if (confirm('This will permanently anonymize your data. Your profile will no longer be identifiable. This action cannot be undone. Continue?')) {
      try {
        await onAnonymizeData();
      } catch (error) {
        console.error('Error anonymizing data:', error);
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!onDeleteAccount || deleteConfirmText !== 'DELETE') return;
    
    try {
      await onDeleteAccount();
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="p-8 border-b border-gray-200">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Privacy Settings</h2>
        <p className="text-gray-600">Control how your information is displayed and who can contact you</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {[
            { id: 'visibility', label: 'Profile Visibility', icon: '👁️' },
            { id: 'communications', label: 'Communications', icon: '📧' },
            { id: 'data', label: 'Data & Privacy', icon: '🔐' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-8">
          {/* Visibility Tab */}
          {activeTab === 'visibility' && (
            <div className="space-y-8">
              {/* Profile Visibility Level */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Visibility Level</h3>
                <div className="space-y-3">
                  {visibilityOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        watchedVisibility === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        {...register('profileVisibility')}
                        value={option.value}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{option.icon}</span>
                          <span className="font-medium text-gray-900">{option.label}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              {/* Information Display Settings */}
              <section className={isPrivate ? 'opacity-50 pointer-events-none' : ''}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Information Display Settings</h3>
                {isPrivate && (
                  <p className="text-sm text-gray-600 mb-4">
                    These settings don't apply when your profile is set to Private
                  </p>
                )}
                
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">Contact Information</h4>
                  <div className="grid md:grid-cols-2 gap-4 ml-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('showEmail')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Show email address</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('showPhoneNumber')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Show phone number</span>
                    </label>
                  </div>

                  <h4 className="text-sm font-medium text-gray-700 mt-6">Professional Links</h4>
                  <div className="grid md:grid-cols-2 gap-4 ml-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('showLinkedin')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Show LinkedIn profile</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('showPortfolio')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Show portfolio website</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('showGitHub')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Show GitHub profile</span>
                    </label>
                  </div>

                  <h4 className="text-sm font-medium text-gray-700 mt-6">Professional Information</h4>
                  <div className="grid md:grid-cols-2 gap-4 ml-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('showSalaryExpectations')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Show salary expectations</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('showLocation')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Show location</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('showWorkExperience')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Show work experience</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('showEducation')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Show education</span>
                    </label>
                  </div>
                </div>
              </section>

              {/* Recruiter Settings */}
              <section className={isPrivate ? 'opacity-50 pointer-events-none' : ''}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recruiter Settings</h3>
                <div className="space-y-4">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      {...register('searchableByRecruiters')}
                      className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-700">Make profile searchable by recruiters</span>
                      <p className="text-sm text-gray-500 mt-1">
                        Allow verified recruiters to find your profile in search results
                      </p>
                    </div>
                  </label>
                  
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      {...register('allowContactFromRecruiters')}
                      className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-700">Allow direct messages from recruiters</span>
                      <p className="text-sm text-gray-500 mt-1">
                        Verified recruiters can send you messages about opportunities
                      </p>
                    </div>
                  </label>
                </div>
              </section>
            </div>
          )}

          {/* Communications Tab */}
          {activeTab === 'communications' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
                <div className="space-y-4">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      {...register('receiveJobAlerts')}
                      className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-700">Job alerts</span>
                      <p className="text-sm text-gray-500 mt-1">
                        Receive emails about new job opportunities matching your profile
                      </p>
                    </div>
                  </label>
                  
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      {...register('receiveNewsletters')}
                      className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-700">Platform updates & newsletters</span>
                      <p className="text-sm text-gray-500 mt-1">
                        Stay updated with new features and platform news
                      </p>
                    </div>
                  </label>
                </div>
              </section>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> You will always receive important account-related emails such as 
                  security updates and password resets regardless of these settings.
                </p>
              </div>
            </div>
          )}

          {/* Data & Privacy Tab */}
          {activeTab === 'data' && (
            <div className="space-y-8">
              {/* GDPR Rights */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Data Rights</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Under GDPR, you have the right to access, export, and delete your personal data. 
                  You can also request that your data be anonymized.
                </p>
                
                <div className="space-y-4">
                  {/* Export Data */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Export Your Data</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Download all your data in a machine-readable format (JSON)
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleExportData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Export Data
                      </button>
                    </div>
                  </div>

                  {/* Anonymize Data */}
                  <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Anonymize Your Data</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Permanently remove all identifying information while keeping your profile active
                        </p>
                        <p className="text-sm text-orange-600 mt-2">
                          ⚠️ This action cannot be undone
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAnonymizeData}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                      >
                        Anonymize
                      </button>
                    </div>
                  </div>

                  {/* Delete Account */}
                  <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Delete Your Account</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Permanently delete your account and all associated data
                        </p>
                        <p className="text-sm text-red-600 mt-2">
                          ⚠️ This action is permanent and cannot be reversed
                        </p>
                        
                        {showDeleteConfirm && (
                          <div className="mt-4 space-y-3">
                            <p className="text-sm font-medium text-gray-700">
                              Type DELETE to confirm account deletion:
                            </p>
                            <input
                              type="text"
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                              placeholder="Type DELETE"
                            />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (showDeleteConfirm) {
                            handleDeleteAccount();
                          } else {
                            setShowDeleteConfirm(true);
                          }
                        }}
                        disabled={showDeleteConfirm && deleteConfirmText !== 'DELETE'}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
                      >
                        {showDeleteConfirm ? 'Confirm Delete' : 'Delete Account'}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Data Retention */}
              <section className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Retention Policy</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Profile data is retained for the duration of your account</li>
                  <li>• Job application history is kept for 2 years</li>
                  <li>• Message history is retained for 1 year</li>
                  <li>• Anonymized analytics data may be retained indefinitely</li>
                  <li>• Deleted data is permanently removed within 30 days</li>
                </ul>
              </section>
            </div>
          )}
        </div>

        {/* Save Button (only for visibility and communications tabs) */}
        {activeTab !== 'data' && (
          <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving || !isDirty}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}