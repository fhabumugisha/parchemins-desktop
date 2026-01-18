import { app } from 'electron';
import path from 'path';

export function getAppDataPath(): string {
  return app.getPath('userData');
}

export function getDatabasePath(): string {
  return path.join(getAppDataPath(), 'sermons.db');
}

export function getLogPath(): string {
  return path.join(getAppDataPath(), 'logs');
}
