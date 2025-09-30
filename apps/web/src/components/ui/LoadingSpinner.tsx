'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const colorClasses = {
  primary: 'border-blue-600',
  secondary: 'border-gray-600',
  white: 'border-white',
  gray: 'border-gray-400',
};

export function LoadingSpinner({ 
  size = 'md', 
  color = 'primary', 
  className = '' 
}: LoadingSpinnerProps) {
  return (
    <div
      className={`
        animate-spin rounded-full border-2 border-transparent border-t-current
        ${sizeClasses[size]}
        ${colorClasses[color]}
        ${className}
      `}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function LoadingDots({ 
  size = 'md',
  color = 'primary',
  className = '' 
}: LoadingSpinnerProps) {
  const dotSizeClasses = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  };

  const dotColorClasses = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-600',
    white: 'bg-white',
    gray: 'bg-gray-400',
  };

  return (
    <div className={`flex space-x-1 ${className}`} role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`
            ${dotSizeClasses[size]}
            ${dotColorClasses[color]}
            rounded-full animate-pulse
          `}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s',
          }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function LoadingPulse({ 
  className = '',
  children 
}: { 
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`animate-pulse ${className}`}>
      {children}
    </div>
  );
}

// Full screen loading overlay
export function LoadingOverlay({ 
  message = 'Loading...',
  transparent = false 
}: {
  message?: string;
  transparent?: boolean;
}) {
  return (
    <div className={`
      fixed inset-0 z-50 flex items-center justify-center
      ${transparent ? 'bg-black bg-opacity-20' : 'bg-white'}
    `}>
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <p className="mt-4 text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
}

// Inline loading component
export function InlineLoading({ 
  message = 'Loading...',
  size = 'sm' 
}: {
  message?: string;
  size?: 'xs' | 'sm' | 'md';
}) {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      <LoadingSpinner size={size} />
      <span className="text-sm">{message}</span>
    </div>
  );
}

// Button loading state
export function LoadingButton({ 
  loading = false,
  children,
  disabled,
  onClick,
  className = '',
  size = 'md',
  variant = 'primary',
  ...props
}: {
  loading?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  [key: string]: any;
}) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-400',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400',
  };

  const spinnerColor = variant === 'outline' ? 'primary' : 'white';
  const spinnerSize = size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm';

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-md font-medium transition-colors duration-200
        disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${className}
      `}
      {...props}
    >
      {loading && <LoadingSpinner size={spinnerSize} color={spinnerColor} />}
      {children}
    </button>
  );
}