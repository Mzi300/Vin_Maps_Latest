// src/utils/logger.ts
/**
 * Simple logger utility – can be swapped for a proper logging library later.
 * Logs are printed to console with a consistent prefix and timestamp.
 */
export const logger = {
  info: (...args: any[]) => console.info('[INFO]', new Date().toISOString(), ...args),
  warn: (...args: any[]) => console.warn('[WARN]', new Date().toISOString(), ...args),
  error: (...args: any[]) => console.error('[ERROR]', new Date().toISOString(), ...args),
};
