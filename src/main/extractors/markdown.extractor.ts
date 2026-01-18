import { readFile } from 'fs/promises';
import { parseMetadata } from './utils';

export interface ExtractedContent {
  content: string;
  title?: string;
  date?: string;
  bibleRef?: string;
}

export async function extractMarkdown(filePath: string): Promise<ExtractedContent> {
  const content = await readFile(filePath, 'utf-8');
  const trimmedContent = content.trim();

  const metadata = parseMetadata(trimmedContent);

  return {
    content: trimmedContent,
    title: metadata.title,
    date: metadata.date,
    bibleRef: metadata.bibleRef,
  };
}
