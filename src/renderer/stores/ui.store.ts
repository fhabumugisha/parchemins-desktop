import { create } from "zustand";
import { persist } from "zustand/middleware";

type View = "chat" | "document" | "settings";
type FontSize = "small" | "medium" | "large";

interface UIState {
  sidebarCollapsed: boolean;
  activeView: View;
  fontSize: FontSize;

  // Actions
  toggleSidebar: () => void;
  setActiveView: (view: View) => void;
  setFontSize: (size: FontSize) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      activeView: "chat",
      fontSize: "medium",

      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),

      setActiveView: (view) => set({ activeView: view }),

      setFontSize: (fontSize) => set({ fontSize }),
    }),
    {
      name: "assistant-pastoral-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        fontSize: state.fontSize,
      }),
    }
  )
);
