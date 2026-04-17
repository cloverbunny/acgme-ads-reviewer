# API Documentation

Complete reference for the ACGME ADS Reviewer API endpoints.

## Base URL

```
http://localhost:3000/api
```

## Authentication

The API supports multiple authentication methods:

### API Key Authentication

Pass your API key in the header:

```bash
curl -H "X-API-Key: your-api-key" http://localhost:3000/api/analyze
```

Generate an API key:

```bash
npm run generate-api-key
```

## Analysis Endpoints

### POST /api/analyze

Analyze HTML and PDF documents for ACGME compliance issues.

**Request:**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -F "html=@submission.html" \
  -F "pdf=@requirements.pdf" \
  -H "X-API-Key: your-api-key"
```

**Request Body (multipart/form-data):**
- `html` (required): HTML file with ADS submission
- `pdf` (required): PDF file with program requirements
- `azureKey` (optional): Azure API key for enhanced analysis
- `azureEndpoint` (optional): Azure endpoint URL

**Response (200):**
```json
{
  "success": true,
  "data": {
    "duplicateCertifications": [
      {
        "severity": "critical",
        "title": "Duplicate Physician Entry",
        "content": "Dr. Jane Smith, MD appears 2 times...",
        "location": "Tables: 1, 2",
        "resolution": "Verify faculty roster and consolidate duplicate entries"
      }
    ],
    "ftePairing": [
      {
        "severity": "success",
        "title": "FTE Information Present in Both Documents",
        "content": "Program requirements specify FTE requirements...",
        "resolution": "Manual verification: Compare specific FTE allocations"
      }
    ],
    "scholarlyActivity": [
      {
        "severity": "warning",
        "title": "Potentially Outdated Scholarly Activity",
        "content": "Found references to activities from years: 2019, 2020...",
        "resolution": "Review and update scholarly activity references"
      }
    ],
    "summary": {
      "issuesFound": 2,
      "criticalCount": 1,
      "warningCount": 1,
      "passCount": 1,
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  },
  "metadata": {
    "htmlFileSize": 45000,
    "pdfFileSize": 120000,
    "processedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Both HTML and PDF files are required"
}
```

### POST /api/analyze/validate

Validate files without running full analysis.

**Request:**
```bash
curl -X POST http://localhost:3000/api/analyze/validate \
  -F "html=@submission.html" \
  -F "pdf=@requirements.pdf"
```

**Response (200):**
```json
{
  "success": true,
  "validation": {
    "html": {
      "valid": true,
      "size": 45000,
      "name": "submission.html",
      "hasTableContent": true
    },
    "pdf": {
      "valid": true,
      "size": 120000,
      "name": "requirements.pdf"
    }
  }
}
```

### POST /api/analyze/sample

Get sample analysis results for testing and UI preview.

**Request:**
```bash
curl -X POST http://localhost:3000/api/analyze/sample
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "duplicateCertifications": [...],
    "ftePairing": [...],
    "scholarlyActivity": [...],
    "summary": {...}
  }
}
```

## Results Storage Endpoints

### POST /api/results/save

Save analysis results with submission metadata.

**Request:**
```bash
curl -X POST http://localhost:3000/api/results/save \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "programName": "Internal Medicine",
    "submissionYear": 2024,
    "submitterEmail": "coordinator@hospital.edu",
    "htmlFilename": "submission.html",
    "pdfFilename": "requirements.pdf",
    "analysisData": {...}
  }'
```

**Response (200):**
```json
{
  "success": true,
  "submissionId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Analysis results saved successfully"
}
```

### GET /api/results/:submissionId

Retrieve saved analysis results.

**Request:**
```bash
curl http://localhost:3000/api/results/550e8400-e29b-41d4-a716-446655440000 \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "success": true,
  "submission": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "programName": "Internal Medicine",
    "submissionYear": 2024,
    "submitterEmail": "coordinator@hospital.edu"
  },
  "results": [...],
  "summary": {
    "critical": 1,
    "warning": 1,
    "success": 1
  }
}
```

### GET /api/results

List all submissions with optional filters.

**Request:**
```bash
curl "http://localhost:3000/api/results?program=Internal%20Medicine&year=2024&limit=10" \
  -H "X-API-Key: your-api-key"
```

**Query Parameters:**
- `program` (optional): Filter by program name
- `year` (optional): Filter by submission year
- `limit` (optional): Maximum results to return (default: 50)

**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "submissions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "programName": "Internal Medicine",
      "submissionYear": 2024
    }
  ]
}
```

### POST /api/results/:submissionId/review

Mark findings as reviewed.

**Request:**
```bash
curl -X POST http://localhost:3000/api/results/550e8400-e29b-41d4-a716-446655440000/review \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "findingId": "finding-123",
    "reviewed": true,
    "notes": "Addressed in updated submission",
    "reviewerId": "reviewer@hospital.edu"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "message": "Finding marked as reviewed"
}
```

### DELETE /api/results/:submissionId

Delete a submission and all associated results.

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/results/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "userId": "admin@hospital.edu"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "message": "Submission deleted"
}
```

## Azure Endpoints

### POST /api/azure/validate

Validate Azure credentials.

**Request:**
```bash
curl -X POST http://localhost:3000/api/azure/validate \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your-azure-key",
    "endpoint": "https://your-resource.openai.azure.com/"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "validation": {
    "valid": true,
    "message": "Azure credentials are valid"
  }
}
```

### GET /api/azure/status

Get Azure configuration status.

**Request:**
```bash
curl http://localhost:3000/api/azure/status
```

**Response (200):**
```json
{
  "status": {
    "azureConfigured": true,
    "docIntelligenceConfigured": false,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## Health Check

### GET /api/health

Check server health status.

**Request:**
```bash
curl http://localhost:3000/api/health
```

**Response (200):**
```json
{
  "status": "ok",
  "environment": "development",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Error Responses

All endpoints use consistent error response format:

### 400 Bad Request
```json
{
  "error": "Description of what went wrong"
}
```

### 401 Unauthorized
```json
{
  "error": "API key required"
}
```

### 403 Forbidden
```json
{
  "error": "Invalid API key"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests",
  "retryAfter": 30
}
```

### 500 Internal Server Error
```json
{
  "error": "An error occurred processing your request"
}
```

## Rate Limiting

All API endpoints are rate limited to prevent abuse:

- **Limit**: 100 requests per 15 minutes per IP address
- **Header**: `Retry-After` indicates seconds to wait before retrying

## Content Types

- **Requests**: `application/json`, `multipart/form-data`
- **Responses**: `application/json`

## CORS

CORS is enabled for configured origins. Configure in `.env.local`:

```
CORS_ORIGIN=https://your-domain.com
```

## Webhooks (Future)

Coming soon: Webhook notifications for completed analyses

```
POST /api/webhooks/register
POST /api/webhooks/unregister
```

## SDK Usage

### JavaScript/Node.js

```javascript
import api from './public/js/api.js';

// Analyze documents
const results = await api.analyzeDocuments(htmlFile, pdfFile, {
  useAzure: true,
  azureKey: 'your-key',
  azureEndpoint: 'https://...'
});

// Save results
const response = await fetch('/api/results/save', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key'
  },
  body: JSON.stringify({
    programName: 'Internal Medicine',
    submissionYear: 2024,
    submitterEmail: 'coordinator@hospital.edu',
    analysisData: results.data
  })
});

const saved = await response.json();
console.log('Submission ID:', saved.submissionId);
```

### Python

```python
import requests

# Analyze documents
with open('submission.html', 'rb') as f:
    html = f
with open('requirements.pdf', 'rb') as f:
    pdf = f

files = {'html': html, 'pdf': pdf}
headers = {'X-API-Key': 'your-api-key'}

response = requests.post(
    'http://localhost:3000/api/analyze',
    files=files,
    headers=headers
)

results = response.json()
print(results['data']['summary'])
```

### cURL

See examples above for all endpoints.

## Changelog

### v1.0.0
- Initial API release
- Analysis endpoints
- Results storage endpoints
- Azure integration
- Rate limiting
- Security headers
