// ============================================================================
// USE MESSAGE PAGINATION HOOK
// ============================================================================

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { getAllMessages } from "../redux/message/action";
import { PAGE_SIZE, MIN_FETCH_DURATION, sleep } from "../constants/homePageConstants";

const useMessagePagination = (currentChat, isAuthenticated, messageState) => {
    const dispatch = useDispatch();
    const messageContainerRef = useRef(null);
    const keepAtBottomRef = useRef(true);
    const isPrependingRef = useRef(false);
    const prevScrollHeightRef = useRef(0);
    const prevScrollTopRef = useRef(0);
    const isFetchingOlderRef = useRef(false);
    const messagesChatIdRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [pendingMessageFocus, setPendingMessageFocus] = useState(null);

    const pagination = messageState.pagination;

    // Sync messages from Redux state - trigger on ANY messageState change
    useEffect(() => {
        setMessages(messageState.messages || []);
        messagesChatIdRef.current = messageState.pagination?.chatId || null;
    }, [messageState]);

    // Fetch initial messages when chat changes
    useEffect(() => {
        if (!currentChat?.id || !isAuthenticated) return;
        dispatch(
            getAllMessages({
                chatId: currentChat.id,
                page: 1,
                size: PAGE_SIZE,
                merge: "replace",
                reset: true,
            })
        );
    }, [currentChat, isAuthenticated, dispatch]);

    // Load older messages
    const loadOlderMessages = useCallback(async () => {
        if (!currentChat?.id) return;
        if (!pagination || pagination.chatId !== currentChat.id) return;
        if (isFetchingOlderRef.current) return;

        const { highestPageLoaded, totalPages } = pagination;
        if (highestPageLoaded >= totalPages) return;

        const nextPage = highestPageLoaded + 1;
        const container = messageContainerRef.current;
        if (container) {
            prevScrollHeightRef.current = container.scrollHeight;
            prevScrollTopRef.current = container.scrollTop;
            isPrependingRef.current = true;
        }

        isFetchingOlderRef.current = true;
        setIsLoadingOlder(true);
        try {
            const start = Date.now();
            await dispatch(
                getAllMessages({
                    chatId: currentChat.id,
                    page: nextPage,
                    size: PAGE_SIZE,
                    merge: "prepend",
                })
            );
            const elapsed = Date.now() - start;
            if (elapsed < MIN_FETCH_DURATION) {
                await sleep(MIN_FETCH_DURATION - elapsed);
            }
        } finally {
            setIsLoadingOlder(false);
            isFetchingOlderRef.current = false;
        }
    }, [currentChat?.id, pagination, dispatch]);

    // Handle scroll event
    useEffect(() => {
        const container = messageContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const nearTop = container.scrollTop <= 20;
            const nearBottom =
                container.scrollHeight -
                (container.scrollTop + container.clientHeight) <
                80;

            keepAtBottomRef.current = nearBottom;
            if (nearTop) loadOlderMessages();
        };

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, [currentChat?.id, loadOlderMessages]);

    // Auto scroll to bottom
    useLayoutEffect(() => {
        const container = messageContainerRef.current;
        if (!container) return;

        if (isPrependingRef.current) {
            const heightDiff = container.scrollHeight - prevScrollHeightRef.current;
            container.scrollTop = prevScrollTopRef.current + heightDiff;
            isPrependingRef.current = false;
            return;
        }

        if (pendingMessageFocus) return;
        if (keepAtBottomRef.current) {
            container.scrollTop = container.scrollHeight;
        }
    }, [messages, currentChat, pendingMessageFocus]);

    // Scroll to specific message
    const scrollToMessage = useCallback((messageId) => {
        const container = messageContainerRef.current;
        if (!container) return false;

        const target = container.querySelector(
            `[data-message-id="${messageId}"]`
        );
        if (!target) return false;

        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("focus-message");
        setTimeout(() => target.classList.remove("focus-message"), 1600);
        return true;
    }, []);

    // Handle pending message focus
    useEffect(() => {
        if (!pendingMessageFocus || pendingMessageFocus.chatId !== currentChat?.id)
            return;
        if (messagesChatIdRef.current !== currentChat.id) return;
        if (!pagination || pagination.chatId !== currentChat.id) return;

        const { messageId } = pendingMessageFocus;
        const hasMessage = messages.some((m) => m.id === messageId);

        if (hasMessage) {
            if (scrollToMessage(messageId)) {
                setPendingMessageFocus(null);
            }
            return;
        }

        const canLoadMore =
            pagination.highestPageLoaded < pagination.totalPages &&
            !isFetchingOlderRef.current;

        if (canLoadMore) {
            loadOlderMessages();
        } else {
            setPendingMessageFocus(null);
        }
    }, [
        pendingMessageFocus,
        currentChat,
        messages,
        pagination,
        scrollToMessage,
        loadOlderMessages,
    ]);

    return {
        messageContainerRef,
        keepAtBottomRef,
        messages,
        setMessages,
        isLoadingOlder,
        pendingMessageFocus,
        setPendingMessageFocus,
        loadOlderMessages,
        scrollToMessage,
    };
};

export default useMessagePagination;
