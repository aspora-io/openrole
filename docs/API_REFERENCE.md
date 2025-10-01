# OpenRole.net API Reference

## CV & Profile Tools API Documentation

**Version:** 1.0.0  
**Base URL:** `https://api.openrole.net/api/v1`  
**Environment:** Production

---

## Overview

The OpenRole.net API provides comprehensive CV & Profile Tools functionality including profile management, CV generation, portfolio showcase, advanced search, and privacy controls. All endpoints require authentication via JWT bearer tokens unless otherwise specified.

## Authentication

```bash
# Include authentication header in all requests
Authorization: Bearer <jwt_token>
```

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2025-10-01T12:00:00.000Z"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": { ... },
  "timestamp": "2025-10-01T12:00:00.000Z"
}
```

---

## Profile Management

### Create Profile
**POST** `/profile`

Create a new candidate profile.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+353851234567",
  "location": "Dublin, Ireland",
  "title": "Senior Software Engineer",
  "summary": "Experienced full-stack developer...",
  "skills": ["JavaScript", "React", "Node.js"],
  "industries": ["Technology", "Fintech"],
  "salaryMin": 70000,
  "salaryMax": 90000,
  "salaryCurrency": "EUR",
  "workType": "HYBRID",
  "experienceLevel": "SENIOR",
  "availabilityDate": "2025-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "profile-123",
    "userId": "user-456",
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "title": "Senior Software Engineer",
    "createdAt": "2025-10-01T12:00:00.000Z",
    "updatedAt": "2025-10-01T12:00:00.000Z"
  },
  "message": "Profile created successfully"
}
```

### Get Profile
**GET** `/profile/{userId}`

Retrieve user profile with privacy filtering applied.

**Parameters:**
- `userId` (path) - User ID to retrieve profile for

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "profile-123",
    "userId": "user-456",
    "fullName": "John Doe",
    "title": "Senior Software Engineer",
    "location": "Dublin, Ireland",
    "skills": ["JavaScript", "React", "Node.js"],
    "experienceLevel": "SENIOR",
    "profileCompletion": 87
  }
}
```

### Update Profile
**PUT** `/profile/{userId}`

Update existing profile. Requires ownership.

**Request Body:** (partial profile data)
```json
{
  "title": "Lead Software Engineer",
  "summary": "Updated professional summary...",
  "skills": ["JavaScript", "TypeScript", "React", "Node.js"]
}
```

### Delete Profile
**DELETE** `/profile/{userId}`

Permanently delete profile and all associated data. GDPR compliant.

### Profile Completion
**GET** `/profile/{userId}/completion`

Get profile completion percentage and recommendations.

**Response:**
```json
{
  "success": true,
  "data": {
    "percentage": 87,
    "missingFields": ["phoneNumber", "portfolio"],
    "recommendations": [
      {
        "field": "phoneNumber",
        "importance": "high",
        "description": "Add phone number to increase recruiter contact"
      }
    ],
    "completionScore": 87
  }
}
```

### Profile Analytics
**GET** `/profile/{userId}/analytics?days=30`

Get profile view and engagement analytics.

**Query Parameters:**
- `days` (optional) - Number of days for analytics (1-365, default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "views": 45,
    "searches": 8,
    "contacts": 3,
    "period": 30,
    "viewHistory": [
      { "date": "2025-09-30", "count": 5 },
      { "date": "2025-10-01", "count": 8 }
    ]
  }
}
```

---

## CV Generation

### Get Available Templates
**GET** `/cv/templates`

List all available CV templates.

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "modern",
        "name": "Modern Professional",
        "description": "Clean, modern design perfect for tech roles",
        "category": "modern",
        "features": ["ATS-friendly", "customizable-colors", "skills-highlight"],
        "previewUrl": "/cv/templates/modern/preview",
        "suitableFor": ["technology", "finance", "consulting"]
      }
    ],
    "total": 4
  }
}
```

### Get Template Details
**GET** `/cv/templates/{templateId}`

Get detailed information about a specific template.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "modern",
    "name": "Modern Professional",
    "description": "Clean, modern design perfect for tech roles",
    "customizationOptions": {
      "colors": ["#2563eb", "#dc2626", "#059669", "#7c3aed"],
      "fonts": ["helvetica", "arial", "georgia", "times"],
      "layouts": ["single-column", "two-column"]
    },
    "sections": ["personal", "experience", "education", "skills", "portfolio"],
    "features": ["ATS-friendly", "customizable-colors", "skills-highlight"]
  }
}
```

### Generate CV
**POST** `/cv/generate`

Generate a new CV from profile data.

**Request Body:**
```json
{
  "templateId": "modern",
  "label": "Senior Engineer CV",
  "isDefault": false,
  "sections": {
    "includePersonalDetails": true,
    "includeWorkExperience": true,
    "includeEducation": true,
    "includeSkills": true,
    "includePortfolio": false,
    "customSections": [
      {
        "title": "Certifications",
        "content": "AWS Solutions Architect Professional (2023)",
        "order": 5
      }
    ]
  },
  "customizations": {
    "primaryColor": "#2563eb",
    "fontSize": "medium",
    "fontFamily": "helvetica",
    "spacing": "normal",
    "margins": {
      "top": 1.0,
      "right": 0.8,
      "bottom": 1.0,
      "left": 0.8
    }
  },
  "format": "pdf",
  "quality": "high"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cv-789",
    "userId": "user-456",
    "templateId": "modern",
    "label": "Senior Engineer CV",
    "fileName": "john-doe-cv-20251001.pdf",
    "filePath": "/generated/cv-789.pdf",
    "format": "pdf",
    "fileSize": 245760,
    "generatedAt": "2025-10-01T12:00:00.000Z",
    "downloadUrl": "/cv/cv-789/download"
  },
  "message": "CV generated successfully"
}
```

### Download CV
**GET** `/cv/{cvId}/download`

Download generated CV file.

**Parameters:**
- `cvId` (path) - CV ID to download

**Headers:**
- `Content-Type`: `application/pdf` | `text/html` | `image/png`
- `Content-Disposition`: `attachment; filename="john-doe-cv.pdf"`

### Regenerate CV
**POST** `/cv/{cvId}/regenerate`

Regenerate existing CV with new options.

**Request Body:** (partial generation options)
```json
{
  "templateId": "classic",
  "customizations": {
    "primaryColor": "#dc2626",
    "fontSize": "large"
  }
}
```

### CV Preview
**POST** `/cv/preview`

Generate CV preview without saving.

**Response:**
```json
{
  "success": true,
  "data": {
    "previewId": "preview-abc123",
    "previewUrl": "/cv/preview/preview-abc123",
    "templateId": "modern",
    "expiresAt": "2025-10-01T13:00:00.000Z"
  }
}
```

### List User CVs
**GET** `/cv/user/{userId}?page=1&limit=10`

Get paginated list of user's CVs.

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10, max: 50)
- `includeInactive` (optional) - Include deleted CVs (default: false)

**Response:**
```json
{
  "success": true,
  "data": {
    "cvs": [
      {
        "id": "cv-789",
        "templateId": "modern",
        "label": "Senior Engineer CV",
        "format": "pdf",
        "isDefault": true,
        "generatedAt": "2025-10-01T12:00:00.000Z",
        "fileSize": 245760
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 3,
      "hasMore": false
    }
  }
}
```

### Batch CV Generation
**POST** `/cv/batch-generate`

Generate multiple CVs with different templates.

**Request Body:**
```json
{
  "requests": [
    {
      "templateId": "modern",
      "label": "Tech Company CV",
      "format": "pdf"
    },
    {
      "templateId": "classic",
      "label": "Corporate CV",
      "format": "html"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "index": 0,
        "success": true,
        "data": { "id": "cv-001", "templateId": "modern" }
      },
      {
        "index": 1,
        "success": true,
        "data": { "id": "cv-002", "templateId": "classic" }
      }
    ],
    "errors": [],
    "successCount": 2,
    "errorCount": 0
  }
}
```

---

## Portfolio Management

### Create Portfolio Item
**POST** `/portfolio`

Create a new portfolio item.

**Request Body:**
```json
{
  "title": "E-commerce Platform Redesign",
  "description": "Complete redesign of e-commerce platform using React and Node.js",
  "type": "PROJECT",
  "technologies": ["React", "Node.js", "PostgreSQL", "Stripe API"],
  "projectDate": "2024-06-01",
  "role": "Lead Developer",
  "externalUrl": "https://github.com/johndoe/ecommerce-platform",
  "isPublic": true,
  "sortOrder": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "portfolio-123",
    "userId": "user-456",
    "title": "E-commerce Platform Redesign",
    "type": "PROJECT",
    "isPublic": true,
    "createdAt": "2025-10-01T12:00:00.000Z"
  },
  "message": "Portfolio item created successfully"
}
```

### Get User Portfolio
**GET** `/portfolio/user/{userId}?type=PROJECT&limit=20`

Get portfolio items for a user.

**Query Parameters:**
- `type` (optional) - Filter by type: PROJECT, ARTICLE, DESIGN, CODE, VIDEO, etc.
- `public` (optional) - Show only public items (default: false for owner, true for others)
- `limit` (optional) - Maximum items to return (default: 20, max: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "portfolio-123",
        "title": "E-commerce Platform Redesign",
        "description": "Complete redesign...",
        "type": "PROJECT",
        "technologies": ["React", "Node.js", "PostgreSQL"],
        "projectDate": "2024-06-01",
        "isPublic": true,
        "fileUrl": "/files/portfolio-123/screenshot.jpg"
      }
    ],
    "total": 5,
    "userId": "user-456"
  }
}
```

### Upload Portfolio File
**POST** `/portfolio/{itemId}/upload-file`

Upload file (image, document, etc.) for portfolio item.

**Request:** Multipart form data
- `file` - File to upload (max 50MB)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "portfolio-123",
    "fileUrl": "/files/portfolio-123/screenshot.jpg",
    "fileName": "screenshot.jpg",
    "fileSize": 2048576
  },
  "message": "File uploaded successfully"
}
```

### Import from GitHub
**POST** `/portfolio/import/github`

Import repositories from GitHub as portfolio items.

**Request Body:**
```json
{
  "githubUsername": "johndoe",
  "selectRepos": ["project-1", "project-2"],
  "makePrivate": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "importedItems": [
      {
        "id": "portfolio-124",
        "title": "project-1",
        "description": "React application for data visualization",
        "type": "PROJECT",
        "externalUrl": "https://github.com/johndoe/project-1"
      }
    ],
    "count": 2,
    "githubUsername": "johndoe"
  },
  "message": "Successfully imported 2 repositories from GitHub"
}
```

---

## Advanced Search

### Search Profiles
**POST** `/search/profiles`

Advanced profile search with filters and scoring.

**Request Body:**
```json
{
  "query": "React developer Dublin",
  "filters": {
    "location": "Dublin",
    "skills": ["React", "TypeScript"],
    "experienceLevel": "SENIOR",
    "industries": ["Technology"],
    "workType": "HYBRID",
    "salaryMin": 60000,
    "salaryMax": 100000,
    "availableFrom": "2025-01-01"
  },
  "sort": {
    "field": "relevance",
    "order": "desc"
  },
  "pagination": {
    "page": 1,
    "limit": 20
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "userId": "user-456",
        "fullName": "John Doe",
        "title": "Senior Software Engineer",
        "location": "Dublin, Ireland",
        "skills": ["React", "TypeScript", "Node.js"],
        "experienceLevel": "SENIOR",
        "relevanceScore": 0.95,
        "profileUrl": "/profile/user-456"
      }
    ],
    "total": 48,
    "pagination": {
      "page": 1,
      "limit": 20,
      "hasMore": true
    },
    "filters": { ... },
    "searchTime": 145
  }
}
```

### Search Suggestions
**GET** `/profile/search/suggestions?type=skills&query=React&limit=10`

Get search suggestions for autocomplete.

**Query Parameters:**
- `type` - Suggestion type: skills, locations, companies, industries
- `query` - Search query (min 2 characters)
- `limit` - Maximum suggestions (default: 10, max: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      "React",
      "React Native",
      "React Router",
      "Redux"
    ],
    "type": "skills",
    "query": "React"
  }
}
```

---

## Privacy & GDPR

### Get Privacy Settings
**GET** `/profile/{userId}/privacy`

Get user's privacy settings.

**Response:**
```json
{
  "success": true,
  "data": {
    "privacyLevel": "SEMI_PRIVATE",
    "profileVisibility": {
      "fullName": true,
      "email": false,
      "phoneNumber": false,
      "location": true,
      "workExperience": true,
      "education": true,
      "skills": true,
      "portfolio": true
    },
    "searchableByRecruiters": true,
    "allowDirectContact": true,
    "showSalaryExpectations": false,
    "dataRetentionDays": 1095,
    "allowAnalytics": true
  }
}
```

### Update Privacy Settings
**PUT** `/profile/{userId}/privacy`

Update privacy and visibility settings.

**Request Body:**
```json
{
  "privacyLevel": "PUBLIC",
  "profileVisibility": {
    "fullName": true,
    "email": false,
    "phoneNumber": false,
    "location": true,
    "workExperience": true,
    "education": true,
    "skills": true,
    "portfolio": true
  },
  "searchableByRecruiters": true,
  "allowDirectContact": true,
  "showSalaryExpectations": false
}
```

### Export User Data
**POST** `/profile/{userId}/export`

Export all user data for GDPR compliance.

**Request Body:**
```json
{
  "format": "json",
  "includeAnalytics": true,
  "includePrivateData": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": { ... },
    "workExperience": [ ... ],
    "education": [ ... ],
    "portfolio": [ ... ],
    "cvs": [ ... ],
    "analytics": { ... },
    "exportedAt": "2025-10-01T12:00:00.000Z"
  },
  "message": "Data export completed successfully"
}
```

---

## Work Experience

### Add Work Experience
**POST** `/experience`

Add work experience entry.

**Request Body:**
```json
{
  "company": "Tech Solutions Ltd",
  "position": "Senior Software Engineer",
  "startDate": "2022-03-01",
  "endDate": null,
  "current": true,
  "location": "Dublin, Ireland",
  "description": "Led development of React-based customer portal",
  "achievements": [
    "Improved performance by 40%",
    "Mentored 3 junior developers"
  ],
  "technologies": ["React", "Node.js", "PostgreSQL"]
}
```

### Get Work Experience
**GET** `/experience?userId={userId}`

Get work experience for user.

### Update Work Experience
**PUT** `/experience/{experienceId}`

Update existing work experience.

### Delete Work Experience
**DELETE** `/experience/{experienceId}`

Delete work experience entry.

---

## Education

### Add Education
**POST** `/education`

Add education record.

**Request Body:**
```json
{
  "institution": "Trinity College Dublin",
  "degree": "Bachelor of Computer Science",
  "fieldOfStudy": "Software Engineering",
  "startDate": "2015-09-01",
  "endDate": "2019-06-01",
  "grade": "First Class Honours",
  "description": "Specialized in algorithms and software design"
}
```

### Get Education
**GET** `/education?userId={userId}`

Get education records for user.

### Update Education
**PUT** `/education/{educationId}`

Update existing education record.

### Delete Education
**DELETE** `/education/{educationId}`

Delete education record.

---

## File Management

### Upload CV Document
**POST** `/files/cv/upload`

Upload CV document file.

**Request:** Multipart form data
- `file` - CV file (PDF, DOC, DOCX, TXT, max 10MB)

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "file-123",
    "originalName": "john-doe-cv.pdf",
    "fileName": "cv-uuid-123.pdf",
    "fileSize": 1048576,
    "uploadedAt": "2025-10-01T12:00:00.000Z",
    "downloadUrl": "/files/file-123/download"
  },
  "message": "CV uploaded successfully"
}
```

### List User Files
**GET** `/files/user/{userId}?type=cv&page=1&limit=10`

Get paginated list of user's uploaded files.

**Query Parameters:**
- `type` - File type: cv, portfolio, avatar
- `page` - Page number
- `limit` - Items per page

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTHENTICATION_REQUIRED` | 401 | Valid authentication token required |
| `AUTHORIZATION_DENIED` | 403 | Insufficient permissions for action |
| `VALIDATION_ERROR` | 400 | Request data validation failed |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource does not exist |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests, retry later |
| `FILE_TOO_LARGE` | 413 | Uploaded file exceeds size limit |
| `UNSUPPORTED_FORMAT` | 415 | File format not supported |
| `PROFILE_NOT_FOUND` | 404 | User profile does not exist |
| `CV_GENERATION_FAILED` | 500 | CV generation process failed |
| `PRIVACY_VIOLATION` | 403 | Action violates privacy settings |

---

## Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| General API | 1000 requests | 1 hour |
| CV Generation | 20 requests | 1 hour |
| File Upload | 50 uploads | 1 hour |
| Search | 200 requests | 1 hour |
| Export Data | 5 requests | 1 day |

Rate limit headers:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Timestamp when limit resets

---

## SDKs and Libraries

### JavaScript/TypeScript
```bash
npm install @openrole/api-client
```

```javascript
import { OpenRoleAPI } from '@openrole/api-client';

const api = new OpenRoleAPI({
  baseURL: 'https://api.openrole.net',
  apiKey: 'your-jwt-token'
});

// Generate CV
const cv = await api.cv.generate({
  templateId: 'modern',
  label: 'My Professional CV',
  format: 'pdf'
});
```

### Python
```bash
pip install openrole-api
```

```python
from openrole import OpenRoleAPI

api = OpenRoleAPI(
    base_url='https://api.openrole.net',
    api_key='your-jwt-token'
)

# Create profile
profile = api.profiles.create({
    'fullName': 'John Doe',
    'title': 'Software Engineer',
    'skills': ['Python', 'React']
})
```

---

## Webhooks

Configure webhooks to receive real-time notifications about profile and CV events.

**Webhook Events:**
- `profile.created`
- `profile.updated`
- `cv.generated`
- `portfolio.created`
- `privacy.updated`

**Webhook Payload:**
```json
{
  "event": "cv.generated",
  "timestamp": "2025-10-01T12:00:00.000Z",
  "data": {
    "cvId": "cv-789",
    "userId": "user-456",
    "templateId": "modern",
    "format": "pdf"
  }
}
```

---

## Support

- **Documentation**: https://docs.openrole.net
- **API Status**: https://status.openrole.net
- **Support Email**: support@openrole.net
- **GitHub Issues**: https://github.com/aspora-io/openrole/issues

**Last Updated:** October 1, 2025  
**API Version:** 1.0.0