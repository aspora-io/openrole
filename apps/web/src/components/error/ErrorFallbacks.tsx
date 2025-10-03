'use client';

import React from 'react';

// Generic error fallback components that can be reused

export function NetworkErrorFallback({ 
  onRetry, 
  message = "Network connection failed" 
}: { 
  onRetry?: () => void;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-6xl mb-4">📶</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Connection Problem</h3>
      <p className="text-gray-600 mb-4 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function DataLoadErrorFallback({ 
  onRetry,
  dataType = "data"
}: { 
  onRetry?: () => void;
  dataType?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-6xl mb-4">📋</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load {dataType}</h3>
      <p className="text-gray-600 mb-4 max-w-md">
        We couldn't load the {dataType}. This might be a temporary issue.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Reload {dataType}
        </button>
      )}
    </div>
  );
}

export function FormErrorFallback({ 
  onRetry,
  onReset 
}: { 
  onRetry?: () => void;
  onReset?: () => void;
}) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-start">
        <div className="text-red-400 text-2xl mr-4">⚠️</div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-red-800 mb-2">Form Error</h3>
          <p className="text-red-700 mb-4">
            Something went wrong with the form. You can try submitting again or reset the form.
          </p>
          <div className="flex gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            )}
            {onReset && (
              <button
                onClick={onReset}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Reset Form
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SearchErrorFallback({ 
  onRetry,
  onClearFilters 
}: { 
  onRetry?: () => void;
  onClearFilters?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Search Failed</h3>
      <p className="text-gray-600 mb-6 max-w-md">
        We couldn't complete your search. Try adjusting your search criteria or clearing filters.
      </p>
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        )}
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}

export function FileUploadErrorFallback({ 
  onRetry,
  fileName,
  error
}: { 
  onRetry?: () => void;
  fileName?: string;
  error?: string;
}) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="text-red-400 text-xl mr-3">📁</div>
        <div className="flex-1">
          <h4 className="font-medium text-red-800 mb-1">Upload Failed</h4>
          {fileName && (
            <p className="text-sm text-red-700 mb-1">File: {fileName}</p>
          )}
          <p className="text-sm text-red-600 mb-3">
            {error || "The file couldn't be uploaded. Please try again."}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
            >
              Retry Upload
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProfileErrorFallback({ 
  onRetry,
  isOwner = false 
}: { 
  onRetry?: () => void;
  isOwner?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="text-6xl mb-4">👤</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Profile Unavailable</h3>
      <p className="text-gray-600 mb-6 max-w-md">
        {isOwner 
          ? "We couldn't load your profile. This might be a temporary issue."
          : "This profile is currently unavailable or doesn't exist."
        }
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function PermissionErrorFallback({ 
  action = "access this content",
  requiredPermission
}: { 
  action?: string;
  requiredPermission?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="text-6xl mb-4">🔒</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
      <p className="text-gray-600 mb-6 max-w-md">
        You don't have permission to {action}.
        {requiredPermission && ` Required permission: ${requiredPermission}`}
      </p>
      <button
        onClick={() => window.history.back()}
        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
      >
        Go Back
      </button>
    </div>
  );
}

export function TimeoutErrorFallback({ 
  onRetry,
  operation = "operation" 
}: { 
  onRetry?: () => void;
  operation?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-6xl mb-4">⏰</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Request Timeout</h3>
      <p className="text-gray-600 mb-4 max-w-md">
        The {operation} is taking longer than expected. Please try again.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function ValidationErrorFallback({ 
  errors,
  onDismiss 
}: { 
  errors: string[];
  onDismiss?: () => void;
}) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex">
        <div className="text-yellow-400 text-xl mr-3">⚠️</div>
        <div className="flex-1">
          <h4 className="font-medium text-yellow-800 mb-2">Validation Errors</h4>
          <ul className="list-disc list-inside text-sm text-yellow-700 mb-3 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Mini error component for inline errors
export function InlineError({ 
  message,
  onRetry 
}: { 
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 text-red-600 text-sm p-2 bg-red-50 rounded border border-red-200">
      <span>⚠️</span>
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-red-700 hover:text-red-900 underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}