# Research: CV & Profile Tools

## File Upload and Storage

**Decision**: Use multipart/form-data uploads with S3-compatible storage (Cloudflare R2)  
**Rationale**: Cloudflare R2 provides cost-effective storage with edge distribution, tight integration with existing Cloudflare infrastructure, and S3 API compatibility for easy migration  
**Alternatives considered**: 
- AWS S3: More expensive egress costs
- Local filesystem: Not scalable, deployment complexity
- Database BLOB: Performance and size limitations

## CV Processing and Generation

**Decision**: PDF-lib for CV generation, Multer for file handling, sharp for image processing  
**Rationale**: PDF-lib provides client-side PDF generation without server dependencies, Multer is the standard Express middleware for multipart uploads, sharp offers fast image optimization  
**Alternatives considered**:
- Puppeteer: Heavy server-side dependencies, slower
- jsPDF: Limited formatting capabilities
- Canvas API: Browser compatibility issues

## Privacy and Access Control

**Decision**: Row-level security (RLS) in PostgreSQL with Drizzle ORM  
**Rationale**: Database-level security ensures data isolation even if application logic fails, Drizzle provides type-safe query building with RLS support  
**Alternatives considered**:
- Application-level filtering: More error-prone, bypass risk
- Separate schemas: Complex multi-tenancy overhead
- Redis-based permissions: Additional infrastructure complexity

## Search and Filtering

**Decision**: PostgreSQL full-text search with GIN indexes for basic search, Elasticsearch for advanced filtering in later phases  
**Rationale**: PostgreSQL FTS provides good performance for MVP with minimal infrastructure, easy to extend with Elasticsearch later for complex faceted search  
**Alternatives considered**:
- Elasticsearch from start: Over-engineering for MVP
- Simple LIKE queries: Poor performance at scale
- Third-party search API: Vendor lock-in, cost concerns

## Real-time Application Updates

**Decision**: Server-Sent Events (SSE) for application status updates  
**Rationale**: Simpler than WebSockets for one-way communication, better browser support, automatic reconnection handling  
**Alternatives considered**:
- WebSockets: Overkill for one-way updates
- Polling: Higher server load, poor UX
- Push notifications: Complex setup, requires user consent

## Authentication and Authorization

**Decision**: JWT tokens with refresh token rotation, RBAC using Drizzle schema  
**Rationale**: Stateless authentication scales well, refresh tokens provide security without frequent re-login, Drizzle enables type-safe role/permission queries  
**Alternatives considered**:
- Session-based auth: Stateful, Redis dependency
- OAuth only: Vendor dependency, complex user flow
- Simple API keys: No expiration, limited security

## Image Optimization and CDN

**Decision**: Next.js Image component with Cloudflare Images for processing  
**Rationale**: Next.js Image handles responsive images and lazy loading, Cloudflare Images provides on-demand processing and global CDN distribution  
**Alternatives considered**:
- Sharp server-side: Increased server load, no caching
- Client-side compression: Inconsistent results, larger uploads
- Third-party service: Additional cost, API dependencies

## Data Validation and Types

**Decision**: Zod for runtime validation with TypeScript integration  
**Rationale**: Zod provides compile-time and runtime type safety, excellent error messages, seamless integration with form libraries and API validation  
**Alternatives considered**:
- Joi: Less TypeScript integration
- Yup: Older API, less type inference
- Manual validation: Error-prone, no type inference

## Testing Strategy

**Decision**: Vitest for unit tests, Playwright for E2E, MSW for API mocking  
**Rationale**: Vitest offers faster test execution with native TypeScript support, Playwright provides reliable cross-browser testing, MSW enables realistic API mocking without server dependencies  
**Alternatives considered**:
- Jest: Slower, ESM support issues
- Cypress: Flakier tests, debugging challenges
- Manual API mocking: Inconsistent, maintenance overhead

## Background Jobs and Processing

**Decision**: BullMQ with Redis for job queues (email notifications, CV processing)  
**Rationale**: BullMQ provides reliable job processing with Redis backing, excellent observability, and retry mechanisms essential for email and file processing  
**Alternatives considered**:
- Database-based queues: Polling overhead, scaling issues
- Cloud functions: Cold start latency, vendor lock-in
- Simple cron jobs: No reliability guarantees, poor error handling