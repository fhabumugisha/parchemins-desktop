import mammoth from 'mammoth';
import { parseMetadata } from './utils';
import type { ExtractedContent } from './markdown.extractor';

export async function extractDocx(filePath: string): Promise<ExtractedContent> {
  const result = await mammoth.extractRawText({ path: filePath });
  const content = result.value.trim();

  // Log any warnings from mammoth
  if (result.messages.length > 0) {
    console.warn('Mammoth warnings for', filePath, result.messages);
  }

  const metadata = parseMetadata(content);

  return {
    content,
    title: metadata.title,
    date: metadata.date,
    bibleRef: metadata.bibleRef,
  };
}
