/**
 * Main Application Logic
 */

// Global references to modules (exposed to HTML onclick handlers)
let currentUI = null;
let currentAPI = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize modules
  currentUI = typeof ui !== 'undefined' ? ui : window.ui;
  currentAPI = typeof api !== 'undefined' ? api : window.api;

  // Initialize UI
  if (currentUI) {
    currentUI.initializeFileInputs();
  }

  // Check Azure status
  checkAzureStatus();
});

/**
 * Analyze documents
 */
async function analyzeDocuments() {
  if (!currentUI || !currentAPI) {
    console.error('Modules not initialized');
    return;
  }

  // Validation — accept HTML or PDF
  if (!currentUI.uploadedFiles.html && !currentUI.uploadedFiles.pdf) {
    currentUI.showError('Please upload your ADS file (HTML or PDF).');
    return;
  }

  currentUI.setButtonLoading('analyzeBtn', true);

  try {
    const azureKey = document.getElementById('azureKey')?.value;
    const azureEndpoint = document.getElementById('azureEndpoint')?.value;

    const results = await currentAPI.analyzeDocuments(
      currentUI.uploadedFiles.html,
      currentUI.uploadedFiles.pdf,
      {
        useAzure: !!(azureKey && azureEndpoint),
        azureKey,
        azureEndpoint
      }
    );

    currentUI.displayResults(results);
    currentUI.showSuccess('Analysis completed successfully!');
  } catch (error) {
    currentUI.showError(error.message || 'An error occurred during analysis');
    console.error('Analysis error:', error);
  } finally {
    currentUI.setButtonLoading('analyzeBtn', false);
  }
}

/**
 * Load sample results
 */
async function loadSample() {
  if (!currentUI || !currentAPI) {
    console.error('Modules not initialized');
    return;
  }

  try {
    const results = await currentAPI.getSampleResults();
    currentUI.displayResults(results);
    currentUI.showSuccess('Sample results loaded. These are example findings.');
  } catch (error) {
    currentUI.showError('Failed to load sample results: ' + error.message);
  }
}

/**
 * Reset form
 */
function resetForm() {
  if (currentUI) {
    currentUI.resetForm();
  }
}

/**
 * Switch tab
 */
function switchTab(tabName) {
  if (currentUI) {
    currentUI.switchTab(tabName);
  }
}

/**
 * Check Azure status
 */
async function checkAzureStatus() {
  if (!currentAPI) return;

  try {
    const status = await currentAPI.getAzureStatus();
    const statusEl = document.getElementById('azureStatus');
    
    if (statusEl && status?.status) {
      const statusText = status.status.azureConfigured
        ? '✓ Azure configured'
        : 'ℹ Azure not configured (optional)';
      
      statusEl.textContent = statusText;
      statusEl.style.color = status.status.azureConfigured ? 'var(--success)' : 'var(--text-secondary)';
    }
  } catch (error) {
    console.error('Failed to check Azure status:', error);
  }
}

// Make functions available globally for HTML onclick handlers
window.analyzeDocuments = analyzeDocuments;
window.resetForm = resetForm;
window.switchTab = switchTab;
window.loadSample = loadSample;
