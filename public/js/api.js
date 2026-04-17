/**
 * API Client
 * Handles communication with backend API
 */

const API_BASE = '/api';

const api = {
  /**
   * Analyze documents
   */
  async analyzeDocuments(htmlFile, pdfFile, options = {}) {
    const formData = new FormData();
    formData.append('html', htmlFile);
    if (pdfFile) formData.append('pdf', pdfFile);
    
    if (options.useAzure) {
      formData.append('useAzure', 'true');
      formData.append('azureKey', options.azureKey);
      formData.append('azureEndpoint', options.azureEndpoint);
    }

    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Analysis failed');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`API Error: ${error.message}`);
    }
  },

  /**
   * Validate files
   */
  async validateFiles(htmlFile, pdfFile) {
    const formData = new FormData();
    formData.append('html', htmlFile);
    formData.append('pdf', pdfFile);

    try {
      const response = await fetch(`${API_BASE}/analyze/validate`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Validation failed');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Validation Error: ${error.message}`);
    }
  },

  /**
   * Get sample analysis results
   */
  async getSampleResults() {
    try {
      const response = await fetch(`${API_BASE}/analyze/sample`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to load sample');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Sample Error: ${error.message}`);
    }
  },

  /**
   * Validate Azure credentials
   */
  async validateAzureCredentials(apiKey, endpoint) {
    try {
      const response = await fetch(`${API_BASE}/azure/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey,
          endpoint
        })
      });

      if (!response.ok) {
        throw new Error('Validation failed');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Azure Validation Error: ${error.message}`);
    }
  },

  /**
   * Get Azure configuration status
   */
  async getAzureStatus() {
    try {
      const response = await fetch(`${API_BASE}/azure/status`);

      if (!response.ok) {
        throw new Error('Failed to get status');
      }

      return await response.json();
    } catch (error) {
      console.error('Status Error:', error);
      return null;
    }
  },

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
};

window.api = api;
