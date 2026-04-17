import express from 'express';
import multer from 'multer';
import DocumentAnalyzer from '../services/analyzer.js';
import AzureService from '../services/azure.js';
import { getGuidelinesText, GUIDELINES_URL } from '../services/guidelines.js';
import { queryGuidelines } from '../services/rag.js';
import { extractPDFText } from '../services/pdfExtract.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800 // 50MB default
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['text/html', 'text/plain', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Upload an HTML or PDF file.`));
    }
  }
});

/**
 * POST /api/analyze
 * Main analysis endpoint
 */
router.post('/', upload.fields([
  { name: 'html', maxCount: 1 },
  { name: 'pdf', maxCount: 1 }
]), async (req, res, next) => {
  try {
    // Validate HTML upload
    const adsFile = req.files?.html?.[0] || req.files?.pdf?.[0];
    if (!adsFile) {
      return res.status(400).json({
        error: 'An ADS file (HTML or PDF) is required'
      });
    }

    // Extract ADS content — HTML as text, PDF via pdf-parse
    const htmlContent = adsFile.mimetype === 'application/pdf'
      ? await extractPDFText(adsFile.buffer)
      : adsFile.buffer.toString('utf-8');

    // ADS file only — always cross-reference against the ACGME guideline
    const pdfContent = await getGuidelinesText();
    const guidelinesSource = 'acgme-guidelines';

    // Initialize analyzer
    const analyzer = new DocumentAnalyzer({
      strictMode: req.body.strictMode === 'true',
      enableAzure: !!req.body.useAzure,
      queryGuidelines
    });

    // Run analysis
    const results = await analyzer.analyze(htmlContent, pdfContent);

    // If Azure is requested and configured, enhance results
    if (req.body.useAzure && req.body.azureKey) {
      const azure = new AzureService({
        apiKey: req.body.azureKey,
        endpoint: req.body.azureEndpoint
      });

      if (azure.isEnabled()) {
        try {
          // Optionally enhance with Azure AI analysis
          // This is disabled by default to avoid unnecessary API calls
          // Uncomment to enable:
          /*
          const azureResults = await azure.analyzeDocumentWithAI(htmlContent, 'duplicates');
          results.azureEnhanced = azureResults;
          */
        } catch (error) {
          results.warnings = results.warnings || [];
          results.warnings.push('Azure analysis unavailable: ' + error.message);
        }
      }
    }

    res.json({
      success: true,
      data: results,
      metadata: {
        adsFileSize: adsFile.size,
        adsFileType: adsFile.mimetype,
        guidelinesSource,
        guidelinesUrl: guidelinesSource === 'acgme-guidelines' ? GUIDELINES_URL : null,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/analyze/sample
 * Get sample analysis results for testing
 */
router.post('/sample', (req, res) => {
  const sampleResults = {
    success: true,
    data: {
      duplicateCertifications: [
        {
          severity: 'critical',
          title: 'Duplicate Physician Entry',
          content: 'Dr. Jane Smith, MD appears 2 times in the faculty roster with certifications: Pediatrics, Pediatrics. This may be a data entry error.',
          location: 'Tables: 1, 2',
          resolution: 'Verify faculty roster and consolidate duplicate entries'
        }
      ],
      ftePairing: [
        {
          severity: 'success',
          title: 'FTE Information Present in Both Documents',
          content: 'Program requirements specify FTE requirements. Found 3 FTE references in program requirements. Cross-reference with ADS submission for accuracy.',
          resolution: 'Manual verification: Compare specific FTE allocations between documents'
        }
      ],
      scholarlyActivity: [
        {
          severity: 'warning',
          title: 'Potentially Outdated Scholarly Activity',
          content: 'Found references to scholarly activities from years: 2019, 2020, 2021. ACGME typically expects recent scholarly activity. Verify that these are appropriately documented or that more recent activities exist.',
          resolution: 'Review and update scholarly activity references to include more recent years'
        }
      ],
      summary: {
        issuesFound: 2,
        criticalCount: 1,
        warningCount: 1,
        passCount: 1,
        timestamp: new Date().toISOString()
      }
    }
  };

  res.json(sampleResults);
});

/**
 * POST /api/analyze/validate
 * Validate files without running full analysis
 */
router.post('/validate', upload.fields([
  { name: 'html', maxCount: 1 },
  { name: 'pdf', maxCount: 1 }
]), (req, res, next) => {
  try {
    const validation = {
      html: null,
      pdf: null
    };

    if (req.files?.html?.[0]) {
      const htmlFile = req.files.html[0];
      const htmlContent = htmlFile.buffer.toString('utf-8');
      
      validation.html = {
        valid: htmlContent.includes('<') && htmlContent.includes('>'),
        size: htmlFile.size,
        name: htmlFile.originalname,
        hasTableContent: htmlContent.toLowerCase().includes('</table>')
      };
    }

    if (req.files?.pdf?.[0]) {
      const pdfFile = req.files.pdf[0];
      
      validation.pdf = {
        valid: pdfFile.mimetype === 'application/pdf',
        size: pdfFile.size,
        name: pdfFile.originalname
      };
    }

    res.json({
      success: true,
      validation: validation
    });

  } catch (error) {
    next(error);
  }
});

export default router;
