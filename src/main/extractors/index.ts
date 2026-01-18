import { extname } from 'path';
import { checkFileSize } from './utils';
import { extractMarkdown, type ExtractedContent } from './markdown.extractor';
import { extractDocx } from './docx.extractor';
import { extractOdt } from './odt.extractor';
import { extractPdf } from './pdf.extractor';

// Re-export the ExtractedContent type for external use
export type { ExtractedContent };

// Map of supported extensions to their extractors
const extractors: Record<string, (filePath: string) => Promise<ExtractedContent>> = {
  '.md': extractMarkdown,
  '.txt': extractMarkdown,
  '.docx': extractDocx,
  '.odt': extractOdt,
  '.pdf': extractPdf,
};

/**
 * Extract text content and metadata from a document file.
 * Supports: .md, .txt, .docx, .odt, .pdf
 *
 * @param filePath - Absolute path to the file
 * @returns Extracted content with optional title, date, and Bible reference
 * @throws Error if file is too large or extension is not supported
 */
export async function extractText(filePath: string): Promise<ExtractedContent> {
  // Check file size before processing
  await checkFileSize(filePath);

  const ext = extname(filePath).toLowerCase();
  const extractor = extractors[ext];

  if (!extractor) {
    throw new Error(`Extension non supportée: ${ext}`);
  }

  return extractor(filePath);
}

// Re-export individual extractors for direct use if needed
export { extractMarkdown } from './markdown.extractor';
export { extractDocx } from './docx.extractor';
export { extractOdt } from './odt.extractor';
export { extractPdf } from './pdf.extractor';
export { checkFileSize, parseMetadata } from './utils';
