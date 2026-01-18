import { create } from "zustand";

interface CreditsState {
  credits: number;
  isLoading: boolean;

  // Actions
  fetchCredits: () => Promise<void>;
  purchaseCredits: (amount: number) => Promise<void>;
}

export const useCreditsStore = create<CreditsState>((set) => ({
  credits: 0,
  isLoading: false,

  fetchCredits: async () => {
    set({ isLoading: true });
    try {
      const credits = await window.electronAPI.credits.get();
      set({ credits, isLoading: false });
    } catch (_error) {
      set({ isLoading: false });
    }
  },

  purchaseCredits: async (amount) => {
    set({ isLoading: true });
    try {
      const newBalance = await window.electronAPI.credits.purchase(amount);
      set({ credits: newBalance, isLoading: false });
    } catch (_error) {
      set({ isLoading: false });
    }
  },
}));
