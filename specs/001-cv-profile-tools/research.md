# Research: CV & Profile Tools

**Date**: 2025-09-30  
**Feature**: CV & Profile Tools for OpenRole.net  
**Status**: Complete

## Research Summary

This research phase analyzed technical requirements for implementing comprehensive CV and profile tools across 5 development phases. No NEEDS CLARIFICATION items remained in the feature specification after the clarification session, allowing direct progression to design phase.

## Technology Decisions

### File Upload & Storage
**Decision**: File system storage with PostgreSQL metadata tracking  
**Rationale**: 
- Simplicity for MVP phase without cloud storage complexity
- PostgreSQL handles structured metadata (file names, versions, labels)
- File system provides direct access for CV generation processes
- Cost-effective for initial deployment
**Alternatives considered**: 
- AWS S3: More scalable but adds complexity and cost for MVP
- Database BLOB storage: Poor performance for large files

### CV Generation Engine
**Decision**: Server-side HTML-to-PDF generation using Puppeteer  
**Rationale**:
- Template-based approach allows multiple CV formats
- HTML provides flexible styling and responsive design
- Puppeteer ensures consistent PDF output across environments
- Can generate accessible PDFs with proper structure
**Alternatives considered**:
- Third-party services (PDFShift, HTMLCSStoJSON): External dependencies and cost
- Client-side generation: Browser compatibility issues and performance concerns

### Privacy Control Implementation
**Decision**: Database-level privacy flags with middleware enforcement  
**Rationale**:
- Row-level security can be implemented in PostgreSQL
- Middleware ensures consistent privacy enforcement across API endpoints
- Allows granular control (public, semi-private, anonymous levels)
- Audit trail for privacy setting changes
**Alternatives considered**:
- Application-level filtering: More error-prone and harder to audit
- Separate privacy database: Unnecessary complexity for MVP

### Form Validation Strategy
**Decision**: Zod schemas shared between frontend and backend  
**Rationale**:
- Single source of truth for validation rules
- TypeScript integration provides compile-time safety
- Frontend validation improves UX, backend validation ensures security
- Reusable across profile forms, CV generation, and file uploads
**Alternatives considered**:
- Separate validation libraries: Code duplication and maintenance overhead
- Backend-only validation: Poor user experience

### Application Status Tracking
**Decision**: Finite state machine with PostgreSQL enum types  
**Rationale**:
- Clear state transitions prevent invalid status changes
- Database constraints ensure data consistency
- Simplifies business logic and error handling
- Supports audit trail for application lifecycle
**Alternatives considered**:
- String-based status: Error-prone and harder to validate
- External workflow engine: Overkill for MVP requirements

### Authentication Integration
**Decision**: Extend existing JWT + Redis session system  
**Rationale**:
- Leverages existing authentication infrastructure
- JWT tokens can include profile completion status
- Redis sessions support real-time profile updates
- Maintains security standards established in constitution
**Alternatives considered**:
- Separate auth system: Unnecessary complexity and user confusion
- Session-only auth: Less scalable for API access patterns

## Performance Considerations

### File Upload Optimization
- Chunked upload for large CV files (up to 10MB limit)
- Client-side file validation before upload
- Progress indicators for better UX
- Background virus scanning integration point for future phases

### CV Generation Performance
- Template caching to reduce Puppeteer overhead
- Background job processing for non-real-time CV generation
- PDF optimization for smaller file sizes
- Concurrent generation limits to prevent resource exhaustion

### Database Query Optimization
- Indexes on privacy levels and user lookup patterns
- Pagination for profile search results
- Selective field loading based on privacy settings
- Connection pooling for file upload operations

## Security Research

### File Upload Security
- MIME type validation with file content verification
- Antivirus scanning integration points
- Secure file naming to prevent path traversal
- Temporary upload area with cleanup processes

### Privacy Compliance
- GDPR Article 17 (right to erasure) implementation strategy
- Data retention policy enforcement mechanisms
- Audit logging for privacy setting changes
- Consent management for profile visibility

### Access Control
- Role-based permissions for employer profile access
- API rate limiting for profile search endpoints
- File access tokens with expiration
- Audit trail for profile view tracking

## Integration Points

### Existing System Integration
- User authentication system (already implemented)
- Job application workflow (planned extension)
- Email notification system (for application updates)
- Search and filtering infrastructure (for profile discovery)

### External Service Integration (Future Phases)
- Payment processing for premium CV services
- AI/ML services for CV optimization
- Third-party job board integrations
- Career development resource APIs

## Accessibility Research

### Form Accessibility
- ARIA labels for complex form interactions
- Keyboard navigation for file upload components
- Screen reader compatibility for CV preview
- Error message announcements

### Generated CV Accessibility
- PDF/UA compliance for generated documents
- Alt text generation for embedded images
- Proper heading structure in CV templates
- High contrast options for visual accessibility

## Technical Debt Considerations

### Phase 1 MVP Technical Debt
- File system storage will need migration to cloud storage
- Basic CV templates will need design system integration
- Privacy controls may need more granular permissions
- Search functionality will need optimization for scale

### Migration Planning
- Database schema designed for backward compatibility
- API versioning strategy for breaking changes
- File storage abstraction layer for future cloud migration
- Feature flag system for gradual rollout

## Conclusion

Research phase completed successfully with all technical approaches validated against constitutional requirements. No blocking technical concerns identified. Design phase can proceed with confidence in selected technologies and architectural patterns.

Key success factors:
1. Leveraging existing authentication and database infrastructure
2. Privacy-by-design approach aligns with transparency principles
3. File upload security maintains platform trust
4. Scalable architecture supports 5-phase development plan
5. Accessibility considerations embedded from start

Next phase: Design & Contracts generation based on research findings.