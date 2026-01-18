import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { ToastContainer } from '@/components/common/Toast';
import { useCreditsStore } from '@/stores/credits.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useChatStore } from '@/stores/chat.store';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { fetchCredits } = useCreditsStore();
  const { fetchSettings, hasApiKey, sermonsFolder } = useSettingsStore();
  const { checkApiConfiguration } = useChatStore();

  useKeyboardShortcuts();

  useEffect(() => {
    async function init() {
      await fetchSettings();
      await fetchCredits();
      await checkApiConfiguration();
      setIsInitialized(true);
    }
    init();
  }, [fetchSettings, fetchCredits, checkApiConfiguration]);

  useEffect(() => {
    if (isInitialized) {
      // Show onboarding if no API key AND no folder configured
      const needsOnboarding = !hasApiKey && !sermonsFolder;
      setShowOnboarding(needsOnboarding);
    }
  }, [isInitialized, hasApiKey, sermonsFolder]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    fetchSettings();
    checkApiConfiguration();
  };

  if (!isInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-burgundy border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <MainLayout />
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}
      <ToastContainer />
    </>
  );
}
