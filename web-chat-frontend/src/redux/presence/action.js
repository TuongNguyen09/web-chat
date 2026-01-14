import { authFetch } from "../../utils/authFetch";

const API_BASE = "/presence"; // authFetch đã gắn BASE_API_URL sẵn

export const PresenceTypes = {
  UPSERT: "presence/upsert",
  BULK_SET: "presence/bulkSet",
};

export const receivePresencePush = (payload) => ({
  type: PresenceTypes.UPSERT,
  payload,
});

export const fetchPresenceSnapshot = () => async (dispatch) => {
  const res = await authFetch(`${API_BASE}/online`, { method: "GET" });
  const data = await res.json();
  dispatch({
    type: PresenceTypes.BULK_SET,
    payload: data.result ?? {},
  });
};

export const fetchPresenceByUser = ({ userId }) => async (dispatch) => {
  const res = await authFetch(`${API_BASE}/${userId}`, { method: "GET" });
  const data = await res.json();
  dispatch(receivePresencePush(data.result));
};