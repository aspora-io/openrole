'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// CV generation validation schema
const cvGenerationSchema = z.object({
  templateId: z.string().min(1, 'Please select a template'),
  label: z.string().min(1, 'CV label is required').max(100),
  isDefault: z.boolean().optional(),
  sections: z.object({
    includePersonalDetails: z.boolean().default(true),
    includeWorkExperience: z.boolean().default(true),
    includeEducation: z.boolean().default(true),
    includeSkills: z.boolean().default(true),
    includePortfolio: z.boolean().default(false)
  }),
  customizations: z.object({
    primaryColor: z.string().optional(),
    fontSize: z.enum(['small', 'medium', 'large']).optional(),
    fontFamily: z.string().optional(),
    spacing: z.enum(['compact', 'normal', 'relaxed']).optional()
  }).optional(),
  format: z.enum(['pdf', 'html', 'png']).optional().default('pdf')
});

type CVGenerationFormData = z.infer<typeof cvGenerationSchema>;

interface CVTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  category: 'professional' | 'creative' | 'modern' | 'classic';
  features: string[];
}

interface CVBuilderProps {
  userId: string;
  onGenerate?: (data: CVGenerationFormData) => Promise<void>;
  onCancel?: () => void;
  existingCVs?: Array<{ id: string; label: string; isDefault: boolean; createdAt: string }>;
}

// Mock templates data
const mockTemplates: CVTemplate[] = [
  {
    id: 'professional-1',
    name: 'Professional Standard',
    description: 'Clean, traditional layout perfect for corporate environments',
    preview: '/templates/professional-1.png',
    category: 'professional',
    features: ['Clean typography', 'Professional layout', 'ATS-friendly']
  },
  {
    id: 'modern-1',
    name: 'Modern Minimal',
    description: 'Contemporary design with subtle accents and modern typography',
    preview: '/templates/modern-1.png',
    category: 'modern',
    features: ['Modern design', 'Color accents', 'Minimal layout']
  },
  {
    id: 'creative-1',
    name: 'Creative Portfolio',
    description: 'Eye-catching design for creative professionals',
    preview: '/templates/creative-1.png',
    category: 'creative',
    features: ['Creative layout', 'Visual elements', 'Portfolio focus']
  },
  {
    id: 'classic-1',
    name: 'Classic Elegance',
    description: 'Timeless design that works across all industries',
    preview: '/templates/classic-1.png',
    category: 'classic',
    features: ['Timeless design', 'Elegant typography', 'Universal appeal']
  }
];

const colorOptions = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'Black', value: '#1F2937' }
];

const fontFamilies = [
  { name: 'Inter (Recommended)', value: 'Inter, sans-serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Helvetica', value: 'Helvetica, sans-serif' }
];

export default function CVBuilder({
  userId,
  onGenerate,
  onCancel,
  existingCVs = []
}: CVBuilderProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CVTemplate | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [previewMode, setPreviewMode] = useState<'template' | 'preview'>('template');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<CVGenerationFormData>({
    resolver: zodResolver(cvGenerationSchema),
    defaultValues: {
      sections: {
        includePersonalDetails: true,
        includeWorkExperience: true,
        includeEducation: true,
        includeSkills: true,
        includePortfolio: false
      },
      customizations: {
        fontSize: 'medium',
        spacing: 'normal'
      },
      format: 'pdf'
    }
  });

  const watchedSections = watch('sections');
  const watchedCustomizations = watch('customizations');
  const watchedFormat = watch('format');

  useEffect(() => {
    if (selectedTemplate) {
      setValue('templateId', selectedTemplate.id);
    }
  }, [selectedTemplate, setValue]);

  const onSubmit = async (data: CVGenerationFormData) => {
    if (!selectedTemplate) {
      return;
    }

    setIsGenerating(true);
    try {
      if (onGenerate) {
        await onGenerate(data);
      }
    } catch (error) {
      console.error('Error generating CV:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredTemplates = filterCategory === 'all' 
    ? mockTemplates 
    : mockTemplates.filter(template => template.category === filterCategory);

  const getSectionCount = () => {
    return Object.values(watchedSections).filter(Boolean).length;
  };

  return (
    <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="p-8 border-b border-gray-200">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">CV Builder</h2>
        <p className="text-gray-600">
          Create a professional CV from your profile data with customizable templates
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 p-8">
        {/* Left Panel - Template Selection */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Choose a Template</h3>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              {['all', 'professional', 'modern', 'creative', 'classic'].map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setFilterCategory(category)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filterCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            {/* Template Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    <div className="text-gray-500 text-sm">Template Preview</div>
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mb-2">{template.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  
                  <div className="flex flex-wrap gap-1">
                    {template.features.map((feature, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Configuration */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* CV Details */}
            <section className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">CV Details</h4>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-2">
                    CV Label *
                  </label>
                  <input
                    id="label"
                    type="text"
                    {...register('label')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Software Engineer - Tech Companies"
                    maxLength={100}
                  />
                  {errors.label && (
                    <p className="mt-1 text-sm text-red-600">{errors.label.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-2">
                    Output Format
                  </label>
                  <select
                    id="format"
                    {...register('format')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pdf">PDF (Recommended)</option>
                    <option value="html">HTML</option>
                    <option value="png">PNG Image</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    id="isDefault"
                    type="checkbox"
                    {...register('isDefault')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
                    Set as default CV
                  </label>
                </div>
              </div>
            </section>

            {/* Sections to Include */}
            <section className="bg-blue-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">
                Sections to Include ({getSectionCount()} selected)
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="includePersonalDetails"
                    type="checkbox"
                    {...register('sections.includePersonalDetails')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includePersonalDetails" className="ml-2 block text-sm text-gray-700">
                    Personal Details
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="includeWorkExperience"
                    type="checkbox"
                    {...register('sections.includeWorkExperience')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includeWorkExperience" className="ml-2 block text-sm text-gray-700">
                    Work Experience
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="includeEducation"
                    type="checkbox"
                    {...register('sections.includeEducation')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includeEducation" className="ml-2 block text-sm text-gray-700">
                    Education
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="includeSkills"
                    type="checkbox"
                    {...register('sections.includeSkills')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includeSkills" className="ml-2 block text-sm text-gray-700">
                    Skills & Technologies
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="includePortfolio"
                    type="checkbox"
                    {...register('sections.includePortfolio')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includePortfolio" className="ml-2 block text-sm text-gray-700">
                    Portfolio Items
                  </label>
                </div>
              </div>
            </section>

            {/* Customization Options */}
            <section className="bg-green-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Customization</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setValue('customizations.primaryColor', color.value)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          watchedCustomizations?.primaryColor === color.value
                            ? 'border-gray-900'
                            : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="fontSize" className="block text-sm font-medium text-gray-700 mb-2">
                    Font Size
                  </label>
                  <select
                    id="fontSize"
                    {...register('customizations.fontSize')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="fontFamily" className="block text-sm font-medium text-gray-700 mb-2">
                    Font Family
                  </label>
                  <select
                    id="fontFamily"
                    {...register('customizations.fontFamily')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Default</option>
                    {fontFamilies.map((font) => (
                      <option key={font.value} value={font.value}>
                        {font.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="spacing" className="block text-sm font-medium text-gray-700 mb-2">
                    Spacing
                  </label>
                  <select
                    id="spacing"
                    {...register('customizations.spacing')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="compact">Compact</option>
                    <option value="normal">Normal</option>
                    <option value="relaxed">Relaxed</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Existing CVs */}
            {existingCVs.length > 0 && (
              <section className="bg-purple-50 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Your Existing CVs</h4>
                <div className="space-y-2">
                  {existingCVs.map((cv) => (
                    <div key={cv.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div>
                        <span className="text-sm font-medium">{cv.label}</span>
                        {cv.isDefault && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(cv.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isGenerating || !selectedTemplate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : `Generate ${watchedFormat?.toUpperCase()}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}