import { authFetch } from "../../utils/authFetch";
import {
  CREATE_NEW_MESSAGE,
  GET_ALL_MESSAGE,
  DELETE_MESSAGE,
} from "./actionType";

export const createMessage = ({ data }) => async (dispatch) => {
  try {
    const res = await authFetch(`/messages/send`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    const response = await res.json();
    dispatch({ type: CREATE_NEW_MESSAGE, payload: response.result || response });
  } catch (error) {
    console.error("createMessage error:", error);
  }
};

export const getAllMessages = ({
  chatId,
  page = 1,
  size = 20,
  merge = "replace",
  reset = false,
}) => async (dispatch) => {
  try {
    const res = await authFetch(
      `/messages/chat/${chatId}?page=${page}&size=${size}`,
      { method: "GET" }
    );

    const response = await res.json();
    const result = response.result || response;

    dispatch({
      type: GET_ALL_MESSAGE,
      payload: {
        chatId,
        data: result.data || [],
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        pageSize: result.pageSize,
        totalElements: result.totalElements,
        merge,
        reset,
      },
    });

    return result;
  } catch (error) {
    console.error("getAllMessages error", error);
    throw error;
  }
};

export const deleteMessage = ({ messageId }) => async (dispatch) => {
  try {
    const res = await authFetch(`/messages/${messageId}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok || data.code !== 0) {
      throw new Error(data?.message || "You cannot delete this message !");
    }

    dispatch({ type: DELETE_MESSAGE, payload: messageId });
    return data.message || "Message deleted successfully";
  } catch (error) {
    console.error("deleteMessage error:", error);
    throw error;
  }
};

export const pushRealtimeMessage = (message) => ({
  type: CREATE_NEW_MESSAGE,
  payload: message,
});