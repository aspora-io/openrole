'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Education validation schema
const educationSchema = z.object({
  institution: z.string().min(1, 'Institution name is required').max(200),
  degree: z.string().min(1, 'Degree is required').max(200),
  fieldOfStudy: z.string().min(1, 'Field of study is required').max(200),
  grade: z.string().max(50).optional(),
  location: z.string().max(200).optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  isCurrentlyEnrolled: z.boolean().optional(),
  description: z.string().max(2000).optional(),
  achievements: z.array(z.string().max(500)).max(10).optional(),
  activities: z.array(z.string().max(200)).max(10).optional()
});

type EducationFormData = z.infer<typeof educationSchema>;

interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  grade?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrentlyEnrolled: boolean;
  description?: string;
  achievements: string[];
  activities: string[];
  createdAt: string;
  updatedAt: string;
}

interface EducationHistoryProps {
  userId: string;
  educations?: Education[];
  onAdd?: (data: EducationFormData) => Promise<void>;
  onUpdate?: (id: string, data: Partial<EducationFormData>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  readonly?: boolean;
}

const degreeTypes = [
  'Bachelor\'s Degree',
  'Master\'s Degree',
  'PhD',
  'Associate Degree',
  'Diploma',
  'Certificate',
  'High School Diploma',
  'Professional Certification',
  'Bootcamp',
  'Online Course'
];

export default function EducationHistory({
  userId,
  educations = [],
  onAdd,
  onUpdate,
  onDelete,
  readonly = false
}: EducationHistoryProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const [expandedEducations, setExpandedEducations] = useState<Set<string>>(new Set());
  const [achievements, setAchievements] = useState<string[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [newAchievement, setNewAchievement] = useState('');
  const [newActivity, setNewActivity] = useState('');
  const [showAllEducations, setShowAllEducations] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
    watch
  } = useForm<EducationFormData>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      isCurrentlyEnrolled: false,
      achievements: [],
      activities: []
    }
  });

  const isCurrentlyEnrolled = watch('isCurrentlyEnrolled');

  useEffect(() => {
    if (editingEducation) {
      reset({
        institution: editingEducation.institution,
        degree: editingEducation.degree,
        fieldOfStudy: editingEducation.fieldOfStudy,
        grade: editingEducation.grade || '',
        location: editingEducation.location || '',
        startDate: editingEducation.startDate,
        endDate: editingEducation.endDate || '',
        isCurrentlyEnrolled: editingEducation.isCurrentlyEnrolled,
        description: editingEducation.description || '',
        achievements: editingEducation.achievements,
        activities: editingEducation.activities
      });
      setAchievements(editingEducation.achievements || []);
      setActivities(editingEducation.activities || []);
    } else {
      reset();
      setAchievements([]);
      setActivities([]);
    }
  }, [editingEducation, reset]);

  useEffect(() => {
    setValue('achievements', achievements);
  }, [achievements, setValue]);

  useEffect(() => {
    setValue('activities', activities);
  }, [activities, setValue]);

  // Clear end date when currently enrolled is checked
  useEffect(() => {
    if (isCurrentlyEnrolled) {
      setValue('endDate', '');
    }
  }, [isCurrentlyEnrolled, setValue]);

  const onSubmit = async (data: EducationFormData) => {
    try {
      if (editingEducation && onUpdate) {
        await onUpdate(editingEducation.id, data);
        setEditingEducation(null);
      } else if (onAdd) {
        await onAdd(data);
        setShowAddForm(false);
      }
      
      reset();
      setAchievements([]);
      setActivities([]);
    } catch (error) {
      console.error('Error saving education:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this education entry?')) {
      try {
        if (onDelete) {
          await onDelete(id);
        }
      } catch (error) {
        console.error('Error deleting education:', error);
      }
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedEducations(prev => {
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

  const addActivity = () => {
    if (newActivity.trim() && activities.length < 10) {
      setActivities([...activities, newActivity.trim()]);
      setNewActivity('');
    }
  };

  const removeActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const calculateDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const years = end.getFullYear() - start.getFullYear();
    
    if (years > 0) {
      return `${years} yr${years > 1 ? 's' : ''}`;
    } else {
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      return `${months} mo${months > 1 ? 's' : ''}`;
    }
  };

  const getDegreeIcon = (degree: string) => {
    const lowerDegree = degree.toLowerCase();
    if (lowerDegree.includes('phd') || lowerDegree.includes('doctor')) return '🎓';
    if (lowerDegree.includes('master')) return '📚';
    if (lowerDegree.includes('bachelor')) return '🎯';
    if (lowerDegree.includes('certificate') || lowerDegree.includes('certification')) return '📜';
    if (lowerDegree.includes('bootcamp')) return '💻';
    if (lowerDegree.includes('high school')) return '🏫';
    return '📖';
  };

  // Sort educations by start date (most recent first)
  const sortedEducations = [...educations].sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  // Show only first 3 educations unless "show all" is clicked
  const displayedEducations = showAllEducations ? sortedEducations : sortedEducations.slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Education History</h2>
            <p className="text-gray-600">
              {readonly 
                ? 'Academic background and qualifications'
                : 'Manage your academic background and qualifications'
              }
            </p>
          </div>
          
          {!readonly && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Education
            </button>
          )}
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingEducation) && !readonly && (
          <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {editingEducation ? 'Edit Education' : 'Add Education'}
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-2">
                    Institution *
                  </label>
                  <input
                    id="institution"
                    type="text"
                    {...register('institution')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Stanford University"
                    maxLength={200}
                  />
                  {errors.institution && (
                    <p className="mt-1 text-sm text-red-600">{errors.institution.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="degree" className="block text-sm font-medium text-gray-700 mb-2">
                    Degree *
                  </label>
                  <input
                    id="degree"
                    type="text"
                    {...register('degree')}
                    list="degree-suggestions"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Bachelor's Degree"
                    maxLength={200}
                  />
                  <datalist id="degree-suggestions">
                    {degreeTypes.map((type) => (
                      <option key={type} value={type} />
                    ))}
                  </datalist>
                  {errors.degree && (
                    <p className="mt-1 text-sm text-red-600">{errors.degree.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="fieldOfStudy" className="block text-sm font-medium text-gray-700 mb-2">
                    Field of Study *
                  </label>
                  <input
                    id="fieldOfStudy"
                    type="text"
                    {...register('fieldOfStudy')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Computer Science"
                    maxLength={200}
                  />
                  {errors.fieldOfStudy && (
                    <p className="mt-1 text-sm text-red-600">{errors.fieldOfStudy.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                    Grade / GPA
                  </label>
                  <input
                    id="grade"
                    type="text"
                    {...register('grade')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 3.8/4.0 or First Class Honours"
                    maxLength={50}
                  />
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
                    placeholder="e.g., Palo Alto, CA"
                    maxLength={200}
                  />
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
                    End Date (or expected)
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    {...register('endDate')}
                    disabled={isCurrentlyEnrolled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                  <label className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      {...register('isCurrentlyEnrolled')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Currently enrolled</span>
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
                  placeholder="Describe your studies, research, or thesis..."
                  maxLength={2000}
                />
              </div>

              {/* Achievements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Achievements & Awards ({achievements.length}/10)
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newAchievement}
                    onChange={(e) => setNewAchievement(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add achievement (e.g., Dean's List, Scholarship)"
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
                        <span className="text-yellow-600">⭐</span>
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

              {/* Activities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activities & Societies ({activities.length}/10)
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add activity (e.g., Student Council, Chess Club)"
                    maxLength={200}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addActivity())}
                  />
                  <button
                    type="button"
                    onClick={addActivity}
                    disabled={activities.length >= 10}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activities.map((activity, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                    >
                      {activity}
                      <button
                        type="button"
                        onClick={() => removeActivity(index)}
                        className="ml-2 text-purple-600 hover:text-purple-800"
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
                    setEditingEducation(null);
                    reset();
                    setAchievements([]);
                    setActivities([]);
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
                  {isSubmitting ? 'Saving...' : (editingEducation ? 'Update' : 'Add')} Education
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Education Cards */}
        {sortedEducations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🎓</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No education history added</h3>
            <p className="text-gray-600 mb-4">
              {readonly 
                ? 'This user hasn\'t added any education history yet.'
                : 'Add your academic background to build a complete profile.'
              }
            </p>
            {!readonly && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Your Education
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-6">
              {displayedEducations.map((education) => {
                const isExpanded = expandedEducations.has(education.id);
                
                return (
                  <div
                    key={education.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4 flex-1">
                        {/* Icon */}
                        <div className="text-3xl">{getDegreeIcon(education.degree)}</div>
                        
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {education.degree} in {education.fieldOfStudy}
                          </h3>
                          <p className="text-lg text-gray-700 mt-1">
                            {education.institution}
                            {education.location && (
                              <span className="text-gray-500"> • {education.location}</span>
                            )}
                          </p>
                          
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>
                              {formatDate(education.startDate)} - {' '}
                              {education.isCurrentlyEnrolled 
                                ? 'Present' 
                                : education.endDate 
                                  ? formatDate(education.endDate)
                                  : 'N/A'}
                            </span>
                            <span className="text-gray-500">
                              ({calculateDuration(education.startDate, education.endDate)})
                            </span>
                            {education.grade && (
                              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                {education.grade}
                              </span>
                            )}
                          </div>

                          {/* Quick preview */}
                          {!isExpanded && (
                            <div className="mt-3">
                              {education.description && (
                                <p className="text-gray-600 line-clamp-2">{education.description}</p>
                              )}
                              {!education.description && education.achievements.length > 0 && (
                                <p className="text-gray-600">
                                  {education.achievements.length} achievement{education.achievements.length > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Expanded content */}
                          {isExpanded && (
                            <div className="mt-4 space-y-4">
                              {education.description && (
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-1">Description</h4>
                                  <p className="text-gray-600">{education.description}</p>
                                </div>
                              )}

                              {education.achievements.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-2">Achievements & Awards</h4>
                                  <ul className="space-y-1">
                                    {education.achievements.map((achievement, idx) => (
                                      <li key={idx} className="flex items-start gap-2 text-gray-600">
                                        <span className="text-yellow-600 mt-0.5">⭐</span>
                                        <span className="text-sm">{achievement}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {education.activities.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-2">Activities & Societies</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {education.activities.map((activity, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded"
                                      >
                                        {activity}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-start gap-2 ml-4">
                        {(education.description || education.achievements.length > 0 || education.activities.length > 0) && (
                          <button
                            onClick={() => toggleExpanded(education.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            {isExpanded ? 'Show less' : 'Show more'}
                          </button>
                        )}
                        
                        {!readonly && (
                          <>
                            <button
                              onClick={() => setEditingEducation(education)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(education.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Show More Button */}
            {sortedEducations.length > 3 && !showAllEducations && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setShowAllEducations(true)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Show {sortedEducations.length - 3} more education entries
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}