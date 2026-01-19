import React, { useEffect, useState } from 'react';
import { ArrowLeft, Key, Folder, Type, Info, Shield, Trash2, CheckCircle, AlertTriangle, RefreshCw, X, MessageSquare } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings.store';
import { useUIStore } from '@/stores/ui.store';
import { useCreditsStore } from '@/stores/credits.store';
import { useIndexerStore } from '@/stores/indexer.store';
import { useDocumentsStore } from '@/stores/documents.store';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { cn } from '@/lib/cn';
import { messages } from '@shared/messages';
import { EXTERNAL_LINKS } from '@shared/constants';
import { showToast } from '@/components/common/Toast';

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
  const { selectFolder, indexFolder, forceReindex, cancelIndexing, isIndexing, progress } = useIndexerStore();
  const { fetchDocuments } = useDocumentsStore();
  const { confirm, dialogProps } = useConfirmDialog();

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
      showToast('success', messages.settings.apiKey.savedSuccess);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError((err as Error).message);
      showToast('error', (err as Error).message);
    }
  };

  const handleDeleteApiKey = async () => {
    const confirmed = await confirm({
      title: messages.settings.apiKey.title,
      message: messages.settings.apiKey.confirmDelete,
      variant: 'danger',
      confirmLabel: messages.common.delete,
    });
    if (confirmed) {
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
      if (result.cancelled) {
        showToast('info', messages.folders.indexingCancelled);
      } else {
        setReindexSuccess(result.updated);
        showToast('success', messages.folders.reindexSuccess(result.updated));
        setTimeout(() => setReindexSuccess(null), 5000);
      }
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-cream">
      <div className="max-w-2xl xl:max-w-3xl 2xl:max-w-4xl mx-auto p-6">
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
                  le site du fournisseur
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
                <div className="space-y-2">
                  <p className="text-sm text-muted">
                    {messages.folders.indexingFile(progress.currentFile, progress.current, progress.total)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelIndexing}
                    className="text-red-500 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    {messages.folders.cancelIndexing}
                  </Button>
                </div>
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

        {/* Feedback Section */}
        <section className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-5 h-5 text-burgundy" />
            <h2 className="text-lg font-medium">{messages.settings.feedback.title}</h2>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted">{messages.settings.feedback.description}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.electronAPI.settings.openExternal(EXTERNAL_LINKS.FEEDBACK_FORM)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {messages.settings.feedback.button}
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
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-muted">
            <p>{messages.settings.about.subtitle}</p>
            <p className="mt-1">{messages.settings.about.poweredBy}</p>
          </div>
        </section>
      </div>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
