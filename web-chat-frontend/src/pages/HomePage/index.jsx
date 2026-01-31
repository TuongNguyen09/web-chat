// ============================================================================
// IMPORTS
// ============================================================================
import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

// Redux Actions
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
    updateChatLastMessage,
    sortChatsByLatest,
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

// Custom Hooks
import useAccessToken from "../../hooks/useAccessToken";
import useWebSocketConnection from "../../hooks/useWebSocketConnection";
import useMessagePagination from "../../hooks/useMessagePagination";
import useGroupOperations from "../../hooks/useGroupOperations";
import useTypingAndPresence from "../../hooks/useTypingAndPresence";

// Components
import SidePanel from "../../components/HomeLayout/SidePanel";
import ChatBox from "../../components/HomeLayout/ChatBox";
import EmptyChatState from "../../components/HomeLayout/EmptyChatState";
import Profile from "../../components/Profile";
import CreateGroup from "../../components/Group/CreateGroup";
import GroupInfoSheet from "../../components/Group/GroupInfoSheet";
import UserInfoSheet from "../../components/User/UserInfoSheet";
import NewContact from "../../components/Contact/NewContact";

// Utils & Constants
import { DEFAULT_AVATAR, DEFAULT_GROUP_IMAGE } from "../../constants/defaults";
import { formatDate } from "../../utils/dateUtils";
import { isGroupChat as checkIsGroupChat } from "../../utils/chatUtils";
import { buildMatchMeta } from "../../utils/messageHelpers";
import { PAGE_SIZE, MIN_FETCH_DURATION, sleep } from "../../constants/homePageConstants";
import { logger } from "../../utils/logger";
import "./HomePage.css";

// ============================================================================
// CONSTANTS (Moved to homePageConstants.js)
// ============================================================================
// PAGE_SIZE, MIN_FETCH_DURATION, sleep, getCookie are now in src/constants/homePageConstants.js

// ============================================================================
// UTILITY FUNCTIONS (Moved to messageHelpers.js)
// ============================================================================
// Text formatting, highlighting, and message preview functions are now in src/utils/messageHelpers.js

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const HomePage = () => {
    // ========================================================================
    // HOOKS & SELECTORS
    // ========================================================================
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { auth, chat, message } = useSelector((store) => store);
    const unreadByChat = useSelector((store) => store.unread.byChatId);
    const typingByChat = useSelector((store) => store.typing.byChatId);
    const presenceByUserId = useSelector((store) => store.presence.byUserId || {});
    const sessionHydrated = useSelector((state) => state.auth.sessionHydrated);

    const accessToken = useAccessToken();
    const isAuthenticated = Boolean(accessToken && auth.reqUser?.id);
    const currentUserId = auth.reqUser?.id;
    const serverKeyword = chat.chatsKeyword || "";
    const pagination = message.pagination;

    // ========================================================================
    // WEBSOCKET CONNECTION
    // ========================================================================
    const { stompClient, isConnected, stompRef } = useWebSocketConnection(
        isAuthenticated,
        accessToken
    );

    // ========================================================================
    // STATE DECLARATIONS (Early - needed for hooks)
    // ========================================================================
    // Chat State
    const [currentChat, setCurrentChat] = useState(null);
    const [chatKeyword, setChatKeyword] = useState("");
    const [content, setContent] = useState("");

    // ========================================================================
    // MESSAGE PAGINATION
    // ========================================================================
    const {
        messageContainerRef,
        keepAtBottomRef,
        messages,
        isLoadingOlder,
        pendingMessageFocus,
        setPendingMessageFocus,
    } = useMessagePagination(currentChat, isAuthenticated, message);

    // ========================================================================
    // GROUP OPERATIONS
    // ========================================================================
    const {
        handleRenameGroup,
        handleAddMember,
        handleRemoveMember,
        handleLeaveGroup,
        handleDeleteGroup,
    } = useGroupOperations(currentChat, currentUserId, isAuthenticated);

    // ========================================================================
    // TYPING & PRESENCE
    // ========================================================================
    const safeChats = useMemo(
        () => (Array.isArray(chat.chats) ? chat.chats : []),
        [chat.chats]
    );

    const { sendTypingSignal } = useTypingAndPresence(
        stompClient,
        isConnected,
        safeChats,
        currentChat,
        currentUserId,
        isAuthenticated
    );

    // ========================================================================
    // REFS DECLARATIONS
    // ========================================================================
    const unreadRef = useRef(unreadByChat);
    const groupSubscriptionsRef = useRef({});
    const currentChatRef = useRef(null);

    // ========================================================================
    // STATE DECLARATIONS
    // ========================================================================
    // UI State
    const [activeSidePanel, setActiveSidePanel] = useState(null);
    const [leftMenuAnchor, setLeftMenuAnchor] = useState(null);
    const [rightMenuAnchor, setRightMenuAnchor] = useState(null);
    const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
    const [isUserInfoOpen, setIsUserInfoOpen] = useState(false);

    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================
    const privateContacts = useMemo(() => {
        if (!currentUserId) return [];
        return safeChats
            .filter((c) => !checkIsGroupChat(c))
            .map((c) => c.users?.find((u) => u.id !== currentUserId))
            .filter(Boolean);
    }, [safeChats, currentUserId]);

    const isCurrentUserAdmin = useMemo(() => {
        if (!checkIsGroupChat(currentChat) || !currentUserId) return false;
        return (
            currentChat?.createdBy?.id === currentUserId ||
            currentChat?.admins?.some((admin) => admin.id === currentUserId)
        );
    }, [currentChat, currentUserId]);

    const isCurrentUserCreator = useMemo(() => {
        if (!checkIsGroupChat(currentChat) || !currentUserId) return false;
        return currentChat?.createdBy?.id === currentUserId;
    }, [currentChat, currentUserId]);

    // ========================================================================
    // UI HELPERS
    // ========================================================================
    const openProfile = () => setActiveSidePanel("profile");
    const openContact = () => setActiveSidePanel("contact");
    const openGroup = () => setActiveSidePanel("group");
    const closeSidePanel = () => setActiveSidePanel(null);

    const openLeft = Boolean(leftMenuAnchor);
    const openRight = Boolean(rightMenuAnchor);
    const handleLeftClick = (e) => setLeftMenuAnchor(e.currentTarget);
    const handleLeftClose = () => setLeftMenuAnchor(null);
    const handleRightClick = (e) => setRightMenuAnchor(e.currentTarget);
    const handleRightClose = () => setRightMenuAnchor(null);

    // ========================================================================
    // UNREAD TRACKING
    // ========================================================================
    useEffect(() => {
        unreadRef.current = unreadByChat;
    }, [unreadByChat]);

    useEffect(() => {
        currentChatRef.current = currentChat;
    }, [currentChat]);

    // ========================================================================
    // AUTHENTICATION & SESSION MANAGEMENT
    // ========================================================================
    useEffect(() => {
        if (!sessionHydrated) return;
        if (!accessToken) {
            navigate("/auth");
        }
    }, [sessionHydrated, accessToken, navigate]);

    useEffect(() => {
        if (accessToken && !auth.reqUser) {
            dispatch(currentUser());
        }
    }, [accessToken, auth.reqUser, dispatch]);

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

    // ========================================================================
    // GROUP MESSAGE SUBSCRIPTIONS
    // ========================================================================
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
            try {
                const messageData = JSON.parse(payload.body);
                const { chatId } = messageData;
                const sentByMe = messageData.sender?.id === currentUserId;

                const currentChatId = currentChatRef.current?.id;

                if (chatId === currentChatId) {
                    dispatch(pushRealtimeMessage(messageData));
                    if (!sentByMe) {
                        markCurrentChatAsRead(chatId);
                    }
                } else {
                    // Chỉ update unread khi không ở trong chat
                    if (!sentByMe) {
                        const currentUnread = unreadRef.current[chatId] || 0;
                        dispatch(
                            handleUnreadPush({
                                chatId,
                                unreadCount: currentUnread + 1,
                            })
                        );
                    }
                }

                // ALWAYS update lastMessage và sort chats (dù đang trong hay ngoài chat)
                dispatch(updateChatLastMessage({ chatId, lastMessage: messageData }));
                dispatch(sortChatsByLatest());
            } catch (err) {
                logger.error("handleIncomingGroupMessage", err);
            }
        },
        [currentUserId, dispatch, markCurrentChatAsRead]
    );

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
    }, [safeChats, isConnected, stompClient, handleIncomingGroupMessage]);

    // ========================================================================
    // UNREAD SUBSCRIPTIONS
    // ========================================================================
    useEffect(() => {
        if (!isConnected || !stompClient || !auth.reqUser) return;

        const subscription = stompClient.subscribe(
            "/user/queue/unread",
            (payload) => {
                try {
                    const data = JSON.parse(payload.body);
                    dispatch(handleUnreadPush(data));
                } catch (err) {
                    logger.error("unread subscription", err);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [isConnected, stompClient, auth.reqUser, dispatch]);

    // ========================================================================
    // MESSAGE HANDLING & OPERATIONS
    // ========================================================================
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

    // ========================================================================
    // CHAT OPERATIONS
    // ========================================================================
    useEffect(() => {
        if (!currentChat) return;
        const fresh = safeChats.find((c) => c.id === currentChat.id);
        if (fresh && fresh !== currentChat) {
            setCurrentChat(fresh);
        }
    }, [safeChats, currentChat]);

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
            logger.error("HomePage.handleSelectContactUser", err, { userId: user?.id });
        }
    };

    const handleJumpToMessageFromInfo = useCallback(
        (messageId) => {
            if (!messageId || !currentChat?.id) return;
            keepAtBottomRef.current = false;
            setPendingMessageFocus({ chatId: currentChat.id, messageId });
        },
        [currentChat?.id]
    );

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
        stompClient.publish({
            destination: "/app/message",
            body: JSON.stringify(payload),
        });
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

    const handleBackToChatList = () => {
        setCurrentChat(null);
    };

    // ========================================================================
    // GROUP OPERATIONS HANDLERS
    // ========================================================================
    const handleOpenGroupInfo = () => {
        if (!checkIsGroupChat(currentChat)) return;
        setIsGroupInfoOpen(true);
    };

    const handleCloseGroupInfo = () => setIsGroupInfoOpen(false);

    const handleOpenUserInfo = () => {
        if (!currentChat || checkIsGroupChat(currentChat)) return;
        setIsUserInfoOpen(true);
    };

    const handleCloseUserInfo = () => setIsUserInfoOpen(false);

    const handleOpenInfo = () => {
        if (checkIsGroupChat(currentChat)) handleOpenGroupInfo();
        else handleOpenUserInfo();
    };

    const handleRemoveMemberWithCallback = (memberId) => {
        handleRemoveMember(memberId, (removedMemberId) => {
            if (removedMemberId === currentUserId) {
                setCurrentChat(null);
                setIsGroupInfoOpen(false);
            }
        });
    };

    const handleLeaveGroupWithCallback = () => {
        handleLeaveGroup(() => {
            setCurrentChat(null);
            setIsGroupInfoOpen(false);
        });
    };

    const handleDeleteGroupWithCallback = () => {
        handleDeleteGroup(() => {
            setCurrentChat(null);
            setIsGroupInfoOpen(false);
        });
    };

    // ========================================================================
    // RENDER
    // ========================================================================
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
                            buildMatchMeta={(chat, keyword) =>
                                buildMatchMeta(chat, keyword, currentUserId, checkIsGroupChat)
                            }
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
                            onOpenInfo={handleOpenInfo}
                            menuAnchor={rightMenuAnchor}
                            isMenuOpen={openRight}
                            onMenuOpen={handleRightClick}
                            onMenuClose={handleRightClose}
                            messageContainerRef={messageContainerRef}
                            isLoadingOlder={isLoadingOlder}
                            messages={messages}
                            formatDateLabel={formatDate}
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

            {checkIsGroupChat(currentChat) && (
                <GroupInfoSheet
                    open={isGroupInfoOpen}
                    onClose={handleCloseGroupInfo}
                    chat={currentChat}
                    messages={messages}
                    onRequestJumpToMessage={handleJumpToMessageFromInfo}
                    currentUserId={currentUserId}
                    isCurrentUserAdmin={isCurrentUserAdmin}
                    isCurrentUserCreator={isCurrentUserCreator}
                    onRequestNameChange={handleRenameGroup}
                    onRequestAddMember={handleAddMember}
                    onRequestRemoveMember={handleRemoveMemberWithCallback}
                    onRequestLeaveGroup={handleLeaveGroupWithCallback}
                    onRequestDeleteGroup={handleDeleteGroupWithCallback}
                    knownContacts={privateContacts}
                    searchResults={auth.searchUser || []}
                    onRequestSearchUser={handleSearchPotentialMembers}
                />
            )}

            {!checkIsGroupChat(currentChat) && (
                <UserInfoSheet
                    open={isUserInfoOpen}
                    onClose={handleCloseUserInfo}
                    chat={currentChat}
                    messages={messages}
                    onRequestJumpToMessage={handleJumpToMessageFromInfo}
                    currentUserId={currentUserId}
                />
            )}
        </div>
    );
};

export default HomePage;
