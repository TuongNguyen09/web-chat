import { PresenceTypes } from "./action";

const initialState = {
  byUserId: {},
};

const upsert = (state, payload) => {
  if (!payload?.userId) return state;
  return {
    ...state,
    byUserId: {
      ...state.byUserId,
      [payload.userId]: {
        ...state.byUserId[payload.userId],
        ...payload,
      },
    },
  };
};

export default function presenceReducer(state = initialState, action) {
  switch (action.type) {
    case PresenceTypes.BULK_SET: {
      const map = action.payload || {};
      const next = { ...state.byUserId };
      Object.entries(map).forEach(([userId, lastSeen]) => {
        next[userId] = { ...(next[userId] || {}), userId, online: true, lastSeen };
      });
      return { ...state, byUserId: next };
    }
    case PresenceTypes.UPSERT:
      return { ...state, byUserId: upsert(state, action.payload).byUserId };
    default:
      return state;
  }
}