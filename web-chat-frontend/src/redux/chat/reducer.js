import {
  CREATE_CHAT,
  CREATE_GROUP,
  GET_USERS_CHAT,
  UPDATE_CHAT,
  REMOVE_CHAT,
  UPDATE_CHAT_LAST_MESSAGE,
  SORT_CHATS_BY_LATEST,
} from "./actionType";

const initialValue = {
  chats: [],
  chatsKeyword: "",
  createdGroup: null,
  createdChat: null,
};

export const chatReducer = (store = initialValue, action) => {
  switch (action.type) {
    case CREATE_CHAT:
      return { ...store, createdChat: action.payload };

    case CREATE_GROUP:
      return { ...store, createdGroup: action.payload };

    case GET_USERS_CHAT:
      return {
        ...store,
        chats: action.payload.data,
        chatsKeyword: action.payload.keyword,
      };

    case UPDATE_CHAT: {
      const updated = action.payload;
      return {
        ...store,
        chats: store.chats.map((chat) =>
          chat.id === updated.id ? updated : chat
        ),
        createdGroup:
          store.createdGroup?.id === updated.id ? updated : store.createdGroup,
        createdChat:
          store.createdChat?.id === updated.id ? updated : store.createdChat,
      };
    }

    case REMOVE_CHAT:
      return {
        ...store,
        chats: store.chats.filter((chat) => chat.id !== action.payload),
        createdGroup:
          store.createdGroup?.id === action.payload ? null : store.createdGroup,
        createdChat:
          store.createdChat?.id === action.payload ? null : store.createdChat,
      };

    case UPDATE_CHAT_LAST_MESSAGE: {
      const { chatId, lastMessage } = action.payload;
      return {
        ...store,
        chats: store.chats.map((chat) =>
          chat.id === chatId ? { ...chat, lastMessage } : chat
        ),
      };
    }

    case SORT_CHATS_BY_LATEST: {
      return {
        ...store,
        chats: [...store.chats].sort((a, b) => {
          const timeA = a.lastMessage?.timeStamp ? new Date(a.lastMessage.timeStamp).getTime() : 0;
          const timeB = b.lastMessage?.timeStamp ? new Date(b.lastMessage.timeStamp).getTime() : 0;
          return timeB - timeA;
        }),
      };
    }

    default:
      return store;
  }
};