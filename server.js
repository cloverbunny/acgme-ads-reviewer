import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Route imports
import analyzeRoutes from './routes/analyze.js';
import { prefetchGuidelines } from './services/guidelines.js';
import azureRoutes from './routes/azure.js';
import resultsRoutes from './routes/results.js';

// Middleware imports
import {
  requestLogger,
  securityHeaders,
  extractUserContext,
  rateLimit,
  errorHandler
} from './middleware/auth.js';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.example' });

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(securityHeaders);
app.use(requestLogger);
app.use(extractUserContext);
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/api/', rateLimit(15 * 60 * 1000, 100));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Create upload and temp directories if they don't exist
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const tempDir = process.env.TEMP_DIR || './temp';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// API Routes
app.use('/api/analyze', analyzeRoutes);
app.use('/api/azure', azureRoutes);
app.use('/api/results', resultsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Catch-all route for SPA - serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
    if (err) {
      res.status(404).json({ error: 'Not found' });
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 ACGME ADS Reviewer Server`);
  console.log(`📍 Running on http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${NODE_ENV}`);
  console.log(`✅ Ready for requests\n`);
  prefetchGuidelines();
});

export default app;
