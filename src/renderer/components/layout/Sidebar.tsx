import { useEffect } from "react";
import {
  FileText,
  MessageSquare,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useUIStore } from "@/stores/ui.store";
import { useDocumentsStore } from "@/stores/documents.store";
import { useIndexerStore } from "@/stores/indexer.store";
import { DocumentList } from "@/components/documents/DocumentList";
import { SearchInput } from "@/components/common/SearchInput";

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, setActiveView } = useUIStore();
  const { documents, fetchDocuments, search, searchQuery, clearSearch } =
    useDocumentsStore();
  const { selectFolder, indexFolder, isIndexing } = useIndexerStore();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleSelectFolder = async () => {
    const path = await selectFolder();
    if (path) {
      await indexFolder(path);
      await fetchDocuments();
    }
  };

  if (sidebarCollapsed) {
    return (
      <aside className="fixed left-0 top-14 bottom-0 w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-4">
        <button
          onClick={() => setActiveView("chat")}
          className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
          title="Chat"
        >
          <MessageSquare className="w-5 h-5 text-muted" />
        </button>
        <button
          onClick={() => setActiveView("document")}
          className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
          title="Documents"
        >
          <FileText className="w-5 h-5 text-muted" />
        </button>
        <button
          onClick={toggleSidebar}
          className="mt-auto p-3 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-muted" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-14 bottom-0 w-72 bg-white border-r border-gray-200 flex flex-col">
      {/* Search */}
      <div className="p-4 border-b border-gray-100">
        <SearchInput
          value={searchQuery}
          onChange={search}
          onClear={clearSearch}
          placeholder="Rechercher dans les sermons..."
        />
      </div>

      {/* Document count or folder selection */}
      <div className="px-4 py-3 border-b border-gray-100">
        {documents.length > 0 ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">
              {documents.length} sermon{documents.length > 1 ? "s" : ""}
            </span>
            <button
              onClick={handleSelectFolder}
              disabled={isIndexing}
              className="text-sm text-burgundy hover:underline disabled:opacity-50"
            >
              {isIndexing ? "Indexation..." : "Changer de dossier"}
            </button>
          </div>
        ) : (
          <button
            onClick={handleSelectFolder}
            disabled={isIndexing}
            className="w-full flex items-center justify-center gap-2 py-3 bg-burgundy text-white rounded-lg hover:bg-burgundy/90 transition-colors disabled:opacity-50"
          >
            <FolderOpen className="w-4 h-4" />
            <span>
              {isIndexing ? "Indexation..." : "Selectionner un dossier"}
            </span>
          </button>
        )}
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto">
        <DocumentList />
      </div>

      {/* Collapse button */}
      <div className="p-2 border-t border-gray-100">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Reduire</span>
        </button>
      </div>
    </aside>
  );
}
