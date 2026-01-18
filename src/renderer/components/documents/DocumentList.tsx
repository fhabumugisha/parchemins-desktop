import { useDocumentsStore } from "@/stores/documents.store";
import { DocumentItem } from "./DocumentItem";

export function DocumentList() {
  const { documents, searchResults, searchQuery, isLoading } =
    useDocumentsStore();

  const displayedDocs = searchQuery ? searchResults : documents;

  if (isLoading) {
    return <div className="p-4 text-center text-muted">Chargement...</div>;
  }

  if (displayedDocs.length === 0) {
    return (
      <div className="p-4 text-center text-muted text-sm">
        {searchQuery ? "Aucun resultat" : "Aucun document indexe"}
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
