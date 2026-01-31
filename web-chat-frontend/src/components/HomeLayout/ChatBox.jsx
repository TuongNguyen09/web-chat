import React, { Fragment, useState, useRef, useMemo, useCallback, useEffect } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import { BsThreeDotsVertical, BsEmojiSmile, BsMicFill, BsDownload } from "react-icons/bs";
import { ImAttachment } from "react-icons/im";
import { IoArrowBack, IoClose } from "react-icons/io5";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Menu, MenuItem } from "@mui/material";
import MessageCard from "../MessageCard";
import { MessageType } from "../../constants/messageType";
import toast from "react-hot-toast";
import { generateUUID } from "../../utils/uuidGenerator";
import EmojiPicker from "emoji-picker-react";
import { pickFileMeta } from "../../utils/fileMeta";
import { logger } from "../../utils/logger";
import { formatDate, formatDateTime } from "../../utils/dateUtils";
import { isGroupChat, getChatTitle, getChatAvatar } from "../../utils/chatUtils";
import { downloadFile } from "../../utils/fileDownloader";
import { uploadFileToCloudinary } from "../../utils/cloudinaryUploader";

const ChatBox = (props) => {
  const {
    auth,
    currentChat,
    defaultAvatar,
    defaultGroupImage,
    onOpenInfo,
    menuAnchor,
    isMenuOpen,
    onMenuOpen,
    onMenuClose,
    messageContainerRef,
    isLoadingOlder,
    messages,
    formatDateLabel,
    onDeleteMessage,
    content,
    onChangeContent,
    onSendMessage,
    onBack,
    typingUsers = {},
    onTypingSignal,
    presenceByUserId = {},
  } = props;

  // removed noisy prop snapshot log

  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [pendingType, setPendingType] = useState(MessageType.TEXT);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  

  /* ---------- Image gallery state ---------- */
  const [galleryState, setGalleryState] = useState({ open: false, index: 0 });

  const imageAttachments = useMemo(() => {
    const list = [];
    messages.forEach((msg) => {
      (msg.attachments || []).forEach((att) => {
        if (att?.mimeType?.startsWith("image/")) {
          list.push({
            messageId: msg.id,
            attachmentKey: att.id || att.url,
            url: att.url,
            fileName: att.fileName || "Ảnh",
            senderName: msg.sender?.fullName || "Unknown",
            timeStamp: msg.timeStamp,
          });
        }
      });
    });
    return list;
  }, [messages]);

  const openGalleryAt = useCallback(
    (attachmentKey) => {
      const targetIndex = imageAttachments.findIndex(
        (item) => item.attachmentKey === attachmentKey || item.url === attachmentKey
      );
      if (targetIndex !== -1) {
        setGalleryState({ open: true, index: targetIndex });
      }
    },
    [imageAttachments]
  );

  const closeGallery = useCallback(() => {
    setGalleryState({ open: false, index: 0 });
  }, []);

  const showPrevImage = useCallback(
    (e) => {
      e?.stopPropagation();
      if (!imageAttachments.length) return;
      setGalleryState((prev) => ({
        ...prev,
        index: (prev.index - 1 + imageAttachments.length) % imageAttachments.length,
      }));
    },
    [imageAttachments.length]
  );

  const showNextImage = useCallback(
    (e) => {
      e?.stopPropagation();
      if (!imageAttachments.length) return;
      setGalleryState((prev) => ({
        ...prev,
        index: (prev.index + 1) % imageAttachments.length,
      }));
    },
    [imageAttachments.length]
  );

  useEffect(() => {
    if (!galleryState.open) return;
    const handleKey = (event) => {
      if (event.key === "Escape") closeGallery();
      if (event.key === "ArrowLeft") showPrevImage();
      if (event.key === "ArrowRight") showNextImage();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [galleryState.open, closeGallery, showPrevImage, showNextImage]);

  useEffect(() => {
    if (!galleryState.open) return;
    if (!imageAttachments.length) {
      setGalleryState({ open: false, index: 0 });
      return;
    }
    setGalleryState((prev) => ({
      ...prev,
      index: Math.min(prev.index, imageAttachments.length - 1),
    }));
  }, [imageAttachments, galleryState.open]);

  const currentImage =
    galleryState.open && imageAttachments.length
      ? imageAttachments[galleryState.index]
      : null;

  /* ---------- Existing logic (upload, send, etc.) giữ nguyên ---------- */
  const partner = currentChat?.members?.find((u) => u.id !== auth.reqUser?.id);
  const chatTitle = getChatTitle(currentChat, auth.reqUser?.id, "Group Chat");
  const chatAvatar = getChatAvatar(currentChat, auth.reqUser?.id, {
    avatar: defaultAvatar,
    groupImage: defaultGroupImage
  });

  const handlePickFile = () => fileInputRef.current?.click();

  const uploadToCloudinary = (file, fileId) => {
    return uploadFileToCloudinary(file, {
      folder: "chat_attachments",
      onProgress: (progress) => updateFileProgress(fileId, progress),
    });
  };

  const detectMessageType = (mime) => {
    if (mime.startsWith("image/")) return MessageType.IMAGE;
    if (mime.startsWith("video/")) return MessageType.VIDEO;
    if (mime.startsWith("audio/")) return MessageType.AUDIO;
    return MessageType.FILE;
  };


  const updateFileProgress = useCallback((fileId, progress) => {
    setPendingAttachments(prev =>
      prev.map(item =>
        item.id === fileId ? { ...item, progress: progress } : item
      )
    );
  }, []);

  const handleFilesSelected = async (evt) => {
    const files = Array.from(evt.target.files || []);
    if (!files.length) return;

    const initialAttachments = files.map(file => ({
      id: generateUUID(), // ID duy nhất để theo dõi
      file: file,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      progress: 0, // Progress mới
      status: 'uploading', // Trạng thái mới
      url: null
    }));

    // Hiển thị ngay các file đang tải lên
    setPendingAttachments(prev => [...prev, ...initialAttachments]);
    setPendingType(detectMessageType(files.at(-1).type));
    setIsUploading(true);

    try {
      const uploadPromises = initialAttachments.map(async (tempAtt) => {
        const res = await uploadToCloudinary(tempAtt.file, tempAtt.id);

        // Trả về dữ liệu cuối cùng khi tải xong
        return {
          ...tempAtt,
          url: res.secure_url,
          status: 'uploaded', // Đánh dấu hoàn thành
          width: res.width,
          height: res.height,
          durationMs: res.duration ? res.duration * 1000 : 0,
        };
      });

      const uploadedResults = await Promise.all(uploadPromises);

      // Cập nhật state với dữ liệu file đã upload thành công
      setPendingAttachments(prev => {
        const finalIds = uploadedResults.map(r => r.id);
        const others = prev.filter(p => !finalIds.includes(p.id));
        return [...others, ...uploadedResults];
      });

    } catch (err) {
      toast.error("Tải file thất bại");
      logger.error("handleFilesSelected", err, { fileCount: files.length });
      // Đánh dấu các file còn đang 'uploading' là 'error'
      setPendingAttachments(prev =>
        prev.map(item =>
          item.status === 'uploading' ? { ...item, status: 'error', progress: 0 } : item
        )
      );
    } finally {
      setIsUploading(false);
      evt.target.value = "";
    }
  };

  const handleRemoveAttachment = (attachmentId) => {
    setPendingAttachments((prev) => {
      const next = prev.filter((file) => file.id !== attachmentId);
      if (next.length === 0) setPendingType(MessageType.TEXT);
      return next;
    });
  };

  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const notifyTyping = useCallback(
    (nextState) => {
      if (!onTypingSignal || !currentChat?.id) return;
      onTypingSignal(currentChat.id, nextState);
    },
    [onTypingSignal, currentChat?.id]
  );

  const scheduleStopTyping = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        notifyTyping(false);
        isTypingRef.current = false;
      }
    }, 3000);
  }, [notifyTyping]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) {
        notifyTyping(false);
        isTypingRef.current = false;
      }
    };
  }, [notifyTyping, currentChat?.id]);

  const handleContentChange = (value) => {
    onChangeContent(value);
    const trimmed = value.trim();

    if (!trimmed) {
      if (isTypingRef.current) {
        notifyTyping(false);
        isTypingRef.current = false;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      return;
    }

    if (!isTypingRef.current) {
      notifyTyping(true);
      isTypingRef.current = true;
    }
    scheduleStopTyping();
  };

  const typingDisplayNames = useMemo(() => {
    if (!typingUsers) return [];
    return Object.entries(typingUsers)
      .filter(([userId]) => userId !== auth.reqUser?.id)
      .map(([, name]) => name || "Ai đó");
  }, [typingUsers, auth.reqUser?.id]);

  const typingLabel = useMemo(() => {
    const count = typingDisplayNames.length;
    if (!count) return "";
    if (count === 1) return `${typingDisplayNames[0]} đang nhập...`;
    if (count === 2) return `${typingDisplayNames[0]} và ${typingDisplayNames[1]} đang nhập...`;
    return `${typingDisplayNames[0]} và ${count - 1} người khác đang nhập...`;
  }, [typingDisplayNames]);

  const openInfo = () => {
    if (onOpenInfo) onOpenInfo();
  };

  const handleOpenInfoFromMenu = useCallback(() => {
    const active = typeof document !== "undefined" ? document.activeElement : null;
    if (active && typeof active.blur === "function") active.blur();
    if (onMenuClose) onMenuClose();
    openInfo();
  }, [onMenuClose, openInfo]);

  const handleSend = () => {
    const trimmed = content.trim();
    // Lọc chỉ lấy các file đã tải lên thành công
    const finalAttachments = pendingAttachments.filter(att => att.status === 'uploaded');

    const hasAttachments = finalAttachments.length > 0;
    if (!hasAttachments && !trimmed) return;

    const payload = {
      chatId: currentChat.id,
      senderId: auth.reqUser?.id,
      type: hasAttachments ? pendingType : MessageType.TEXT,
      content: trimmed || null,
      attachments: finalAttachments, // Dùng file đã lọc
      linkPreview: null,
      metadata: {},
    };

    onSendMessage(payload);
    // Xóa các file đã gửi khỏi pendingAttachments
    setPendingAttachments(prev => prev.filter(att => att.status !== 'uploaded'));
    onChangeContent("");
    setPendingType(MessageType.TEXT);
    if (isTypingRef.current) {
      notifyTyping(false);
      isTypingRef.current = false;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const canSend = content.trim().length > 0 || pendingAttachments.some(att => att.status === 'uploaded');

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };


  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);

  const QUICK_REACTIONS = ["😀", "😂", "😍", "😎", "😭", "👍", "🙏", "🔥", "🎉", "🤯", "🥳"];

  const handleEmojiClick = (emojiData) => {
    onChangeContent((prev) => `${prev}${emojiData.emoji}`);
  };

  const handleSendReaction = (emoji) => {
    if (!currentChat || !auth.reqUser?.id) return;
    onSendMessage({
      chatId: currentChat.id,
      senderId: auth.reqUser.id,
      type: MessageType.STICKER,
      content: emoji,
      attachments: [],
      linkPreview: null,
      metadata: { kind: "emoji" },
    });
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        !emojiButtonRef.current?.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const handleDownloadFile = async (url, filename = "attachment") => {
    await downloadFile(url, filename);
  };

  const downloadAllFromMessage = useCallback((messageId) => {
    const target = messages.find((m) => m.id === messageId);
    if (!target) return;
    const imgs = (target.attachments || []).filter((att) =>
      att.mimeType?.startsWith("image/")
    );
    imgs.forEach((img, idx) =>
      handleDownloadFile(img.url, img.fileName || `image-${idx + 1}`)
    );
  }, [messages]);

  const partnerPresence = !currentChat?.group && partner
    ? presenceByUserId[partner.id]
    : null;
  const isPartnerOnline = Boolean(partnerPresence?.online);

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Offline";
    const diff = Date.now() - timestamp;
    if (diff < 60_000) return "Vừa hoạt động";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} phút trước`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} giờ trước`;
    return `Hoạt động ${formatDate(new Date(timestamp))}`;
  };

  const statusLabel = isGroupChat(currentChat)
    ? `${currentChat.members?.length || 0} thành viên`
    : isPartnerOnline
      ? "Online"
      : formatLastSeen(partnerPresence?.lastSeen);

  return (
    <div className="h-full flex flex-col bg-[#efeae2] dark:bg-[#0a0a0a]">
      {/* ----- Header giữ nguyên ----- */}
      <div className="flex items-center justify-between bg-[#f0f2f5] dark:bg-[#252525] px-4 py-3 border-b border-gray-300 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {/* Back button for mobile */}
          <button
            onClick={onBack}
            className="md:hidden mr-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <IoArrowBack size={24} />
          </button>

          <div className="flex items-center gap-3 cursor-pointer" onClick={openInfo}>
            <div className="relative">
              <img
                className="h-10 w-10 rounded-full object-cover"
                src={chatAvatar}
                alt="chat"
              />
              {!isGroupChat(currentChat) && isPartnerOnline && (
                <span
                  className="
          absolute -top-0.5 -left-0.5
          h-3.5 w-3.5 rounded-full
          border-2 border-white
          bg-[#25D366]
        "
                />
              )}
            </div>

            <div>
              <p className="font-semibold text-gray-800 dark:text-white">{chatTitle}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                {!isGroupChat(currentChat) && (
                  <span
                    className={`
            inline-block h-2 w-2 rounded-full
            ${isPartnerOnline ? "bg-[#25D366]" : "bg-gray-300"}
          `}
                  />
                )}
                {statusLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
          <AiOutlineSearch className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-300" size={20} />
          <BsThreeDotsVertical
            className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-300"
            size={20}
            onClick={onMenuOpen}
          />

          <Menu
            anchorEl={menuAnchor}
            open={isMenuOpen}
            onClose={onMenuClose}
            disableRestoreFocus
            MenuListProps={{ autoFocusItem: false }}
          >
            <MenuItem
              onClick={handleOpenInfoFromMenu}
            >
              {isGroupChat(currentChat) ? "Thông tin nhóm" : "Thông tin liên hệ"}
            </MenuItem>
          </Menu>
        </div>
      </div>
      {/* ----- Messages Area ----- */}
      <div
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-opacity-10 dark:bg-[linear-gradient(rgba(0,0,0,0.68),rgba(0,0,0,0.68)),url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] dark:bg-repeat relative"
      >
        {isLoadingOlder && (
          <div className="flex justify-center py-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00a884] border-t-transparent" />
          </div>
        )}

        <div className="px-4 py-6 space-y-2">
          {messages.map((message, index) => {
            const currentDate = message.timeStamp ? formatDate(message.timeStamp) : null;
            const previousDate =
              index > 0 && messages[index - 1].timeStamp
                ? formatDate(messages[index - 1].timeStamp)
                : null;
            const showDivider = currentDate && currentDate !== previousDate;

            return (
              <Fragment key={message.id}>
                {showDivider && (
                  <div className="flex justify-center my-4">
                    <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-3 py-1 rounded-full">
                      {currentDate}
                    </div>
                  </div>
                )}
                <MessageCard
                  message={message}
                  isRequestMessage={message.sender?.id !== auth.reqUser?.id}
                  onDelete={onDeleteMessage}
                  onImageClick={(attachment) =>
                    openGalleryAt(attachment?.id || attachment?.url)
                  }
                />
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* ----- Input area giữ nguyên ----- */}
      <div className="bg-[#f0f2f5] dark:bg-[#2a2a2a] p-4 border-t border-gray-300 dark:border-gray-700">
        <div className="flex flex-col gap-2 bg-white dark:bg-[#3a3a3a] rounded-lg px-3 py-2 relative">

          <div className="flex items-center gap-2">
            <button
              ref={emojiButtonRef}
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              title="Chèn emoji"
            >
              <BsEmojiSmile size={20} />
            </button>
            <ImAttachment
              onClick={handlePickFile}
              className="text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
              size={18}
            />

            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={handleFilesSelected}
            />

            <input
              className="flex-1 bg-transparent dark:text-white outline-none px-3 py-2 text-gray-800 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Nhập tin nhắn..."
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            {canSend ? (
              <button
                onClick={handleSend}
                disabled={isUploading}
                className="text-[#00a884] dark:text-[#4fab7a] hover:text-[#008f75] dark:hover:text-[#5eb883] disabled:opacity-50 transition-colors"
              >
                <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
                  <path d="M1.101,21.757L23.8,12.028L1.101,2.3l0.011,7.912l13.623,1.816L1.112,13.845 L1.101,21.757z"></path>
                </svg>
              </button>
            ) : (
              <BsMicFill className="text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300" size={20} />
            )}
          </div>

          {/* Ngay dưới phần input trong ChatBox */}
          {pendingAttachments.length > 0 && (
            <div
              className="grid w-full gap-2 justify-items-start"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(96px, 110px))" }}
            >
              {pendingAttachments.map((file) => {
                const meta = pickFileMeta(file.mimeType, file.fileName);

                return (
                  <div
                    key={file.id}
                    className="relative w-[96px] sm:w-[110px] rounded-xl bg-gray-100/80 p-2 flex flex-col"
                  >
                    {file.mimeType?.startsWith("image/") && file.url ? (
                      <div className="w-full aspect-[4/3] overflow-hidden rounded-lg">
                        <img src={file.url} alt={file.fileName} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 py-2 text-center">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow ${meta.accent}`}>
                          <meta.Icon size={22} />
                        </span>
                        <p className="text-[11px] text-gray-700 line-clamp-2 w-full px-1 break-words">
                          {file.fileName}
                        </p>
                      </div>
                    )}

                    {(file.status === "uploading" || file.status === "error") && (
                      <div
                        className={`absolute inset-0 flex flex-col items-center justify-center text-white px-2 rounded-xl ${file.status === "uploading" ? "bg-black/60" : "bg-red-600/70"
                          }`}
                      >
                        {file.status === "uploading" ? (
                          <>
                            <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#00a884]"
                                style={{ width: `${file.progress}%` }}
                              />
                            </div>
                            <span className="mt-1 text-xs">{file.progress}%</span>
                          </>
                        ) : (
                          <span className="text-xs font-bold">Lỗi tải</span>
                        )}
                      </div>
                    )}

                    {file.status !== "uploading" && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(file.id)}
                        className="absolute -top-2 -right-2 z-10 h-5 w-5 rounded-full bg-black/80 text-white text-xs flex items-center justify-center hover:bg-black"
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-[110%] left-0 z-20 bg-white border border-gray-200 rounded-2xl shadow-2xl p-3 w-[320px] max-w-full"
            >
              <p className="text-xs font-bold text-gray-500 mb-2">Gửi nhanh</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSendReaction(emoji)}
                    className="text-2xl hover:scale-110 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <EmojiPicker
                width="100%"
                height={320}
                searchDisabled
                skinTonesDisabled
                previewConfig={{ showPreview: false }}
                onEmojiClick={handleEmojiClick}
              />
            </div>
          )}
          <div
            className={`
        pointer-events-none absolute left-10 -top-2
        px-2 py-0.5 rounded-full bg-white shadow
        text-xs text-[#00a884]
        transition-all duration-150
        ${typingLabel ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}
      `}
          >
            {typingLabel || "\u00A0"}
          </div>
        </div>
      </div>
      {/* ---------- Image Lightbox ---------- */}
      {galleryState.open && currentImage && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/80"
          onClick={closeGallery}
        >
          <div className="flex justify-end p-4">
            <button
              className="text-white text-3xl hover:text-gray-200 focus-visible:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                closeGallery();
              }}
            >
              <IoClose />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center px-6">
            {imageAttachments.length > 1 && (
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white hover:bg-black/80"
                onClick={showPrevImage}
              >
                <FiChevronLeft size={24} />
              </button>
            )}

            <img
              src={currentImage.url}
              alt={currentImage.fileName}
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            {imageAttachments.length > 1 && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white hover:bg-black/80"
                onClick={showNextImage}
              >
                <FiChevronRight size={24} />
              </button>
            )}
          </div>

          <div
            className="px-6 py-4 bg-black/50 text-white flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="font-bold">{currentImage.fileName}</p>
              <p className="text-xs text-gray-300">
                {currentImage.senderName} ·{" "}
                {currentImage.timeStamp
                  ? formatDateTime(currentImage.timeStamp)
                  : ""}
              </p>
            </div>
            <div
              className="flex flex-wrap gap-2 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  await handleDownloadFile(currentImage.url, currentImage.fileName || "image");
                }}
                title="Tải ảnh này"
                aria-label="Tải ảnh này"
                className="rounded-full bg-white/15 p-2 hover:bg-white/25"
              >
                <BsDownload size={18} />
              </button>

              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  await downloadAllFromMessage(currentImage.messageId);
                }}
                title="Tải tất cả ảnh trong tin"
                aria-label="Tải tất cả ảnh trong tin"
                className="rounded-full bg-[#00a884]/80 p-2 hover:bg-[#00a884]"
              >
                <p>Tải tất cả</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info sheets are rendered by parent (HomePage) via `onOpenInfo`. */}
    </div>
  );
};

export default ChatBox;