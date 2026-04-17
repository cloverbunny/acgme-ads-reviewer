# Development Guide

This guide helps you extend and customize the ACGME ADS Reviewer application.

## Adding New Analysis Rules

### Step 1: Implement the Check Method

Add a new method to `services/analyzer.js`:

```javascript
/**
 * Check for new issue type
 */
checkNewIssueType(htmlData, pdfData) {
  const findings = [];

  // Your analysis logic here
  // Example:
  const pattern = /specific pattern/gi;
  const matches = htmlData.text.match(pattern);

  if (matches && matches.length > 0) {
    findings.push({
      severity: 'warning', // 'critical', 'warning', or 'success'
      title: 'Issue Title',
      content: 'Detailed description of the issue',
      location: 'Table 1, Row 5', // optional
      resolution: 'How to fix this issue' // optional
    });
  }

  return findings;
}
```

### Step 2: Call in Main Analyze Method

Update the `analyze()` method in `services/analyzer.js`:

```javascript
async analyze(htmlContent, pdfContent) {
  // ... existing code ...
  
  // Add your new check:
  results.newIssueType = this.checkNewIssueType(htmlData, pdfData);
  
  // ... rest of code ...
}
```

### Step 3: Update Summary Stats

Add to the summary calculation:

```javascript
results.summary.warningCount += results.newIssueType.filter(f => f.severity === 'warning').length;
results.summary.passCount += results.newIssueType.filter(f => f.severity === 'success').length;
```

### Step 4: Display in Frontend

Update the tab in `public/index.html`:

```html
<button class="tab-button" onclick="switchTab('newIssue')">New Issue Type</button>
```

Add the content div:

```html
<div id="newIssue" class="tab-content"></div>
```

Update `public/js/app.js`:

```javascript
async function analyzeDocuments() {
  // ... existing code ...
  
  currentUI.displayFindings('newIssue', results.data.newIssueType);
}
```

## Enhancing Document Parsing

### Improving HTML Parsing

In `services/analyzer.js`, the `parseHTML()` method uses JSDOM. You can enhance it:

```javascript
parseHTML(htmlContent) {
  try {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    return {
      text: htmlContent,
      tables: Array.from(document.querySelectorAll('table')),
      // Add more specific selectors:
      facultyTable: document.querySelector('.faculty-table'),
      staffTable: document.querySelector('.staff-table'),
      paragraphs: Array.from(document.querySelectorAll('p')),
      raw: htmlContent
    };
  } catch (error) {
    throw new Error(`HTML parsing failed: ${error.message}`);
  }
}
```

### Adding PDF Text Extraction

To properly extract text from PDFs, install `pdf-parse`:

```bash
npm install pdf-parse
```

Update `services/analyzer.js`:

```javascript
import pdf from 'pdf-parse';

async parsePDFProper(pdfBuffer) {
  try {
    const data = await pdf(pdfBuffer);
    return {
      text: data.text,
      numPages: data.numpages,
      metadata: data.metadata,
      pages: data.version // additional info
    };
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}
```

Update the analyze method to use buffers instead of text.

## Adding API Endpoints

### Step 1: Create a New Route File

Create `routes/custom.js`:

```javascript
import express from 'express';

const router = express.Router();

/**
 * GET /api/custom/endpoint
 */
router.get('/endpoint', (req, res) => {
  res.json({
    message: 'Custom endpoint response'
  });
});

/**
 * POST /api/custom/process
 */
router.post('/process', (req, res) => {
  const { data } = req.body;
  
  // Your logic here
  const result = processData(data);
  
  res.json({
    success: true,
    result: result
  });
});

export default router;
```

### Step 2: Register in server.js

```javascript
import customRoutes from './routes/custom.js';

// Add after other route imports:
app.use('/api/custom', customRoutes);
```

### Step 3: Update API Client

Add to `public/js/api.js`:

```javascript
async processCustomData(data) {
  try {
    const response = await fetch(`${API_BASE}/custom/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Processing failed');
    }

    return await response.json();
  } catch (error) {
    throw new Error(`API Error: ${error.message}`);
  }
}
```

## Advanced Azure Integration

### Using Azure AI for Analysis

Enable Azure analysis in `routes/analyze.js`:

```javascript
if (req.body.useAzure && req.body.azureKey) {
  const azure = new AzureService({
    apiKey: req.body.azureKey,
    endpoint: req.body.azureEndpoint
  });

  if (azure.isEnabled()) {
    try {
      const azureResults = await azure.analyzeDocumentWithAI(
        htmlContent, 
        'duplicates' // or 'fte', 'scholarly'
      );
      results.azureEnhanced = azureResults;
    } catch (error) {
      results.warnings = results.warnings || [];
      results.warnings.push('Azure analysis unavailable: ' + error.message);
    }
  }
}
```

### Custom Azure Prompts

Add new analysis types in `services/azure.js`:

```javascript
async analyzeDocumentWithAI(content, analysisType = 'general') {
  const systemPrompts = {
    custom: `Your custom system prompt here.
      Return a JSON object with:
      {
        "findings": [...],
        "summary": "..."
      }`
    // ... existing prompts ...
  };
  
  // ... rest of method ...
}
```

## Frontend Customization

### Adding New UI Components

Add to `public/css/styles.css`:

```css
.custom-component {
    background: var(--bg-secondary);
    padding: 1rem;
    border-radius: 8px;
    /* Your styles */
}
```

Add to `public/index.html`:

```html
<div class="custom-component">
    <!-- Your content -->
</div>
```

### Modifying the Theme

Update CSS variables in `public/css/styles.css`:

```css
:root {
    --primary: #your-color;
    --accent: #your-accent;
    /* ... other colors ... */
}
```

## Testing Your Changes

### Manual Testing

1. Start in dev mode: `npm run dev`
2. Open browser: `http://localhost:3000`
3. Test with sample files
4. Check browser console for errors
5. Check server logs for backend errors

### Testing New Analysis Rules

Create a simple test in `public/js/app.js`:

```javascript
async function testAnalysis() {
  // Create mock files
  const mockHTML = new File(['<html>...</html>'], 'test.html');
  const mockPDF = new File(['%PDF...'], 'test.pdf');
  
  // Test analysis
  const result = await currentAPI.analyzeDocuments(mockHTML, mockPDF);
  console.log('Analysis result:', result);
}
```

### Debugging

Enable detailed logging in `services/analyzer.js`:

```javascript
console.log('Analyzing HTML content...');
const htmlData = this.parseHTML(htmlContent);
console.log('Parsed tables:', htmlData.tables.length);

// ... add logging to other methods ...
```

## Performance Optimization

### Caching Results

Add to `routes/analyze.js`:

```javascript
const resultCache = new Map();

router.post('/', async (req, res, next) => {
  const cacheKey = crypto
    .createHash('sha256')
    .update(req.files.html[0].buffer)
    .update(req.files.pdf[0].buffer)
    .digest('hex');

  if (resultCache.has(cacheKey)) {
    return res.json({
      success: true,
      data: resultCache.get(cacheKey),
      fromCache: true
    });
  }

  // ... existing analysis ...
  
  resultCache.set(cacheKey, results);
  res.json({ success: true, data: results });
});
```

### Async Processing

For large files, process asynchronously:

```javascript
// In routes/analyze.js
router.post('/async', (req, res) => {
  const jobId = generateJobId();
  
  // Start processing in background
  analyzeAsync(jobId, files);
  
  res.json({
    success: true,
    jobId: jobId,
    statusUrl: `/api/analyze/status/${jobId}`
  });
});

// Check status
router.get('/status/:jobId', (req, res) => {
  const status = getJobStatus(req.params.jobId);
  res.json(status);
});
```

## Common Tasks

### Adding a New Finding Type

1. Add property to results object
2. Implement check method
3. Add to analyze() method
4. Add to summary stats
5. Add tab to HTML
6. Update UI to display findings

### Changing Color Scheme

1. Edit `:root` in `public/css/styles.css`
2. Update color variables
3. Test in browser
4. Colors will automatically update everywhere

### Adding Form Input

1. Add input to `public/index.html`
2. Get value in `public/js/app.js`
3. Pass to API in request
4. Handle in backend route
5. Use in analysis logic

## Troubleshooting Development

### Changes Not Appearing

- Clear browser cache (Ctrl+Shift+Del)
- Hard refresh (Ctrl+Shift+R)
- Restart dev server (`npm run dev`)

### Module Not Found Errors

- Check import paths
- Verify file exists in correct directory
- Check export statements
- Verify import syntax

### API Errors

- Check browser Network tab
- Review server console logs
- Verify request format matches API expectations
- Check CORS configuration

## Next Steps

- Add more sophisticated pattern matching
- Integrate document intelligence APIs
- Add user authentication
- Implement result caching/persistence
- Create admin dashboard
- Add batch processing capabilities
