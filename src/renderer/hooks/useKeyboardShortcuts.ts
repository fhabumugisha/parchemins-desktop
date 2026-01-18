import { useEffect } from 'react';
import { useUIStore } from '@/stores/ui.store';

export function useKeyboardShortcuts() {
  const { toggleSidebar, setActiveView } = useUIStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl/Cmd + B: Toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }

      // Ctrl/Cmd + ,: Open settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setActiveView('settings');
      }

      // Escape: Go to chat
      if (e.key === 'Escape') {
        setActiveView('chat');
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, setActiveView]);
}
