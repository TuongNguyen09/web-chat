import { TYPING_SET_BULK, TYPING_SET_STATE, TYPING_CLEAR_CHAT } from "./actionType";

const initialState = { byChatId: {} };

export const typingReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case TYPING_SET_BULK: {
      const { chatId, typers } = payload;
      if (!chatId) return state;
      return {
        ...state,
        byChatId: {
          ...state.byChatId,
          [chatId]: typers,
        },
      };
    }
    case TYPING_SET_STATE: {
      const { chatId, userId, displayName, typing } = payload || {};
      if (!chatId || !userId) return state;

      const current = state.byChatId[chatId] || {};
      const next = typing
        ? { ...current, [userId]: displayName || "Ai đó" }
        : (() => {
            const clone = { ...current };
            delete clone[userId];
            return clone;
          })();

      return {
        ...state,
        byChatId: {
          ...state.byChatId,
          [chatId]: next,
        },
      };
    }
    case TYPING_CLEAR_CHAT: {
      const { chatId } = payload || {};
      if (!chatId) return state;
      const next = { ...state.byChatId };
      delete next[chatId];
      return { ...state, byChatId: next };
    }
    default:
      return state;
  }
};