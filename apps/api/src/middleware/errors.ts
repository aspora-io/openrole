/**
 * Error Handling Middleware - Comprehensive error handling and logging
 * 
 * Provides centralized error handling, logging, monitoring integration,
 * and user-friendly error responses for the API.
 * 
 * @author OpenRole Team
 * @date 2025-09-30
 */

import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';

/**
 * Application error types
 */
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}

/**
 * Structured error interface
 */
export interface AppError extends Error {
  type: ErrorType;
  statusCode: number;
  code: string;
  details?: any;
  userMessage?: string;
  isOperational?: boolean;
  timestamp?: Date;
  requestId?: string;
  userId?: string;
  context?: Record<string, any>;
}

/**
 * Error response format
 */
export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    type: string;
    details?: any;
    timestamp: string;
    requestId?: string;
    path?: string;
    method?: string;
  };
  success: false;
  statusCode: number;
}

/**
 * Application error class
 */
export class ApplicationError extends Error implements AppError {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;
  public readonly userMessage?: string;
  public readonly isOperational: boolean = true;
  public readonly timestamp: Date;
  public readonly requestId?: string;
  public readonly userId?: string;
  public readonly context?: Record<string, any>;

  constructor(
    type: ErrorType,
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: any,
    userMessage?: string,
    context?: Record<string, any>
  ) {
    super(message);
    
    this.name = 'ApplicationError';
    this.type = type;
    this.statusCode = statusCode;
    this.code = code || type;
    this.details = details;
    this.userMessage = userMessage || message;
    this.timestamp = new Date();
    this.context = context;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, ApplicationError);
  }

  /**
   * Convert error to JSON representation
   */
  toJSON(): object {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      details: this.details,
      userMessage: this.userMessage,
      timestamp: this.timestamp,
      requestId: this.requestId,
      userId: this.userId,
      context: this.context,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
    };
  }
}

/**
 * Predefined error factories
 */
export const ErrorFactory = {
  // Validation errors
  validationError: (message: string, details?: any) => 
    new ApplicationError(
      ErrorType.VALIDATION_ERROR,
      message,
      400,
      'VALIDATION_FAILED',
      details,
      'The provided data is invalid. Please check your input and try again.'
    ),

  // Authentication errors
  authenticationError: (message: string = 'Authentication failed') =>
    new ApplicationError(
      ErrorType.AUTHENTICATION_ERROR,
      message,
      401,
      'AUTH_FAILED',
      undefined,
      'Authentication is required. Please log in and try again.'
    ),

  // Authorization errors
  authorizationError: (message: string = 'Access denied') =>
    new ApplicationError(
      ErrorType.AUTHORIZATION_ERROR,
      message,
      403,
      'ACCESS_DENIED',
      undefined,
      'You do not have permission to access this resource.'
    ),

  // Not found errors
  notFoundError: (resource: string = 'Resource') =>
    new ApplicationError(
      ErrorType.NOT_FOUND_ERROR,
      `${resource} not found`,
      404,
      'NOT_FOUND',
      { resource },
      `The requested ${resource.toLowerCase()} could not be found.`
    ),

  // Conflict errors
  conflictError: (message: string, details?: any) =>
    new ApplicationError(
      ErrorType.CONFLICT_ERROR,
      message,
      409,
      'CONFLICT',
      details,
      'The request conflicts with existing data. Please check and try again.'
    ),

  // Rate limit errors
  rateLimitError: (limit: number, window: string = '1 minute') =>
    new ApplicationError(
      ErrorType.RATE_LIMIT_ERROR,
      `Rate limit exceeded: ${limit} requests per ${window}`,
      429,
      'RATE_LIMIT_EXCEEDED',
      { limit, window },
      `Too many requests. Please wait before trying again.`
    ),

  // Business logic errors
  businessLogicError: (message: string, code?: string, details?: any) =>
    new ApplicationError(
      ErrorType.BUSINESS_LOGIC_ERROR,
      message,
      422,
      code || 'BUSINESS_LOGIC_ERROR',
      details,
      message
    ),

  // External service errors
  externalServiceError: (service: string, message?: string) =>
    new ApplicationError(
      ErrorType.EXTERNAL_SERVICE_ERROR,
      `External service error: ${service}${message ? ` - ${message}` : ''}`,
      503,
      'EXTERNAL_SERVICE_ERROR',
      { service },
      'A required service is temporarily unavailable. Please try again later.'
    ),

  // Database errors
  databaseError: (operation: string, details?: any) =>
    new ApplicationError(
      ErrorType.DATABASE_ERROR,
      `Database error during ${operation}`,
      500,
      'DATABASE_ERROR',
      details,
      'A database error occurred. Please try again later.'
    ),

  // File system errors
  fileSystemError: (operation: string, path?: string) =>
    new ApplicationError(
      ErrorType.FILE_SYSTEM_ERROR,
      `File system error during ${operation}${path ? ` for ${path}` : ''}`,
      500,
      'FILE_SYSTEM_ERROR',
      { operation, path },
      'A file operation failed. Please try again later.'
    ),

  // Internal server errors
  internalServerError: (message?: string, details?: any) =>
    new ApplicationError(
      ErrorType.INTERNAL_SERVER_ERROR,
      message || 'Internal server error',
      500,
      'INTERNAL_SERVER_ERROR',
      details,
      'An unexpected error occurred. Please try again later.'
    )
};

/**
 * Error logging service
 */
export class ErrorLogger {
  /**
   * Log error with context
   */
  static log(error: Error, context?: Record<string, any>): void {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error instanceof ApplicationError ? error.toJSON() : {})
      },
      context: {
        ...context,
        environment: process.env.NODE_ENV,
        nodeVersion: process.version
      }
    };

    // In production, you would send this to your logging service
    if (process.env.NODE_ENV === 'production') {
      // Send to logging service (e.g., Winston, Pino, etc.)
      console.error('ERROR:', JSON.stringify(errorInfo, null, 2));
      
      // Send to external monitoring (e.g., Sentry, DataDog, etc.)
      // this.sendToMonitoring(errorInfo);
    } else {
      console.error('ERROR:', error);
      if (context) {
        console.error('CONTEXT:', context);
      }
    }
  }

  /**
   * Send error to external monitoring service
   */
  private static sendToMonitoring(errorInfo: any): void {
    // TODO: Implement integration with monitoring services
    // Examples: Sentry, DataDog, New Relic, etc.
  }
}

/**
 * Global error handler middleware
 */
export const errorHandler = async (error: Error, c: Context) => {
  const requestId = (c as any).requestId || 'unknown';
  const userId = (c as any).userId;
  const requestContext = {
    requestId,
    userId,
    method: c.req.method,
    path: c.req.path,
    userAgent: c.req.header('User-Agent'),
    ip: c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP'),
    timestamp: new Date().toISOString()
  };

  // Log the error
  ErrorLogger.log(error, requestContext);

  // Handle different error types
  if (error instanceof ApplicationError) {
    return c.json(createErrorResponse(error, requestContext), error.statusCode);
  }

  if (error instanceof HTTPException) {
    const appError = new ApplicationError(
      ErrorType.INTERNAL_SERVER_ERROR,
      error.message,
      error.status,
      'HTTP_EXCEPTION',
      error.cause
    );
    return c.json(createErrorResponse(appError, requestContext), error.status);
  }

  if (error instanceof ZodError) {
    const appError = ErrorFactory.validationError(
      'Request validation failed',
      {
        issues: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      }
    );
    return c.json(createErrorResponse(appError, requestContext), 400);
  }

  // Handle database errors
  if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
    const appError = ErrorFactory.conflictError(
      'Resource already exists',
      { originalError: error.message }
    );
    return c.json(createErrorResponse(appError, requestContext), 409);
  }

  // Handle connection errors
  if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
    const appError = ErrorFactory.externalServiceError(
      'External service',
      'Connection failed'
    );
    return c.json(createErrorResponse(appError, requestContext), 503);
  }

  // Generic internal server error
  const appError = ErrorFactory.internalServerError(
    process.env.NODE_ENV === 'development' ? error.message : undefined,
    process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
  );

  return c.json(createErrorResponse(appError, requestContext), 500);
};

/**
 * Create standardized error response
 */
function createErrorResponse(error: ApplicationError, context: any): ErrorResponse {
  return {
    success: false,
    statusCode: error.statusCode,
    error: {
      message: error.userMessage || error.message,
      code: error.code,
      type: error.type,
      details: process.env.NODE_ENV === 'development' ? error.details : undefined,
      timestamp: error.timestamp.toISOString(),
      requestId: context.requestId,
      path: context.path,
      method: context.method
    }
  };
}

/**
 * Not found handler middleware
 */
export const notFoundHandler = (c: Context) => {
  const error = ErrorFactory.notFoundError('Endpoint');
  const requestContext = {
    requestId: (c as any).requestId || 'unknown',
    method: c.req.method,
    path: c.req.path
  };

  return c.json(createErrorResponse(error, requestContext), 404);
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn: Function) => {
  return async (c: Context, next?: Next) => {
    try {
      return await fn(c, next);
    } catch (error) {
      throw error; // Let the global error handler deal with it
    }
  };
};

/**
 * Error monitoring and health check
 */
export class ErrorMonitor {
  private static errorCounts = new Map<string, number>();
  private static lastReset = Date.now();

  /**
   * Track error occurrence
   */
  static trackError(errorType: ErrorType): void {
    const current = this.errorCounts.get(errorType) || 0;
    this.errorCounts.set(errorType, current + 1);

    // Reset counts every hour
    if (Date.now() - this.lastReset > 60 * 60 * 1000) {
      this.errorCounts.clear();
      this.lastReset = Date.now();
    }
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts.entries());
  }

  /**
   * Check if error rate is concerning
   */
  static isErrorRateHigh(errorType: ErrorType, threshold: number = 100): boolean {
    return (this.errorCounts.get(errorType) || 0) > threshold;
  }
}

/**
 * Development error helpers
 */
export const devHelpers = {
  /**
   * Throw a test error for debugging
   */
  testError: (type: ErrorType = ErrorType.INTERNAL_SERVER_ERROR) => {
    if (process.env.NODE_ENV !== 'development') {
      throw ErrorFactory.notFoundError();
    }
    
    switch (type) {
      case ErrorType.VALIDATION_ERROR:
        throw ErrorFactory.validationError('Test validation error');
      case ErrorType.AUTHENTICATION_ERROR:
        throw ErrorFactory.authenticationError();
      case ErrorType.AUTHORIZATION_ERROR:
        throw ErrorFactory.authorizationError();
      default:
        throw ErrorFactory.internalServerError('Test internal server error');
    }
  },

  /**
   * Simulate random errors for testing
   */
  simulateRandomError: (probability: number = 0.1) => {
    if (process.env.NODE_ENV !== 'development') return;
    
    if (Math.random() < probability) {
      const errorTypes = Object.values(ErrorType);
      const randomType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      devHelpers.testError(randomType);
    }
  }
};