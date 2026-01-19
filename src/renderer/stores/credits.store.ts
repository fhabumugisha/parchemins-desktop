import { create } from "zustand";
import { getErrorMessage } from "../lib/error";

interface UsageStats {
  totalQuestions: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  avgCostPerQuestion: number;
}

interface CreditsState {
  credits: number;
  usageStats: UsageStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCredits: () => Promise<void>;
  fetchUsageStats: () => Promise<void>;
  purchaseCredits: (amount: number) => Promise<void>;
  resetCredits: () => Promise<void>;
}

export const useCreditsStore = create<CreditsState>((set) => ({
  credits: 0,
  usageStats: null,
  isLoading: false,
  error: null,

  fetchCredits: async () => {
    set({ isLoading: true, error: null });
    try {
      const credits = await window.electronAPI.credits.get();
      set({ credits, isLoading: false });
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      console.error('[Credits] Failed to fetch credits:', errorMsg);
      set({ isLoading: false, error: errorMsg });
    }
  },

  fetchUsageStats: async () => {
    try {
      const usageStats = await window.electronAPI.usage.getStats();
      set({ usageStats });
    } catch (error) {
      console.error('[Credits] Failed to fetch usage stats:', getErrorMessage(error));
    }
  },

  purchaseCredits: async (amount) => {
    set({ isLoading: true, error: null });
    try {
      const newBalance = await window.electronAPI.credits.purchase(amount);
      set({ credits: newBalance, isLoading: false });
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      console.error('[Credits] Failed to purchase credits:', errorMsg);
      set({ isLoading: false, error: errorMsg });
    }
  },

  resetCredits: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await window.electronAPI.credits.reset();
      set({ credits: result.balance, isLoading: false });
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      console.error('[Credits] Failed to reset credits:', errorMsg);
      set({ isLoading: false, error: errorMsg });
    }
  },
}));
