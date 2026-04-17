/**
 * Thin wrapper around pdf-parse v2's class-based API.
 * Hides the breaking change from v1 (pdfParse(buffer) → new PDFParse({data}).getText()).
 */
import { PDFParse } from 'pdf-parse';

/**
 * Extract plain text from a PDF Buffer.
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
export async function extractPDFText(buffer) {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text;
}
