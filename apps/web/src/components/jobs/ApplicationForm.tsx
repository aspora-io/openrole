import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Briefcase, MessageSquare, CheckCircle } from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import { useCV } from '../../hooks/useCV';
import { usePortfolio } from '../../hooks/usePortfolio';

interface ApplicationFormProps {
  job: any;
  onSubmit: (applicationData: any) => void;
  onClose: () => void;
  submitting: boolean;
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  job,
  onSubmit,
  onClose,
  submitting
}) => {
  const [step, setStep] = useState(1);
  const [applicationData, setApplicationData] = useState({
    cv_document_id: '',
    cover_letter: '',
    portfolio_items: [],
    custom_responses: {}
  });

  // Hooks for fetching user data
  const { profile } = useProfile();
  const { cvDocuments, loading: cvLoading } = useCV();
  const { portfolioItems, loading: portfolioLoading } = usePortfolio();

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (job.requires_cover_letter && !applicationData.cover_letter.trim()) {
      alert('Cover letter is required for this position');
      return;
    }
    
    if (job.requires_portfolio && applicationData.portfolio_items.length === 0) {
      alert('Portfolio items are required for this position');
      return;
    }

    // Validate custom questions
    const missingResponses = job.custom_questions?.filter(q => 
      q.required && !applicationData.custom_responses[q.question]
    );
    
    if (missingResponses?.length > 0) {
      alert(`Please answer all required questions: ${missingResponses.map(q => q.question).join(', ')}`);
      return;
    }

    onSubmit(applicationData);
  };

  // Update application data
  const updateApplicationData = (field: string, value: any) => {
    setApplicationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle custom question responses
  const handleCustomResponse = (question: string, response: string) => {
    setApplicationData(prev => ({
      ...prev,
      custom_responses: {
        ...prev.custom_responses,
        [question]: response
      }
    }));
  };

  // Toggle portfolio item selection
  const togglePortfolioItem = (itemId: string) => {
    setApplicationData(prev => ({
      ...prev,
      portfolio_items: prev.portfolio_items.includes(itemId)
        ? prev.portfolio_items.filter(id => id !== itemId)
        : [...prev.portfolio_items, itemId]
    }));
  };

  const totalSteps = 3 + (job.custom_questions?.length > 0 ? 1 : 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Apply for {job.title}</h2>
            <p className="text-gray-600">{job.company.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Step 1: CV Selection */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Select your CV
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Choose the CV you'd like to submit with your application.
                  </p>
                </div>

                {cvLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading your CVs...</p>
                  </div>
                ) : cvDocuments && cvDocuments.length > 0 ? (
                  <div className="space-y-3">
                    {cvDocuments.map(cv => (
                      <label 
                        key={cv.id} 
                        className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="radio"
                          name="cv_document_id"
                          value={cv.id}
                          checked={applicationData.cv_document_id === cv.id}
                          onChange={(e) => updateApplicationData('cv_document_id', e.target.value)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{cv.title}</div>
                          <div className="text-sm text-gray-600">
                            {cv.template_name} • Updated {new Date(cv.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {cv.format.toUpperCase()}
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No CVs found</p>
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Create your first CV
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Cover Letter */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Cover Letter
                    {job.requires_cover_letter && (
                      <span className="text-red-500 text-sm">*Required</span>
                    )}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {job.requires_cover_letter 
                      ? 'A cover letter is required for this position. Tell the employer why you\'re interested and what makes you a great fit.'
                      : 'Add a cover letter to help your application stand out (optional).'
                    }
                  </p>
                </div>

                <div>
                  <textarea
                    value={applicationData.cover_letter}
                    onChange={(e) => updateApplicationData('cover_letter', e.target.value)}
                    placeholder="Dear Hiring Manager,&#10;&#10;I am writing to express my interest in the [Position Title] role at [Company Name]..."
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                    <span>{applicationData.cover_letter.length} characters</span>
                    <span>Recommended: 250-400 words</span>
                  </div>
                </div>

                {/* Cover Letter Tips */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Cover Letter Tips:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Address the hiring manager by name if possible</li>
                    <li>• Mention specific skills that match the job requirements</li>
                    <li>• Explain why you're interested in this company</li>
                    <li>• Keep it concise and professional</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 3: Portfolio */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Portfolio Items
                    {job.requires_portfolio && (
                      <span className="text-red-500 text-sm">*Required</span>
                    )}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {job.requires_portfolio 
                      ? 'Select portfolio items that showcase your relevant work and skills for this position.'
                      : 'Add portfolio items to showcase your work (optional).'
                    }
                  </p>
                </div>

                {portfolioLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading your portfolio...</p>
                  </div>
                ) : portfolioItems && portfolioItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {portfolioItems.map(item => (
                      <label 
                        key={item.id} 
                        className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={applicationData.portfolio_items.includes(item.id)}
                          onChange={() => togglePortfolioItem(item.id)}
                          className="mt-1 mr-3"
                        />
                        <div className="flex-1">
                          {item.thumbnail_url && (
                            <img 
                              src={item.thumbnail_url} 
                              alt={item.title}
                              className="w-full h-32 object-cover rounded mb-2"
                            />
                          )}
                          <div className="font-medium text-gray-900">{item.title}</div>
                          <div className="text-sm text-gray-600 mb-2">{item.description}</div>
                          <div className="flex flex-wrap gap-1">
                            {item.technologies.slice(0, 3).map(tech => (
                              <span 
                                key={tech}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No portfolio items found</p>
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Add your first portfolio item
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Custom Questions */}
            {step === 4 && job.custom_questions && job.custom_questions.length > 0 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Additional Questions
                  </h3>
                  <p className="text-gray-600 mb-4">
                    The employer has asked some additional questions to learn more about you.
                  </p>
                </div>

                <div className="space-y-6">
                  {job.custom_questions.map((question, index) => (
                    <div key={index}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {question.question}
                        {question.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      
                      {question.type === 'text' && (
                        <input
                          type="text"
                          value={applicationData.custom_responses[question.question] || ''}
                          onChange={(e) => handleCustomResponse(question.question, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required={question.required}
                        />
                      )}
                      
                      {question.type === 'textarea' && (
                        <textarea
                          value={applicationData.custom_responses[question.question] || ''}
                          onChange={(e) => handleCustomResponse(question.question, e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required={question.required}
                        />
                      )}
                      
                      {question.type === 'select' && (
                        <select
                          value={applicationData.custom_responses[question.question] || ''}
                          onChange={(e) => handleCustomResponse(question.question, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required={question.required}
                        >
                          <option value="">Select an option</option>
                          {question.options?.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      )}
                      
                      {question.type === 'multiselect' && (
                        <div className="space-y-2">
                          {question.options?.map(option => (
                            <label key={option} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={(applicationData.custom_responses[question.question] || []).includes(option)}
                                onChange={(e) => {
                                  const current = applicationData.custom_responses[question.question] || [];
                                  const updated = e.target.checked 
                                    ? [...current, option]
                                    : current.filter(item => item !== option);
                                  handleCustomResponse(question.question, updated);
                                }}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={step > 1 ? () => setStep(step - 1) : onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              disabled={submitting}
            >
              {step > 1 ? 'Back' : 'Cancel'}
            </button>

            <div className="flex items-center gap-3">
              {step < totalSteps ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Submit Application
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};