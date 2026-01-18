import AdmZip from 'adm-zip';
import { parseMetadata } from './utils';
import type { ExtractedContent } from './markdown.extractor';

export async function extractOdt(filePath: string): Promise<ExtractedContent> {
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
}
