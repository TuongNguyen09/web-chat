import { getAccessToken, setAccessToken, clearAccessToken } from "./tokenManager";

import { BASE_API_URL } from "../config/api";

const refreshAccessToken = async () => {
  const res = await fetch(`${BASE_API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Refresh thất bại");
  const payload = await res.json();
  if (payload.code !== 0) throw new Error(payload.message || "Refresh thất bại");

  const newToken = payload?.result?.accessToken;
  if (!newToken) throw new Error("Không có access token mới");
  setAccessToken(newToken);
  return newToken;
};

export const authFetch = async (path, options = {}) => {
  const token = getAccessToken();
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${BASE_API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    clearAccessToken();
    throw new Error("Unauthorized");
  }

  return res;
};