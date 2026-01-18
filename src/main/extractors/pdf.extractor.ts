import { readFile } from 'fs/promises';
import { createRequire } from 'module';
import { parseMetadata } from './utils';
import type { ExtractedContent } from './markdown.extractor';

// Use legacy build for Node.js environment (no DOM APIs like DOMMatrix)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsLib: any = null;
let workerConfigured = false;

async function getPdfjs() {
  if (!pdfjsLib) {
    // Use legacy build which doesn't require DOM APIs
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

    // Configure worker path for Node.js environment using require.resolve
    if (!workerConfigured && pdfjsLib.GlobalWorkerOptions) {
      try {
        // Use createRequire to resolve the worker path from node_modules
        const require = createRequire(import.meta.url);
        const workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
        // Convert Windows path to file:// URL format
        const { pathToFileURL } = await import('url');
        const workerUrl = pathToFileURL(workerPath).href;
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
      } catch (error) {
        console.warn('[PDF Extractor] Could not resolve worker path:', error);
        // Fallback: try to disable worker entirely
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      }
      workerConfigured = true;
    }
  }
  return pdfjsLib;
}

export async function extractPdf(filePath: string): Promise<ExtractedContent> {
  const pdfjs = await getPdfjs();
  const buffer = await readFile(filePath);

  // Convert Buffer to Uint8Array for pdfjs
  const data = new Uint8Array(buffer);

  // Load the PDF document
  const loadingTask = pdfjs.getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: true,
    isEvalSupported: false,
  });

  const pdfDocument = await loadingTask.promise;

  // Extract text from all pages
  const textParts: string[] = [];
  let pdfTitle: string | undefined;

  // Try to get title from metadata
  try {
    const metadata = await pdfDocument.getMetadata();
    if (metadata.info && typeof metadata.info === 'object' && 'Title' in metadata.info) {
      pdfTitle = metadata.info.Title as string;
    }
  } catch {
    // Metadata not available
  }

  // Extract text from each page
  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();

    const pageText = textContent.items
      .map((item: { str?: string }) => {
        if ('str' in item) {
          return item.str;
        }
        return '';
      })
      .join(' ');

    textParts.push(pageText);
  }

  // Clean up the text
  const content = textParts
    .join('\n\n')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Parse metadata from content
  const metadata = parseMetadata(content);

  return {
    content,
    title: metadata.title || pdfTitle,
    date: metadata.date,
    bibleRef: metadata.bibleRef,
  };
}
