import React, { useState } from 'react';
import { FolderOpen, Key, MessageSquare, ArrowRight, ExternalLink, Shield, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showHelp, setShowHelp] = useState(false);

  const { saveApiKey } = useSettingsStore();
  const { selectFolder, indexFolder, isIndexing, progress, cancelIndexing } = useIndexerStore();
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
              {/* Expandable help section */}
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="w-full flex items-center justify-between px-4 py-3 bg-burgundy/5 rounded-lg text-left hover:bg-burgundy/10 transition-colors"
              >
                <div className="flex items-center gap-2 text-burgundy">
                  <HelpCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">{messages.onboarding.apiKey.whatIsApiKey}</span>
                </div>
                {showHelp ? <ChevronUp className="w-4 h-4 text-burgundy" /> : <ChevronDown className="w-4 h-4 text-burgundy" />}
              </button>

              {showHelp && (
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-sm space-y-3">
                  <p className="text-muted">{messages.onboarding.apiKey.apiKeyExplanation}</p>
                  <div className="space-y-2">
                    <p className="font-medium text-gray-700">Comment obtenir votre clé :</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted">
                      <li>{messages.onboarding.apiKey.steps.step1}</li>
                      <li>{messages.onboarding.apiKey.steps.step2}</li>
                      <li>{messages.onboarding.apiKey.steps.step3}</li>
                    </ol>
                  </div>
                  <a
                    href="https://console.anthropic.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-burgundy hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {messages.onboarding.apiKey.getKey}
                  </a>
                </div>
              )}

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
                  {messages.onboarding.apiKey.skipForNow}
                </Button>
                <Button onClick={handleApiKeySubmit} disabled={isLoading} isLoading={isLoading} className="flex-1">
                  {messages.common.continue}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-muted">
                <Shield className="w-3 h-3" />
                <span>{messages.onboarding.apiKey.securityNote}</span>
              </div>
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
                  <Button
                    variant="secondary"
                    onClick={cancelIndexing}
                    className="w-full"
                  >
                    {messages.folders.cancelIndexing}
                  </Button>
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
