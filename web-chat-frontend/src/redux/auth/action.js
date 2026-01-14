import { BASE_API_URL } from "../../config/api";
import {
  REGISTER,
  LOGIN,
  REQ_USER,
  SEARCH_USER,
  UPDATE_USER,
  LOGOUT,
} from "./actionType";
import { setAccessToken, clearAccessToken, getAccessToken } from "../../utils/tokenManager";
import { authFetch } from "../../utils/authFetch";

export const register = (data) => async (dispatch) => {
  try {
    const res = await fetch(`${BASE_API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const response = await res.json();
    if (!res.ok || response.code !== 0) {
      return dispatch({
        type: REGISTER,
        payload: { error: response.message || "Đăng ký thất bại" },
      });
    }

    dispatch({
      type: REGISTER,
      payload: { success: true, data: response.result },
    });
  } catch (error) {
    dispatch({
      type: REGISTER,
      payload: { error: error.message || "Server error" },
    });
  }
};

export const login = (data) => async (dispatch) => {
  try {
    const res = await fetch(`${BASE_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });

    const response = await res.json();
    if (!res.ok || response.code !== 0) {
      clearAccessToken();
      return dispatch({ type: LOGIN, payload: { error: response.message } });
    }

    const accessToken = response?.result?.accessToken;
    setAccessToken(accessToken);

    dispatch({ type: LOGIN, payload: { success: true, data: response.result } });
    dispatch(currentUser());
  } catch (error) {
    dispatch({ type: LOGIN, payload: { error: "Server error" } });
  }
};

const parseJsonIfPossible = async (res) => {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  const text = await res.text();
  return text ? { message: text } : null;
};

export const currentUser = () => async (dispatch) => {
  try {
    const res = await authFetch(`/users/me`, { method: "GET" });

    if (res.status === 204) {
      dispatch({ type: REQ_USER, payload: null });
      return null;
    }

    if (res.status === 401) {
      clearAccessToken();
      dispatch(logout());
      return null;
    }

    const payload = await parseJsonIfPossible(res);
    if (!res.ok || payload?.code !== 0) {
      throw new Error(payload?.message || "Không lấy được thông tin user");
    }

    dispatch({ type: REQ_USER, payload: payload.result });
    return payload.result;
  } catch (error) {
    console.error("currentUser error", error);
    return null;
  }
};

export const searchUser = ({ keyword }) => async (dispatch) => {
  try {
    const res = await authFetch(
      `/users/search?name=${encodeURIComponent(keyword || "")}`,
      { method: "GET" }
    );
    const response = await res.json();
    dispatch({ type: SEARCH_USER, payload: response.result || [] });
  } catch (error) {
    console.error("searchUser error", error);
  }
};

export const updateUser = ({ id, data }) => async (dispatch) => {
  try {
    const res = await authFetch(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });

    const response = await res.json();
    if (!res.ok || response.code !== 0) {
      throw new Error(response.message || "Cập nhật thất bại");
    }

    const updatedUser = response.result;
    dispatch({ type: UPDATE_USER, payload: updatedUser });
    dispatch({ type: REQ_USER, payload: updatedUser });

    return updatedUser;
  } catch (error) {
    console.error("updateUser error", error);
    throw error;
  }
};

export const logout = () => async (dispatch) => {
  const accessToken = getAccessToken();

  if (!accessToken) {
    clearAccessToken();
    dispatch({ type: LOGOUT, payload: null });
    dispatch({ type: REQ_USER, payload: null });
    dispatch(resetSigninState());
    return;
  }

  try {
    await fetch(`${BASE_API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    });
  } catch (err) {
    console.warn("logout request failed", err);
  }

  clearAccessToken();
  dispatch({ type: LOGOUT, payload: null });
  dispatch({ type: REQ_USER, payload: null });
  dispatch(resetSigninState());
};

export const resetSigninState = () => ({ type: "AUTH/RESET_SIGNIN_STATE" });

export const bootstrapSession = () => async (dispatch) => {
  try {
    const res = await fetch(`${BASE_API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Refresh failed");

    const payload = await res.json();
    if (payload.code !== 0) throw new Error(payload.message);

    setAccessToken(payload.result.accessToken);
    await dispatch(currentUser());
  } catch (error) {
    console.warn("bootstrapSession error:", error);
    clearAccessToken();
    dispatch({ type: REQ_USER, payload: null });
  } finally {
    dispatch({ type: "AUTH/BOOTSTRAP_FINISHED" });
  }
};