import { applyMiddleware, combineReducers, legacy_createStore } from "redux";
import { thunk } from "redux-thunk";
import { authReducer } from "./auth/reducer";
import {chatReducer} from "./chat/reducer"
import { messageReducer } from "./message/reducer";
import { unreadReducer } from "./unread/reducer";
import { typingReducer } from "./typing/reducer";
import presenceReducer from "./presence/reducer";

const rootReducer = combineReducers({
    auth: authReducer,
    chat: chatReducer,
    message: messageReducer,
    unread: unreadReducer,
    typing: typingReducer,
    presence: presenceReducer,
});

export const store = legacy_createStore(rootReducer, applyMiddleware(thunk));