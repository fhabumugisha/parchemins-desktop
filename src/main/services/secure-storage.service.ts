import { safeStorage } from 'electron';
import { getSetting, setSetting, deleteSetting } from './database.service';

const API_KEY_ENCRYPTED = 'anthropic_api_key_encrypted';
const API_KEY_METHOD = 'anthropic_api_key_method';
const API_KEY_PLAIN = 'anthropic_api_key';

/**
 * Store API key securely using Electron's safeStorage
 */
export function storeApiKey(key: string): void {
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(key);
    setSetting(API_KEY_ENCRYPTED, encrypted.toString('base64'));
    setSetting(API_KEY_METHOD, 'encrypted');
    // Remove any plain text key
    deleteSetting(API_KEY_PLAIN);
  } else {
    // Fallback to plain storage (less secure)
    console.warn('Encryption not available, storing API key in plain text');
    setSetting(API_KEY_PLAIN, key);
    setSetting(API_KEY_METHOD, 'plain');
  }
}

/**
 * Retrieve API key from secure storage
 */
export function retrieveApiKey(): string | null {
  const method = getSetting(API_KEY_METHOD);

  if (method === 'encrypted' && safeStorage.isEncryptionAvailable()) {
    const encrypted = getSetting(API_KEY_ENCRYPTED);
    if (encrypted) {
      try {
        const buffer = Buffer.from(encrypted, 'base64');
        return safeStorage.decryptString(buffer);
      } catch (error) {
        console.error('Failed to decrypt API key:', error);
        return null;
      }
    }
  }

  // Fallback to plain storage
  return getSetting(API_KEY_PLAIN) || null;
}

/**
 * Check if API key is stored
 */
export function hasApiKey(): boolean {
  const method = getSetting(API_KEY_METHOD);
  if (method === 'encrypted') {
    return !!getSetting(API_KEY_ENCRYPTED);
  }
  return !!getSetting(API_KEY_PLAIN);
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
