import React, {
    useState,
    useEffect,
    useRef,
    useLayoutEffect,
    useCallback,
    useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
    logout,
    currentUser,
    searchUser,
} from "../../redux/auth/action";
import {
    getAllMessages,
    deleteMessage,
    pushRealtimeMessage,
} from "../../redux/message/action";
import {
    createChat,
    getUsersChat,
    addUserToGroup,
    updateChat,
    removeFromGroup,
    deleteChat,
} from "../../redux/chat/action";
import {
    fetchUnreadCounts,
    markChatAsRead,
    handleUnreadPush,
} from "../../redux/unread/action";
import {
    fetchActiveTypers,
    handleTypingPush,
    clearTypingForChat,
} from "../../redux/typing/action";
import {
    fetchPresenceSnapshot,
    fetchPresenceByUser,
    receivePresencePush,
} from "../../redux/presence/action";

import SidePanel from "../../components/HomeLayout/SidePanel";
import ChatBox from "../../components/HomeLayout/ChatBox";
import EmptyChatState from "../../components/HomeLayout/EmptyChatState";
import toast from "react-hot-toast";
import Profile from "../../components/Profile";
import CreateGroup from "../../components/Group/CreateGroup";
import GroupInfoSheet from "../../components/Group/GroupInfoSheet";
import NewContact from "../../components/Contact/NewContact";
import "./HomePage.css";
import SockJS from "sockjs-client/dist/sockjs";
import { over } from "stompjs";
import { MessageType } from "../../constants/messageType";
import { getAccessToken, subscribeAccessToken } from "../../utils/tokenManager";

/* ---------- Constants & helpers ---------- */
const PAGE_SIZE = 20;
const MIN_FETCH_DURATION = 1000;
const DEFAULT_AVATAR =
    "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__340.png";
const DEFAULT_GROUP_IMAGE =
    "https://plus.unsplash.com/premium_photo-1664474619075-644dd191935f?auto=format&fit=crop&w=200&q=80";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length !== 2) return undefined;
    return parts.pop().split(";").shift();
};

const isGroupChat = (chatEntity) => Boolean(chatEntity?.group);
const normalize = (text) => text?.toLowerCase() ?? "";
const truncate = (text, max = 70) =>
    text?.length > max ? `${text.slice(0, max)}…` : text || "";
const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const highlightText = (text, keyword) => {
    if (!text || !keyword?.trim()) return null;
    const rawKeyword = keyword.trim();
    const regex = new RegExp(`(${escapeRegExp(rawKeyword)})`, "ig");
    const parts = text.split(regex);
    if (parts.length === 1) return null;
    const lowered = rawKeyword.toLowerCase();

    return parts.map((part, index) =>
        part.toLowerCase() === lowered ? (
            <span
                key={`${part}-${index}`}
                className="bg-yellow-200 text-gray-900 rounded px-0.5"
            >
                {part}
            </span>
        ) : (
            part
        )
    );
};

const describeAttachmentPreview = (message, senderLabel) => {
    const attachments = Array.isArray(message.attachments)
        ? message.attachments
        : [];
    const trimmed = message.content?.trim();

    if (trimmed) {
        return `${senderLabel}: ${truncate(trimmed)}`;
    }

    const join = (text) => `${senderLabel} ${text}`;
    const countByMime = (prefix) =>
        attachments.filter((att) => att?.mimeType?.startsWith(prefix)).length;

    const imageCount = countByMime("image/");
    const videoCount = countByMime("video/");
    const audioCount = countByMime("audio/");
    const otherDocs = attachments.length - (imageCount + videoCount + audioCount);
    const noun = (count, singular, plural) =>
        count > 1 ? `${count} ${plural}` : `một ${singular}`;
    const attachmentText = (text) => join(text);

    switch (message.type) {
        case MessageType.IMAGE:
            return attachmentText(
                `đã gửi ${noun(imageCount || attachments.length || 1, "ảnh", "ảnh")}`
            );
        case MessageType.VIDEO:
            return attachmentText(
                `đã gửi ${noun(videoCount || attachments.length || 1, "video", "video")}`
            );
        case MessageType.AUDIO:
            return attachmentText("đã gửi tin nhắn thoại");
        case MessageType.FILE:
            return attachmentText(
                attachments.length
                    ? `đã gửi ${noun(attachments.length, "tệp đính kèm", "tệp đính kèm")}`
                    : "đã gửi tập tin đính kèm"
            );
        case MessageType.STICKER:
            return attachmentText(
                message.content
                    ? `đã gửi biểu cảm ${message.content}`
                    : "đã gửi biểu cảm"
            );
        case MessageType.LINK:
            return attachmentText("đã chia sẻ một liên kết");
        default:
            break;
    }

    if (imageCount) return attachmentText(`đã gửi ${noun(imageCount, "ảnh", "ảnh")}`);
    if (videoCount) return attachmentText(`đã gửi ${noun(videoCount, "video", "video")}`);
    if (audioCount) return attachmentText(`đã gửi ${noun(audioCount, "âm thanh", "âm thanh")}`);
    if (otherDocs > 0) return attachmentText(`đã gửi ${noun(otherDocs, "tập tin", "tập tin")}`);

    return attachmentText("đã gửi tin nhắn");
};

const getLastMessageMeta = (chat, currentUserId) => {
    if (!chat.messages?.length) {
        return { previewText: "Hãy gửi tin nhắn đầu tiên!", timestamp: "" };
    }
    const lastMessage = chat.lastMessage || chat.messages[chat.messages.length - 1];
    const senderName =
        lastMessage?.sender?.id === currentUserId
            ? "Bạn"
            : lastMessage?.sender?.fullName || "Unknown";

    return {
        previewText: describeAttachmentPreview(lastMessage || {}, senderName),
        timestamp: lastMessage?.timeStamp
            ? new Date(lastMessage.timeStamp).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
            })
            : "",
    };
};

const buildMatchMeta = (chat, keyword, currentUserId) => {
    const base = {
        ...getLastMessageMeta(chat, currentUserId),
        previewNode: null,
        subtitle: null,
        nameNode: null,
        matchedMessageId: null,
    };

    const normalizedKeyword = keyword?.trim().toLowerCase();
    if (!normalizedKeyword) return base;

    const messageHit = chat.messages?.find((msg) =>
        normalize(msg.content).includes(normalizedKeyword)
    );
    if (messageHit) {
        const senderName =
            messageHit.sender?.id === currentUserId
                ? "Bạn"
                : messageHit.sender?.fullName || "Unknown";
        const truncated = truncate(messageHit.content);
        const highlighted = highlightText(truncated, keyword.trim());

        return {
            ...base,
            previewNode: (
                <>
                    {senderName}: {highlighted || truncated}
                </>
            ),
            matchedMessageId: messageHit.id,
        };
    }

    const participants = (chat.users || []).filter((u) => u.id !== currentUserId);
    const memberHit = participants.find((u) =>
        normalize(u.fullName).includes(normalizedKeyword)
    );

    if ((chat.isGroup || chat.group) && memberHit) {
        return { ...base, subtitle: `${memberHit.fullName} is in this group` };
    }

    if (!chat.isGroup && !chat.group && memberHit) {
        return { ...base, nameNode: highlightText(memberHit.fullName, keyword.trim()) };
    }

    return base;
};

const formatDateLabel = (isoString) =>
    new Date(isoString).toLocaleDateString("vi-VN");

/* Hook đồng bộ access token từ tokenManager */
const useAccessToken = () => {
    const [token, setToken] = useState(() => getAccessToken());

    useEffect(() => {
        const unsubscribe = subscribeAccessToken(setToken);
        return unsubscribe;
    }, []);

    return token;
};

const HomePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { auth, chat, message } = useSelector((store) => store);
    const unreadByChat = useSelector((store) => store.unread.byChatId);
    const typingByChat = useSelector((store) => store.typing.byChatId);
    const presenceByUserId = useSelector((store) => store.presence.byUserId || {});

    const unreadRef = useRef(unreadByChat);
    useEffect(() => {
        unreadRef.current = unreadByChat;
    }, [unreadByChat]);

    const typingSubscriptionsRef = useRef({});
    const prevChatIdRef = useRef(null);

    const accessToken = useAccessToken();
    const isAuthenticated = Boolean(accessToken && auth.reqUser?.id);

    const [chatKeyword, setChatKeyword] = useState("");
    const [content, setContent] = useState("");
    const [activeSidePanel, setActiveSidePanel] = useState(null);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
    const [pendingMessageFocus, setPendingMessageFocus] = useState(null);
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [leftMenuAnchor, setLeftMenuAnchor] = useState(null);
    const [rightMenuAnchor, setRightMenuAnchor] = useState(null);
    const [stompClient, setStompClient] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    const serverKeyword = chat.chatsKeyword || "";
    const pagination = message.pagination;
    const currentUserId = auth.reqUser?.id;

    const messageContainerRef = useRef(null);
    const keepAtBottomRef = useRef(true);
    const isPrependingRef = useRef(false);
    const prevScrollHeightRef = useRef(0);
    const prevScrollTopRef = useRef(0);
    const isFetchingOlderRef = useRef(false);
    const messagesChatIdRef = useRef(null);

    const safeChats = useMemo(
        () => (Array.isArray(chat.chats) ? chat.chats : []),
        [chat.chats]
    );

    const privateContacts = useMemo(() => {
        if (!currentUserId) return [];
        return safeChats
            .filter((c) => !isGroupChat(c))
            .map((c) => c.users?.find((u) => u.id !== currentUserId))
            .filter(Boolean);
    }, [safeChats, currentUserId]);

    /* Side panel helpers */
    const openProfile = () => setActiveSidePanel("profile");
    const openContact = () => setActiveSidePanel("contact");
    const openGroup = () => setActiveSidePanel("group");
    const closeSidePanel = () => setActiveSidePanel(null);

    /* Menu helpers */
    const openLeft = Boolean(leftMenuAnchor);
    const openRight = Boolean(rightMenuAnchor);
    const handleLeftClick = (e) => setLeftMenuAnchor(e.currentTarget);
    const handleLeftClose = () => setLeftMenuAnchor(null);
    const handleRightClick = (e) => setRightMenuAnchor(e.currentTarget);
    const handleRightClose = () => setRightMenuAnchor(null);

    /* Nếu không có token -> đá về /auth */
    const sessionHydrated = useSelector((state) => state.auth.sessionHydrated);

    useEffect(() => {
        if (!sessionHydrated) return;
        if (!accessToken) {
            navigate("/auth");
        }
    }, [sessionHydrated, accessToken, navigate]);

    // useEffect(() => {
    //     if (!accessToken) {
    //         dispatch(logout());
    //         navigate("/auth");
    //     }
    // }, [accessToken, dispatch, navigate]);

    /* Nếu đã có token mà Redux chưa có user -> fetch lại */
    useEffect(() => {
        if (accessToken && !auth.reqUser) {
            dispatch(currentUser());
        }
    }, [accessToken, auth.reqUser, dispatch]);

    /* Giá trị guard chung */
    useEffect(() => {
        if (!isAuthenticated) return;
        dispatch(getUsersChat());
    }, [isAuthenticated, chat.createdChat, chat.createdGroup, dispatch]);

    useEffect(() => {
        if (!isAuthenticated) return;
        dispatch(fetchUnreadCounts());
    }, [isAuthenticated, dispatch]);

    useEffect(() => {
        if (!isAuthenticated) return;
        dispatch(fetchPresenceSnapshot());
    }, [isAuthenticated, dispatch]);

    /* WebSocket lifecycle */
    const stompRef = useRef(null);
    const retryTimeoutRef = useRef(null);

    const connect = useCallback(() => {
        if (!isAuthenticated || !accessToken || stompRef.current) return;

        const sock = new SockJS("http://localhost:8080/whatsapp/ws");
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
                console.error("WS error", error);
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

    const markCurrentChatAsRead = useCallback(
        (chatId) => {
            if (!chatId) return;
            const sameChat = message.pagination?.chatId === chatId;
            const lastMessage = sameChat
                ? message.messages?.[message.messages.length - 1]
                : null;

            dispatch(
                markChatAsRead({
                    chatId,
                    lastMessageId: lastMessage?.id || null,
                })
            );
        },
        [dispatch, message.messages, message.pagination?.chatId]
    );

    const handleIncomingGroupMessage = useCallback(
        (payload) => {
            const messageData = JSON.parse(payload.body);
            const { chatId } = messageData;
            const sentByMe = messageData.sender?.id === currentUserId;

            if (chatId === currentChat?.id) {
                dispatch(pushRealtimeMessage(messageData));
                if (!sentByMe) {
                    markCurrentChatAsRead(chatId);
                }
                return;
            }

            if (!sentByMe) {
                const currentUnread = unreadRef.current[chatId] || 0;
                dispatch(
                    handleUnreadPush({
                        chatId,
                        unreadCount: currentUnread + 1,
                    })
                );
            }
        },
        [currentChat?.id, currentUserId, dispatch, markCurrentChatAsRead]
    );

    const groupSubscriptionsRef = useRef({});
    useEffect(() => {
        if (!isConnected || !stompClient) return;

        const subs = groupSubscriptionsRef.current;
        const activeChatIds = safeChats.map((chat) => chat.id);

        activeChatIds.forEach((chatId) => {
            if (subs[chatId]) return;
            subs[chatId] = stompClient.subscribe(
                `/group/${chatId}`,
                handleIncomingGroupMessage
            );
        });

        Object.keys(subs).forEach((chatId) => {
            if (!activeChatIds.includes(chatId)) {
                subs[chatId].unsubscribe();
                delete subs[chatId];
            }
        });

        return () => {
            Object.values(subs).forEach((subscription) => subscription.unsubscribe());
            groupSubscriptionsRef.current = {};
        };
    }, [safeChats, isConnected, stompClient, handleIncomingGroupMessage]);

    /* Message sync */
    useEffect(() => {
        setMessages(message.messages || []);
        messagesChatIdRef.current = message.pagination?.chatId || null;
    }, [message.messages, message.pagination?.chatId]);

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

    /* Infinite scroll */
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

    /* Keep currentChat fresh */
    useEffect(() => {
        if (!currentChat) return;
        const fresh = safeChats.find((c) => c.id === currentChat.id);
        if (fresh && fresh !== currentChat) {
            setCurrentChat(fresh);
        }
    }, [safeChats, currentChat]);

    /* Auth / chat handlers */
    const handleLogout = () => {
        dispatch(logout());
        navigate("/auth");
    };

    const handleSearchChats = (value) => {
        setChatKeyword(value);
        if (!isAuthenticated) return;
        dispatch(getUsersChat({ keyword: value }));
    };

    const handleSearchPotentialMembers = useCallback(
        (keyword) => {
            if (!isAuthenticated) return;
            dispatch(searchUser({ keyword }));
        },
        [dispatch, isAuthenticated]
    );

    const handleSelectContactUser = async (user) => {
        if (!user?.id || !isAuthenticated) return;
        try {
            const chatResult = await dispatch(
                createChat({ data: { userId: user.id } })
            );
            if (chatResult?.id) {
                setCurrentChat(chatResult);
                closeSidePanel();
            } else {
                toast.error("Không thể mở cuộc trò chuyện");
            }
        } catch (err) {
            toast.error("Tạo chat thất bại");
            console.error(err);
        }
    };

    const handleClickOnChatCard = (chatEntity, meta) => {
        if (!chatEntity?.id) return;
        const wantsFocus = Boolean(meta?.matchedMessageId);
        keepAtBottomRef.current = !wantsFocus;
        setCurrentChat(chatEntity);
        if (wantsFocus) {
            setPendingMessageFocus({
                chatId: chatEntity.id,
                messageId: meta.matchedMessageId,
            });
        } else {
            setPendingMessageFocus(null);
        }
        markCurrentChatAsRead(chatEntity.id);
    };

    const handleCreateNewMessage = (messagePayload) => {
        if (!stompClient || !currentChat) return;
        const payload = {
            ...messagePayload,
            chatId: currentChat.id,
            senderId: auth.reqUser?.id,
        };
        stompClient.send("/app/message", {}, JSON.stringify(payload));
    };

    const handleDeleteMessage = async (messageId) => {
        if (!isAuthenticated) return;
        try {
            const successMessage = await dispatch(deleteMessage({ messageId }));
            toast.success(successMessage);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleOpenGroupInfo = () => {
        if (!isGroupChat(currentChat)) return;
        setIsGroupInfoOpen(true);
    };

    const handleCloseGroupInfo = () => setIsGroupInfoOpen(false);

    const isCurrentUserAdmin =
        isGroupChat(currentChat) &&
        (currentChat?.createdBy?.id === currentUserId ||
            currentChat?.admins?.some((admin) => admin.id === currentUserId));

    const isCurrentUserCreator =
        isGroupChat(currentChat) && currentChat?.createdBy?.id === currentUserId;

    const handleRenameGroup = async (nextName) => {
        const trimmed = nextName?.trim();
        if (!currentChat?.id || !trimmed || !isAuthenticated) return;
        try {
            await dispatch(
                updateChat({
                    chatId: currentChat.id,
                    data: { newName: trimmed },
                })
            );
            toast.success("Đổi tên nhóm thành công");
        } catch (err) {
            toast.error(err.message || "Đổi tên nhóm thất bại");
        }
    };

    const handleAddMember = async (userId) => {
        if (!currentChat?.id || !userId || !isAuthenticated) {
            toast.error("Không tìm thấy người cần thêm");
            return;
        }
        try {
            await dispatch(addUserToGroup({ chatId: currentChat.id, userId }));
            toast.success("Đã thêm thành viên");
        } catch (err) {
            toast.error(err.message || "Không thể thêm thành viên");
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!currentChat?.id || !memberId || !isAuthenticated) return;
        try {
            await dispatch(
                removeFromGroup({ chatId: currentChat.id, targetUserId: memberId })
            );
            const message =
                memberId === currentUserId ? "Bạn đã rời nhóm" : "Đã xóa thành viên";
            toast.success(message);

            if (memberId === currentUserId) {
                setCurrentChat(null);
                setIsGroupInfoOpen(false);
            }
        } catch (err) {
            toast.error(err.message || "Không thể xóa thành viên");
        }
    };

    const handleLeaveGroup = () => handleRemoveMember(currentUserId);

    const handleDeleteGroup = async () => {
        if (!currentChat?.id || !isAuthenticated) return;
        try {
            await dispatch(deleteChat({ chatId: currentChat.id }));
            toast.success("Đã xóa nhóm");
            setCurrentChat(null);
            setIsGroupInfoOpen(false);
        } catch (err) {
            toast.error(err.message || "Không thể xóa nhóm");
        }
    };

    const handleBackToChatList = () => {
        setCurrentChat(null);
    };

    useEffect(() => {
        if (!isConnected || !stompClient || !auth.reqUser) return;

        const subscription = stompClient.subscribe(
            "/user/queue/unread",
            (payload) => {
                const data = JSON.parse(payload.body);
                dispatch(handleUnreadPush(data));
            }
        );

        return () => subscription.unsubscribe();
    }, [isConnected, stompClient, auth.reqUser, dispatch]);

    const handleIncomingTypingEvent = useCallback(
        (payload) => {
            const data = JSON.parse(payload.body);
            if (data.userId === currentUserId) return;
            dispatch(handleTypingPush(data));
        },
        [currentUserId, dispatch]
    );

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

    const sendTypingSignal = useCallback(
        (chatId, typing) => {
            if (!stompClient || !chatId) return;
            const destination = typing ? "/app/typing/start" : "/app/typing/stop";
            stompClient.send(destination, {}, JSON.stringify({ chatId }));
        },
        [stompClient]
    );

    const handlePresenceEvent = useCallback(
        (payload) => {
            const data = JSON.parse(payload.body);
            dispatch(receivePresencePush(data));
        },
        [dispatch]
    );

    useEffect(() => {
        if (!isConnected || !stompClient) return;
        const sub = stompClient.subscribe("/group/presence", handlePresenceEvent);
        return () => sub.unsubscribe();
    }, [isConnected, stompClient, handlePresenceEvent]);

    useEffect(() => {
        if (!isAuthenticated || !currentChat || isGroupChat(currentChat)) return;
        const partner = currentChat.members?.find((m) => m.id !== auth.reqUser?.id);
        if (partner?.id) {
            dispatch(fetchPresenceByUser({ userId: partner.id }));
        }
    }, [isAuthenticated, currentChat, auth.reqUser?.id, dispatch]);

    return (
        <div className="homepage-container">
            <div className="flex h-screen w-screen bg-gray-50">
                <div
                    className={`h-full flex flex-col transition-all duration-300 ease-in-out ${currentChat
                            ? "hidden md:flex md:w-1/3 lg:w-1/4"
                            : "flex w-full md:w-1/3 lg:w-1/4"
                        }`}
                    style={{ minWidth: "320px" }}
                >
                    {activeSidePanel === "group" ? (
                        <CreateGroup onClose={closeSidePanel} setIsGroup={closeSidePanel} />
                    ) : activeSidePanel === "profile" ? (
                        <Profile onClose={closeSidePanel} />
                    ) : activeSidePanel === "contact" ? (
                        <NewContact
                            onClose={closeSidePanel}
                            onSelectUser={handleSelectContactUser}
                        />
                    ) : (
                        <SidePanel
                            auth={auth}
                            chats={safeChats}
                            serverKeyword={serverKeyword}
                            defaultAvatar={DEFAULT_AVATAR}
                            defaultGroupImage={DEFAULT_GROUP_IMAGE}
                            buildMatchMeta={buildMatchMeta}
                            chatKeyword={chatKeyword}
                            onSearchChats={handleSearchChats}
                            onSelectChat={handleClickOnChatCard}
                            onGoStatus={() => navigate("/status")}
                            onOpenProfile={openProfile}
                            onOpenContact={openContact}
                            onOpenGroup={openGroup}
                            onLogout={handleLogout}
                            menuAnchor={leftMenuAnchor}
                            isMenuOpen={openLeft}
                            onMenuOpen={handleLeftClick}
                            onMenuClose={handleLeftClose}
                            unreadByChat={unreadByChat}
                            presenceByUserId={presenceByUserId}
                        />
                    )}
                </div>

                <div
                    className={`h-full flex flex-col transition-all duration-300 ease-in-out ${currentChat
                            ? "flex w-full md:w-2/3 lg:w-3/4"
                            : "hidden md:flex md:w-2/3 lg:w-3/4"
                        }`}
                >
                    {currentChat ? (
                        <ChatBox
                            auth={auth}
                            currentChat={currentChat}
                            defaultAvatar={DEFAULT_AVATAR}
                            defaultGroupImage={DEFAULT_GROUP_IMAGE}
                            onOpenGroupInfo={handleOpenGroupInfo}
                            menuAnchor={rightMenuAnchor}
                            isMenuOpen={openRight}
                            onMenuOpen={handleRightClick}
                            onMenuClose={handleRightClose}
                            messageContainerRef={messageContainerRef}
                            isLoadingOlder={isLoadingOlder}
                            messages={messages}
                            formatDateLabel={formatDateLabel}
                            onDeleteMessage={handleDeleteMessage}
                            content={content}
                            onChangeContent={setContent}
                            onSendMessage={handleCreateNewMessage}
                            onBack={handleBackToChatList}
                            typingUsers={typingByChat[currentChat?.id] || {}}
                            onTypingSignal={sendTypingSignal}
                            presenceByUserId={presenceByUserId}
                        />
                    ) : (
                        <EmptyChatState />
                    )}
                </div>
            </div>

            {isGroupChat(currentChat) && (
                <GroupInfoSheet
                    open={isGroupInfoOpen}
                    onClose={handleCloseGroupInfo}
                    chat={currentChat}
                    currentUserId={currentUserId}
                    isCurrentUserAdmin={isCurrentUserAdmin}
                    isCurrentUserCreator={isCurrentUserCreator}
                    onRequestNameChange={handleRenameGroup}
                    onRequestAddMember={handleAddMember}
                    onRequestRemoveMember={handleRemoveMember}
                    onRequestLeaveGroup={handleLeaveGroup}
                    onRequestDeleteGroup={handleDeleteGroup}
                    knownContacts={privateContacts}
                    searchResults={auth.searchUser || []}
                    onRequestSearchUser={handleSearchPotentialMembers}
                />
            )}
        </div>
    );
};

export default HomePage;