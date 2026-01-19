import { create } from "zustand";
import { persist } from "zustand/middleware";

type View = "chat" | "document" | "settings";
type FontSize = "small" | "medium" | "large";

interface UIState {
  sidebarCollapsed: boolean;
  activeView: View;
  fontSize: FontSize;
  conversationsPanelOpen: boolean;

  // Actions
  toggleSidebar: () => void;
  setActiveView: (view: View) => void;
  setFontSize: (size: FontSize) => void;
  toggleConversationsPanel: () => void;
  setConversationsPanelOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      activeView: "chat",
      fontSize: "medium",
      conversationsPanelOpen: false,

      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),

      setActiveView: (view) => set({ activeView: view }),

      setFontSize: (fontSize) => set({ fontSize }),

      toggleConversationsPanel: () =>
        set((state) => ({
          conversationsPanelOpen: !state.conversationsPanelOpen,
        })),

      setConversationsPanelOpen: (open) => set({ conversationsPanelOpen: open }),
    }),
    {
      name: "assistant-pastoral-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        fontSize: state.fontSize,
        conversationsPanelOpen: state.conversationsPanelOpen,
      }),
    }
  )
);
