import { authFetch } from "../../utils/authFetch";
import { parseApiResponse } from "../../utils/apiResponse";
import { logger } from "../../utils/logger";
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

    const result = await parseApiResponse(res);
    dispatch({ type: CREATE_NEW_MESSAGE, payload: result });
  } catch (error) {
    logger.error("createMessage", error, { chatId: data?.chatId });
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

    const result = await parseApiResponse(res, { allowEmptyResult: true });

    dispatch({
      type: GET_ALL_MESSAGE,
      payload: {
        chatId,
        data: result?.data || [],
        currentPage: result?.currentPage,
        totalPages: result?.totalPages,
        pageSize: result?.pageSize,
        totalElements: result?.totalElements,
        merge,
        reset,
      },
    });

    return result;
  } catch (error) {
    logger.error("getAllMessages", error, { chatId, page, size });
    throw error;
  }
};

export const deleteMessage = ({ messageId }) => async (dispatch) => {
  try {
    const res = await authFetch(`/messages/${messageId}`, { method: "DELETE" });
    
    // For delete, we might get a message in the response
    let result;
    try {
      result = await parseApiResponse(res, {
        defaultErrorMessage: "You cannot delete this message !",
      });
    } catch (error) {
      // If parseApiResponse fails, try to get message from response
      const data = await res.json();
      if (data?.message) {
        dispatch({ type: DELETE_MESSAGE, payload: messageId });
        return data.message;
      }
      throw error;
    }

    dispatch({ type: DELETE_MESSAGE, payload: messageId });
    return result?.message || "Message deleted successfully";
  } catch (error) {
    logger.error("deleteMessage", error, { messageId });
    throw error;
  }
};

export const pushRealtimeMessage = (message) => ({
  type: CREATE_NEW_MESSAGE,
  payload: message,
});