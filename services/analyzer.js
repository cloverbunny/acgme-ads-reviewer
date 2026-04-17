/**
 * Document Analysis Service
 * Handles parsing and analysis of HTML and PDF documents
 */

import { JSDOM } from 'jsdom';

export class DocumentAnalyzer {
  constructor(options = {}) {
    this.options = {
      strictMode: options.strictMode || false,
      enableAzure: options.enableAzure || false,
      ...options
    };
    // RAG query function — injected from the route so it stays optional
    this._queryGuidelines = options.queryGuidelines || (() => []);
  }

  /**
   * Query the ACGME guidelines index and return formatted references.
   * Each reference has { section, snippet } where snippet is the first
   * 220 characters of the most relevant chunk.
   */
  _guidelineRefs(query, topK = 2) {
    return this._queryGuidelines(query, topK).map(r => ({
      section: r.section.replace(/\n.*/s, '').trim(), // first line only
      snippet: r.text.substring(0, 220).replace(/\s+/g, ' ').trim() + (r.text.length > 220 ? '…' : '')
    }));
  }

  /**
   * Analyze both HTML and PDF content
   */
  async analyze(htmlContent, pdfContent) {
    const results = {
      duplicateCertifications: [],
      ftePairing: [],
      scholarlyActivity: [],
      summary: {
        issuesFound: 0,
        criticalCount: 0,
        warningCount: 0,
        passCount: 0,
        timestamp: new Date().toISOString()
      }
    };

    try {
      // Parse documents
      const htmlData = this.parseHTML(htmlContent);
      const pdfData = this.parsePDF(pdfContent);

      // Run analyses
      results.duplicateCertifications = this.checkDuplicateCertifications(htmlData);
      results.ftePairing = this.checkFTESupport(htmlData, pdfData);
      results.scholarlyActivity = this.checkScholarlyActivity(htmlData);

      // Update summary
      results.summary.criticalCount = results.duplicateCertifications.filter(
        f => f.severity === 'critical'
      ).length;
      results.summary.warningCount = 
        results.ftePairing.filter(f => f.severity === 'warning').length +
        results.scholarlyActivity.filter(f => f.severity === 'warning').length;
      results.summary.passCount = 
        results.ftePairing.filter(f => f.severity === 'success').length +
        results.scholarlyActivity.filter(f => f.severity === 'success').length;
      results.summary.issuesFound = results.summary.criticalCount + results.summary.warningCount;

    } catch (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }

    return results;
  }

  /**
   * Parse HTML document structure
   */
  parseHTML(htmlContent) {
    try {
      const dom = new JSDOM(htmlContent);
      const document = dom.window.document;

      // Remove style and script elements so their content doesn't pollute text searches
      document.querySelectorAll('style, script').forEach(el => el.remove());

      // plainText is used for all regex/text scanning — no tags, no CSS, no JS
      const plainText = document.body?.textContent ?? '';

      // raw is still the original HTML, used only for section-heading detection via tag search
      return {
        text: plainText,
        tables: Array.from(document.querySelectorAll('table')),
        paragraphs: Array.from(document.querySelectorAll('p')),
        headers: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')),
        links: Array.from(document.querySelectorAll('a')),
        raw: htmlContent
      };
    } catch (error) {
      throw new Error(`HTML parsing failed: ${error.message}`);
    }
  }

  /**
   * Process pre-extracted PDF text (text has already been extracted via pdf-parse)
   */
  parsePDF(pdfContent) {
    const lines = pdfContent.split('\n').map(l => l.trim()).filter(Boolean);
    return {
      text: pdfContent,
      lines,
      pageCount: (pdfContent.match(/^\f/gm) || []).length || null,
      raw: pdfContent
    };
  }

  /**
   * Check for duplicate physician certifications
   */
  checkDuplicateCertifications(htmlData) {
    const findings = [];
    const physicianMap = new Map();

    // Extract data from tables
    htmlData.tables.forEach((table, tableIndex) => {
      const rows = Array.from(table.querySelectorAll('tr'));
      
      rows.forEach((row, rowIndex) => {
        const cells = Array.from(row.querySelectorAll('td'));
        if (cells.length === 0) return; // Skip header rows

        const nameCell = cells[0]?.textContent?.trim() || '';
        const certCell = cells[1]?.textContent?.trim() || '';

        // Look for physician indicators (MD, DO, etc.)
        if (this.isPhysician(nameCell)) {
          const key = nameCell.toLowerCase();
          
          if (!physicianMap.has(key)) {
            physicianMap.set(key, {
              name: nameCell,
              count: 0,
              certifications: [],
              tables: []
            });
          }

          const entry = physicianMap.get(key);
          entry.count++;
          entry.certifications.push(certCell);
          entry.tables.push({ tableIndex, rowIndex });
        }
      });
    });

    // Report duplicates
    physicianMap.forEach((physician, key) => {
      if (physician.count > 1) {
        const firstTableIdx = physician.tables[0].tableIndex;
        const tableEl = htmlData.tables[firstTableIdx];
        const section = tableEl ? this.getDOMSection(tableEl) : null;

        // Build a text excerpt from the duplicate rows
        const excerptParts = physician.tables.slice(0, 3).map(({ tableIndex, rowIndex }) => {
          const t = htmlData.tables[tableIndex];
          if (!t) return null;
          const rows = Array.from(t.querySelectorAll('tr'));
          const row = rows[rowIndex];
          if (!row) return null;
          return Array.from(row.querySelectorAll('td'))
            .map(c => c.textContent.trim())
            .filter(Boolean)
            .join(' | ');
        }).filter(Boolean);

        findings.push({
          severity: 'critical',
          title: 'Duplicate Physician Entry',
          content: `${physician.name} appears ${physician.count} times in the faculty roster with certifications: ${[...new Set(physician.certifications)].join(', ')}. This may be a data entry error.`,
          section: section || null,
          excerpt: excerptParts.length > 0 ? excerptParts.join('\n') : null,
          location: `Tables: ${[...new Set(physician.tables.map(t => t.tableIndex))].join(', ')}`,
          resolution: 'Verify faculty roster and consolidate duplicate entries',
          guidelineRefs: this._guidelineRefs(
            'faculty roster duplicate entries board certification credentialing'
          )
        });
      }
    });

    return findings;
  }

  /**
   * Check FTE support consistency
   */
  checkFTESupport(htmlData, pdfData) {
    const findings = [];

    const htmlFTEPattern = /FTE|fte|full\s*time\s*equivalent|full-time\s*equivalent/gi;
    const htmlFTEMatches = htmlData.text.match(htmlFTEPattern) || [];

    const pdfFTEPattern = /(\d+\.?\d*)\s*FTE|full\s*time\s*equivalent.*?(\d+\.?\d*)|FTE.*?(\d+\.?\d*)/gi;
    const pdfFTEMatches = pdfData.text.match(pdfFTEPattern) || [];

    // Extract contextual snippets for FTE mentions in the HTML
    const fteContextMatches = this.extractPattern(
      htmlData.text,
      'FTE|fte|full\\s*time\\s*equivalent|full-time\\s*equivalent',
      3
    );
    const fteSection = fteContextMatches.length > 0
      ? this.getSectionAtIndex(htmlData.raw, fteContextMatches[0].index)
      : null;
    const fteExcerpt = fteContextMatches.length > 0
      ? fteContextMatches.slice(0, 2).map(m => this.stripHTML(m.context)).join(' … ')
      : null;

    if (htmlFTEMatches.length > 0) {
      const fteGuidelineRefs = this._guidelineRefs(
        'program coordinator administrator FTE full-time equivalent support staffing'
      );
      if (pdfFTEMatches.length === 0) {
        findings.push({
          severity: 'warning',
          title: 'Missing FTE Reference in Program Requirements',
          content: 'FTE support is mentioned in the ADS submission but program requirements PDF does not specify required FTE allocation. Please verify program requirements document is complete.',
          section: fteSection,
          excerpt: fteExcerpt,
          resolution: 'Ensure program requirements document includes FTE specifications',
          guidelineRefs: fteGuidelineRefs
        });
      } else {
        findings.push({
          severity: 'success',
          title: 'FTE Information Present in Both Documents',
          content: `Program requirements specify FTE requirements. Found ${pdfFTEMatches.length} FTE references in program requirements. Cross-reference with ADS submission for accuracy.`,
          section: fteSection,
          excerpt: fteExcerpt,
          resolution: 'Manual verification: Compare specific FTE allocations between documents',
          guidelineRefs: fteGuidelineRefs
        });
      }
    } else {
      findings.push({
        severity: 'success',
        title: 'No FTE Discrepancies',
        content: 'FTE support is not mentioned in the ADS submission.',
        resolution: 'No action needed',
        guidelineRefs: this._guidelineRefs(
          'program coordinator administrator FTE full-time equivalent support staffing'
        )
      });
    }

    return findings;
  }

  /**
   * Check for outdated scholarly activity
   */
  checkScholarlyActivity(htmlData) {
    const findings = [];
    const currentYear = new Date().getFullYear();
    const thresholdYear = currentYear - 2;

    const yearPattern = /\b(19|20)\d{2}\b/g;
    const yearsFound = new Set();
    const oldYears = new Set();
    const oldYearMatches = []; // first match per old year, for excerpt/section

    let match;
    const regex = new RegExp(yearPattern);
    while ((match = regex.exec(htmlData.text)) !== null) {
      const year = parseInt(match[0]);
      yearsFound.add(year);

      if (year < thresholdYear && year > 1990) {
        oldYears.add(year);
        if (!oldYearMatches.some(m => m.year === year)) {
          oldYearMatches.push({ year, index: match.index, length: match[0].length });
        }
      }
    }

    if (oldYears.size > 0) {
      const sortedOldYears = Array.from(oldYears).sort().slice(0, 5);

      // Build excerpt from first 2 old year matches
      const excerptParts = oldYearMatches.slice(0, 2).map(m => {
        const start = Math.max(0, m.index - 80);
        const end = Math.min(htmlData.text.length, m.index + m.length + 80);
        return this.stripHTML(htmlData.text.substring(start, end));
      });

      findings.push({
        severity: 'warning',
        title: 'Potentially Outdated Scholarly Activity',
        content: `Found references to scholarly activities from years: ${sortedOldYears.join(', ')}. ACGME typically expects recent scholarly activity. Verify that these are appropriately documented or that more recent activities exist.`,
        section: oldYearMatches.length > 0
          ? this.getSectionAtIndex(htmlData.raw, oldYearMatches[0].index)
          : null,
        excerpt: excerptParts.length > 0 ? excerptParts.join(' … ') : null,
        resolution: 'Review and update scholarly activity references to include more recent years',
        guidelineRefs: this._guidelineRefs(
          'scholarly activity faculty research publications presentations recency requirements'
        )
      });
    } else if (yearsFound.size > 0) {
      const recentYears = Array.from(yearsFound)
        .filter(y => y >= thresholdYear)
        .sort()
        .reverse()
        .slice(0, 3);

      findings.push({
        severity: 'success',
        title: 'Current Scholarly Activity Timeline',
        content: `Scholarly activities appear to be current. Recent years referenced: ${recentYears.join(', ')}`,
        resolution: 'No action needed',
        guidelineRefs: this._guidelineRefs(
          'scholarly activity faculty research publications presentations recency requirements'
        )
      });
    } else {
      findings.push({
        severity: 'warning',
        title: 'No Year References Found',
        content: 'Could not find specific year references in scholarly activity section. Unable to fully assess activity recency.',
        resolution: 'Manually verify that scholarly activities are current and properly dated',
        guidelineRefs: this._guidelineRefs(
          'scholarly activity faculty research publications presentations recency requirements'
        )
      });
    }

    return findings;
  }

  /**
   * Determine if text likely refers to a physician
   */
  isPhysician(name) {
    const physicianIndicators = /\b(MD|DO|DDS|DMD|DVM|PhD|MA|MSc|MBBS)\b/i;
    return physicianIndicators.test(name);
  }

  /**
   * Strip HTML tags and normalize whitespace from a string
   */
  stripHTML(str) {
    return str
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z#0-9]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Get the nearest section heading before a character position in raw HTML
   */
  getSectionAtIndex(rawHTML, index) {
    const headingPattern = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;
    let lastHeading = null;
    let match;
    while ((match = headingPattern.exec(rawHTML)) !== null) {
      if (match.index >= index) break;
      const text = match[1].replace(/<[^>]+>/g, '').trim();
      if (text) lastHeading = text;
    }
    return lastHeading;
  }

  /**
   * Get the nearest section heading by walking back through the DOM
   */
  getDOMSection(element) {
    let el = element;
    while (el) {
      let sibling = el.previousElementSibling;
      while (sibling) {
        if (/^H[1-6]$/.test(sibling.tagName)) {
          return sibling.textContent.trim();
        }
        sibling = sibling.previousElementSibling;
      }
      el = el.parentElement;
    }
    return null;
  }

  /**
   * Extract specific patterns from text
   */
  extractPattern(text, pattern, limit = 10) {
    const matches = [];
    const regex = new RegExp(pattern, 'gi');
    let match;
    
    while ((match = regex.exec(text)) !== null && matches.length < limit) {
      matches.push({
        text: match[0],
        index: match.index,
        context: text.substring(
          Math.max(0, match.index - 50),
          Math.min(text.length, match.index + match[0].length + 50)
        )
      });
    }
    
    return matches;
  }
}

export default DocumentAnalyzer;
