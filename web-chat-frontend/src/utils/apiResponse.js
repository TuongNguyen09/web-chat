/**
 * Utility functions for parsing API responses
 * Handles consistent response parsing across all Redux actions
 */

/**
 * Parses API response and handles errors consistently
 * @param {Response} res - Fetch response object
 * @param {Object} options - Optional configuration
 * @param {string} options.defaultErrorMessage - Default error message if response doesn't have one
 * @param {boolean} options.allowEmptyResult - Whether to allow empty result (default: false)
 * @returns {Promise<any>} Parsed response data (response.result || response)
 * @throws {Error} If response is not ok or code !== 0
 */
export const parseApiResponse = async (res, options = {}) => {
  const { defaultErrorMessage = "Request failed", allowEmptyResult = false } = options;

  // Handle 204 No Content
  if (res.status === 204) {
    return null;
  }

  // Handle 401 Unauthorized
  if (res.status === 401) {
    const error = new Error("Unauthorized");
    error.status = 401;
    throw error;
  }

  // Parse JSON if possible
  let data;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    const text = await res.text();
    data = text ? { message: text } : null;
  }

  // Check if response is ok
  if (!res.ok) {
    const errorMessage = data?.message || defaultErrorMessage;
    const error = new Error(errorMessage);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  // Check response code (if API uses code field)
  if (data && typeof data.code === "number" && data.code !== 0) {
    const errorMessage = data.message || defaultErrorMessage;
    const error = new Error(errorMessage);
    error.code = data.code;
    error.data = data;
    throw error;
  }

  // Return result or data itself
  const result = data?.result !== undefined ? data.result : data;

  // Check if result is empty (if not allowed)
  if (!allowEmptyResult && (result === null || result === undefined)) {
    throw new Error(defaultErrorMessage);
  }

  return result;
};

/**
 * Parses API response that might return text or JSON
 * Used for endpoints that return different content types
 * @param {Response} res - Fetch response object
 * @returns {Promise<any>} Parsed response
 */
export const parseJsonIfPossible = async (res) => {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  const text = await res.text();
  return text ? { message: text } : null;
};
