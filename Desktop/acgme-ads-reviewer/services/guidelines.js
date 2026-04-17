/**
 * ACGME Guidelines Service
 * Fetches and caches the ACGME Common Program Requirements (Fellowship) PDF.
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import { buildGuidelinesIndex } from './rag.js';
import { extractPDFText } from './pdfExtract.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '..', 'data');
const CACHE_PATH = path.join(CACHE_DIR, 'acgme-guidelines.pdf');

export const GUIDELINES_URL =
  'https://www.acgme.org/globalassets/pdfs/guide-to-the-common-program-requirements-fellowship.pdf';

let cachedText = null;

/**
 * Returns extracted text from the ACGME guidelines PDF.
 * Uses memory cache → disk cache → remote fetch, in that order.
 */
export async function getGuidelinesText() {
  if (cachedText) return cachedText;

  if (fs.existsSync(CACHE_PATH)) {
    try {
      const buffer = fs.readFileSync(CACHE_PATH);
      cachedText = await extractPDFText(buffer);
      console.log('📄 ACGME guidelines loaded from disk cache.');
      buildGuidelinesIndex(cachedText);
      return cachedText;
    } catch (err) {
      console.warn('⚠️  Disk-cached guidelines PDF unreadable, re-fetching:', err.message);
    }
  }

  console.log('🌐 Fetching ACGME guidelines PDF from acgme.org …');
  const buffer = await fetchWithRedirects(GUIDELINES_URL);
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE_PATH, buffer);
  console.log('✅ ACGME guidelines PDF cached to disk.');

  cachedText = await extractPDFText(buffer);
  buildGuidelinesIndex(cachedText);
  return cachedText;
}

/**
 * Kick off the fetch in the background so it's warm before the first request.
 */
export function prefetchGuidelines() {
  getGuidelinesText().catch(err => {
    console.warn('⚠️  Could not pre-fetch ACGME guidelines:', err.message);
  });
}

/** Follow up to 5 redirects, return a Buffer. */
function fetchWithRedirects(url, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    if (redirectsLeft === 0) {
      return reject(new Error('Too many redirects fetching guidelines PDF'));
    }
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'acgme-ads-reviewer/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchWithRedirects(res.headers.location, redirectsLeft - 1)
          .then(resolve)
          .catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} fetching guidelines PDF`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}
