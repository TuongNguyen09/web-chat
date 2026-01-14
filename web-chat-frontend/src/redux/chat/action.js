import { authFetch } from "../../utils/authFetch";
import {
  CREATE_CHAT,
  CREATE_GROUP,
  GET_USERS_CHAT,
  UPDATE_CHAT,
  REMOVE_CHAT,
} from "./actionType";

const buildKeywordQuery = (keyword) => {
  const normalized = keyword?.trim();
  return normalized ? `?keyword=${encodeURIComponent(normalized)}` : "";
};

export const createChat = ({ data }) => async (dispatch) => {
  try {
    const res = await authFetch(`/chats/private`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    const response = await res.json();
    dispatch({ type: CREATE_CHAT, payload: response.result || response });
    return response.result || response;
  } catch (error) {
    console.error("createChat error", error);
    throw error;
  }
};

export const createGroupChat = ({ group }) => async (dispatch) => {
  try {
    const res = await authFetch(`/chats/group`, {
      method: "POST",
      body: JSON.stringify(group),
    });

    const response = await res.json();
    dispatch({ type: CREATE_GROUP, payload: response.result || response });
    return { success: true, result: response.result || response };
  } catch (error) {
    console.error("createGroup error", error);
    return { success: false, error };
  }
};

export const getUsersChat = ({ keyword } = {}) => async (dispatch) => {
  try {
    const query = buildKeywordQuery(keyword);
    const res = await authFetch(`/chats/my-chats${query}`, { method: "GET" });

    const response = await res.json();
    dispatch({
      type: GET_USERS_CHAT,
      payload: {
        data: response.result || response,
        keyword: keyword?.trim() || "",
      },
    });
  } catch (error) {
    console.error("getUsersChat error", error);
  }
};

export const addUserToGroup = ({ chatId, userId }) => async (dispatch) => {
  try {
    const res = await authFetch(`/chats/${chatId}/add-user/${userId}`, {
      method: "POST",
    });

    const response = await res.json();
    if (!res.ok) throw new Error(response.message || "Add member failed");

    const updatedChat = response.result || response;
    dispatch({ type: UPDATE_CHAT, payload: updatedChat });
    return updatedChat;
  } catch (error) {
    console.error("addUserToGroup error:", error);
    throw error;
  }
};

export const updateChat = ({ chatId, data }) => async (dispatch) => {
  try {
    const res = await authFetch(`/chats/${chatId}/update`, {
      method: "PUT",
      body: JSON.stringify(data),
    });

    const response = await res.json();
    if (!res.ok) throw new Error(response.message || "Update chat failed");

    const updatedChat = response.result || response;
    dispatch({ type: UPDATE_CHAT, payload: updatedChat });
    return updatedChat;
  } catch (error) {
    console.error("updateChat error:", error);
    throw error;
  }
};

export const removeFromGroup = ({ chatId, targetUserId }) => async (dispatch) => {
  try {
    const res = await authFetch(`/chats/${chatId}/remove-user/${targetUserId}`, {
      method: "DELETE",
    });

    const response = await res.json();
    if (!res.ok) throw new Error(response.message || "Remove member failed");

    const updatedChat = response.result || response;
    dispatch({ type: UPDATE_CHAT, payload: updatedChat });
    return updatedChat;
  } catch (error) {
    console.error("removeFromGroup error:", error);
    throw error;
  }
};

export const deleteChat = ({ chatId }) => async (dispatch) => {
  try {
    const res = await authFetch(`/chats/${chatId}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Delete chat failed");
    }

    dispatch({ type: REMOVE_CHAT, payload: chatId });
    return true;
  } catch (error) {
    console.error("deleteChat error:", error);
    throw error;
  }
};