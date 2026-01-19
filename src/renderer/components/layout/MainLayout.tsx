import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MainContent } from "./MainContent";
import { ConversationsPanel } from "../conversations/ConversationsPanel";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/lib/cn";

export function MainLayout() {
  const { sidebarCollapsed, conversationsPanelOpen, activeView } = useUIStore();

  const showConversationsPanel = conversationsPanelOpen && activeView === 'chat';

  return (
    <div className="h-screen flex flex-col bg-cream">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main
          className={cn(
            "flex-1 transition-all duration-300 flex",
            sidebarCollapsed ? "ml-16" : "ml-72"
          )}
        >
          <div className="flex-1 overflow-hidden">
            <MainContent />
          </div>
          {showConversationsPanel && <ConversationsPanel />}
        </main>
      </div>
    </div>
  );
}
