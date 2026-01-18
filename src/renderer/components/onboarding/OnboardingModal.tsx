import React, { useState } from 'react';
import { FolderOpen, Key, MessageSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useSettingsStore } from '@/stores/settings.store';
import { useIndexerStore } from '@/stores/indexer.store';
import { useDocumentsStore } from '@/stores/documents.store';
import { messages } from '@shared/messages';

interface OnboardingModalProps {
  onComplete: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { saveApiKey } = useSettingsStore();
  const { selectFolder, indexFolder, isIndexing, progress } = useIndexerStore();
  const { fetchDocuments } = useDocumentsStore();

  const steps = [
    {
      icon: MessageSquare,
      title: messages.onboarding.welcome.title,
      description: messages.onboarding.welcome.description,
    },
    {
      icon: Key,
      title: messages.onboarding.apiKey.title,
      description: messages.onboarding.apiKey.description,
    },
    {
      icon: FolderOpen,
      title: messages.onboarding.sermons.title,
      description: messages.onboarding.sermons.description,
    },
  ];

  const handleApiKeySubmit = async () => {
    if (!apiKey.trim()) {
      setStep(2);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await saveApiKey(apiKey);
      setStep(2);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderSelect = async () => {
    const path = await selectFolder();
    if (path) {
      await indexFolder(path);
      await fetchDocuments();
      onComplete();
    }
  };

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 overflow-hidden animate-slide-up">
        {/* Progress */}
        <div className="flex">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1 ${i <= step ? 'bg-burgundy' : 'bg-gray-200'}`} />
          ))}
        </div>

        <div className="p-8">
          {/* Icon */}
          <div className="w-16 h-16 bg-burgundy/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon className="w-8 h-8 text-burgundy" />
          </div>

          {/* Content */}
          <h2 className="text-2xl font-serif text-burgundy text-center mb-3">{currentStep.title}</h2>
          <p className="text-muted text-center mb-6">{currentStep.description}</p>

          {/* Step-specific content */}
          {step === 0 && (
            <Button onClick={() => setStep(1)} className="w-full">
              {messages.onboarding.start}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy"
              />

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">
                  {messages.common.skip}
                </Button>
                <Button onClick={handleApiKeySubmit} disabled={isLoading} isLoading={isLoading} className="flex-1">
                  {messages.common.continue}
                </Button>
              </div>

              <p className="text-xs text-center text-muted">
                {messages.settings.apiKey.configLater}
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {isIndexing ? (
                <div className="space-y-3">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-burgundy transition-all duration-300"
                      style={{
                        width: progress ? `${(progress.current / progress.total) * 100}%` : '0%',
                      }}
                    />
                  </div>
                  <p className="text-sm text-center text-muted">
                    {progress ? messages.folders.indexingFile(progress.currentFile, progress.current, progress.total) : messages.folders.preparation}
                  </p>
                </div>
              ) : (
                <>
                  <Button onClick={handleFolderSelect} className="w-full">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    {messages.folders.selectFolder}
                  </Button>

                  <button onClick={onComplete} className="w-full text-sm text-muted hover:text-burgundy">
                    {messages.onboarding.configureLater}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
