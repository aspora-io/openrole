'use client';

import React from 'react';
import { LoadingSpinner, InlineLoading } from './LoadingSpinner';

// Empty state components
export function EmptyState({
  icon = '📂',
  title,
  description,
  action,
  className = ''
}: {
  icon?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{description}</p>
      {action}
    </div>
  );
}

// Loading state wrapper that handles different states
export function LoadingStateWrapper({
  loading,
  error,
  empty,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent
}: {
  loading: boolean;
  error?: string | null;
  empty?: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
}) {
  if (loading) {
    return <>{loadingComponent || <InlineLoading message="Loading..." />}</>;
  }

  if (error) {
    return (
      <>
        {errorComponent || (
          <div className="text-center py-8">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </>
    );
  }

  if (empty) {
    return <>{emptyComponent || <EmptyState title="No data" description="No items found" />}</>;
  }

  return <>{children}</>;
}

// Specific loading states for common scenarios

export function TableLoadingState({ 
  columns = 5, 
  rows = 5 
}: { 
  columns?: number; 
  rows?: number; 
}) {
  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-6 py-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: columns }).map((_, j) => (
                <td key={j} className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardGridLoadingState({ 
  cards = 6 
}: { 
  cards?: number; 
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
          <div className="mt-4 flex space-x-2">
            <div className="h-6 w-16 bg-gray-200 rounded"></div>
            <div className="h-6 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListLoadingState({ 
  items = 5 
}: { 
  items?: number; 
}) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow animate-pulse">
          <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-8 w-20 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function FormLoadingState() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-1/5 mb-2"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
      <div className="flex space-x-4">
        <div className="h-10 w-24 bg-gray-200 rounded"></div>
        <div className="h-10 w-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

// Progress indicators
export function ProgressBar({ 
  value, 
  max = 100, 
  className = '',
  showLabel = false,
  label
}: {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  label?: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={className}>
      {(showLabel || label) && (
        <div className="flex justify-between text-sm mb-1">
          <span>{label || 'Progress'}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}

export function CircularProgress({ 
  value, 
  max = 100, 
  size = 40,
  strokeWidth = 4,
  className = ''
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-blue-600 transition-all duration-300 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}

// Skeleton loader wrapper
export function SkeletonWrapper({ 
  loading, 
  children, 
  skeleton 
}: {
  loading: boolean;
  children: React.ReactNode;
  skeleton: React.ReactNode;
}) {
  if (loading) {
    return <>{skeleton}</>;
  }

  return <>{children}</>;
}

// Upload progress component
export function UploadProgress({ 
  files 
}: {
  files: Array<{
    name: string;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
  }>;
}) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-medium text-gray-900">Uploading Files</h4>
      {files.map((file, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate max-w-xs">{file.name}</span>
            <span className={`
              ${file.status === 'completed' ? 'text-green-600' : ''}
              ${file.status === 'error' ? 'text-red-600' : ''}
              ${file.status === 'uploading' ? 'text-blue-600' : ''}
            `}>
              {file.status === 'completed' && '✓ Complete'}
              {file.status === 'error' && '✗ Failed'}
              {file.status === 'uploading' && `${file.progress}%`}
            </span>
          </div>
          <ProgressBar 
            value={file.progress} 
            className={`
              ${file.status === 'completed' ? 'opacity-75' : ''}
              ${file.status === 'error' ? 'opacity-50' : ''}
            `}
          />
          {file.status === 'error' && file.error && (
            <p className="text-xs text-red-600">{file.error}</p>
          )}
        </div>
      ))}
    </div>
  );
}