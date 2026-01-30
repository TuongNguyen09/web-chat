// ============================================================================
// USE TYPING AND PRESENCE HOOK
// ============================================================================

import { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import {
    handleTypingPush,
    clearTypingForChat,
    fetchActiveTypers,
} from "../redux/typing/action";
import {
    receivePresencePush,
    fetchPresenceByUser,
} from "../redux/presence/action";
import { logger } from "../utils/logger";

const useTypingAndPresence = (
    stompClient,
    isConnected,
    safeChats,
    currentChat,
    currentUserId,
    isAuthenticated
) => {
    const dispatch = useDispatch();
    const typingSubscriptionsRef = useRef({});
    const prevChatIdRef = useRef(null);

    // Handle incoming typing event
    const handleIncomingTypingEvent = useCallback(
        (payload) => {
            try {
                const data = JSON.parse(payload.body);
                if (data.userId === currentUserId) return;
                dispatch(handleTypingPush(data));
            } catch (err) {
                logger.error("handleIncomingTypingEvent", err);
            }
        },
        [currentUserId, dispatch]
    );

    // Subscribe to typing events for active chats
    useEffect(() => {
        if (!isConnected || !stompClient) return;

        const subs = typingSubscriptionsRef.current;
        const activeChatIds = safeChats.map((chat) => chat.id);

        activeChatIds.forEach((chatId) => {
            if (subs[chatId]) return;
            subs[chatId] = stompClient.subscribe(
                `/group/${chatId}/typing`,
                handleIncomingTypingEvent
            );
        });

        Object.keys(subs).forEach((chatId) => {
            if (!activeChatIds.includes(chatId)) {
                subs[chatId].unsubscribe();
                delete subs[chatId];
            }
        });

        return () => {
            Object.values(subs).forEach((sub) => sub.unsubscribe());
            typingSubscriptionsRef.current = {};
        };
    }, [safeChats, isConnected, stompClient, handleIncomingTypingEvent]);

    // Handle chat change for typing
    useEffect(() => {
        const previous = prevChatIdRef.current;
        if (previous && previous !== currentChat?.id) {
            dispatch(clearTypingForChat(previous));
        }
        prevChatIdRef.current = currentChat?.id;

        if (currentChat?.id && isAuthenticated) {
            dispatch(fetchActiveTypers({ chatId: currentChat.id }));
        }
    }, [currentChat?.id, isAuthenticated, dispatch]);

    // Send typing signal
    const sendTypingSignal = useCallback(
        (chatId, typing) => {
            if (!stompClient || !chatId) return;
            try {
                const destination = typing ? "/app/typing/start" : "/app/typing/stop";
                stompClient.send(destination, {}, JSON.stringify({ chatId }));
            } catch (err) {
                logger.error("sendTypingSignal", err, { chatId, typing });
            }
        },
        [stompClient]
    );

    // Handle presence event
    const handlePresenceEvent = useCallback(
        (payload) => {
            try {
                const data = JSON.parse(payload.body);
                dispatch(receivePresencePush(data));
            } catch (err) {
                logger.error("handlePresenceEvent", err);
            }
        },
        [dispatch]
    );

    // Subscribe to presence events
    useEffect(() => {
        if (!isConnected || !stompClient) return;
        const sub = stompClient.subscribe("/group/presence", handlePresenceEvent);
        return () => sub.unsubscribe();
    }, [isConnected, stompClient, handlePresenceEvent]);

    // Fetch presence for private chat partner
    useEffect(() => {
        if (!isAuthenticated || !currentChat) return;

        // Only fetch presence for private chats (not groups)
        const isGroupChat = currentChat.users && currentChat.users.length > 2;
        if (isGroupChat) return;

        const partner = currentChat.members?.find(
            (m) => m.id !== currentUserId
        );
        if (partner?.id) {
            dispatch(fetchPresenceByUser({ userId: partner.id }));
        }
    }, [isAuthenticated, currentChat, currentUserId, dispatch]);

    return {
        sendTypingSignal,
        typingSubscriptionsRef,
    };
};

export default useTypingAndPresence;
