/**
 * UI Utilities
 * Handles UI state and rendering
 */

const ui = {
  // File tracking
  uploadedFiles: {
    html: null,
    pdf: null
  },

  /**
   * Initialize file input listeners and drag-and-drop zones
   */
  initializeFileInputs() {
    this.setupDropZone('htmlDropZone', 'htmlFile', 'htmlFileInfo');
  },

  /**
   * Wire up a drop zone: drag events, click-to-browse, and file input change.
   * For the ADS drop zone, detects whether a PDF or HTML file was dropped and
   * stores it under the correct key ('html' or 'pdf').
   */
  setupDropZone(zoneId, inputId, infoId) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);
    if (!zone || !input) return;

    const accept = (file) => {
      const key = file.type === 'application/pdf' ? 'pdf' : 'html';
      // Clear the other key so we don't send both
      this.uploadedFiles.html = null;
      this.uploadedFiles.pdf = null;
      this.uploadedFiles[key] = file;
      this.updateFileInfo(infoId, file, 'success');
      this.setDropZoneAccepted(zone, file.name);
    };

    zone.addEventListener('click', () => input.click());

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) accept(file);
    });

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', (e) => {
      if (!zone.contains(e.relatedTarget)) zone.classList.remove('drag-over');
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) accept(file);
    });
  },

  /**
   * Update drop zone to show the accepted file name
   */
  setDropZoneAccepted(zone, fileName) {
    zone.classList.add('has-file');
    const primary = zone.querySelector('.drop-zone-primary');
    const secondary = zone.querySelector('.drop-zone-secondary');
    const icon = zone.querySelector('.drop-zone-icon');
    if (primary) primary.textContent = fileName;
    if (secondary) secondary.textContent = 'Click to replace';
    if (icon) icon.textContent = '✓';
  },

  /**
   * Update file info display
   */
  updateFileInfo(elementId, file, status) {
    const el = document.getElementById(elementId);
    if (file) {
      const sizeKB = (file.size / 1024).toFixed(1);
      el.innerHTML = `<div class="file-info ${status === 'error' ? 'error' : ''}">
          ${status === 'success' ? '✓' : '⚠'} ${file.name} (${sizeKB} KB)
      </div>`;
    }
  },

  /**
   * Display results
   */
  displayResults(results) {
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.classList.remove('hidden');

    // Display stats
    const summary = results.data.summary;
    const statsHTML = `
        <div class="stats">
            <div class="stat-box">
                <div class="stat-number" style="color: ${summary.criticalCount > 0 ? 'var(--error)' : 'var(--success)'}">
                    ${summary.criticalCount}
                </div>
                <div class="stat-label">Critical Issues</div>
            </div>
            <div class="stat-box">
                <div class="stat-number" style="color: var(--warning)">
                    ${summary.warningCount}
                </div>
                <div class="stat-label">Warnings</div>
            </div>
            <div class="stat-box">
                <div class="stat-number" style="color: var(--success)">
                    ${summary.passCount}
                </div>
                <div class="stat-label">Checks Passed</div>
            </div>
        </div>
    `;
    document.getElementById('statsContainer').innerHTML = statsHTML;

    // Display summary — list every non-success finding directly
    const allFindings = [
      ...results.data.duplicateCertifications,
      ...results.data.ftePairing,
      ...results.data.scholarlyActivity
    ].filter(f => f.severity !== 'success');

    let summaryHTML = '';
    if (allFindings.length === 0) {
      summaryHTML = '<div class="empty-state"><div class="empty-state-icon">✓</div><p>No issues detected. Documents appear to be in good order.</p></div>';
    } else {
      summaryHTML = allFindings.map(f => `
        <div class="summary-issue ${f.severity}">
          <div class="summary-issue-header">
            <span class="severity-badge ${f.severity}">${f.severity}</span>
            <span class="summary-issue-title">${f.title}</span>
          </div>
          <div class="summary-issue-content">${f.content}</div>
          ${f.resolution ? `<div class="summary-issue-resolution">💡 ${f.resolution}</div>` : ''}
        </div>`).join('');
    }
    document.getElementById('summary').innerHTML = summaryHTML;

    // Display findings
    this.displayFindings('duplicates', results.data.duplicateCertifications);
    this.displayFindings('fte', results.data.ftePairing);
    this.displayFindings('scholarly', results.data.scholarlyActivity);

    // Scroll to results
    setTimeout(() => {
      document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
    }, 100);
  },

  /**
   * Display findings in a tab
   */
  displayFindings(tabId, findings) {
    let html = '';
    if (findings.length === 0) {
      html = '<div class="empty-state"><p>No findings in this category.</p></div>';
    } else {
      findings.forEach(finding => {
        const excerptLines = finding.excerpt
          ? finding.excerpt.split('\n').map(l => l.trim()).filter(Boolean)
          : [];
        const guidelineHTML = (finding.guidelineRefs || []).map(ref => `
            <div class="guideline-cite">
                <div class="guideline-cite-header">
                    <span class="guideline-cite-icon">📖</span>
                    <span class="guideline-cite-section">${ref.section}</span>
                </div>
                <div class="guideline-cite-text">${ref.snippet}</div>
            </div>`).join('');

        html += `
            <div class="finding ${finding.severity}">
                <div class="finding-title">
                    ${finding.title}
                    <span class="severity-badge ${finding.severity}">${finding.severity}</span>
                </div>
                ${finding.section ? `<div class="finding-section">📑 ${finding.section}</div>` : ''}
                <div class="finding-content">${finding.content}</div>
                ${excerptLines.length > 0 ? `<blockquote class="finding-excerpt">${excerptLines.map(l => `<span>${l}</span>`).join('<br>')}</blockquote>` : ''}
                ${finding.location ? `<div class="finding-location">📍 ${finding.location}</div>` : ''}
                ${guidelineHTML ? `<div class="guideline-cites">${guidelineHTML}</div>` : ''}
                ${finding.resolution ? `<div class="finding-resolution">💡 ${finding.resolution}</div>` : ''}
            </div>
        `;
      });
    }
    document.getElementById(tabId).innerHTML = html;
  },

  /**
   * Switch between tabs
   */
  switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });

    // Show selected tab
    const tabElement = document.getElementById(tabName);
    if (tabElement) {
      tabElement.classList.add('active');
    }

    // Mark button as active
    event?.target?.classList?.add('active');
  },

  /**
   * Reset form
   */
  resetForm() {
    document.getElementById('htmlFile').value = '';
    document.getElementById('pdfFile').value = '';
    document.getElementById('azureKey').value = '';
    document.getElementById('azureEndpoint').value = '';
    document.getElementById('htmlFileInfo').innerHTML = '';
    document.getElementById('pdfFileInfo').innerHTML = '';
    document.getElementById('resultsSection').classList.add('hidden');
    this.uploadedFiles = { html: null, pdf: null };

    // Restore drop zone labels
    [
      { zoneId: 'htmlDropZone', primary: 'Drag & drop your HTML file here', hint: '.html / .htm', icon: '📄' }
    ].forEach(({ zoneId, primary, hint, icon }) => {
      const zone = document.getElementById(zoneId);
      if (!zone) return;
      zone.classList.remove('has-file');
      const el = zone.querySelector('.drop-zone-primary');
      const sec = zone.querySelector('.drop-zone-secondary');
      const ico = zone.querySelector('.drop-zone-icon');
      if (el) el.textContent = primary;
      if (sec) sec.innerHTML = 'or <span class="drop-zone-link">click to browse</span>';
      if (ico) ico.textContent = icon;
    });
  },

  /**
   * Show error notification
   */
  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = '❌ ' + message;
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '20px';
    errorDiv.style.right = '20px';
    errorDiv.style.zIndex = '1000';
    errorDiv.style.maxWidth = '400px';
    errorDiv.style.animation = 'slideDown 0.3s ease-out';
    document.body.appendChild(errorDiv);

    setTimeout(() => errorDiv.remove(), 5000);
  },

  /**
   * Show success notification
   */
  showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = '✓ ' + message;
    successDiv.style.position = 'fixed';
    successDiv.style.top = '20px';
    successDiv.style.right = '20px';
    successDiv.style.zIndex = '1000';
    successDiv.style.maxWidth = '400px';
    successDiv.style.animation = 'slideDown 0.3s ease-out';
    document.body.appendChild(successDiv);

    setTimeout(() => successDiv.remove(), 4000);
  },

  /**
   * Set button loading state
   */
  setButtonLoading(buttonId, isLoading) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    if (isLoading) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Analyzing...';
    } else {
      btn.disabled = false;
      btn.innerHTML = '✓ Analyze Documents';
    }
  }
};

window.ui = ui;
