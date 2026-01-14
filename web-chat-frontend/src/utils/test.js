// utils/tokenManager.js
let accessToken = null;
const listeners = new Set();

export const setAccessToken = (token) => {
  accessToken = token || null;
  listeners.forEach((listener) => listener(accessToken));
};

export const getAccessToken = () => accessToken;
export const clearAccessToken = () => setAccessToken(null);

export const subscribeAccessToken = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};