/**
 * Error handling utilities
 * Provides consistent error handling patterns across the application
 */

/**
 * Wraps an async function with error handling
 * @param {string} actionName - Name of the action for logging
 * @param {Function} fn - Async function to wrap
 * @returns {Promise<any>} Result of the function or throws error
 */
export const withErrorHandling = (actionName) => async (fn) => {
  try {
    return await fn();
  } catch (error) {
    console.error(`${actionName} error:`, error);
    throw error;
  }
};

/**
 * Wraps an async function with error handling and custom error handler
 * @param {string} actionName - Name of the action for logging
 * @param {Function} fn - Async function to wrap
 * @param {Function} onError - Custom error handler (optional)
 * @returns {Promise<any>} Result of the function or throws error
 */
export const withErrorHandlingCustom = (actionName, onError) => async (fn) => {
  try {
    return await fn();
  } catch (error) {
    if (onError) {
      return onError(error);
    }
    console.error(`${actionName} error:`, error);
    throw error;
  }
};

/**
 * Wraps an async function that returns a success/error object
 * @param {string} actionName - Name of the action for logging
 * @param {Function} fn - Async function to wrap
 * @returns {Promise<{success: boolean, result?: any, error?: any}>}
 */
export const withErrorHandlingResult = (actionName) => async (fn) => {
  try {
    const result = await fn();
    return { success: true, result };
  } catch (error) {
    console.error(`${actionName} error:`, error);
    return { success: false, error };
  }
};
