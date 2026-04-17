/**
 * RAG (Retrieval-Augmented Generation) index for the ACGME guidelines PDF.
 *
 * Uses TF-IDF + cosine similarity — no external packages required.
 * The ACGME CPR document uses highly specific terminology, so keyword-based
 * retrieval works very well here.
 */

// ─── Text utilities ────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','must',
  'shall','that','this','these','those','it','its','as','if','not','no',
  'so','each','any','all','some','such','than','then','when','where',
  'which','who','how','what','also','into','their','they','them','its',
  'there','about','more','other','can','only','over','new','after',
  'between','under','during','within','through','i','ii','iii','iv','v',
  'vi','vii','viii','ix','x','e','g','ie','et','al'
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(t => t.length > 2 && !STOPWORDS.has(t));
}

// ─── PDF text cleanup ──────────────────────────────────────────────────────

function cleanPDFText(text) {
  return text
    .replace(/\f/g, '\n')                          // form feeds
    .replace(/Page \d+( of \d+)?/gi, '')           // page numbers
    .replace(/^\s*\d+\s*$/gm, '')                  // lone number lines
    .replace(/ACGME [^\n]{0,80}Requirements[^\n]*/gi, '') // repeated headers
    .replace(/©\s*\d{4}[^\n]*/g, '')               // copyright lines
    .replace(/\n{3,}/g, '\n\n')                    // collapse blank lines
    .trim();
}

// ─── Chunking ─────────────────────────────────────────────────────────────

/**
 * Split cleaned PDF text into overlapping chunks, tracking the nearest
 * section heading (Roman numeral / letter / number pattern) for each chunk.
 */
export function chunkDocument(text, targetWords = 250, overlapWords = 50) {
  const cleaned = cleanPDFText(text);

  // Pattern for ACGME section headings:
  // "IV.B.2.a) Faculty" or "A. Eligibility" or "1. The program must..."
  const headingRe = /^(?:[IVXivx]+\.|[A-Z]\.|(?:[IVXivx]+\.)?[A-Z]\.(?:\d+\.)?(?:[a-z]\))?)\s+\S/m;

  const paragraphs = cleaned.split(/\n\n+/).map(p => p.replace(/\n/g, ' ').trim()).filter(p => p.length > 15);

  const chunks = [];
  let sectionHeading = 'Introduction';
  let wordBuffer = [];
  let bufferSource = sectionHeading;

  function flush(heading) {
    if (wordBuffer.length < 10) return;
    const chunkText = wordBuffer.join(' ');
    chunks.push({ text: chunkText, section: bufferSource });
    // Keep overlap
    wordBuffer = wordBuffer.slice(-overlapWords);
    bufferSource = heading || bufferSource;
  }

  for (const para of paragraphs) {
    // Detect heading
    if (headingRe.test(para) && para.length < 200) {
      // Start a fresh chunk at each major heading
      flush(para);
      sectionHeading = para.substring(0, 120);
      bufferSource = sectionHeading;
    }

    const words = para.split(/\s+/);
    wordBuffer.push(...words);

    if (wordBuffer.length >= targetWords) {
      flush(sectionHeading);
    }
  }
  flush(sectionHeading);

  return chunks;
}

// ─── TF-IDF index ─────────────────────────────────────────────────────────

class TFIDFIndex {
  constructor(chunks) {
    this.chunks = chunks;
    this._idf = {};
    this._tfVectors = [];
    this._build();
  }

  _build() {
    const df = {};
    const docTokenSets = this.chunks.map(chunk => {
      const tokens = tokenize(chunk.text);
      const tf = {};
      for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
      for (const t of Object.keys(tf)) df[t] = (df[t] || 0) + 1;
      return tf;
    });

    const N = this.chunks.length;
    for (const [t, freq] of Object.entries(df)) {
      this._idf[t] = Math.log((N + 1) / (freq + 1)) + 1; // smoothed
    }

    this._tfVectors = docTokenSets.map(tf => {
      const total = Object.values(tf).reduce((a, b) => a + b, 0);
      const vec = {};
      for (const [t, count] of Object.entries(tf)) {
        vec[t] = (count / total) * (this._idf[t] || 0);
      }
      return vec;
    });
  }

  _cosine(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (const [k, va] of Object.entries(a)) {
      const vb = b[k] || 0;
      dot += va * vb;
      normA += va * va;
    }
    for (const vb of Object.values(b)) normB += vb * vb;
    return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
  }

  /**
   * Return top-k chunks most relevant to queryText, with score > 0.
   */
  query(queryText, topK = 3) {
    const qTokens = tokenize(queryText);
    const total = qTokens.length || 1;
    const qVec = {};
    for (const t of qTokens) {
      qVec[t] = ((qVec[t] || 0) + 1 / total) * (this._idf[t] || 0);
    }

    const scored = this._tfVectors
      .map((vec, i) => ({ score: this._cosine(qVec, vec), i }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored.map(({ i, score }) => ({
      section: this.chunks[i].section,
      text: this.chunks[i].text,
      score
    }));
  }
}

// ─── Public API ───────────────────────────────────────────────────────────

let _index = null;

/**
 * Build (or rebuild) the TF-IDF index from full guideline text.
 * Call once after the PDF is loaded; subsequent calls are no-ops unless
 * `force` is true.
 */
export function buildGuidelinesIndex(text, force = false) {
  if (_index && !force) return;
  const chunks = chunkDocument(text);
  _index = new TFIDFIndex(chunks);
  console.log(`📚 RAG index built: ${chunks.length} chunks from ACGME guidelines.`);
}

/**
 * Query the index. Returns up to topK results, each with { section, text, score }.
 * Returns [] if the index hasn't been built yet.
 */
export function queryGuidelines(queryText, topK = 2) {
  if (!_index) return [];
  return _index.query(queryText, topK);
}
