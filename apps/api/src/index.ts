import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// CORS middleware
app.use('/*', cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://openrole.net', 'https://www.openrole.net']
    : ['http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  })
})

// API info endpoint
app.get('/api/v1', (c) => {
  return c.json({
    name: 'OpenRole.net API',
    version: '1.0.0',
    description: 'Transparent job platform API',
    features: [
      'CV & Profile Management',
      'Application Tracking', 
      'Employer Verification',
      'Salary Transparency'
    ],
    status: 'Coming Soon',
    documentation: '/api/v1/docs'
  })
})

// CV & Profile endpoints (planned)
app.get('/api/v1/profiles', (c) => {
  return c.json({
    message: 'Profile management endpoints coming soon',
    specification: 'See /specs/001-cv-profile-tools/ for detailed requirements'
  })
})

app.get('/api/v1/cvs', (c) => {
  return c.json({
    message: 'CV management endpoints coming soon',
    features: ['Upload', 'Generation', 'Version Control', 'Privacy Controls']
  })
})

app.get('/api/v1/applications', (c) => {
  return c.json({
    message: 'Application tracking endpoints coming soon',
    features: ['Status Tracking', 'Feedback System', 'External Applications']
  })
})

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('API Error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

const port = parseInt(process.env.PORT || '3001')

console.log(`🚀 OpenRole.net API starting on port ${port}`)
console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`)

export default {
  port,
  fetch: app.fetch,
}