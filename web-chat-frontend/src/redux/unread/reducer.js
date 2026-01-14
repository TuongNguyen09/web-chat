import {
  UNREAD_FETCH_SUCCESS,
  UNREAD_UPDATE,
  UNREAD_RESET_CHAT,
} from "./actionType";

const initialState = { byChatId: {} };

export const unreadReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case UNREAD_FETCH_SUCCESS:
      return { byChatId: payload || {} };

    case UNREAD_UPDATE:
      return {
        byChatId: {
          ...state.byChatId,
          [payload.chatId]: payload.unreadCount,
        },
      };

    case UNREAD_RESET_CHAT: {
      const next = { ...state.byChatId };
      delete next[payload.chatId];
      return { byChatId: next };
    }

    default:
      return state;
  }
};