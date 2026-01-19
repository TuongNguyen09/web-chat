/**
 * Date and time formatting utilities
 * Provides consistent date/time formatting across the application
 */

const DEFAULT_LOCALE = "vi-VN";

/**
 * Format date string to locale date
 * @param {string|Date} isoString - ISO date string or Date object
 * @param {string} locale - Locale string (default: "vi-VN")
 * @returns {string} Formatted date string or empty string if invalid
 */
export const formatDate = (isoString, locale = DEFAULT_LOCALE) => {
  if (!isoString) return "";
  try {
    const date = typeof isoString === 'string' ? new Date(isoString) : isoString;
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString(locale);
  } catch (error) {
    console.warn("formatDate error:", error);
    return "";
  }
};

/**
 * Format date string to locale time
 * @param {string|Date} isoString - ISO date string or Date object
 * @param {string} locale - Locale string (default: "vi-VN")
 * @param {Object} options - Additional Intl.DateTimeFormat options
 * @returns {string} Formatted time string or empty string if invalid
 */
export const formatTime = (isoString, locale = DEFAULT_LOCALE, options = {}) => {
  if (!isoString) return "";
  try {
    const date = typeof isoString === 'string' ? new Date(isoString) : isoString;
    if (isNaN(date.getTime())) return "";
    
    const defaultOptions = {
      hour: "2-digit",
      minute: "2-digit",
      ...options,
    };
    
    return date.toLocaleTimeString(locale, defaultOptions);
  } catch (error) {
    console.warn("formatTime error:", error);
    return "";
  }
};

/**
 * Format date string to locale date and time
 * @param {string|Date} isoString - ISO date string or Date object
 * @param {string} locale - Locale string (default: "vi-VN")
 * @param {Object} options - Additional Intl.DateTimeFormat options
 * @returns {string} Formatted date-time string or empty string if invalid
 */
export const formatDateTime = (isoString, locale = DEFAULT_LOCALE, options = {}) => {
  if (!isoString) return "";
  try {
    const date = typeof isoString === 'string' ? new Date(isoString) : isoString;
    if (isNaN(date.getTime())) return "";
    
    const defaultOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      ...options,
    };
    
    return date.toLocaleString(locale, defaultOptions);
  } catch (error) {
    console.warn("formatDateTime error:", error);
    return "";
  }
};

/**
 * Get relative time string (e.g., "2 giờ trước", "Hôm nay")
 * @param {string|Date} isoString - ISO date string or Date object
 * @param {string} locale - Locale string (default: "vi-VN")
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (isoString, locale = DEFAULT_LOCALE) => {
  if (!isoString) return "";
  try {
    const date = typeof isoString === 'string' ? new Date(isoString) : isoString;
    if (isNaN(date.getTime())) return "";
    
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSeconds < 60) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return formatDate(date, locale);
  } catch (error) {
    console.warn("formatRelativeTime error:", error);
    return "";
  }
};

/**
 * Check if date is today
 * @param {string|Date} isoString - ISO date string or Date object
 * @returns {boolean} True if date is today
 */
export const isToday = (isoString) => {
  if (!isoString) return false;
  try {
    const date = typeof isoString === 'string' ? new Date(isoString) : isoString;
    if (isNaN(date.getTime())) return false;
    
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  } catch (error) {
    return false;
  }
};

/**
 * Check if date is yesterday
 * @param {string|Date} isoString - ISO date string or Date object
 * @returns {boolean} True if date is yesterday
 */
export const isYesterday = (isoString) => {
  if (!isoString) return false;
  try {
    const date = typeof isoString === 'string' ? new Date(isoString) : isoString;
    if (isNaN(date.getTime())) return false;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    );
  } catch (error) {
    return false;
  }
};
