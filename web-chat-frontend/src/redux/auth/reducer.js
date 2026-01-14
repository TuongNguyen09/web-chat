import { LOGIN, REGISTER, REQ_USER, SEARCH_USER, UPDATE_USER, INTROSPECT_TOKEN } from "./actionType";

const initialValue = {
  signup: { success: false, error: null, data: null },
  signin: { success: false, error: null, data: null },
  reqUser: null,
  searchUser: null,
  updatedUser: null,
  introspect: null,
  sessionHydrated: false,
};

const cloneSigninState = () => ({ ...initialValue.signin });

export const authReducer = (state = initialValue, { type, payload }) => {
  switch (type) {
    case REGISTER:
      return {
        ...state,
        signup: {
          success: payload?.success || false,
          error: payload?.error || null,
          data: payload?.data || null,
        },
      };

    case LOGIN:
      return {
        ...state,
        signin: {
          success: payload?.success || false,
          error: payload?.error || null,
          data: payload?.data || null,
        },
      };

    case REQ_USER:
      return { ...state, reqUser: payload };

    case SEARCH_USER:
      return { ...state, searchUser: payload };

    case UPDATE_USER: {
      const mergedUser = state.reqUser ? { ...state.reqUser, ...payload } : payload;
      return {
        ...state,
        reqUser: mergedUser,
        updatedUser: mergedUser,
      };
    }

    case INTROSPECT_TOKEN:
      return { ...state, introspect: payload };

    case "AUTH/RESET_SIGNIN_STATE":
      return { ...state, signin: cloneSigninState() };

    case "AUTH/RESET_ALL":
      return initialValue;

    case "AUTH/BOOTSTRAP_FINISHED":
      return { ...state, sessionHydrated: true };

    default:
      return state;
  }
};