'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Profile validation schema
const profileSchema = z.object({
  headline: z.string().max(200).optional(),
  summary: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  phoneNumber: z.string().max(20).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  skills: z.array(z.string()).max(50).optional(),
  industries: z.array(z.string()).max(10).optional(),
  salaryExpectationMin: z.number().min(0).optional(),
  salaryExpectationMax: z.number().min(0).optional(),
  remotePreference: z.enum(['REMOTE_ONLY', 'HYBRID', 'ON_SITE', 'NO_PREFERENCE']).optional()
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileManagementProps {
  userId: string;
  initialData?: Partial<ProfileFormData>;
  onSave?: (data: ProfileFormData) => void;
  onCancel?: () => void;
  readonly?: boolean;
}

export default function ProfileManagement({
  userId,
  initialData,
  onSave,
  onCancel,
  readonly = false
}: ProfileManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>(initialData?.skills || []);
  const [industries, setIndustries] = useState<string[]>(initialData?.industries || []);
  const [newSkill, setNewSkill] = useState('');
  const [newIndustry, setNewIndustry] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialData
  });

  // Watch salary fields to ensure max >= min
  const salaryMin = watch('salaryExpectationMin');
  const salaryMax = watch('salaryExpectationMax');

  useEffect(() => {
    if (initialData) {
      reset(initialData);
      setSkills(initialData.skills || []);
      setIndustries(initialData.industries || []);
    }
  }, [initialData, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      const formData = {
        ...data,
        skills,
        industries
      };
      
      if (onSave) {
        await onSave(formData);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim()) && skills.length < 50) {
      const updatedSkills = [...skills, newSkill.trim()];
      setSkills(updatedSkills);
      setValue('skills', updatedSkills);
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    const updatedSkills = skills.filter((_, i) => i !== index);
    setSkills(updatedSkills);
    setValue('skills', updatedSkills);
  };

  const addIndustry = () => {
    if (newIndustry.trim() && !industries.includes(newIndustry.trim()) && industries.length < 10) {
      const updatedIndustries = [...industries, newIndustry.trim()];
      setIndustries(updatedIndustries);
      setValue('industries', updatedIndustries);
      setNewIndustry('');
    }
  };

  const removeIndustry = (index: number) => {
    const updatedIndustries = industries.filter((_, i) => i !== index);
    setIndustries(updatedIndustries);
    setValue('industries', updatedIndustries);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {readonly ? 'Profile Overview' : 'Profile Management'}
        </h2>
        <p className="text-gray-600">
          {readonly 
            ? 'View your professional profile information'
            : 'Manage your professional profile and career information'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Personal Information Section */}
        <section className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="headline" className="block text-sm font-medium text-gray-700 mb-2">
                Professional Headline
              </label>
              <input
                id="headline"
                type="text"
                {...register('headline')}
                disabled={readonly}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="e.g., Senior Software Engineer with 5+ years experience"
                maxLength={200}
              />
              {errors.headline && (
                <p className="mt-1 text-sm text-red-600">{errors.headline.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                id="location"
                type="text"
                {...register('location')}
                disabled={readonly}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="e.g., San Francisco, CA"
                maxLength={200}
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                {...register('phoneNumber')}
                disabled={readonly}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="+1 (555) 123-4567"
                maxLength={20}
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="remotePreference" className="block text-sm font-medium text-gray-700 mb-2">
                Remote Work Preference
              </label>
              <select
                id="remotePreference"
                {...register('remotePreference')}
                disabled={readonly}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select preference</option>
                <option value="REMOTE_ONLY">Remote Only</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ON_SITE">On-Site</option>
                <option value="NO_PREFERENCE">No Preference</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">
              Professional Summary
            </label>
            <textarea
              id="summary"
              {...register('summary')}
              disabled={readonly}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              placeholder="Describe your professional background, key achievements, and career goals..."
              maxLength={2000}
            />
            {errors.summary && (
              <p className="mt-1 text-sm text-red-600">{errors.summary.message}</p>
            )}
          </div>
        </section>

        {/* Social & Professional Links */}
        <section className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Professional Links</h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn Profile
              </label>
              <input
                id="linkedinUrl"
                type="url"
                {...register('linkedinUrl')}
                disabled={readonly}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="https://linkedin.com/in/yourprofile"
              />
              {errors.linkedinUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.linkedinUrl.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="portfolioUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Portfolio Website
              </label>
              <input
                id="portfolioUrl"
                type="url"
                {...register('portfolioUrl')}
                disabled={readonly}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="https://yourportfolio.com"
              />
              {errors.portfolioUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.portfolioUrl.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="githubUrl" className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Profile
              </label>
              <input
                id="githubUrl"
                type="url"
                {...register('githubUrl')}
                disabled={readonly}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="https://github.com/yourusername"
              />
              {errors.githubUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.githubUrl.message}</p>
              )}
            </div>
          </div>
        </section>

        {/* Skills Section */}
        <section className="bg-green-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Skills & Technologies</h3>
          
          {!readonly && (
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add a skill (e.g., JavaScript, Project Management)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <button
                  type="button"
                  onClick={addSkill}
                  disabled={skills.length >= 50}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {skills.length}/50 skills added
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {skill}
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        </section>

        {/* Industries Section */}
        <section className="bg-purple-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Industries of Interest</h3>
          
          {!readonly && (
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newIndustry}
                  onChange={(e) => setNewIndustry(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add an industry (e.g., Technology, Healthcare)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIndustry())}
                />
                <button
                  type="button"
                  onClick={addIndustry}
                  disabled={industries.length >= 10}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {industries.length}/10 industries added
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {industries.map((industry, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
              >
                {industry}
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => removeIndustry(index)}
                    className="ml-2 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        </section>

        {/* Salary Expectations */}
        <section className="bg-yellow-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Salary Expectations</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="salaryExpectationMin" className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Salary (Annual)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  id="salaryExpectationMin"
                  type="number"
                  {...register('salaryExpectationMin', { valueAsNumber: true })}
                  disabled={readonly}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="50000"
                  min="0"
                />
              </div>
              {errors.salaryExpectationMin && (
                <p className="mt-1 text-sm text-red-600">{errors.salaryExpectationMin.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="salaryExpectationMax" className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Salary (Annual)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  id="salaryExpectationMax"
                  type="number"
                  {...register('salaryExpectationMax', { valueAsNumber: true })}
                  disabled={readonly}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="80000"
                  min="0"
                />
              </div>
              {errors.salaryExpectationMax && (
                <p className="mt-1 text-sm text-red-600">{errors.salaryExpectationMax.message}</p>
              )}
              {salaryMin && salaryMax && salaryMax < salaryMin && (
                <p className="mt-1 text-sm text-red-600">
                  Maximum salary must be greater than or equal to minimum salary
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        {!readonly && (
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || !isDirty}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}