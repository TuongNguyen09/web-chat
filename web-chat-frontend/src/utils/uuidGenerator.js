/**
 * UUID Generator - Cross-browser compatible
 */

/**
 * Generate a random UUID v4
 * Fallback for browsers that don't support crypto.randomUUID()
 */
export const generateUUID = () => {
  // Check if crypto.randomUUID is available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: Generate UUID v4 manually
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
