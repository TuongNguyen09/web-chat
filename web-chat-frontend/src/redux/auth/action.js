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
import { parseApiResponse, parseJsonIfPossible } from "../../utils/apiResponse";
import { logger } from "../../utils/logger";

export const register = (data) => async (dispatch) => {
  try {
    const res = await fetch(`${BASE_API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    try {
      const result = await parseApiResponse(res, { defaultErrorMessage: "Đăng ký thất bại" });
      dispatch({
        type: REGISTER,
        payload: { success: true, data: result },
      });
    } catch (error) {
      dispatch({
        type: REGISTER,
        payload: { error: error.message || "Đăng ký thất bại" },
      });
    }
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

    try {
      const response = await res.json();
      if (!res.ok || (response.code !== 1000 && response.code !== 0)) {
        clearAccessToken();
        return dispatch({ type: LOGIN, payload: { error: response.message || "Đăng nhập thất bại" } });
      }

      const accessToken = response?.result?.accessToken;
      setAccessToken(accessToken);

      dispatch({ type: LOGIN, payload: { success: true, data: response.result } });
      dispatch(currentUser());
    } catch (error) {
      clearAccessToken();
      dispatch({ type: LOGIN, payload: { error: error.message || "Đăng nhập thất bại" } });
    }
  } catch (error) {
    dispatch({ type: LOGIN, payload: { error: "Server error" } });
  }
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

    try {
      const result = await parseApiResponse(res, {
        defaultErrorMessage: "Không lấy được thông tin user",
        allowEmptyResult: true,
      });
      dispatch({ type: REQ_USER, payload: result });
      return result;
    } catch (error) {
      // If parseApiResponse throws, try parseJsonIfPossible for backward compatibility
      const payload = await parseJsonIfPossible(res);
      if (!res.ok || payload?.code !== 0) {
        throw new Error(payload?.message || "Không lấy được thông tin user");
      }
      dispatch({ type: REQ_USER, payload: payload.result });
      return payload.result;
    }
  } catch (error) {
    logger.error("currentUser", error);
    return null;
  }
};

export const searchUser = ({ keyword }) => async (dispatch) => {
  try {
    const res = await authFetch(
      `/users/search?name=${encodeURIComponent(keyword || "")}`,
      { method: "GET" }
    );
    const result = await parseApiResponse(res, { allowEmptyResult: true });
    dispatch({ type: SEARCH_USER, payload: result || [] });
  } catch (error) {
    logger.error("searchUser", error, { keyword });
    dispatch({ type: SEARCH_USER, payload: [] });
  }
};

export const updateUser = ({ id, data }) => async (dispatch) => {
  try {
    const res = await authFetch(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });

    const updatedUser = await parseApiResponse(res, {
      defaultErrorMessage: "Cập nhật thất bại",
    });
    dispatch({ type: UPDATE_USER, payload: updatedUser });
    dispatch({ type: REQ_USER, payload: updatedUser });

    return updatedUser;
  } catch (error) {
    logger.error("updateUser", error, { userId: id });
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
    logger.warn("logout", "Logout request failed", { error: err });
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

    const result = await parseApiResponse(res, {
      defaultErrorMessage: "Refresh failed",
    });

    setAccessToken(result.accessToken);
    await dispatch(currentUser());
  } catch (error) {
    logger.warn("bootstrapSession", "Bootstrap session failed", { error });
    clearAccessToken();
    dispatch({ type: REQ_USER, payload: null });
  } finally {
    dispatch({ type: "AUTH/BOOTSTRAP_FINISHED" });
  }
};