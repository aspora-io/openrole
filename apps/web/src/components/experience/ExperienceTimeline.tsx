'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Work experience validation schema
const workExperienceSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required').max(200),
  companyName: z.string().min(1, 'Company name is required').max(200),
  location: z.string().max(200).optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  isCurrentPosition: z.boolean().optional(),
  description: z.string().max(2000).optional(),
  achievements: z.array(z.string().max(500)).max(10).optional(),
  skills: z.array(z.string()).max(20).optional()
});

type WorkExperienceFormData = z.infer<typeof workExperienceSchema>;

interface WorkExperience {
  id: string;
  jobTitle: string;
  companyName: string;
  location?: string;
  employmentType: string;
  startDate: string;
  endDate?: string;
  isCurrentPosition: boolean;
  description?: string;
  achievements: string[];
  skills: string[];
  createdAt: string;
  updatedAt: string;
}

interface ExperienceTimelineProps {
  userId: string;
  experiences?: WorkExperience[];
  onAdd?: (data: WorkExperienceFormData) => Promise<void>;
  onUpdate?: (id: string, data: Partial<WorkExperienceFormData>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  readonly?: boolean;
}

const employmentTypeLabels = {
  FULL_TIME: { label: 'Full Time', color: 'bg-blue-100 text-blue-800' },
  PART_TIME: { label: 'Part Time', color: 'bg-purple-100 text-purple-800' },
  CONTRACT: { label: 'Contract', color: 'bg-orange-100 text-orange-800' },
  FREELANCE: { label: 'Freelance', color: 'bg-green-100 text-green-800' },
  INTERNSHIP: { label: 'Internship', color: 'bg-yellow-100 text-yellow-800' }
};

export default function ExperienceTimeline({
  userId,
  experiences = [],
  onAdd,
  onUpdate,
  onDelete,
  readonly = false
}: ExperienceTimelineProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExperience, setEditingExperience] = useState<WorkExperience | null>(null);
  const [expandedExperiences, setExpandedExperiences] = useState<Set<string>>(new Set());
  const [achievements, setAchievements] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [newAchievement, setNewAchievement] = useState('');
  const [newSkill, setNewSkill] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
    watch
  } = useForm<WorkExperienceFormData>({
    resolver: zodResolver(workExperienceSchema),
    defaultValues: {
      isCurrentPosition: false,
      achievements: [],
      skills: []
    }
  });

  const isCurrentPosition = watch('isCurrentPosition');

  useEffect(() => {
    if (editingExperience) {
      reset({
        jobTitle: editingExperience.jobTitle,
        companyName: editingExperience.companyName,
        location: editingExperience.location || '',
        employmentType: editingExperience.employmentType as any,
        startDate: editingExperience.startDate,
        endDate: editingExperience.endDate || '',
        isCurrentPosition: editingExperience.isCurrentPosition,
        description: editingExperience.description || '',
        achievements: editingExperience.achievements,
        skills: editingExperience.skills
      });
      setAchievements(editingExperience.achievements || []);
      setSkills(editingExperience.skills || []);
    } else {
      reset();
      setAchievements([]);
      setSkills([]);
    }
  }, [editingExperience, reset]);

  useEffect(() => {
    setValue('achievements', achievements);
  }, [achievements, setValue]);

  useEffect(() => {
    setValue('skills', skills);
  }, [skills, setValue]);

  // Clear end date when current position is checked
  useEffect(() => {
    if (isCurrentPosition) {
      setValue('endDate', '');
    }
  }, [isCurrentPosition, setValue]);

  const onSubmit = async (data: WorkExperienceFormData) => {
    try {
      if (editingExperience && onUpdate) {
        await onUpdate(editingExperience.id, data);
        setEditingExperience(null);
      } else if (onAdd) {
        await onAdd(data);
        setShowAddForm(false);
      }
      
      reset();
      setAchievements([]);
      setSkills([]);
    } catch (error) {
      console.error('Error saving experience:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this work experience?')) {
      try {
        if (onDelete) {
          await onDelete(id);
        }
      } catch (error) {
        console.error('Error deleting experience:', error);
      }
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedExperiences(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const addAchievement = () => {
    if (newAchievement.trim() && achievements.length < 10) {
      setAchievements([...achievements, newAchievement.trim()]);
      setNewAchievement('');
    }
  };

  const removeAchievement = (index: number) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim()) && skills.length < 20) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const calculateDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years > 0 && remainingMonths > 0) {
      return `${years} yr${years > 1 ? 's' : ''} ${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
    } else if (years > 0) {
      return `${years} yr${years > 1 ? 's' : ''}`;
    } else {
      return `${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
    }
  };

  // Sort experiences by start date (most recent first)
  const sortedExperiences = [...experiences].sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Work Experience</h2>
            <p className="text-gray-600">
              {readonly 
                ? 'Professional work history and achievements'
                : 'Manage your professional work history'
              }
            </p>
          </div>
          
          {!readonly && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Experience
            </button>
          )}
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingExperience) && !readonly && (
          <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {editingExperience ? 'Edit Experience' : 'Add Work Experience'}
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title *
                  </label>
                  <input
                    id="jobTitle"
                    type="text"
                    {...register('jobTitle')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Senior Software Engineer"
                    maxLength={200}
                  />
                  {errors.jobTitle && (
                    <p className="mt-1 text-sm text-red-600">{errors.jobTitle.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    {...register('companyName')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Tech Corp"
                    maxLength={200}
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., San Francisco, CA"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label htmlFor="employmentType" className="block text-sm font-medium text-gray-700 mb-2">
                    Employment Type *
                  </label>
                  <select
                    id="employmentType"
                    {...register('employmentType')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select type</option>
                    {Object.entries(employmentTypeLabels).map(([value, config]) => (
                      <option key={value} value={value}>{config.label}</option>
                    ))}
                  </select>
                  {errors.employmentType && (
                    <p className="mt-1 text-sm text-red-600">{errors.employmentType.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    {...register('startDate')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    {...register('endDate')}
                    disabled={isCurrentPosition}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                  <label className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      {...register('isCurrentPosition')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">I currently work here</span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  {...register('description')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your role and responsibilities..."
                  maxLength={2000}
                />
              </div>

              {/* Achievements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Achievements ({achievements.length}/10)
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newAchievement}
                    onChange={(e) => setNewAchievement(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add an achievement..."
                    maxLength={500}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAchievement())}
                  />
                  <button
                    type="button"
                    onClick={addAchievement}
                    disabled={achievements.length >= 10}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Add
                  </button>
                </div>
                {achievements.length > 0 && (
                  <ul className="space-y-2">
                    {achievements.map((achievement, index) => (
                      <li key={index} className="flex items-start gap-2 bg-white p-2 rounded border">
                        <span className="text-blue-600">•</span>
                        <span className="flex-1 text-sm">{achievement}</span>
                        <button
                          type="button"
                          onClick={() => removeAchievement(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills Used ({skills.length}/20)
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add a skill..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    disabled={skills.length >= 20}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
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

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingExperience(null);
                    reset();
                    setAchievements([]);
                    setSkills([]);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isSubmitting ? 'Saving...' : (editingExperience ? 'Update' : 'Add')} Experience
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Experience Timeline */}
        {sortedExperiences.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">💼</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No work experience added</h3>
            <p className="text-gray-600 mb-4">
              {readonly 
                ? 'This user hasn\'t added any work experience yet.'
                : 'Start building your professional timeline by adding your work history.'
              }
            </p>
            {!readonly && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Your First Experience
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>

            {/* Experience items */}
            <div className="space-y-8">
              {sortedExperiences.map((experience, index) => {
                const isExpanded = expandedExperiences.has(experience.id);
                const typeConfig = employmentTypeLabels[experience.employmentType as keyof typeof employmentTypeLabels];
                
                return (
                  <div key={experience.id} className="relative flex gap-6">
                    {/* Timeline dot */}
                    <div className="absolute left-6 w-5 h-5 bg-white border-4 border-blue-600 rounded-full z-10"></div>
                    
                    {/* Content */}
                    <div className="ml-16 flex-1">
                      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {experience.jobTitle}
                            </h3>
                            <p className="text-lg text-gray-700 mt-1">
                              {experience.companyName}
                              {experience.location && (
                                <span className="text-gray-500"> • {experience.location}</span>
                              )}
                            </p>
                            
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeConfig?.color}`}>
                                {typeConfig?.label}
                              </span>
                              <span>
                                {formatDate(experience.startDate)} - {' '}
                                {experience.isCurrentPosition 
                                  ? 'Present' 
                                  : formatDate(experience.endDate!)}
                              </span>
                              <span className="text-gray-500">
                                ({calculateDuration(experience.startDate, experience.endDate)})
                              </span>
                            </div>

                            {/* Quick preview of description or achievements */}
                            {!isExpanded && (experience.description || experience.achievements.length > 0) && (
                              <p className="mt-3 text-gray-600 line-clamp-2">
                                {experience.description || `${experience.achievements.length} key achievements`}
                              </p>
                            )}

                            {/* Expanded content */}
                            {isExpanded && (
                              <div className="mt-4 space-y-4">
                                {experience.description && (
                                  <div>
                                    <h4 className="font-medium text-gray-900 mb-1">Description</h4>
                                    <p className="text-gray-600">{experience.description}</p>
                                  </div>
                                )}

                                {experience.achievements.length > 0 && (
                                  <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Key Achievements</h4>
                                    <ul className="space-y-1">
                                      {experience.achievements.map((achievement, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-gray-600">
                                          <span className="text-blue-600 mt-0.5">•</span>
                                          <span className="text-sm">{achievement}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {experience.skills.length > 0 && (
                                  <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Skills</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {experience.skills.map((skill, idx) => (
                                        <span
                                          key={idx}
                                          className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-start gap-2 ml-4">
                            {(experience.description || experience.achievements.length > 0) && (
                              <button
                                onClick={() => toggleExpanded(experience.id)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                {isExpanded ? 'Show less' : 'Show more'}
                              </button>
                            )}
                            
                            {!readonly && (
                              <>
                                <button
                                  onClick={() => setEditingExperience(experience)}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(experience.id)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}