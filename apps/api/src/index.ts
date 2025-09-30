import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Import middleware
import { addRequestContext } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errors';
import { sanitizeInput } from './middleware/validation';
import { rateLimitPresets } from './middleware/rate-limit';

// Import route handlers
import profileRoutes from './routes/profile';
import searchRoutes from './routes/search';
import filesRoutes from './routes/files';
import cvRoutes from './routes/cv';
import portfolioRoutes from './routes/portfolio';
import privacyRoutes from './routes/privacy';
import experienceRoutes from './routes/experience';
import educationRoutes from './routes/education';

const app = new Hono();

// Global middleware
app.use('/*', addRequestContext);

// CORS middleware
app.use('/*', cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://openrole.net', 'https://www.openrole.net']
    : ['http://localhost:3000', 'http://localhost:3001'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true
}));

// Input sanitization
app.use('/*', sanitizeInput);

// Global rate limiting
app.use('/api/*', rateLimitPresets.general);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    features: {
      cvProfileTools: 'active',
      authentication: 'active',
      fileUploads: 'active',
      search: 'active',
      privacy: 'active'
    }
  });
});

// API info endpoint
app.get('/api/v1', (c) => {
  return c.json({
    name: 'OpenRole.net API',
    version: '1.0.0',
    description: 'Transparent job platform API with CV & Profile Tools',
    features: [
      'Comprehensive Profile Management',
      'CV Generation & Templates',
      'Portfolio Management', 
      'Advanced Search & Discovery',
      'File Upload & Management',
      'Privacy & GDPR Compliance',
      'Work Experience Tracking',
      'Education Management'
    ],
    status: 'Active',
    documentation: '/api/v1/docs',
    endpoints: {
      profiles: '/api/v1/profile',
      search: '/api/v1/search',
      files: '/api/v1/files',
      cv: '/api/v1/cv',
      portfolio: '/api/v1/portfolio',
      privacy: '/api/v1/privacy',
      experience: '/api/v1/experience',
      education: '/api/v1/education'
    }
  });
});

// Mount route handlers
app.route('/api/v1/profile', profileRoutes);
app.route('/api/v1/search', searchRoutes);
app.route('/api/v1/files', filesRoutes);
app.route('/api/v1/cv', cvRoutes);
app.route('/api/v1/portfolio', portfolioRoutes);
app.route('/api/v1/privacy', privacyRoutes);
app.route('/api/v1/experience', experienceRoutes);
app.route('/api/v1/education', educationRoutes);

// API Documentation endpoint
app.get('/api/v1/docs', (c) => {
  return c.json({
    openapi: '3.0.0',
    info: {
      title: 'OpenRole.net API',
      version: '1.0.0',
      description: 'CV & Profile Tools API for the transparent job platform',
      contact: {
        name: 'OpenRole Support',
        email: 'support@openrole.net'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.openrole.net/api/v1'
          : 'http://localhost:3001/api/v1',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    paths: {
      '/profile/{userId}': {
        get: { summary: 'Get user profile', tags: ['Profile'] },
        put: { summary: 'Update user profile', tags: ['Profile'] }
      },
      '/search/profiles': {
        post: { summary: 'Advanced profile search', tags: ['Search'] }
      },
      '/files/cv/upload': {
        post: { summary: 'Upload CV document', tags: ['Files'] }
      },
      '/cv/generate': {
        post: { summary: 'Generate CV from profile', tags: ['CV'] }
      },
      '/portfolio': {
        get: { summary: 'Get portfolio items', tags: ['Portfolio'] },
        post: { summary: 'Create portfolio item', tags: ['Portfolio'] }
      },
      '/privacy/settings/{userId}': {
        get: { summary: 'Get privacy settings', tags: ['Privacy'] },
        put: { summary: 'Update privacy settings', tags: ['Privacy'] }
      },
      '/experience': {
        get: { summary: 'Get work experience', tags: ['Experience'] },
        post: { summary: 'Add work experience', tags: ['Experience'] }
      },
      '/education': {
        get: { summary: 'Get education records', tags: ['Education'] },
        post: { summary: 'Add education record', tags: ['Education'] }
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      { bearerAuth: [] }
    ]
  });
});

// Legacy endpoint redirects for backward compatibility
app.get('/api/v1/profiles', (c) => {
  return c.redirect('/api/v1/profile/user/' + ((c as any).userId || 'me'), 301);
});

app.get('/api/v1/cvs', (c) => {
  return c.redirect('/api/v1/cv/user/' + ((c as any).userId || 'me'), 301);
});

// 404 handler
app.notFound(notFoundHandler);

// Global error handler
app.onError(errorHandler);

const port = parseInt(process.env.PORT || '3001')

console.log(`🚀 OpenRole.net API starting on port ${port}`)
console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`)

// Node.js deployment
const { serve } = require('@hono/node-server')
serve({
  fetch: app.fetch,
  port: port,
})

console.log(`🌐 Server running at http://localhost:${port}`)