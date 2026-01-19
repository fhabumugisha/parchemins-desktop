import { safeStorage } from 'electron';
import { getSetting, setSetting, deleteSetting } from './database.service';

const API_KEY_ENCRYPTED = 'anthropic_api_key_encrypted';
const API_KEY_METHOD = 'anthropic_api_key_method';
const API_KEY_PLAIN = 'anthropic_api_key';

/**
 * Check if secure storage is available for API keys
 */
export function canStoreApiKey(): boolean {
  return safeStorage.isEncryptionAvailable();
}

/**
 * Migrate plaintext keys: delete any existing plaintext API key
 * Call this at app startup to clean up insecure storage
 */
export function migratePlaintextKey(): boolean {
  const method = getSetting(API_KEY_METHOD);
  const hasPlainKey = !!getSetting(API_KEY_PLAIN);

  if (method === 'plain' || hasPlainKey) {
    deleteSetting(API_KEY_PLAIN);
    if (method === 'plain') {
      deleteSetting(API_KEY_METHOD);
    }
    return true; // Migration occurred, user needs to re-enter key
  }
  return false;
}

/**
 * Store API key securely using Electron's safeStorage
 * Throws an error if encryption is not available
 */
export function storeApiKey(key: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('ENCRYPTION_UNAVAILABLE');
  }

  const encrypted = safeStorage.encryptString(key);
  setSetting(API_KEY_ENCRYPTED, encrypted.toString('base64'));
  setSetting(API_KEY_METHOD, 'encrypted');
  // Remove any legacy plain text key
  deleteSetting(API_KEY_PLAIN);
}

/**
 * Retrieve API key from secure storage
 * Only retrieves encrypted keys - no plaintext fallback
 */
export function retrieveApiKey(): string | null {
  const method = getSetting(API_KEY_METHOD);

  if (method !== 'encrypted') {
    return null;
  }

  if (!safeStorage.isEncryptionAvailable()) {
    return null;
  }

  const encrypted = getSetting(API_KEY_ENCRYPTED);
  if (!encrypted) {
    return null;
  }

  try {
    const buffer = Buffer.from(encrypted, 'base64');
    return safeStorage.decryptString(buffer);
  } catch {
    // Log generic message - don't expose implementation details
    console.error('Unable to retrieve API key');
    return null;
  }
}

/**
 * Check if API key is stored (encrypted only)
 */
export function hasApiKey(): boolean {
  const method = getSetting(API_KEY_METHOD);
  return method === 'encrypted' && !!getSetting(API_KEY_ENCRYPTED);
}

/**
 * Delete API key from storage
 */
export function deleteApiKey(): void {
  deleteSetting(API_KEY_ENCRYPTED);
  deleteSetting(API_KEY_PLAIN);
  deleteSetting(API_KEY_METHOD);
}

/**
 * Check if encryption is available
 */
export function isEncryptionAvailable(): boolean {
  return safeStorage.isEncryptionAvailable();
}
