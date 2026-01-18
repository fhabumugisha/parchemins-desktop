import { useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  BookOpen,
  Hash,
  Sparkles,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useDocumentsStore } from "@/stores/documents.store";
import { useUIStore } from "@/stores/ui.store";
import { useChatStore } from "@/stores/chat.store";
import { cn } from "@/lib/cn";
import { messages } from "@shared/messages";

export function DocumentViewer() {
  const { selectedDocument, selectDocument, openDocumentExternal } =
    useDocumentsStore();
  const { setActiveView, fontSize } = useUIStore();
  const { summarizeDocument } = useChatStore();
  const [isSummarizing, setIsSummarizing] = useState(false);

  if (!selectedDocument) {
    return (
      <div className="h-full flex items-center justify-center text-muted">
        {messages.documents.selectDocument}
      </div>
    );
  }

  const handleBack = () => {
    selectDocument(null);
    setActiveView("chat");
  };

  const handleOpenExternal = () => {
    openDocumentExternal(selectedDocument.id);
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      await summarizeDocument(selectedDocument.id, selectedDocument.title);
      setActiveView("chat");
    } finally {
      setIsSummarizing(false);
    }
  };

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return messages.documents.unknownDate;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Font size classes
  const fontSizeClasses = {
    small: "text-sm leading-relaxed",
    medium: "text-base leading-relaxed",
    large: "text-lg leading-loose",
  };

  return (
    <div className="h-full flex flex-col bg-cream-light">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-muted hover:text-burgundy transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{messages.common.back}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSummarize}
              disabled={isSummarizing}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSummarizing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{isSummarizing ? messages.chat.thinking : messages.documents.summarize}</span>
            </button>
            <button
              onClick={handleOpenExternal}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-burgundy text-white rounded-lg hover:bg-burgundy/90 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{messages.documents.openFile}</span>
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-serif text-burgundy mb-3">
          {selectedDocument.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
          {selectedDocument.date && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(selectedDocument.date)}
            </span>
          )}
          {selectedDocument.bible_ref && (
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              {selectedDocument.bible_ref}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Hash className="w-4 h-4" />
            {selectedDocument.word_count} {messages.documents.words}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div
          className={cn(
            "max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8",
            fontSizeClasses[fontSize]
          )}
        >
          <div className="prose prose-burgundy max-w-none">
            <ReactMarkdown>{selectedDocument.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
