import { Settings, Menu, CreditCard } from "lucide-react";
import { useUIStore } from "@/stores/ui.store";
import { useCreditsStore } from "@/stores/credits.store";

export function Header() {
  const { toggleSidebar, setActiveView } = useUIStore();
  const { credits } = useCreditsStore();

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 drag-region">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors no-drag"
        >
          <Menu className="w-5 h-5 text-muted" />
        </button>
        <h1 className="text-lg font-serif text-burgundy font-semibold">
          Assistant Pastoral
        </h1>
      </div>

      <div className="flex items-center gap-4 no-drag">
        <div className="flex items-center gap-2 text-sm text-muted">
          <CreditCard className="w-4 h-4" />
          <span>{credits} credits</span>
        </div>
        <button
          onClick={() => setActiveView("settings")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5 text-muted" />
        </button>
      </div>
    </header>
  );
}
