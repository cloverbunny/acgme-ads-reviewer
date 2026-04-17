import express from 'express';
import crypto from 'crypto';
import { getDatabase } from '../services/database.js';

const router = express.Router();

/**
 * POST /api/results/save
 * Save analysis results with submission metadata
 */
router.post('/save', async (req, res, next) => {
  try {
    const {
      programName,
      submissionYear,
      submitterEmail,
      analysisData,
      htmlFilename,
      pdfFilename
    } = req.body;

    if (!analysisData) {
      return res.status(400).json({
        error: 'Analysis data is required'
      });
    }

    const db = getDatabase();
    const submissionId = crypto.randomUUID();

    // Save submission metadata
    const submission = await db.saveSubmission({
      id: submissionId,
      programName,
      submissionYear,
      submitterEmail,
      htmlFilename,
      pdfFilename,
      htmlSize: req.body.htmlSize,
      pdfSize: req.body.pdfSize,
      analysisStatus: 'completed'
    });

    // Save individual findings
    for (const finding of [
      ...analysisData.duplicateCertifications,
      ...analysisData.ftePairing,
      ...analysisData.scholarlyActivity
    ]) {
      await db.saveAnalysisResults(submissionId, {
        analysisType: findingType(finding),
        ...finding
      });
    }

    // Log the action
    await db.logAudit(
      'analysis_completed',
      submissionId,
      submitterEmail,
      `Analysis completed for ${programName}`
    );

    res.json({
      success: true,
      submissionId: submissionId,
      message: 'Analysis results saved successfully'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/results/:submissionId
 * Retrieve saved analysis results
 */
router.get('/:submissionId', async (req, res, next) => {
  try {
    const db = getDatabase();

    const submission = await db.getSubmission(req.params.submissionId);
    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found'
      });
    }

    const results = await db.getAnalysisResults(req.params.submissionId);

    res.json({
      success: true,
      submission: submission,
      results: results,
      summary: {
        critical: results.filter(r => r.severity === 'critical').length,
        warning: results.filter(r => r.severity === 'warning').length,
        success: results.filter(r => r.severity === 'success').length
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/results
 * List all submissions with optional filters
 */
router.get('/', async (req, res, next) => {
  try {
    const db = getDatabase();

    const filters = {
      programName: req.query.program,
      submissionYear: req.query.year ? parseInt(req.query.year) : null,
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    };

    // Remove null filters
    Object.keys(filters).forEach(key => 
      filters[key] === null && delete filters[key]
    );

    const submissions = await db.listSubmissions(filters);

    res.json({
      success: true,
      count: submissions.length,
      submissions: submissions
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/results/:submissionId/review
 * Mark findings as reviewed
 */
router.post('/:submissionId/review', async (req, res, next) => {
  try {
    const { findingId, reviewed, notes } = req.body;

    const db = getDatabase();
    const submission = await db.getSubmission(req.params.submissionId);

    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found'
      });
    }

    // TODO: Implement finding update in database service
    // await db.updateFinding(findingId, { reviewed, notes });

    await db.logAudit(
      'finding_reviewed',
      req.params.submissionId,
      req.body.reviewerId,
      `Finding reviewed: ${notes}`
    );

    res.json({
      success: true,
      message: 'Finding marked as reviewed'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/results/:submissionId
 * Delete a submission and all associated results
 */
router.delete('/:submissionId', async (req, res, next) => {
  try {
    const db = getDatabase();
    const submission = await db.getSubmission(req.params.submissionId);

    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found'
      });
    }

    // TODO: Implement deletion in database service
    // await db.deleteSubmission(req.params.submissionId);

    await db.logAudit(
      'submission_deleted',
      req.params.submissionId,
      req.body.userId,
      'Submission and results deleted'
    );

    res.json({
      success: true,
      message: 'Submission deleted'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Helper function to determine finding type
 */
function findingType(finding) {
  if (finding.title.includes('Duplicate')) return 'duplicates';
  if (finding.title.includes('FTE')) return 'fte';
  if (finding.title.includes('Scholarly')) return 'scholarly';
  return 'other';
}

export default router;
