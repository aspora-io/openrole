'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Portfolio item validation schema
const portfolioItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['PROJECT', 'ARTICLE', 'DESIGN', 'CODE', 'VIDEO', 'PRESENTATION', 'CERTIFICATE', 'LINK']),
  externalUrl: z.string().url().optional().or(z.literal('')),
  technologies: z.array(z.string()).max(20).optional(),
  projectDate: z.string().optional(),
  role: z.string().max(100).optional(),
  isPublic: z.boolean().optional().default(true)
});

type PortfolioItemFormData = z.infer<typeof portfolioItemSchema>;

interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  type: string;
  externalUrl?: string;
  technologies: string[];
  projectDate?: string;
  role?: string;
  isPublic: boolean;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  validationStatus: 'PENDING' | 'VALID' | 'INVALID' | 'UNREACHABLE';
  createdAt: string;
  updatedAt: string;
}

interface PortfolioShowcaseProps {
  userId: string;
  items?: PortfolioItem[];
  onAddItem?: (data: PortfolioItemFormData & { file?: File }) => Promise<void>;
  onUpdateItem?: (id: string, data: Partial<PortfolioItemFormData>) => Promise<void>;
  onDeleteItem?: (id: string) => Promise<void>;
  onImportFromGitHub?: (username: string) => Promise<void>;
  readonly?: boolean;
}

const portfolioTypeConfig = {
  PROJECT: { icon: '🚀', label: 'Project', color: 'bg-blue-100 text-blue-800' },
  ARTICLE: { icon: '📝', label: 'Article', color: 'bg-green-100 text-green-800' },
  DESIGN: { icon: '🎨', label: 'Design', color: 'bg-purple-100 text-purple-800' },
  CODE: { icon: '💻', label: 'Code', color: 'bg-gray-100 text-gray-800' },
  VIDEO: { icon: '🎥', label: 'Video', color: 'bg-red-100 text-red-800' },
  PRESENTATION: { icon: '📊', label: 'Presentation', color: 'bg-orange-100 text-orange-800' },
  CERTIFICATE: { icon: '🏆', label: 'Certificate', color: 'bg-yellow-100 text-yellow-800' },
  LINK: { icon: '🔗', label: 'Link', color: 'bg-indigo-100 text-indigo-800' }
};

export default function PortfolioShowcase({
  userId,
  items = [],
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onImportFromGitHub,
  readonly = false
}: PortfolioShowcaseProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'type'>('date');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [githubUsername, setGithubUsername] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [newTechnology, setNewTechnology] = useState('');
  const [technologies, setTechnologies] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
    watch
  } = useForm<PortfolioItemFormData>({
    resolver: zodResolver(portfolioItemSchema),
    defaultValues: {
      isPublic: true,
      technologies: []
    }
  });

  const watchedType = watch('type');

  useEffect(() => {
    if (editingItem) {
      reset({
        title: editingItem.title,
        description: editingItem.description || '',
        type: editingItem.type as any,
        externalUrl: editingItem.externalUrl || '',
        technologies: editingItem.technologies,
        projectDate: editingItem.projectDate || '',
        role: editingItem.role || '',
        isPublic: editingItem.isPublic
      });
      setTechnologies(editingItem.technologies || []);
    } else {
      reset();
      setTechnologies([]);
    }
  }, [editingItem, reset]);

  const filteredAndSortedItems = items
    .filter(item => filterType === 'all' || item.type === filterType)
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'date':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

  const onSubmit = async (data: PortfolioItemFormData) => {
    try {
      const formData = {
        ...data,
        technologies
      };

      if (editingItem && onUpdateItem) {
        await onUpdateItem(editingItem.id, formData);
        setEditingItem(null);
      } else if (onAddItem) {
        await onAddItem({ ...formData, file: selectedFile || undefined });
        setShowAddForm(false);
      }
      
      reset();
      setTechnologies([]);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error saving portfolio item:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this portfolio item?')) {
      try {
        if (onDeleteItem) {
          await onDeleteItem(id);
        }
      } catch (error) {
        console.error('Error deleting portfolio item:', error);
      }
    }
  };

  const handleGitHubImport = async () => {
    if (!githubUsername.trim()) return;
    
    setIsImporting(true);
    try {
      if (onImportFromGitHub) {
        await onImportFromGitHub(githubUsername.trim());
      }
      setGithubUsername('');
    } catch (error) {
      console.error('Error importing from GitHub:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const addTechnology = () => {
    if (newTechnology.trim() && !technologies.includes(newTechnology.trim()) && technologies.length < 20) {
      const updatedTechnologies = [...technologies, newTechnology.trim()];
      setTechnologies(updatedTechnologies);
      setValue('technologies', updatedTechnologies);
      setNewTechnology('');
    }
  };

  const removeTechnology = (index: number) => {
    const updatedTechnologies = technologies.filter((_, i) => i !== index);
    setTechnologies(updatedTechnologies);
    setValue('technologies', updatedTechnologies);
  };

  const getValidationStatusColor = (status: string) => {
    switch (status) {
      case 'VALID': return 'text-green-600';
      case 'INVALID': return 'text-red-600';
      case 'UNREACHABLE': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="p-8 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Portfolio Showcase</h2>
            <p className="text-gray-600">
              {readonly 
                ? 'View professional portfolio items and projects'
                : 'Manage your professional portfolio and showcase your work'
              }
            </p>
          </div>
          
          {!readonly && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              >
                Add Item
              </button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
              >
                List
              </button>
            </div>

            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              {Object.entries(portfolioTypeConfig).map(([type, config]) => (
                <option key={type} value={type}>{config.label}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="type">Sort by Type</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            {filteredAndSortedItems.length} items
          </div>
        </div>

        {/* GitHub Import */}
        {!readonly && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Import from GitHub</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="GitHub username"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleGitHubImport}
                disabled={isImporting || !githubUsername.trim()}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 disabled:bg-gray-400"
              >
                {isImporting ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-8">
        {/* Add/Edit Form */}
        {(showAddForm || editingItem) && !readonly && (
          <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {editingItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    {...register('title')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., E-commerce Web App"
                    maxLength={200}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    id="type"
                    {...register('type')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select type</option>
                    {Object.entries(portfolioTypeConfig).map(([type, config]) => (
                      <option key={type} value={type}>
                        {config.icon} {config.label}
                      </option>
                    ))}
                  </select>
                  {errors.type && (
                    <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="externalUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    External URL
                  </label>
                  <input
                    id="externalUrl"
                    type="url"
                    {...register('externalUrl')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com"
                  />
                  {errors.externalUrl && (
                    <p className="mt-1 text-sm text-red-600">{errors.externalUrl.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Role
                  </label>
                  <input
                    id="role"
                    type="text"
                    {...register('role')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Lead Developer, Designer"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label htmlFor="projectDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Project Date
                  </label>
                  <input
                    id="projectDate"
                    type="date"
                    {...register('projectDate')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="isPublic"
                    type="checkbox"
                    {...register('isPublic')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                    Make this item public
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
                  placeholder="Describe your project, achievements, and impact..."
                  maxLength={2000}
                />
              </div>

              {/* Technologies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Technologies ({technologies.length}/20)
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newTechnology}
                    onChange={(e) => setNewTechnology(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add technology (e.g., React, Python)"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                  />
                  <button
                    type="button"
                    onClick={addTechnology}
                    disabled={technologies.length >= 20}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {technologies.map((tech, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => removeTechnology(index)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              {watchedType && ['DESIGN', 'PRESENTATION', 'CERTIFICATE'].includes(watchedType) && (
                <div>
                  <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File (optional)
                  </label>
                  <input
                    id="file"
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    accept="image/*,.pdf,.doc,.docx,.ppt,.pptx"
                  />
                  {selectedFile && (
                    <p className="mt-1 text-sm text-gray-600">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingItem(null);
                    reset();
                    setTechnologies([]);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
                >
                  {isSubmitting ? 'Saving...' : (editingItem ? 'Update' : 'Add')} Item
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Portfolio Items */}
        {filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📂</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No portfolio items yet</h3>
            <p className="text-gray-600 mb-4">
              {readonly 
                ? 'This user hasn\'t added any portfolio items yet.'
                : 'Start building your portfolio by adding your first project or achievement.'
              }
            </p>
            {!readonly && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Your First Item
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredAndSortedItems.map((item) => {
              const typeConfig = portfolioTypeConfig[item.type as keyof typeof portfolioTypeConfig];
              
              return (
                <div
                  key={item.id}
                  className={`border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}
                >
                  {/* Thumbnail/Icon */}
                  <div className={`bg-gray-100 flex items-center justify-center ${
                    viewMode === 'list' ? 'w-24 h-24' : 'h-48'
                  }`}>
                    {item.fileName ? (
                      <div className="text-gray-600 text-sm">File</div>
                    ) : (
                      <div className="text-4xl">{typeConfig?.icon || '📄'}</div>
                    )}
                  </div>

                  <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                      {!readonly && (
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-800 text-sm ml-2"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeConfig?.color}`}>
                        {typeConfig?.icon} {typeConfig?.label}
                      </span>
                      <span className={`text-xs ${getValidationStatusColor(item.validationStatus)}`}>
                        {item.validationStatus}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                        {item.description}
                      </p>
                    )}

                    {item.role && (
                      <p className="text-sm text-gray-500 mb-2">
                        Role: {item.role}
                      </p>
                    )}

                    {item.technologies.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {item.technologies.slice(0, 3).map((tech, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              {tech}
                            </span>
                          ))}
                          {item.technologies.length > 3 && (
                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              +{item.technologies.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {item.projectDate 
                          ? new Date(item.projectDate).toLocaleDateString()
                          : new Date(item.createdAt).toLocaleDateString()
                        }
                      </span>
                      {item.externalUrl && (
                        <a
                          href={item.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}