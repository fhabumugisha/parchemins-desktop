import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import {
  insertDocument,
  getDocumentByPath,
  updateDocument,
  deleteDocument,
  getAllDocuments,
} from './database.service';
import { extractText } from '../extractors';
import { SUPPORTED_EXTENSIONS } from '../../shared/constants';
import type { IndexingProgress, IndexingResult } from '../../shared/types';

type ProgressCallback = (progress: IndexingProgress) => void;

// Operation-specific cancellation support to avoid race conditions
let currentOperationId = 0;
let cancelledOperationId: number | null = null;

export function cancelIndexing(): boolean {
  if (currentOperationId > 0 && cancelledOperationId !== currentOperationId) {
    cancelledOperationId = currentOperationId;
    return true;
  }
  return false;
}

export function isIndexingCancelled(): boolean {
  return cancelledOperationId === currentOperationId;
}

function startNewOperation(): number {
  currentOperationId++;
  return currentOperationId;
}

function isOperationCancelled(operationId: number): boolean {
  return cancelledOperationId === operationId;
}

function cleanupOperation(operationId: number): void {
  // Only clear cancelled state if this operation was the one cancelled
  if (cancelledOperationId === operationId) {
    cancelledOperationId = null;
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function indexFolder(
  folderPath: string,
  onProgress?: ProgressCallback,
  forceReindex = false
): Promise<IndexingResult> {
  const operationId = startNewOperation();
  const result: IndexingResult = { added: 0, updated: 0, removed: 0, errors: [], cancelled: false };

  try {
    // Get all supported files recursively
    const files = await getFilesRecursive(folderPath);
    const supportedFiles = files.filter(f =>
      SUPPORTED_EXTENSIONS.includes(path.extname(f).toLowerCase())
    );

    // Index each file
    for (let i = 0; i < supportedFiles.length; i++) {
      // Check for cancellation with operation-specific token
      if (isOperationCancelled(operationId)) {
        result.cancelled = true;
        break;
      }

      const filePath = supportedFiles[i];

      onProgress?.({
        total: supportedFiles.length,
        current: i + 1,
        currentFile: path.basename(filePath),
      });

      try {
        const status = await indexFile(filePath, forceReindex);
        if (status === 'added') result.added++;
        else if (status === 'updated') result.updated++;
      } catch (error) {
        const errorMessage = `${path.basename(filePath)}: ${getErrorMessage(error)}`;
        result.errors.push(errorMessage);
        console.error('[Indexer] Indexing error:', errorMessage);
      }
    }

    // Remove deleted documents (only if not cancelled)
    if (!isOperationCancelled(operationId)) {
      result.removed = await removeDeletedDocuments(folderPath);
    }

    return result;
  } finally {
    cleanupOperation(operationId);
  }
}

export async function forceReindexFolder(
  folderPath: string,
  onProgress?: ProgressCallback
): Promise<IndexingResult> {
  return indexFolder(folderPath, onProgress, true);
}

async function indexFile(filePath: string, forceReindex = false): Promise<'added' | 'updated' | 'unchanged'> {
  // Calculate file hash
  const fileBuffer = await fs.readFile(filePath);
  const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');

  // Check if document already exists
  const existing = getDocumentByPath(filePath);

  if (existing && !forceReindex) {
    // If hash matches, no update needed
    if (existing.hash === hash) {
      return 'unchanged';
    }
  }

  // Extract text and metadata
  const extracted = await extractText(filePath);

  // Calculate word count
  const wordCount = extracted.content.split(/\s+/).filter(w => w.length > 0).length;

  // Prepare document data
  const doc = {
    path: filePath,
    title: extracted.title || path.basename(filePath, path.extname(filePath)),
    content: extracted.content,
    date: extracted.date || null,
    bible_ref: extracted.bibleRef || null,
    word_count: wordCount,
    hash,
  };

  if (existing) {
    updateDocument(existing.id, doc);
    return 'updated';
  } else {
    insertDocument(doc);
    return 'added';
  }
}

async function getFilesRecursive(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    // Skip hidden files and directories
    if (entry.name.startsWith('.')) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await getFilesRecursive(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

async function removeDeletedDocuments(folderPath: string): Promise<number> {
  // Normalize the folder path for consistent comparison
  const normalizedFolderPath = path.normalize(folderPath);
  const documents = getAllDocuments();
  let removed = 0;

  for (const doc of documents) {
    // Normalize document path and check if it's within the watched folder
    const normalizedDocPath = path.normalize(doc.path);
    if (!normalizedDocPath.startsWith(normalizedFolderPath + path.sep) &&
        normalizedDocPath !== normalizedFolderPath) {
      continue;
    }

    try {
      await fs.access(doc.path);
    } catch {
      // File no longer exists
      deleteDocument(doc.id);
      removed++;
    }
  }

  return removed;
}

export async function reindexFile(filePath: string): Promise<void> {
  try {
    await indexFile(filePath);
  } catch (error) {
    console.error('[Indexer] Failed to reindex file:', filePath, error);
  }
}

export function removeFileFromIndex(filePath: string): void {
  const doc = getDocumentByPath(filePath);
  if (doc) {
    deleteDocument(doc.id);
  }
}
