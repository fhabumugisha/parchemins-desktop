import { readFile } from 'fs/promises';
import { createRequire } from 'module';
import path from 'path';
import { parseMetadata } from './utils';
import type { ExtractedContent } from './markdown.extractor';

// Constants
const PDF_LINE_Y_THRESHOLD = 5;
const PDF_DEFAULT_LINE_HEIGHT = 12;

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pdfDocument: any = null;

  try {
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

    pdfDocument = await loadingTask.promise;

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

    // Extract text from each page with better structure detection
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();

      // Group text items by their Y position to detect lines
      interface TextItem {
        str: string;
        transform?: number[];
        height?: number;
      }

      const lines: { y: number; text: string; height: number }[] = [];
      let currentLine = { y: 0, text: '', height: PDF_DEFAULT_LINE_HEIGHT };

      for (const item of textContent.items as TextItem[]) {
        if (!item.str) continue;

        const y = item.transform ? Math.round(item.transform[5]) : 0;
        const height = item.height || PDF_DEFAULT_LINE_HEIGHT;

        // If Y position changed significantly, start a new line
        if (Math.abs(y - currentLine.y) > PDF_LINE_Y_THRESHOLD && currentLine.text) {
          lines.push({ ...currentLine });
          currentLine = { y, text: item.str, height };
        } else {
          currentLine.text += (currentLine.text ? ' ' : '') + item.str;
          currentLine.y = y;
          currentLine.height = Math.max(currentLine.height, height);
        }
      }

      if (currentLine.text) {
        lines.push(currentLine);
      }

      // Sort lines by Y position (top to bottom)
      lines.sort((a, b) => b.y - a.y);

      // Build page text with paragraph detection
      const pageLines: string[] = [];
      let prevY = lines[0]?.y || 0;

      for (const line of lines) {
        const gap = prevY - line.y;
        const text = line.text.trim();

        if (!text) continue;

        // Large gap = new paragraph
        if (gap > line.height * 1.5 && pageLines.length > 0) {
          pageLines.push('');
        }

        pageLines.push(text);
        prevY = line.y;
      }

      textParts.push(pageLines.join('\n'));
    }

    // Clean up the text
    const content = textParts
      .join('\n\n')
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Parse metadata from content
    const metadata = parseMetadata(content);

    return {
      content,
      title: metadata.title || pdfTitle,
      date: metadata.date,
      bibleRef: metadata.bibleRef,
    };
  } catch (error) {
    console.error('[PDF Extractor] Failed to extract:', filePath, error);
    // Return empty content with filename as title on error
    return {
      content: '',
      title: path.basename(filePath, path.extname(filePath)),
      date: undefined,
      bibleRef: undefined,
    };
  } finally {
    // Clean up PDF document to prevent memory leaks
    if (pdfDocument) {
      try {
        pdfDocument.destroy();
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
