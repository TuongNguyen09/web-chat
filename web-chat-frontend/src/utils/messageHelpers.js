// ============================================================================
// MESSAGE HELPER UTILITIES
// ============================================================================

import { MessageType } from "../constants/messageType";

// ============================================================================
// TEXT FORMATTING UTILITIES
// ============================================================================

const normalize = (text) => text?.toLowerCase() ?? "";

const truncate = (text, max = 70) =>
    text?.length > max ? `${text.slice(0, max)}…` : text || "";

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ============================================================================
// HIGHLIGHT UTILITIES
// ============================================================================

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

// ============================================================================
// ATTACHMENT PREVIEW UTILITIES
// ============================================================================

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

// ============================================================================
// MESSAGE META UTILITIES
// ============================================================================

const getLastMessageMeta = (chat, currentUserId) => {
    if (!chat.messages?.length) {
        return { previewText: "Hãy gửi tin nhắn đầu tiên!", timestamp: "" };
    }
    const lastMessage = chat.lastMessage || chat.messages[chat.messages.length - 1];
    const senderName =
        lastMessage?.sender?.id === currentUserId
            ? "Bạn"
            : lastMessage?.sender?.fullName || "Unknown";

    const result = {
        previewText: describeAttachmentPreview(lastMessage || {}, senderName),
        timestamp: lastMessage?.timeStamp || "",
    };
    return result;
};

// ============================================================================
// BUILD MATCH META FOR SEARCH
// ============================================================================

const buildMatchMeta = (chat, keyword, currentUserId, checkIsGroupChat) => {
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

    if (checkIsGroupChat(chat) && memberHit) {
        return { ...base, subtitle: `${memberHit.fullName} is in this group` };
    }

    if (!checkIsGroupChat(chat) && memberHit) {
        return { ...base, nameNode: highlightText(memberHit.fullName, keyword.trim()) };
    }

    return base;
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
    normalize,
    truncate,
    escapeRegExp,
    highlightText,
    describeAttachmentPreview,
    getLastMessageMeta,
    buildMatchMeta,
};
