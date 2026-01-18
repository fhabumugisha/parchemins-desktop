import React from "react";
import {
  FileText,
  Calendar,
  BookOpen,
  Trash2,
  ExternalLink,
} from "lucide-react";
import type { Document } from "@shared/types";
import { useDocumentsStore } from "@/stores/documents.store";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/lib/cn";

interface DocumentItemProps {
  document: Document;
}

export function DocumentItem({ document }: DocumentItemProps) {
  const {
    selectedDocument,
    selectDocument,
    deleteDocument,
    openDocumentExternal,
  } = useDocumentsStore();
  const { setActiveView } = useUIStore();

  const isSelected = selectedDocument?.id === document.id;

  const handleClick = () => {
    selectDocument(document);
    setActiveView("document");
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Supprimer "${document.title}" de l'index ?`)) {
      await deleteDocument(document.id);
    }
  };

  const handleOpenExternal = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await openDocumentExternal(document.id);
  };

  // Format date for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "p-3 cursor-pointer hover:bg-gray-50 transition-colors group",
        isSelected && "bg-burgundy/5 border-l-2 border-burgundy"
      )}
    >
      <div className="flex items-start gap-3">
        <FileText
          className={cn(
            "w-4 h-4 mt-0.5 flex-shrink-0",
            isSelected ? "text-burgundy" : "text-muted"
          )}
        />

        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              "font-medium text-sm truncate",
              isSelected ? "text-burgundy" : "text-gray-900"
            )}
          >
            {document.title}
          </h3>

          <div className="flex items-center gap-3 mt-1 text-xs text-muted">
            {document.date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(document.date)}
              </span>
            )}
            {document.bible_ref && (
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {document.bible_ref}
              </span>
            )}
          </div>

          {/* Show snippet if available (from search) */}
          {(document as Document & { snippet?: string }).snippet && (
            <p
              className="mt-1 text-xs text-muted line-clamp-2"
              dangerouslySetInnerHTML={{
                __html: (document as Document & { snippet?: string }).snippet!,
              }}
            />
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleOpenExternal}
            className="p-1 hover:bg-gray-200 rounded"
            title="Ouvrir dans l'application"
          >
            <ExternalLink className="w-3.5 h-3.5 text-muted" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 hover:bg-red-100 rounded"
            title="Supprimer de l'index"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
