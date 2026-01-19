import chokidar, { FSWatcher } from 'chokidar';
import path from 'path';
import { getSetting } from './database.service';
import { indexFolder, reindexFile, removeFileFromIndex } from './indexer.service';
import { SUPPORTED_EXTENSIONS } from '../../shared/constants';
import type { IndexingProgress, IndexingResult } from '../../shared/types';

let watcher: FSWatcher | null = null;
let currentFolderPath: string | null = null;

type ProgressCallback = (progress: IndexingProgress) => void;
type ResultCallback = (result: IndexingResult) => void;

export async function initWatcher(): Promise<void> {
  const folderPath = getSetting('sermons_folder');

  if (folderPath) {
    console.log('[Watcher] Auto-starting watcher for:', folderPath);
    await startWatcher(folderPath);
  } else {
    console.log('[Watcher] No sermons folder configured, watcher not started');
  }
}

export async function startWatcher(
  folderPath: string,
  onProgress?: ProgressCallback,
  onComplete?: ResultCallback
): Promise<IndexingResult> {
  // Stop existing watcher if any
  await stopWatcher();

  console.log('[Watcher] Starting watcher for:', folderPath);
  currentFolderPath = folderPath;

  // Initial indexation
  const result = await indexFolder(folderPath, onProgress);
  console.log('[Watcher] Initial indexation complete:', result);

  // Notify completion
  onComplete?.(result);

  // Create file watcher
  const globPattern = SUPPORTED_EXTENSIONS.map(ext => `**/*${ext}`);

  watcher = chokidar.watch(globPattern, {
    cwd: folderPath,
    ignored: /(^|[/\\])\../, // Ignore hidden files
    persistent: true,
    ignoreInitial: true, // Don't fire events for existing files
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100,
    },
  });

  watcher.on('add', (relativePath) => {
    const fullPath = path.join(folderPath, relativePath);
    console.log('[Watcher] File added:', relativePath);
    reindexFile(fullPath);
  });

  watcher.on('change', (relativePath) => {
    const fullPath = path.join(folderPath, relativePath);
    console.log('[Watcher] File changed:', relativePath);
    reindexFile(fullPath);
  });

  watcher.on('unlink', (relativePath) => {
    const fullPath = path.join(folderPath, relativePath);
    console.log('[Watcher] File deleted:', relativePath);
    removeFileFromIndex(fullPath);
  });

  watcher.on('error', (error) => {
    console.error('[Watcher] Error:', error);
  });

  watcher.on('ready', () => {
    console.log('[Watcher] Ready and watching for changes');
  });

  return result;
}

export async function stopWatcher(): Promise<void> {
  if (watcher) {
    console.log('[Watcher] Stopping watcher');
    try {
      await watcher.close();
    } catch (error) {
      console.error('[Watcher] Error closing watcher:', error);
    } finally {
      watcher = null;
      currentFolderPath = null;
    }
  }
}

export function isWatcherRunning(): boolean {
  return watcher !== null;
}

export function getWatchedFolder(): string | null {
  return currentFolderPath;
}
