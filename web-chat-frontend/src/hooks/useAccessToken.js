// ============================================================================
// USE ACCESS TOKEN HOOK
// ============================================================================

import { useState, useEffect } from "react";
import { getAccessToken, subscribeAccessToken } from "../utils/tokenManager";

const useAccessToken = () => {
    const [token, setToken] = useState(() => getAccessToken());

    useEffect(() => {
        const unsubscribe = subscribeAccessToken(setToken);
        return unsubscribe;
    }, []);

    return token;
};

export default useAccessToken;
