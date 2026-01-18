import { useUIStore } from '@/stores/ui.store';
import { useDocumentsStore } from '@/stores/documents.store';
import { DocumentViewer } from '@/components/documents/DocumentViewer';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { messages } from '@shared/messages';

export function MainContent() {
  const { activeView } = useUIStore();
  const { selectedDocument } = useDocumentsStore();

  if (selectedDocument && activeView === 'document') {
    return <DocumentViewer />;
  }

  switch (activeView) {
    case 'chat':
      return <ChatPanel />;
    case 'settings':
      return <SettingsPanel />;
    case 'document':
    default:
      if (!selectedDocument) {
        return (
          <div className="h-full flex items-center justify-center text-muted">
            <p>{messages.documents.selectDocumentInList}</p>
          </div>
        );
      }
      return <DocumentViewer />;
  }
}
