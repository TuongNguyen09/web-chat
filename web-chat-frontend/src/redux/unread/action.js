import { authFetch } from "../../utils/authFetch";
import { parseApiResponse } from "../../utils/apiResponse";
import { logger } from "../../utils/logger";
import {
  UNREAD_FETCH_SUCCESS,
  UNREAD_UPDATE,
  UNREAD_RESET_CHAT,
} from "./actionType";

export const fetchUnreadCounts = () => async (dispatch) => {
  try {
    const res = await authFetch(`/unread`, { method: "GET" });
    const result = await parseApiResponse(res, { allowEmptyResult: true });
    dispatch({
      type: UNREAD_FETCH_SUCCESS,
      payload: result ?? {},
    });
  } catch (error) {
    logger.error("fetchUnreadCounts", error);
    dispatch({
      type: UNREAD_FETCH_SUCCESS,
      payload: {},
    });
  }
};

export const markChatAsRead =
  ({ chatId, lastMessageId }) =>
  async (dispatch) => {
    await authFetch(`/unread/${chatId}/read`, {
      method: "POST",
      body: JSON.stringify({ lastMessageId }),
    });

    dispatch({
      type: UNREAD_RESET_CHAT,
      payload: { chatId },
    });
  };

export const handleUnreadPush = ({ chatId, unreadCount }) => ({
  type: UNREAD_UPDATE,
  payload: { chatId, unreadCount },
});