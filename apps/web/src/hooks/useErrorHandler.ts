import { useCallback } from 'react';
import { useApp } from '../context/AppContext';

export interface ErrorOptions {
  title?: string;
  level?: 'info' | 'warning' | 'error' | 'critical';
  showNotification?: boolean;
  logToConsole?: boolean;
  logToService?: boolean;
  context?: Record<string, any>;
}

export function useErrorHandler() {
  const { addNotification } = useApp();

  const handleError = useCallback((
    error: Error | string,
    options: ErrorOptions = {}
  ) => {
    const {
      title = 'An error occurred',
      level = 'error',
      showNotification = true,
      logToConsole = true,
      logToService = process.env.NODE_ENV === 'production',
      context = {}
    } = options;

    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;

    // Log to console in development
    if (logToConsole) {
      console.error('Error Handler:', {
        title,
        message: errorMessage,
        stack: errorStack,
        level,
        context,
        timestamp: new Date().toISOString()
      });
    }

    // Show notification to user
    if (showNotification) {
      const notificationType = level === 'critical' ? 'error' : level;
      
      addNotification({
        type: notificationType as 'info' | 'warning' | 'error',
        title,
        message: errorMessage,
        duration: level === 'critical' ? 0 : 5000, // Critical errors don't auto-dismiss
      });
    }

    // Log to external service
    if (logToService) {
      logErrorToService(error, { title, level, context });
    }
  }, [addNotification]);

  const handleAsyncError = useCallback(async (
    asyncOperation: () => Promise<any>,
    options: ErrorOptions = {}
  ) => {
    try {
      return await asyncOperation();
    } catch (error) {
      handleError(error as Error, options);
      throw error; // Re-throw so calling code can handle it
    }
  }, [handleError]);

  const handleApiError = useCallback((
    error: any,
    operation: string = 'operation'
  ) => {
    let message = `Failed to ${operation}`;
    let level: ErrorOptions['level'] = 'error';

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          message = data?.message || 'Invalid request';
          level = 'warning';
          break;
        case 401:
          message = 'You need to be logged in to perform this action';
          level = 'warning';
          break;
        case 403:
          message = 'You don\'t have permission to perform this action';
          level = 'warning';
          break;
        case 404:
          message = 'The requested resource was not found';
          level = 'warning';
          break;
        case 429:
          message = 'Too many requests. Please try again later';
          level = 'warning';
          break;
        case 500:
          message = 'Server error. Please try again later';
          level = 'error';
          break;
        default:
          message = data?.message || `${operation} failed`;
          level = 'error';
      }
    } else if (error.request) {
      // Network error
      message = 'Network error. Please check your connection';
      level = 'error';
    } else {
      // Other error
      message = error.message || `Failed to ${operation}`;
      level = 'error';
    }

    handleError(message, {
      title: `${operation.charAt(0).toUpperCase() + operation.slice(1)} Failed`,
      level,
      context: {
        operation,
        status: error.response?.status,
        url: error.config?.url,
      }
    });
  }, [handleError]);

  const handleValidationError = useCallback((
    validationErrors: Record<string, string[]> | string[]
  ) => {
    let message: string;

    if (Array.isArray(validationErrors)) {
      message = validationErrors.join(', ');
    } else {
      const errors = Object.values(validationErrors).flat();
      message = errors.join(', ');
    }

    handleError(message, {
      title: 'Validation Error',
      level: 'warning',
      context: { validationErrors }
    });
  }, [handleError]);

  const handleFileUploadError = useCallback((
    error: any,
    fileName?: string
  ) => {
    let message = 'File upload failed';

    if (error.response?.status === 413) {
      message = 'File is too large';
    } else if (error.message?.includes('network')) {
      message = 'Network error during upload';
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
    }

    handleError(message, {
      title: 'Upload Failed',
      level: 'error',
      context: { fileName, fileSize: error.fileSize }
    });
  }, [handleError]);

  return {
    handleError,
    handleAsyncError,
    handleApiError,
    handleValidationError,
    handleFileUploadError,
  };
}

// Helper function to log errors to external service
function logErrorToService(
  error: Error | string,
  metadata: { title?: string; level?: string; context?: Record<string, any> }
) {
  const errorReport = {
    message: typeof error === 'string' ? error : error.message,
    stack: typeof error === 'string' ? undefined : error.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    ...metadata,
  };

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Sentry, LogRocket, etc.
    fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorReport),
    }).catch(err => {
      console.error('Failed to log error to service:', err);
    });
  }
}

// Hook for handling specific error types
export function useNetworkErrorHandler() {
  const { handleError } = useErrorHandler();

  return useCallback((error: any) => {
    handleError('Network connection failed. Please check your internet connection.', {
      title: 'Connection Error',
      level: 'error',
      context: { type: 'network', error: error.message }
    });
  }, [handleError]);
}

export function usePermissionErrorHandler() {
  const { handleError } = useErrorHandler();

  return useCallback((action: string, requiredPermission?: string) => {
    const message = `You don't have permission to ${action}${
      requiredPermission ? `. Required: ${requiredPermission}` : ''
    }`;
    
    handleError(message, {
      title: 'Permission Denied',
      level: 'warning',
      context: { type: 'permission', action, requiredPermission }
    });
  }, [handleError]);
}

export function useTimeoutErrorHandler() {
  const { handleError } = useErrorHandler();

  return useCallback((operation: string) => {
    handleError(`The ${operation} is taking longer than expected. Please try again.`, {
      title: 'Request Timeout',
      level: 'warning',
      context: { type: 'timeout', operation }
    });
  }, [handleError]);
}