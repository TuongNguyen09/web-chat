import { authFetch } from "../../utils/authFetch";
import {
  UNREAD_FETCH_SUCCESS,
  UNREAD_UPDATE,
  UNREAD_RESET_CHAT,
} from "./actionType";

export const fetchUnreadCounts = () => async (dispatch) => {
  const res = await authFetch(`/unread`, { method: "GET" });
  const response = await res.json();
  dispatch({
    type: UNREAD_FETCH_SUCCESS,
    payload: response.result ?? {},
  });
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