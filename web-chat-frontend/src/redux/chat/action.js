import { authFetch } from "../../utils/authFetch";
import { parseApiResponse } from "../../utils/apiResponse";
import { logger } from "../../utils/logger";
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

    const result = await parseApiResponse(res);
    dispatch({ type: CREATE_CHAT, payload: result });
    return result;
  } catch (error) {
    logger.error("createChat", error, { userId: data?.userId });
    throw error;
  }
};

export const createGroupChat = ({ group }) => async (dispatch) => {
  try {
    const res = await authFetch(`/chats/group`, {
      method: "POST",
      body: JSON.stringify(group),
    });

    const result = await parseApiResponse(res);
    dispatch({ type: CREATE_GROUP, payload: result });
    return { success: true, result };
  } catch (error) {
    logger.error("createGroup", error, { groupName: group?.name });
    return { success: false, error };
  }
};

export const getUsersChat = ({ keyword } = {}) => async (dispatch) => {
  try {
    const query = buildKeywordQuery(keyword);
    const res = await authFetch(`/chats/my-chats${query}`, { method: "GET" });

    const result = await parseApiResponse(res, { allowEmptyResult: true });
    dispatch({
      type: GET_USERS_CHAT,
      payload: {
        data: result || [],
        keyword: keyword?.trim() || "",
      },
    });
  } catch (error) {
    logger.error("getUsersChat", error, { keyword });
  }
};

export const addUserToGroup = ({ chatId, userId }) => async (dispatch) => {
  try {
    const res = await authFetch(`/chats/${chatId}/add-user/${userId}`, {
      method: "POST",
    });

    const updatedChat = await parseApiResponse(res, {
      defaultErrorMessage: "Add member failed",
    });
    dispatch({ type: UPDATE_CHAT, payload: updatedChat });
    return updatedChat;
  } catch (error) {
    logger.error("addUserToGroup", error, { chatId, userId });
    throw error;
  }
};

export const updateChat = ({ chatId, data }) => async (dispatch) => {
  try {
    const res = await authFetch(`/chats/${chatId}/update`, {
      method: "PUT",
      body: JSON.stringify(data),
    });

    const updatedChat = await parseApiResponse(res, {
      defaultErrorMessage: "Update chat failed",
    });
    dispatch({ type: UPDATE_CHAT, payload: updatedChat });
    return updatedChat;
  } catch (error) {
    logger.error("updateChat", error, { chatId });
    throw error;
  }
};

export const removeFromGroup = ({ chatId, targetUserId }) => async (dispatch) => {
  try {
    const res = await authFetch(`/chats/${chatId}/remove-user/${targetUserId}`, {
      method: "DELETE",
    });

    const updatedChat = await parseApiResponse(res, {
      defaultErrorMessage: "Remove member failed",
    });
    dispatch({ type: UPDATE_CHAT, payload: updatedChat });
    return updatedChat;
  } catch (error) {
    logger.error("removeFromGroup", error, { chatId, targetUserId });
    throw error;
  }
};

export const deleteChat = ({ chatId }) => async (dispatch) => {
  try {
    const res = await authFetch(`/chats/${chatId}`, { method: "DELETE" });
    await parseApiResponse(res, {
      defaultErrorMessage: "Delete chat failed",
    });

    dispatch({ type: REMOVE_CHAT, payload: chatId });
    return true;
  } catch (error) {
    logger.error("deleteChat", error, { chatId });
    throw error;
  }
};