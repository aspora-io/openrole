'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  circle?: boolean;
}

export function Skeleton({ 
  className = '',
  width,
  height,
  rounded = true,
  circle = false
}: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`
        bg-gray-200 animate-pulse
        ${circle ? 'rounded-full' : rounded ? 'rounded' : ''}
        ${className}
      `}
      style={style}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Specific skeleton components for common use cases

export function TextSkeleton({ 
  lines = 1,
  className = '' 
}: { 
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={16}
          width={i === lines - 1 ? '75%' : '100%'}
          className="last:w-3/4"
        />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 animate-pulse">
      <div className="flex items-start gap-6">
        {/* Avatar */}
        <Skeleton circle width={80} height={80} />
        
        {/* Profile info */}
        <div className="flex-1">
          <Skeleton height={24} width="60%" className="mb-2" />
          <Skeleton height={16} width="40%" className="mb-4" />
          <TextSkeleton lines={3} />
        </div>
      </div>
      
      {/* Skills */}
      <div className="mt-6">
        <Skeleton height={20} width="30%" className="mb-3" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} height={28} width={80} rounded />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CVBuilderSkeleton() {
  return (
    <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="p-8 border-b border-gray-200">
        <Skeleton height={32} width="40%" className="mb-2" />
        <Skeleton height={16} width="60%" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8 p-8">
        {/* Template Selection */}
        <div className="lg:col-span-2">
          <Skeleton height={24} width="50%" className="mb-4" />
          
          {/* Filter buttons */}
          <div className="flex gap-2 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height={32} width={80} rounded />
            ))}
          </div>

          {/* Template grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <Skeleton height={200} className="mb-4" />
                <Skeleton height={20} width="70%" className="mb-2" />
                <Skeleton height={14} width="90%" className="mb-3" />
                <div className="flex gap-1">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} height={20} width={60} rounded />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* CV Details */}
            <div className="bg-gray-50 rounded-lg p-6">
              <Skeleton height={20} width="40%" className="mb-4" />
              <div className="space-y-4">
                <div>
                  <Skeleton height={14} width="30%" className="mb-2" />
                  <Skeleton height={40} />
                </div>
                <div>
                  <Skeleton height={14} width="40%" className="mb-2" />
                  <Skeleton height={40} />
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className="bg-blue-50 rounded-lg p-6">
              <Skeleton height={20} width="50%" className="mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center">
                    <Skeleton width={16} height={16} className="mr-2" />
                    <Skeleton height={14} width="60%" />
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Skeleton height={40} width="50%" rounded />
              <Skeleton height={40} width="50%" rounded />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PortfolioSkeleton() {
  return (
    <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Skeleton height={32} width="40%" className="mb-2" />
          <Skeleton height={16} width="60%" />
        </div>
        <Skeleton height={40} width={100} rounded />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Skeleton height={40} width={120} rounded />
          <Skeleton height={40} width={150} rounded />
          <Skeleton height={40} width={130} rounded />
        </div>
        <Skeleton height={16} width="100px" />
      </div>

      {/* Portfolio Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
            <Skeleton height={192} />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton height={20} width="70%" />
                <div className="flex gap-1 ml-auto">
                  <Skeleton height={14} width={30} />
                  <Skeleton height={14} width={40} />
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Skeleton height={20} width={80} rounded />
                <Skeleton height={12} width={40} />
              </div>
              <TextSkeleton lines={2} className="mb-3" />
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} height={20} width={60} rounded />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExperienceTimelineSkeleton() {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Skeleton height={32} width="40%" className="mb-2" />
          <Skeleton height={16} width="60%" />
        </div>
        <Skeleton height={40} width={120} rounded />
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {/* Experience items */}
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="relative flex gap-6">
              {/* Timeline dot */}
              <Skeleton circle width={20} height={20} className="relative z-10" />
              
              {/* Content */}
              <div className="ml-16 flex-1">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Skeleton height={24} width="60%" className="mb-2" />
                      <Skeleton height={20} width="50%" className="mb-2" />
                      
                      <div className="flex items-center gap-4 mb-3">
                        <Skeleton height={20} width={80} rounded />
                        <Skeleton height={16} width="40%" />
                        <Skeleton height={16} width="30%" />
                      </div>
                      
                      <TextSkeleton lines={2} />
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Skeleton height={14} width={60} />
                      <Skeleton height={14} width={30} />
                      <Skeleton height={14} width={40} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <Skeleton height={24} width="30%" />
        <div className="flex items-center gap-4">
          <Skeleton height={40} width={120} />
          <Skeleton height={40} width={80} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-6">
            <Skeleton height={20} width="80%" className="mb-2" />
            <TextSkeleton lines={3} className="mb-3" />
            
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2">
                <Skeleton width={16} height={16} />
                <Skeleton height={14} width="60%" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton width={16} height={16} />
                <Skeleton height={14} width="50%" />
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} height={20} width={50} rounded />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <Skeleton height={12} width="40%" />
              <Skeleton height={12} width="30%" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EducationSkeleton() {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Skeleton height={32} width="40%" className="mb-2" />
          <Skeleton height={16} width="60%" />
        </div>
        <Skeleton height={40} width={120} rounded />
      </div>

      <div className="grid gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4 flex-1">
                <Skeleton width={48} height={48} />
                
                <div className="flex-1">
                  <Skeleton height={24} width="70%" className="mb-2" />
                  <Skeleton height={20} width="60%" className="mb-2" />
                  
                  <div className="flex items-center gap-4 mb-3">
                    <Skeleton height={16} width="40%" />
                    <Skeleton height={16} width="30%" />
                    <Skeleton height={20} width={60} rounded />
                  </div>
                  
                  <TextSkeleton lines={2} />
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                <Skeleton height={14} width={60} />
                <Skeleton height={14} width={30} />
                <Skeleton height={14} width={40} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}