# CV Validation Schemas Usage Guide

This document provides examples of how to use the CV validation schemas in your OpenRole applications.

## Installation & Import

```typescript
import { cvSchemas, validateCVData, validateCVFile } from '@openrole/validation';
// or
import { cvUploadRequestSchema, cvGenerationRequestSchema } from '@openrole/validation/cv';
```

## CV Upload Validation

### File Upload with Validation

```typescript
// Frontend file validation
const handleFileUpload = (file: File) => {
  const fileValidation = validateCVFile(file);
  
  if (!fileValidation.isValid) {
    console.error('File validation errors:', fileValidation.errors);
    return;
  }
  
  // File is valid, proceed with upload
  const formData = new FormData();
  formData.append('file', file);
  formData.append('label', 'Software Engineer CV');
  formData.append('isDefault', 'false');
  
  // Validate form data
  const validation = cvSchemas.cvUploadFormData.safeParse({
    label: 'Software Engineer CV',
    isDefault: 'false'
  });
  
  if (validation.success) {
    // Submit to API
    submitCVUpload(formData);
  }
};
```

### Backend Upload Validation

```typescript
// API endpoint validation
app.post('/cv', upload.single('file'), (req, res) => {
  const { file } = req;
  const { label, isDefault } = req.body;
  
  // Validate file
  const fileValidation = validateCVFile(file);
  if (!fileValidation.isValid) {
    return res.status(400).json({
      error: 'File validation failed',
      details: fileValidation.errors
    });
  }
  
  // Validate form data
  const dataValidation = validateCVData(cvSchemas.cvUploadFormData, {
    label,
    isDefault
  });
  
  if (!dataValidation.success) {
    return res.status(422).json({
      error: 'Validation failed',
      details: dataValidation.errors
    });
  }
  
  // Process upload...
});
```

## CV Generation Validation

```typescript
const generateCV = async (generationRequest: any) => {
  // Validate generation request
  const validation = validateCVData(cvSchemas.cvGeneration, generationRequest);
  
  if (!validation.success) {
    throw new Error(`Invalid generation request: ${validation.errors?.map(e => e.message).join(', ')}`);
  }
  
  const { templateId, label, sections, customizations } = validation.data;
  
  // Additional business logic validation
  const businessValidation = validateCVGenerationLogic(validation.data);
  if (!businessValidation.isValid) {
    throw new Error(`Business rule validation failed: ${businessValidation.errors.join(', ')}`);
  }
  
  // Proceed with generation...
};

// Example usage
const request = {
  templateId: '550e8400-e29b-41d4-a716-446655440000',
  label: 'Generated Software Engineer CV',
  sections: {
    includePersonalDetails: true,
    includeWorkExperience: true,
    includeEducation: true,
    includeSkills: true,
    includePortfolio: false
  },
  customizations: {
    primaryColor: '#2563eb',
    fontSize: 'medium',
    showPhoto: false
  }
};

generateCV(request);
```

## Portfolio Item Validation

### Creating Portfolio Items

```typescript
const createPortfolioItem = async (portfolioData: any) => {
  // Validate basic structure
  const validation = validateCVData(cvSchemas.portfolioCreateFormData, portfolioData);
  
  if (!validation.success) {
    throw new Error(`Portfolio validation failed: ${validation.errors?.map(e => e.message).join(', ')}`);
  }
  
  const { type, externalUrl } = validation.data;
  
  // Type-specific validation
  const typeValidation = validatePortfolioTypeSpecific(type, validation.data);
  if (!typeValidation.isValid) {
    throw new Error(`Portfolio type validation failed: ${typeValidation.errors.join(', ')}`);
  }
  
  // URL accessibility validation (if external URL provided)
  if (externalUrl) {
    const urlValidation = await validateExternalUrlAccessibility(externalUrl);
    if (!urlValidation.isAccessible) {
      console.warn(`External URL is not accessible: ${urlValidation.status}`);
    }
  }
  
  // Create portfolio item...
};
```

### Portfolio Link Validation

```typescript
const validatePortfolioLink = async (url: string) => {
  // Basic URL validation
  const urlValidation = cvSchemas.externalUrl.safeParse(url);
  if (!urlValidation.success) {
    return { valid: false, error: 'Invalid URL format' };
  }
  
  // Accessibility check
  const accessibilityCheck = await validateExternalUrlAccessibility(url);
  
  return {
    valid: accessibilityCheck.isAccessible,
    status: accessibilityCheck.status,
    statusCode: accessibilityCheck.statusCode
  };
};
```

## File Validation Helpers

```typescript
// CV file validation
const handleCVFileSelect = (files: FileList) => {
  const file = files[0];
  
  if (!file) return;
  
  const validation = validateCVFile(file);
  
  if (!validation.isValid) {
    // Show validation errors to user
    setErrors(validation.errors);
    return;
  }
  
  // File is valid
  setSelectedFile(file);
  setErrors([]);
};

// Portfolio file validation
const handlePortfolioFileSelect = (files: FileList) => {
  const file = files[0];
  
  if (!file) return;
  
  const validation = validatePortfolioFile(file);
  
  if (!validation.isValid) {
    setErrors(validation.errors);
    return;
  }
  
  setSelectedFile(file);
  setErrors([]);
};
```

## Access Token Validation

```typescript
const generateAccessToken = (cvId: string, expiresInHours?: number) => {
  // Validate request
  const validation = validateCVData(cvSchemas.accessToken, {
    expiresInHours: expiresInHours || 24
  });
  
  if (!validation.success) {
    throw new Error(`Invalid access token request: ${validation.errors?.map(e => e.message).join(', ')}`);
  }
  
  // Generate token with validated expiration time
  const { expiresInHours: validatedHours } = validation.data;
  return createAccessToken(cvId, validatedHours);
};
```

## Error Handling

```typescript
const handleValidationError = (error: any) => {
  if (error.errors) {
    // Zod validation error
    const formattedErrors = error.errors.map((e: any) => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code
    }));
    
    return {
      type: 'validation',
      errors: formattedErrors
    };
  }
  
  return {
    type: 'unknown',
    message: error.message
  };
};
```

## Type Safety

```typescript
import type { 
  CVGenerationRequest, 
  PortfolioItemCreateFormData,
  CVUploadFormData 
} from '@openrole/validation';

// Use types for type safety
const processGenerationRequest = (request: CVGenerationRequest) => {
  // TypeScript will enforce the correct structure
  const { templateId, label, sections, customizations } = request;
  // ...
};
```

This comprehensive validation system ensures data integrity, security, and user experience across all CV and portfolio management features.