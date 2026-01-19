import { create } from "zustand";
import { getErrorMessage } from "../lib/error";

interface CreditsState {
  credits: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCredits: () => Promise<void>;
  purchaseCredits: (amount: number) => Promise<void>;
}

export const useCreditsStore = create<CreditsState>((set) => ({
  credits: 0,
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
}));
