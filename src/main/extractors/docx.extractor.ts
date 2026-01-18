import mammoth from 'mammoth';
import TurndownService from 'turndown';
import { parseMetadata } from './utils';
import type { ExtractedContent } from './markdown.extractor';

// Configure Turndown for better Markdown output
const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
});

export async function extractDocx(filePath: string): Promise<ExtractedContent> {
  // Convert to HTML to preserve formatting (headings, bold, lists, etc.)
  const result = await mammoth.convertToHtml({ path: filePath });
  const html = result.value;

  // Log any warnings from mammoth
  if (result.messages.length > 0) {
    console.warn('Mammoth warnings for', filePath, result.messages);
  }

  // Convert HTML to Markdown
  const content = turndown.turndown(html).trim();

  const metadata = parseMetadata(content);

  return {
    content,
    title: metadata.title,
    date: metadata.date,
    bibleRef: metadata.bibleRef,
  };
}
