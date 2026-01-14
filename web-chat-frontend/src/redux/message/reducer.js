import { CREATE_NEW_MESSAGE, GET_ALL_MESSAGE, DELETE_MESSAGE } from "./actionType";

const initialValue = {
  messages: [],
  newMessage: null,
  pagination: { chatId: null, highestPageLoaded: 0, totalPages: 0, pageSize: 0, totalElements: 0 },
};

const normalizeMessage = (msg = {}) => ({
  ...msg,
  attachments: Array.isArray(msg.attachments) ? msg.attachments : [],
  metadata: msg.metadata ?? {},
});

export const messageReducer = (store = initialValue, { type, payload }) => {
  switch (type) {
    case CREATE_NEW_MESSAGE: {
      const incoming = normalizeMessage(payload);
      if (store.pagination.chatId !== incoming.chatId) {
        return { ...store, newMessage: incoming };
      }
      const alreadyHave = store.messages.some((m) => m.id === incoming.id);
      return {
        ...store,
        newMessage: incoming,
        messages: alreadyHave ? store.messages : [...store.messages, incoming],
      };
    }
    case GET_ALL_MESSAGE: {
      const {
        chatId,
        data = [],
        merge = "replace",
        currentPage,
        totalPages,
        pageSize,
        totalElements,
        reset = false,
      } = payload;

      const sameChat = !reset && store.pagination.chatId === chatId;
      const existing = sameChat ? store.messages : [];
      const normalizedData = data.map(normalizeMessage);

      let messages;
      if (!sameChat || merge === "replace") {
        const incomingIds = new Set(normalizedData.map((m) => m.id));
        const older = existing.filter((m) => !incomingIds.has(m.id));
        messages = [...older, ...normalizedData];
      } else if (merge === "prepend") {
        const existingIds = new Set(existing.map((m) => m.id));
        const filtered = normalizedData.filter((m) => !existingIds.has(m.id));
        messages = [...filtered, ...existing];
      } else {
        messages = normalizedData;
      }

      const prevHighest = sameChat ? store.pagination.highestPageLoaded : 0;
      let highestPageLoaded;
      if (!sameChat || reset) {
        highestPageLoaded = currentPage;
      } else if (merge === "prepend") {
        highestPageLoaded = Math.max(prevHighest, currentPage);
      } else {
        highestPageLoaded = Math.max(prevHighest, currentPage);
      }

      return {
        ...store,
        messages,
        pagination: {
          chatId,
          highestPageLoaded,
          totalPages,
          pageSize,
          totalElements,
        },
      };
    }
    case DELETE_MESSAGE:
      return {
        ...store,
        messages: store.messages.filter((m) => m.id !== payload),
      };
    default:
      return store
  }
}
