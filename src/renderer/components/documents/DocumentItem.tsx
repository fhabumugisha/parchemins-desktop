import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Calendar,
  BookOpen,
  Trash2,
  ExternalLink,
  Pencil,
} from "lucide-react";
import type { Document } from "@shared/types";
import { useDocumentsStore } from "@/stores/documents.store";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/lib/cn";
import { messages } from "@shared/messages";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

interface DocumentItemProps {
  document: Document;
}

export function DocumentItem({ document }: DocumentItemProps) {
  const {
    selectedDocument,
    selectDocument,
    deleteDocument,
    openDocumentExternal,
    updateDocumentTitle,
  } = useDocumentsStore();
  const { setActiveView } = useUIStore();
  const { confirm, dialogProps } = useConfirmDialog();

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(document.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSelected = selectedDocument?.id === document.id;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!isEditing) {
      selectDocument(document);
      setActiveView("document");
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: messages.documents.deleteFromIndex,
      message: messages.documents.confirmDelete(document.title),
      variant: 'danger',
      confirmLabel: messages.common.delete,
    });
    if (confirmed) {
      await deleteDocument(document.id);
    }
  };

  const handleOpenExternal = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await openDocumentExternal(document.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedTitle(document.title);
    setIsEditing(true);
  };

  const handleSaveTitle = async () => {
    const trimmed = editedTitle.trim();
    if (trimmed && trimmed !== document.title) {
      await updateDocumentTitle(document.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedTitle(document.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
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
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleKeyDown}
              className="w-full font-medium text-sm text-gray-900 bg-white border border-burgundy/30 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-burgundy"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3
              className={cn(
                "font-medium text-sm truncate",
                isSelected ? "text-burgundy" : "text-gray-900"
              )}
            >
              {document.title}
            </h3>
          )}

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
            onClick={handleEditClick}
            className="p-1 hover:bg-gray-200 rounded"
            title={messages.documents.editTitle}
          >
            <Pencil className="w-3.5 h-3.5 text-muted" />
          </button>
          <button
            onClick={handleOpenExternal}
            className="p-1 hover:bg-gray-200 rounded"
            title={messages.documents.openInApp}
          >
            <ExternalLink className="w-3.5 h-3.5 text-muted" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 hover:bg-red-100 rounded"
            title={messages.documents.deleteFromIndex}
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      </div>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
