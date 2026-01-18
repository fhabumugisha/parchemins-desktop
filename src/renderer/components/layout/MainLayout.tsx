import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MainContent } from "./MainContent";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/lib/cn";

export function MainLayout() {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="h-screen flex flex-col bg-cream">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main
          className={cn(
            "flex-1 transition-all duration-300",
            sidebarCollapsed ? "ml-16" : "ml-72"
          )}
        >
          <MainContent />
        </main>
      </div>
    </div>
  );
}
