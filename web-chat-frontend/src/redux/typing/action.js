import { authFetch } from "../../utils/authFetch";
import { TYPING_SET_BULK, TYPING_SET_STATE, TYPING_CLEAR_CHAT } from "./actionType";

export const fetchActiveTypers = ({ chatId }) => async (dispatch) => {
  if (!chatId) return;

  const res = await authFetch(`/typing/${chatId}`, { method: "GET" });
  const { result = [] } = await res.json();

  const typers = result.reduce((acc, item) => {
    if (item.userId) acc[item.userId] = item.displayName || "Ai đó";
    return acc;
  }, {});

  dispatch({ type: TYPING_SET_BULK, payload: { chatId, typers } });
};

export const handleTypingPush = (payload) => ({
  type: TYPING_SET_STATE,
  payload,
});

export const clearTypingForChat = (chatId) => ({
  type: TYPING_CLEAR_CHAT,
  payload: { chatId },
});