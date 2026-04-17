/**
 * Azure AI Services Integration
 * Handles secure communication with Azure APIs
 */

import axios from 'axios';

export class AzureService {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.AZURE_API_KEY;
    this.endpoint = options.endpoint || process.env.AZURE_ENDPOINT;
    this.apiVersion = options.apiVersion || process.env.AZURE_API_VERSION || '2024-02-15-preview';
    
    this.docIntelligenceEndpoint = options.docIntelligenceEndpoint || process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
    this.docIntelligenceKey = options.docIntelligenceKey || process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

    // Validate credentials if provided
    if (this.apiKey && this.endpoint) {
      this.isConfigured = true;
    } else {
      this.isConfigured = false;
    }
  }

  /**
   * Check if Azure services are properly configured
   */
  isEnabled() {
    return this.isConfigured;
  }

  /**
   * Get configuration status (safe to expose to frontend)
   */
  getStatus() {
    return {
      azureConfigured: this.isConfigured,
      docIntelligenceConfigured: !!(this.docIntelligenceEndpoint && this.docIntelligenceKey),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate Azure credentials without exposing the key
   */
  async validateCredentials() {
    if (!this.isConfigured) {
      return {
        valid: false,
        message: 'Azure credentials not configured'
      };
    }

    try {
      const response = await axios.post(
        `${this.endpoint}/openai/deployments/gpt-35-turbo/chat/completions?api-version=${this.apiVersion}`,
        {
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10
        },
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      return {
        valid: true,
        message: 'Azure credentials are valid'
      };
    } catch (error) {
      const status = error.response?.status;
      let message = 'Azure validation failed';

      if (status === 401 || status === 403) {
        message = 'Invalid API key or insufficient permissions';
      } else if (status === 404) {
        message = 'Azure endpoint or deployment not found';
      } else if (error.code === 'ECONNREFUSED') {
        message = 'Cannot reach Azure endpoint';
      }

      return {
        valid: false,
        message: message,
        statusCode: status
      };
    }
  }

  /**
   * Call Azure OpenAI for document analysis
   */
  async analyzeDocumentWithAI(content, analysisType = 'general') {
    if (!this.isConfigured) {
      throw new Error('Azure credentials not configured');
    }

    const systemPrompts = {
      duplicates: `You are an expert in ACGME accreditation. Analyze the provided HTML document for duplicate physician entries in the faculty roster. 
        Return a JSON object with:
        {
          "duplicates": [
            {
              "physician": "Name",
              "count": number,
              "certifications": ["cert1", "cert2"],
              "severity": "critical|warning|info"
            }
          ],
          "summary": "brief summary"
        }`,
      
      fte: `You are an expert in medical education program requirements. Analyze FTE (Full-Time Equivalent) support mentioned in the ADS document.
        Return a JSON object with:
        {
          "fteMentions": [
            {
              "position": "title",
              "fte": number,
              "context": "surrounding text"
            }
          ],
          "issues": ["issue1", "issue2"],
          "severity": "critical|warning|info"
        }`,
      
      scholarly: `You are an expert in ACGME scholarly activity requirements. Analyze the scholarly activity section.
        Return a JSON object with:
        {
          "activities": [
            {
              "description": "activity description",
              "year": number,
              "type": "category",
              "isCurrent": true|false
            }
          ],
          "outdatedCount": number,
          "severity": "critical|warning|info"
        }`
    };

    const systemPrompt = systemPrompts[analysisType] || systemPrompts.general;

    try {
      const response = await axios.post(
        `${this.endpoint}/openai/deployments/gpt-35-turbo/chat/completions?api-version=${this.apiVersion}`,
        {
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `Please analyze this document:\n\n${content.substring(0, 8000)}`
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        },
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const result = response.data.choices[0].message.content;
      
      try {
        return JSON.parse(result);
      } catch {
        // If response isn't valid JSON, return as-is
        return { raw: result };
      }
    } catch (error) {
      throw new Error(`Azure API call failed: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF using Document Intelligence API
   */
  async extractPDFContent(pdfBuffer) {
    if (!this.docIntelligenceEndpoint || !this.docIntelligenceKey) {
      throw new Error('Document Intelligence not configured');
    }

    try {
      const response = await axios.post(
        `${this.docIntelligenceEndpoint}/documentintelligence:analyze?api-version=2024-02-29-preview`,
        pdfBuffer,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.docIntelligenceKey,
            'Content-Type': 'application/pdf'
          },
          timeout: 60000
        }
      );

      // Poll for results
      const resultUrl = response.headers['operation-location'];
      return await this.pollResults(resultUrl);
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  /**
   * Poll for analysis results
   */
  async pollResults(operationUrl, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.get(operationUrl, {
          headers: {
            'Ocp-Apim-Subscription-Key': this.docIntelligenceKey
          }
        });

        if (response.data.status === 'succeeded') {
          return response.data.analyzeResult;
        } else if (response.data.status === 'failed') {
          throw new Error('Document analysis failed');
        }

        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        if (i === maxAttempts - 1) {
          throw error;
        }
      }
    }

    throw new Error('Document analysis timeout');
  }
}

export default AzureService;
