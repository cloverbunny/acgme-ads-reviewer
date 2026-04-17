import express from 'express';
import AzureService from '../services/azure.js';

const router = express.Router();

/**
 * POST /api/azure/validate
 * Validate Azure credentials
 */
router.post('/validate', async (req, res, next) => {
  try {
    const { apiKey, endpoint } = req.body;

    if (!apiKey || !endpoint) {
      return res.status(400).json({
        error: 'API key and endpoint are required'
      });
    }

    const azure = new AzureService({
      apiKey,
      endpoint
    });

    const validation = await azure.validateCredentials();

    res.json({
      success: validation.valid,
      validation: validation
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/azure/status
 * Get Azure configuration status
 */
router.get('/status', (req, res) => {
  const azure = new AzureService();
  
  res.json({
    status: azure.getStatus()
  });
});

export default router;
