// ============================================================================
// USE WEBSOCKET CONNECTION HOOK
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client/dist/sockjs";
import { over } from "stompjs";
import { ENV_CONFIG } from "../config/env";
import { logger } from "../utils/logger";
import { getCookie } from "../constants/homePageConstants";

const useWebSocketConnection = (isAuthenticated, accessToken) => {
    const [stompClient, setStompClient] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const stompRef = useRef(null);
    const retryTimeoutRef = useRef(null);

    const connect = useCallback(() => {
        if (!isAuthenticated || !accessToken || stompRef.current) return;

        const sock = new SockJS(ENV_CONFIG.API.WS_URL);
        const client = over(sock);

        const xsrf = getCookie("XSRF-TOKEN");
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            ...(xsrf ? { "X-XSRF-TOKEN": xsrf } : {}),
        };

        client.connect(
            headers,
            () => {
                stompRef.current = client;
                setStompClient(client);
                setIsConnected(true);
            },
            (error) => {
                logger.error("WS error", error);
                stompRef.current = null;
                setIsConnected(false);
                retryTimeoutRef.current = setTimeout(connect, 3000);
            }
        );
    }, [accessToken, isAuthenticated]);

    const disconnect = useCallback(() => {
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }
        if (stompRef.current) {
            stompRef.current.disconnect();
            stompRef.current = null;
        }
        setIsConnected(false);
        setStompClient(null);
    }, []);

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    return {
        stompClient,
        isConnected,
        stompRef,
    };
};

export default useWebSocketConnection;
