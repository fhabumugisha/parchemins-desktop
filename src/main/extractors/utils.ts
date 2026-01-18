import { stat } from 'fs/promises';
import { MAX_FILE_SIZE } from '../../shared/constants';

export interface ParsedMetadata {
  title?: string;
  date?: string;
  bibleRef?: string;
}

export function parseMetadata(content: string): ParsedMetadata {
  const result: ParsedMetadata = {};

  // TITLE EXTRACTION
  // Try to find title from:
  // 1. First markdown H1: # Title
  // 2. First bold line: **Title**
  // 3. First line if short enough
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    result.title = h1Match[1].trim();
  } else {
    const boldMatch = content.match(/^\*\*(.+)\*\*$/m);
    if (boldMatch) {
      result.title = boldMatch[1].trim();
    } else {
      // Use first line if it's short (likely a title)
      const firstLine = content.split('\n')[0].trim();
      if (firstLine.length > 0 && firstLine.length < 100) {
        result.title = firstLine;
      }
    }
  }

  // DATE EXTRACTION
  // Try multiple patterns common in French sermon documents
  const datePatterns = [
    /\*\*Date\*\*\s*:\s*(\d{1,2}\s+\w+\s+\d{4})/i,
    /Date\s*:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
    /Date\s*:\s*(\d{1,2}\s+\w+\s+\d{4})/i,
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    /(\d{1,2}\s+(?:janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre)\s+\d{4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match) {
      result.date = normalizeDate(match[1]);
      break;
    }
  }

  // BIBLE REFERENCE EXTRACTION
  // Common patterns in French sermons
  const biblePatterns = [
    /\*\*Texte\*\*\s*:\s*([A-Za-zÀ-ÿ]+\s+\d+[:\d\-,\s]*)/i,
    /Texte\s*:\s*([A-Za-zÀ-ÿ]+\s+\d+[:\d\-,\s]*)/i,
    /Lecture\s*:\s*([A-Za-zÀ-ÿ]+\s+\d+[:\d\-,\s]*)/i,
    /Reference\s*:\s*([A-Za-zÀ-ÿ]+\s+\d+[:\d\-,\s]*)/i,
    /Référence\s*:\s*([A-Za-zÀ-ÿ]+\s+\d+[:\d\-,\s]*)/i,
    /\*\*Reference\*\*\s*:\s*([A-Za-zÀ-ÿ]+\s+\d+[:\d\-,\s]*)/i,
    /\*\*Référence\*\*\s*:\s*([A-Za-zÀ-ÿ]+\s+\d+[:\d\-,\s]*)/i,
  ];

  for (const pattern of biblePatterns) {
    const match = content.match(pattern);
    if (match) {
      result.bibleRef = match[1].trim();
      break;
    }
  }

  return result;
}

// Helper function to normalize dates to YYYY-MM-DD format
function normalizeDate(dateStr: string): string {
  // Already in ISO format
  const isoMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return dateStr;

  // French format DD/MM/YYYY
  const frMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (frMatch) {
    const [, day, month, year] = frMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // French text format "15 janvier 2024"
  const frenchMonths: Record<string, string> = {
    janvier: '01',
    fevrier: '02',
    février: '02',
    mars: '03',
    avril: '04',
    mai: '05',
    juin: '06',
    juillet: '07',
    aout: '08',
    août: '08',
    septembre: '09',
    octobre: '10',
    novembre: '11',
    decembre: '12',
    décembre: '12',
  };

  const textMatch = dateStr.toLowerCase().match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (textMatch) {
    const [, day, monthName, year] = textMatch;
    // Normalize accents for lookup
    const normalizedMonth = monthName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const month = frenchMonths[normalizedMonth] || frenchMonths[monthName];
    if (month) {
      return `${year}-${month}-${day.padStart(2, '0')}`;
    }
  }

  // Return original if cannot normalize
  return dateStr;
}

export async function checkFileSize(filePath: string): Promise<void> {
  const stats = await stat(filePath);
  if (stats.size > MAX_FILE_SIZE) {
    const sizeMB = Math.round(stats.size / 1024 / 1024);
    throw new Error(`Fichier trop volumineux: ${sizeMB}MB (max: 50MB)`);
  }
}
