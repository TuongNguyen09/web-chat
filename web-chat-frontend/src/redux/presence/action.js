import { authFetch } from "../../utils/authFetch";
import { parseApiResponse } from "../../utils/apiResponse";
import { logger } from "../../utils/logger";

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
  try {
    const res = await authFetch(`${API_BASE}/online`, { method: "GET" });
    const result = await parseApiResponse(res, { allowEmptyResult: true });
    dispatch({
      type: PresenceTypes.BULK_SET,
      payload: result ?? {},
    });
  } catch (error) {
    logger.error("fetchPresenceSnapshot", error);
    dispatch({
      type: PresenceTypes.BULK_SET,
      payload: {},
    });
  }
};

export const fetchPresenceByUser = ({ userId }) => async (dispatch) => {
  try {
    const res = await authFetch(`${API_BASE}/${userId}`, { method: "GET" });
    const result = await parseApiResponse(res, { allowEmptyResult: true });
    if (result) {
      dispatch(receivePresencePush(result));
    }
  } catch (error) {
    logger.error("fetchPresenceByUser", error, { userId });
  }
};