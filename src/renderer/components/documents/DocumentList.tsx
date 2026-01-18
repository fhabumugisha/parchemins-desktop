import { useDocumentsStore } from "@/stores/documents.store";
import { DocumentItem } from "./DocumentItem";
import { messages } from "@shared/messages";

export function DocumentList() {
  const { documents, searchResults, searchQuery, isLoading } =
    useDocumentsStore();

  const displayedDocs = searchQuery ? searchResults : documents;

  if (isLoading) {
    return <div className="p-4 text-center text-muted">{messages.common.loading}</div>;
  }

  if (displayedDocs.length === 0) {
    return (
      <div className="p-4 text-center text-muted text-sm">
        {searchQuery ? messages.documents.noResult : messages.documents.noDocumentIndexed}
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {displayedDocs.map((doc) => (
        <DocumentItem key={doc.id} document={doc} />
      ))}
    </div>
  );
}
