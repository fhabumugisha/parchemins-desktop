import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import {
  getUsageStats,
  getUsageStatsByMonth,
  getTodayUsage,
} from '../services/database.service';

export function registerUsageHandlers(): void {
  // Get usage stats for last N days (default 30)
  ipcMain.handle(IPC_CHANNELS.USAGE_GET_STATS, (_, days?: number) => {
    return getUsageStats(days ?? 30);
  });

  // Get usage stats grouped by month
  ipcMain.handle(IPC_CHANNELS.USAGE_GET_BY_MONTH, () => {
    return getUsageStatsByMonth();
  });

  // Get today's usage
  ipcMain.handle(IPC_CHANNELS.USAGE_GET_TODAY, () => {
    return getTodayUsage();
  });
}
