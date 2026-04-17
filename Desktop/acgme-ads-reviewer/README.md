# ACGME ADS Annual Update Reviewer

A secure, professional document review application for analyzing ACGME (Accreditation Council for Graduate Medical Education) ADS (Annual Data System) Annual Update submissions.

## Overview

This application helps medical program coordinators identify common errors and issues in their ACGME ADS Annual Update submissions by comparing the HTML submission against program requirements documentation.

### Key Features

- **Secure Processing**: Files are processed on your server, credentials are never stored
- **Duplicate Detection**: Identifies duplicate physician entries in faculty rosters
- **FTE Validation**: Cross-references program staff FTE against program requirements
- **Scholarly Activity Review**: Flags potentially outdated scholarly activity references
- **Azure Integration**: Optional Azure AI Services integration for enhanced analysis
- **Professional UI**: Clean, medical-professional design with detailed findings

## System Requirements

- Node.js >= 18.0.0
- npm or yarn
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Installation

### 1. Clone or Download Repository

```bash
cd acgme-ads-reviewer
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the example environment file and fill in your configuration:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your settings:

```
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Optional: Azure Configuration
AZURE_API_KEY=
AZURE_ENDPOINT=
```

### 4. Create Upload Directories

The application will create these automatically, but you can pre-create them:

```bash
mkdir -p uploads temp
```

## Running the Application

### Development Mode

```bash
npm run dev
```

This starts the server with auto-reload enabled. Navigate to `http://localhost:3000` in your browser.

### Production Mode

```bash
npm start
```

## Project Structure

```
acgme-ads-reviewer/
├── server.js                 # Main Express server
├── package.json              # Dependencies and scripts
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore configuration
│
├── services/                 # Business logic
│   ├── analyzer.js          # Document analysis engine
│   └── azure.js             # Azure API integration
│
├── routes/                   # API endpoints
│   ├── analyze.js           # Analysis routes
│   └── azure.js             # Azure integration routes
│
└── public/                   # Frontend application
    ├── index.html           # Main HTML
    ├── css/
    │   └── styles.css       # Stylesheet
    └── js/
        ├── api.js           # API client
        ├── ui.js            # UI utilities
        └── app.js           # Main app logic
```

## API Endpoints

### Analysis Endpoints

#### POST `/api/analyze`

Main analysis endpoint. Analyzes uploaded HTML and PDF documents.

**Request:**
- `multipart/form-data` with:
  - `html`: HTML file (required)
  - `pdf`: PDF file (required)
  - `azureKey`: Azure API key (optional)
  - `azureEndpoint`: Azure endpoint (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "duplicateCertifications": [...],
    "ftePairing": [...],
    "scholarlyActivity": [...],
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

#### POST `/api/analyze/validate`

Validate files without running full analysis.

#### POST `/api/analyze/sample`

Get sample analysis results for testing.

### Azure Endpoints

#### POST `/api/azure/validate`

Validate Azure credentials.

**Request:**
```json
{
  "apiKey": "your-api-key",
  "endpoint": "https://your-resource.openai.azure.com/"
}
```

#### GET `/api/azure/status`

Get Azure configuration status.

### Health Check

#### GET `/api/health`

Server health check endpoint.

## Analysis Rules

### Duplicate Certifications Check

Identifies physicians appearing multiple times in the faculty roster with:
- Number of occurrences
- Associated certifications
- Table location in document
- Severity: CRITICAL

### FTE Support Validation

Checks for consistency between ADS submission and program requirements:
- Detects FTE mentions in both documents
- Compares presence of FTE specifications
- Severity: WARNING if mismatch detected

### Scholarly Activity Review

Reviews scholarly activity for recency:
- Identifies activity year references
- Flags activities older than 2 years
- Suggests manual verification
- Severity: WARNING if outdated activities found

## Azure Configuration (Optional)

For advanced analysis features, you can integrate Azure OpenAI Services:

### 1. Create Azure Resources

- Azure OpenAI Service with a GPT-3.5 or GPT-4 deployment
- Azure Document Intelligence Service (optional, for advanced PDF parsing)

### 2. Get Credentials

From your Azure portal, obtain:
- API Key
- Endpoint URL
- Deployment Name

### 3. Configure in .env.local

```
AZURE_API_KEY=your-api-key
AZURE_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://your-doc-int.cognitiveservices.azure.com/
AZURE_DOCUMENT_INTELLIGENCE_KEY=your-doc-int-key
```

### 4. Test Connection

The application will validate credentials on startup and when analyzing documents.

## Security Considerations

### File Handling

- Files are uploaded to your server and stored temporarily
- Temporary files are deleted after processing
- No data is permanently stored without explicit user action

### Credentials

- Azure credentials are not stored in the database
- API keys are not logged or sent to external services
- Credentials are kept in environment variables
- Use `.env.local` for sensitive configuration (not in version control)

### CORS

Configure CORS in `.env.local` for your deployment:

```
CORS_ORIGIN=https://your-domain.com
```

## Extending the Application

### Adding Custom Analysis Rules

Edit `services/analyzer.js` to add new analysis methods:

```javascript
checkCustomRule(htmlData, pdfData) {
  const findings = [];
  // Your analysis logic
  return findings;
}
```

Then call from the `analyze()` method:

```javascript
results.customFindings = this.checkCustomRule(htmlData, pdfData);
```

### Adding New API Endpoints

Create a new route file in `routes/` and import in `server.js`:

```javascript
import customRoutes from './routes/custom.js';
app.use('/api/custom', customRoutes);
```

### Modifying the UI

Edit `public/js/app.js`, `public/js/ui.js`, and `public/css/styles.css` to customize the interface.

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
PORT=3001 npm start
```

Or change `PORT` in `.env.local`.

### File Upload Errors

- Check file size limits in `.env.local` (`MAX_FILE_SIZE`)
- Ensure files are valid HTML and PDF formats
- Verify upload directories exist and have write permissions

### Azure Connection Issues

- Verify API key and endpoint in `.env.local`
- Check Azure resource is deployed and accessible
- Review Azure service quotas and rate limits
- Check network connectivity and firewall rules

### Memory Issues with Large Files

- Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096 npm start`
- Consider processing files in chunks
- Monitor server resource usage

## Development

### Running Tests

```bash
npm test
```

### Linting (when configured)

```bash
npm run lint
```

### Building for Production

1. Set `NODE_ENV=production` in `.env.local`
2. Run `npm start`
3. Consider using a process manager (PM2) for production deployment
4. Use a reverse proxy (nginx) for SSL/TLS termination

## Deployment

### Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t acgme-ads-reviewer .
docker run -p 3000:3000 --env-file .env.local acgme-ads-reviewer
```

### Process Manager (PM2)

```bash
npm install -g pm2
pm2 start server.js --name "acgme-reviewer"
pm2 save
pm2 startup
```

## License

MIT

## Support

For issues, feature requests, or contributions, please open an issue in your repository.

## Changelog

### Version 1.0.0
- Initial release
- Duplicate certification detection
- FTE validation
- Scholarly activity review
- Azure integration ready
