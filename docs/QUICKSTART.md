# OpenRole.net CV & Profile Tools - Quick Start Guide

Get up and running with the OpenRole.net CV & Profile Tools in minutes. This guide covers profile creation, CV generation, and portfolio management.

## Table of Contents

1. [Authentication Setup](#authentication-setup)
2. [Creating Your First Profile](#creating-your-first-profile)
3. [Generating Your First CV](#generating-your-first-cv)
4. [Building Your Portfolio](#building-your-portfolio)
5. [Privacy & Search Settings](#privacy--search-settings)
6. [API Integration](#api-integration)
7. [Testing & Validation](#testing--validation)

---

## Authentication Setup

### 1. Get Your API Token

First, obtain your JWT authentication token:

```bash
# Register/Login to get your token
curl -X POST https://api.openrole.net/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your.email@example.com",
    "password": "your-password"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-123",
      "email": "your.email@example.com",
      "role": "CANDIDATE"
    }
  }
}
```

### 2. Set Environment Variables

```bash
export OPENROLE_API_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export OPENROLE_API_URL="https://api.openrole.net/api/v1"
```

---

## Creating Your First Profile

### 1. Basic Profile Creation

Create a comprehensive professional profile:

```bash
curl -X POST $OPENROLE_API_URL/profile \
  -H "Authorization: Bearer $OPENROLE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Sarah Chen",
    "email": "sarah.chen@example.com",
    "phoneNumber": "+353851234567",
    "location": "Dublin, Ireland",
    "title": "Senior Full Stack Developer",
    "summary": "Experienced developer with 5+ years in React, Node.js, and cloud technologies. Passionate about building scalable applications that solve real-world problems.",
    "skills": [
      "JavaScript",
      "TypeScript", 
      "React",
      "Node.js",
      "PostgreSQL",
      "AWS",
      "Docker"
    ],
    "industries": ["Technology", "Fintech", "Healthcare"],
    "salaryMin": 75000,
    "salaryMax": 95000,
    "salaryCurrency": "EUR",
    "workType": "HYBRID",
    "experienceLevel": "SENIOR",
    "availabilityDate": "2025-01-15"
  }'
```

### 2. Add Work Experience

```bash
curl -X POST $OPENROLE_API_URL/experience \
  -H "Authorization: Bearer $OPENROLE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Stripe",
    "position": "Senior Software Engineer",
    "startDate": "2022-01-01",
    "endDate": null,
    "current": true,
    "location": "Dublin, Ireland",
    "description": "Lead development of payment processing infrastructure serving millions of transactions daily",
    "achievements": [
      "Improved payment success rate by 15%",
      "Led team of 5 engineers",
      "Architected microservices handling 1M+ transactions daily"
    ],
    "technologies": ["React", "Node.js", "PostgreSQL", "Kubernetes", "AWS"]
  }'
```

### 3. Add Education

```bash
curl -X POST $OPENROLE_API_URL/education \
  -H "Authorization: Bearer $OPENROLE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "institution": "Trinity College Dublin",
    "degree": "Master of Computer Science",
    "fieldOfStudy": "Artificial Intelligence",
    "startDate": "2016-09-01",
    "endDate": "2018-06-01",
    "grade": "First Class Honours",
    "description": "Specialized in machine learning and distributed systems"
  }'
```

### 4. Check Profile Completion

```bash
curl -X GET $OPENROLE_API_URL/profile/user-123/completion \
  -H "Authorization: Bearer $OPENROLE_API_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "percentage": 95,
    "missingFields": ["portfolio"],
    "recommendations": [
      {
        "field": "portfolio",
        "importance": "medium",
        "description": "Add portfolio items to showcase your work"
      }
    ]
  }
}
```

---

## Generating Your First CV

### 1. Explore Available Templates

```bash
curl -X GET $OPENROLE_API_URL/cv/templates \
  -H "Authorization: Bearer $OPENROLE_API_TOKEN"
```

### 2. Preview a Template

```bash
curl -X POST $OPENROLE_API_URL/cv/templates/modern/preview \
  -H "Authorization: Bearer $OPENROLE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "useSampleData": false,
    "useUserData": true
  }'
```

### 3. Generate Your CV

```bash
curl -X POST $OPENROLE_API_URL/cv/generate \
  -H "Authorization: Bearer $OPENROLE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "modern",
    "label": "Senior Developer CV - Dublin Tech",
    "isDefault": true,
    "sections": {
      "includePersonalDetails": true,
      "includeWorkExperience": true,
      "includeEducation": true,
      "includeSkills": true,
      "includePortfolio": false,
      "customSections": [
        {
          "title": "Certifications",
          "content": "AWS Solutions Architect Professional (2023)\nKubernetes Administrator (2022)",
          "order": 5
        }
      ]
    },
    "customizations": {
      "primaryColor": "#0066cc",
      "fontSize": "medium",
      "fontFamily": "helvetica",
      "spacing": "normal"
    },
    "format": "pdf",
    "quality": "high"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cv-abc123",
    "templateId": "modern",
    "label": "Senior Developer CV - Dublin Tech",
    "fileName": "sarah-chen-cv-20251001.pdf",
    "format": "pdf",
    "fileSize": 245760,
    "downloadUrl": "/cv/cv-abc123/download",
    "generatedAt": "2025-10-01T12:00:00.000Z"
  }
}
```

### 4. Download Your CV

```bash
curl -X GET $OPENROLE_API_URL/cv/cv-abc123/download \
  -H "Authorization: Bearer $OPENROLE_API_TOKEN" \
  -o "my-cv.pdf"
```

### 5. Generate Multiple Formats

```bash
# Generate HTML version for web sharing
curl -X POST $OPENROLE_API_URL/cv/generate \
  -H "Authorization: Bearer $OPENROLE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "modern",
    "label": "Web Portfolio CV",
    "sections": {
      "includePersonalDetails": true,
      "includeWorkExperience": true,
      "includeEducation": true,
      "includeSkills": true,
      "includePortfolio": true
    },
    "format": "html",
    "quality": "high"
  }'
```

---

## Building Your Portfolio

### 1. Create Portfolio Items

```bash
# Add a project
curl -X POST $OPENROLE_API_URL/portfolio \
  -H "Authorization: Bearer $OPENROLE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Real-time Analytics Dashboard",
    "description": "React-based dashboard for monitoring payment metrics with D3.js visualizations and real-time data streaming",
    "type": "PROJECT",
    "technologies": ["React", "D3.js", "Node.js", "PostgreSQL", "WebSockets"],
    "projectDate": "2024-03-01",
    "role": "Lead Developer",
    "externalUrl": "https://github.com/sarahchen/analytics-dashboard",
    "isPublic": true,
    "sortOrder": 1
  }'

# Add an article
curl -X POST $OPENROLE_API_URL/portfolio \
  -H "Authorization: Bearer $OPENROLE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Microservices Architecture Best Practices",
    "description": "Technical article covering microservices implementation patterns, service discovery, and deployment strategies",
    "type": "ARTICLE",
    "projectDate": "2024-01-15",
    "externalUrl": "https://medium.com/@sarahchen/microservices-guide",
    "isPublic": true,
    "sortOrder": 2
  }'
```

### 2. Upload Portfolio Files

```bash
# Upload a screenshot for your project
curl -X POST $OPENROLE_API_URL/portfolio/portfolio-123/upload-file \
  -H "Authorization: Bearer $OPENROLE_API_TOKEN" \
  -F "file=@dashboard-screenshot.jpg"
```

### 3. Import from GitHub

```bash
curl -X POST $OPENROLE_API_URL/portfolio/import/github \
  -H "Authorization: Bearer $OPENROLE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "githubUsername": "sarahchen",
    "selectRepos": ["analytics-dashboard", "payment-processor", "user-service"],
    "makePrivate": false
  }'
```

### 4. View Your Portfolio

```bash
curl -X GET $OPENROLE_API_URL/portfolio/user/user-123 \
  -H "Authorization: Bearer $OPENROLE_API_TOKEN"
```

---

## Privacy & Search Settings

### 1. Configure Privacy Settings

```bash
curl -X PUT $OPENROLE_API_URL/profile/user-123/privacy \
  -H "Authorization: Bearer $OPENROLE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
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
    "showSalaryExpectations": false
  }'
```

### 2. Test Search Visibility

```bash
# Search to see if your profile appears
curl -X POST $OPENROLE_API_URL/search/profiles \
  -H "Content-Type: application/json" \
  -d '{
    "query": "React developer Dublin",
    "filters": {
      "location": "Dublin",
      "skills": ["React"],
      "experienceLevel": "SENIOR"
    }
  }'
```

---

## API Integration

### 1. JavaScript/Node.js Integration

```javascript
// npm install axios
const axios = require('axios');

class OpenRoleClient {
  constructor(token) {
    this.api = axios.create({
      baseURL: 'https://api.openrole.net/api/v1',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async createProfile(profileData) {
    const response = await this.api.post('/profile', profileData);
    return response.data;
  }

  async generateCV(cvOptions) {
    const response = await this.api.post('/cv/generate', cvOptions);
    return response.data;
  }

  async downloadCV(cvId) {
    const response = await this.api.get(`/cv/${cvId}/download`, {
      responseType: 'stream'
    });
    return response.data;
  }
}

// Usage
const client = new OpenRoleClient(process.env.OPENROLE_API_TOKEN);

async function main() {
  // Create profile
  const profile = await client.createProfile({
    fullName: 'Jane Developer',
    title: 'Software Engineer',
    skills: ['React', 'Python']
  });

  // Generate CV
  const cv = await client.generateCV({
    templateId: 'modern',
    label: 'My Professional CV',
    format: 'pdf'
  });

  console.log('CV generated:', cv.data.downloadUrl);
}

main().catch(console.error);
```

### 2. Python Integration

```python
import requests
import os

class OpenRoleClient:
    def __init__(self, token):
        self.base_url = 'https://api.openrole.net/api/v1'
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def create_profile(self, profile_data):
        response = requests.post(
            f'{self.base_url}/profile',
            json=profile_data,
            headers=self.headers
        )
        return response.json()

    def generate_cv(self, cv_options):
        response = requests.post(
            f'{self.base_url}/cv/generate',
            json=cv_options,
            headers=self.headers
        )
        return response.json()

    def download_cv(self, cv_id, filename):
        response = requests.get(
            f'{self.base_url}/cv/{cv_id}/download',
            headers=self.headers
        )
        with open(filename, 'wb') as f:
            f.write(response.content)

# Usage
client = OpenRoleClient(os.getenv('OPENROLE_API_TOKEN'))

# Create profile
profile = client.create_profile({
    'fullName': 'Alex Python',
    'title': 'Backend Developer',
    'skills': ['Python', 'Django', 'PostgreSQL']
})

# Generate CV
cv = client.generate_cv({
    'templateId': 'classic',
    'label': 'Backend Developer CV',
    'format': 'pdf'
})

# Download CV
client.download_cv(cv['data']['id'], 'my-cv.pdf')
print(f"CV downloaded: my-cv.pdf")
```

---

## Testing & Validation

### 1. Test Profile Creation Flow

```bash
#!/bin/bash
# test-profile-flow.sh

echo "🧪 Testing OpenRole CV & Profile Tools..."

# Test 1: Create Profile
echo "1. Creating profile..."
PROFILE_RESPONSE=$(curl -s -X POST $OPENROLE_API_URL/profile \
  -H "Authorization: Bearer $OPENROLE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "title": "Software Engineer",
    "skills": ["JavaScript", "React"]
  }')

if echo $PROFILE_RESPONSE | grep -q '"success":true'; then
  echo "✅ Profile created successfully"
else
  echo "❌ Profile creation failed"
  exit 1
fi

# Test 2: Generate CV
echo "2. Generating CV..."
CV_RESPONSE=$(curl -s -X POST $OPENROLE_API_URL/cv/generate \
  -H "Authorization: Bearer $OPENROLE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "modern",
    "label": "Test CV",
    "format": "pdf"
  }')

if echo $CV_RESPONSE | grep -q '"success":true'; then
  echo "✅ CV generated successfully"
  CV_ID=$(echo $CV_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
  echo "   CV ID: $CV_ID"
else
  echo "❌ CV generation failed"
  exit 1
fi

# Test 3: Download CV
echo "3. Downloading CV..."
curl -s -X GET $OPENROLE_API_URL/cv/$CV_ID/download \
  -H "Authorization: Bearer $OPENROLE_API_TOKEN" \
  -o test-cv.pdf

if [ -f test-cv.pdf ] && [ -s test-cv.pdf ]; then
  echo "✅ CV downloaded successfully ($(stat -c%s test-cv.pdf) bytes)"
  rm test-cv.pdf
else
  echo "❌ CV download failed"
  exit 1
fi

echo "🎉 All tests passed!"
```

### 2. Performance Testing

```bash
#!/bin/bash
# performance-test.sh

echo "⚡ Performance Testing..."

# Test CV generation speed
start_time=$(date +%s%N)
curl -s -X POST $OPENROLE_API_URL/cv/generate \
  -H "Authorization: Bearer $OPENROLE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "modern",
    "label": "Performance Test CV",
    "format": "pdf"
  }' > /dev/null

end_time=$(date +%s%N)
duration_ms=$(( (end_time - start_time) / 1000000 ))

echo "CV Generation Time: ${duration_ms}ms"

if [ $duration_ms -lt 5000 ]; then
  echo "✅ Performance: Excellent (< 5s)"
elif [ $duration_ms -lt 10000 ]; then
  echo "⚠️  Performance: Good (< 10s)"
else
  echo "❌ Performance: Slow (> 10s)"
fi
```

---

## Common Use Cases

### 1. Job Application Workflow

```javascript
// Complete job application workflow
async function applyForJob(jobId) {
  const client = new OpenRoleClient(process.env.OPENROLE_API_TOKEN);
  
  // 1. Generate targeted CV
  const cv = await client.generateCV({
    templateId: 'professional',
    label: `Application for ${jobId}`,
    sections: {
      includePersonalDetails: true,
      includeWorkExperience: true,
      includeEducation: true,
      includeSkills: true
    },
    format: 'pdf'
  });
  
  // 2. Get portfolio items
  const portfolio = await client.getPortfolio();
  
  // 3. Submit application (external job board API)
  const application = await submitJobApplication({
    jobId,
    cvUrl: cv.data.downloadUrl,
    portfolioItems: portfolio.data.items.slice(0, 3)
  });
  
  return application;
}
```

### 2. Portfolio Website Integration

```javascript
// Embed portfolio in your personal website
async function getPublicPortfolio(userId) {
  const response = await fetch(
    `https://api.openrole.net/api/v1/portfolio/user/${userId}?public=true`
  );
  const portfolio = await response.json();
  
  return portfolio.data.items.map(item => ({
    title: item.title,
    description: item.description,
    technologies: item.technologies,
    url: item.externalUrl,
    image: item.fileUrl
  }));
}

// React component
function PortfolioSection({ userId }) {
  const [portfolio, setPortfolio] = useState([]);
  
  useEffect(() => {
    getPublicPortfolio(userId).then(setPortfolio);
  }, [userId]);
  
  return (
    <div className="portfolio">
      {portfolio.map(item => (
        <div key={item.id} className="portfolio-item">
          <h3>{item.title}</h3>
          <p>{item.description}</p>
          <div className="technologies">
            {item.technologies.map(tech => (
              <span key={tech} className="tech-tag">{tech}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 3. CV Customization for Different Markets

```bash
# Generate different CV versions for different markets
generate_market_cv() {
  local market=$1
  local template=$2
  local color=$3
  
  curl -X POST $OPENROLE_API_URL/cv/generate \
    -H "Authorization: Bearer $OPENROLE_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"templateId\": \"$template\",
      \"label\": \"CV for $market Market\",
      \"customizations\": {
        \"primaryColor\": \"$color\",
        \"fontSize\": \"medium\"
      },
      \"format\": \"pdf\"
    }"
}

# Generate for different markets
generate_market_cv "Tech Startups" "creative" "#8b5cf6"
generate_market_cv "Corporate Finance" "classic" "#1e40af"
generate_market_cv "Design Agencies" "modern" "#dc2626"
```

---

## Troubleshooting

### Common Issues

1. **Authentication Errors (401)**
   ```bash
   # Check token validity
   curl -X GET $OPENROLE_API_URL/profile/me \
     -H "Authorization: Bearer $OPENROLE_API_TOKEN"
   ```

2. **Rate Limiting (429)**
   ```bash
   # Check rate limit status
   curl -I -X GET $OPENROLE_API_URL/profile/me \
     -H "Authorization: Bearer $OPENROLE_API_TOKEN"
   
   # Look for these headers:
   # X-RateLimit-Remaining: 995
   # X-RateLimit-Reset: 1696176000
   ```

3. **CV Generation Fails**
   ```bash
   # Validate generation options first
   curl -X POST $OPENROLE_API_URL/cv/validate-generation \
     -H "Authorization: Bearer $OPENROLE_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{ "templateId": "modern", "format": "pdf" }'
   ```

4. **File Upload Issues**
   ```bash
   # Check file size and type
   ls -lh my-cv.pdf
   file my-cv.pdf
   
   # Ensure file is under limits:
   # CV files: 10MB max
   # Portfolio files: 50MB max
   # Avatar images: 5MB max
   ```

### Getting Help

- **API Documentation**: https://docs.openrole.net/api
- **Status Page**: https://status.openrole.net
- **Support Email**: support@openrole.net
- **GitHub Issues**: https://github.com/aspora-io/openrole/issues

---

## Next Steps

1. **Explore Advanced Features**
   - ATS optimization
   - Batch CV generation
   - Portfolio analytics
   - GDPR data export

2. **Integrate with Your Application**
   - Use webhooks for real-time updates
   - Implement caching for performance
   - Add error handling and retries

3. **Optimize for Your Use Case**
   - Customize templates
   - Implement search filters
   - Add privacy controls

**Happy building with OpenRole.net CV & Profile Tools! 🚀**