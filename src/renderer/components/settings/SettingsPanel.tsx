import React, { useEffect, useState } from 'react';
import { ArrowLeft, Key, Folder, Type, Info, Shield, Trash2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings.store';
import { useUIStore } from '@/stores/ui.store';
import { useCreditsStore } from '@/stores/credits.store';
import { useIndexerStore } from '@/stores/indexer.store';
import { useDocumentsStore } from '@/stores/documents.store';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/cn';
import { messages } from '@shared/messages';

export function SettingsPanel() {
  const { setActiveView, fontSize, setFontSize } = useUIStore();
  const {
    hasApiKey,
    isEncryptionAvailable,
    sermonsFolder,
    appInfo,
    isLoading,
    fetchSettings,
    saveApiKey,
    deleteApiKey,
    fetchAppInfo,
  } = useSettingsStore();
  const { credits } = useCreditsStore();
  const { selectFolder, indexFolder, forceReindex, isIndexing, progress } = useIndexerStore();
  const { fetchDocuments } = useDocumentsStore();

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reindexSuccess, setReindexSuccess] = useState<number | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchAppInfo();
  }, [fetchSettings, fetchAppInfo]);

  const handleSaveApiKey = async () => {
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await saveApiKey(apiKeyInput);
      setApiKeyInput('');
      setShowApiKeyInput(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError((err as Error).message);
    }
  };

  const handleDeleteApiKey = async () => {
    if (confirm(messages.settings.apiKey.confirmDelete)) {
      await deleteApiKey();
    }
  };

  const handleChangeFolder = async () => {
    const path = await selectFolder();
    if (path) {
      await indexFolder(path);
      await fetchDocuments();
      await fetchSettings();
    }
  };

  const handleForceReindex = async () => {
    setReindexSuccess(null);
    const result = await forceReindex();
    if (result) {
      await fetchDocuments();
      setReindexSuccess(result.updated);
      setTimeout(() => setReindexSuccess(null), 5000);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-cream">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setActiveView('chat')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted" />
          </button>
          <h1 className="text-2xl font-serif text-burgundy">{messages.settings.title}</h1>
        </div>

        {/* API Key Section */}
        <section className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-5 h-5 text-burgundy" />
            <h2 className="text-lg font-medium">{messages.settings.apiKey.title}</h2>
          </div>

          {hasApiKey ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>{messages.settings.apiKey.configured}</span>
              </div>

              {isEncryptionAvailable && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Shield className="w-4 h-4" />
                  <span>{messages.settings.apiKey.securelyStored}</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="secondary" size="sm" onClick={() => setShowApiKeyInput(true)}>
                  {messages.common.modify}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteApiKey}
                  className="text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {messages.common.delete}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted">
                {messages.settings.apiKey.description}{' '}
                <a
                  href="https://console.anthropic.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-burgundy hover:underline"
                >
                  console.anthropic.com
                </a>
              </p>

              {!showApiKeyInput && <Button onClick={() => setShowApiKeyInput(true)}>{messages.settings.apiKey.configure}</Button>}
            </div>
          )}

          {showApiKeyInput && (
            <div className="mt-4 space-y-3">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy"
              />

              {saveError && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{saveError}</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={handleSaveApiKey} disabled={!apiKeyInput.trim() || isLoading} isLoading={isLoading}>
                  {messages.common.save}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowApiKeyInput(false);
                    setApiKeyInput('');
                    setSaveError(null);
                  }}
                >
                  {messages.common.cancel}
                </Button>
              </div>
            </div>
          )}

          {saveSuccess && (
            <div className="mt-4 flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>{messages.settings.apiKey.savedSuccess}</span>
            </div>
          )}
        </section>

        {/* Folder Section */}
        <section className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Folder className="w-5 h-5 text-burgundy" />
            <h2 className="text-lg font-medium">{messages.folders.sermonsFolder}</h2>
          </div>

          {sermonsFolder ? (
            <div className="space-y-4">
              <p className="text-sm text-muted break-all">{sermonsFolder}</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" size="sm" onClick={handleChangeFolder}>
                  {messages.folders.changeFolder}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleForceReindex}
                  disabled={isIndexing}
                  className="text-burgundy hover:bg-burgundy/10"
                >
                  <RefreshCw className={cn('w-4 h-4 mr-1', isIndexing && 'animate-spin')} />
                  {isIndexing ? messages.folders.indexing : messages.folders.forceReindex}
                </Button>
              </div>

              {isIndexing && progress && (
                <p className="text-sm text-muted">
                  {messages.folders.indexingFile(progress.currentFile, progress.current, progress.total)}
                </p>
              )}

              {reindexSuccess !== null && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>{messages.folders.reindexSuccess(reindexSuccess)}</span>
                </div>
              )}

              <p className="text-xs text-muted">{messages.folders.forceReindexDescription}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted">{messages.folders.noFolderConfigured}</p>
              <Button onClick={handleChangeFolder}>{messages.folders.selectFolder}</Button>
            </div>
          )}
        </section>

        {/* Display Section */}
        <section className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Type className="w-5 h-5 text-burgundy" />
            <h2 className="text-lg font-medium">{messages.settings.display.title}</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted block mb-2">{messages.settings.display.textSize}</label>
              <div className="flex gap-2">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={cn(
                      'px-4 py-2 rounded-lg border transition-colors',
                      fontSize === size
                        ? 'bg-burgundy text-white border-burgundy'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-burgundy'
                    )}
                  >
                    {size === 'small' && messages.settings.display.small}
                    {size === 'medium' && messages.settings.display.medium}
                    {size === 'large' && messages.settings.display.large}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Credits Section */}
        <section className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-5 h-5 text-burgundy" />
            <h2 className="text-lg font-medium">{messages.settings.credits.title}</h2>
          </div>

          <div className="space-y-4">
            <p className="text-2xl font-bold text-burgundy">{messages.settings.credits.count(credits)}</p>
            <p className="text-sm text-muted">{messages.settings.credits.description}</p>
            <Button variant="secondary" size="sm" disabled>
              {messages.settings.credits.buyCredits}
            </Button>
          </div>
        </section>

        {/* About Section */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-5 h-5 text-burgundy" />
            <h2 className="text-lg font-medium">{messages.settings.about.title}</h2>
          </div>

          {appInfo && (
            <div className="space-y-2 text-sm text-muted">
              <p>
                <span className="font-medium">{messages.settings.about.version} :</span> {appInfo.version}
              </p>
              <p>
                <span className="font-medium">{messages.settings.about.electron} :</span> {appInfo.electronVersion}
              </p>
              <p>
                <span className="font-medium">{messages.settings.about.chrome} :</span> {appInfo.chromeVersion}
              </p>
              <p>
                <span className="font-medium">{messages.settings.about.nodejs} :</span> {appInfo.nodeVersion}
              </p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-muted">
            <p>{messages.settings.about.subtitle}</p>
            <p className="mt-1">{messages.settings.about.poweredBy}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
