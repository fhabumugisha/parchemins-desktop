import AdmZip from 'adm-zip';
import path from 'path';
import { parseMetadata } from './utils';
import type { ExtractedContent } from './markdown.extractor';

export async function extractOdt(filePath: string): Promise<ExtractedContent> {
  try {
    // ODT files are ZIP archives containing XML
    const zip = new AdmZip(filePath);
    const contentXml = zip.readAsText('content.xml');

    // Extract text from XML (basic approach)
    // Replace paragraph tags with newlines, then strip all XML tags
    const content = contentXml
      .replace(/<text:p[^>]*>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const metadata = parseMetadata(content);

    return {
      content,
      title: metadata.title,
      date: metadata.date,
      bibleRef: metadata.bibleRef,
    };
  } catch (error) {
    console.error('[ODT Extractor] Failed to extract:', filePath, error);
    // Return empty content with filename as title on error
    return {
      content: '',
      title: path.basename(filePath, path.extname(filePath)),
      date: undefined,
      bibleRef: undefined,
    };
  }
}
