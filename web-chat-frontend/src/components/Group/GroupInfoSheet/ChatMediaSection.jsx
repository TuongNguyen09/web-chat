import React, { useMemo, useState } from "react";
import { BsImages, BsFileEarmarkText, BsLink45Deg, BsMusicNoteBeamed, BsChevronDown } from "react-icons/bs";
import { formatDateTime } from "../../../utils/dateUtils";
import { MessageType } from "../../../constants/messageType";
import { pickFileMeta } from "../../../utils/fileMeta";

const linkRegex = /(https?:\/\/[^\s]+)/gi;
const TABS = [
  { id: "media", label: "Ảnh & Video", icon: BsImages },
  { id: "files", label: "Tài liệu", icon: BsFileEarmarkText },
  { id: "audio", label: "Âm thanh", icon: BsMusicNoteBeamed },
  { id: "links", label: "Liên kết", icon: BsLink45Deg },
];

const normalizeFileName = (attachment) => {
  if (!attachment) return "Đính kèm";
  return (
    attachment.fileName ||
    attachment.originalFileName ||
    attachment.name ||
    attachment.url?.split("?").shift()?.split("/").pop() ||
    "Đính kèm"
  );
};

const buildSubtitle = (message) => {
  const sender = message?.sender?.fullName || "Unknown";
  const timestamp = message?.timeStamp ? formatDateTime(message.timeStamp) : "";
  return timestamp ? `${sender} · ${timestamp}` : sender;
};

const extractLinks = (message) => {
  if (!message) return [];
  const contentLinks = typeof message.content === "string" ? message.content.match(linkRegex) || [] : [];
  const metadataLinks = [];

  const previewUrl = message.metadata?.linkPreview?.url;
  if (previewUrl) metadataLinks.push(previewUrl);

  if (message.type === MessageType.LINK && message.metadata?.url) {
    metadataLinks.push(message.metadata.url);
  }

  return [...new Set([...contentLinks, ...metadataLinks])].map((url, index) => ({
    id: `${message.id || "link"}-${index}-${url}`,
    url,
    message,
    title: url,
  }));
};

const categorizeAttachments = (messages) => {
  const records = [];
  messages.forEach((msg) => {
    (msg?.attachments || []).forEach((att, index) => {
      records.push({
        id: `${msg?.id || "msg"}-${att?.id || att?.url || index}`,
        attachment: att,
        message: msg,
      });
    });
  });

  const isImage = (mime = "") => mime.startsWith("image/");
  const isVideo = (mime = "") => mime.startsWith("video/");
  const isAudio = (mime = "") => mime.startsWith("audio/");

  const media = records.filter(({ attachment }) => {
    const mime = attachment?.mimeType || "";
    return isImage(mime) || isVideo(mime);
  });

  const files = records.filter(({ attachment }) => {
    const mime = attachment?.mimeType || "";
    if (!mime) return true;
    return !mime.startsWith("image/") && !mime.startsWith("video/") && !mime.startsWith("audio/");
  });

  const audio = records.filter(({ attachment }) => isAudio(attachment?.mimeType || ""));

  return { media, files, audio };
};

const EmptyState = ({ label }) => (
  <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
    Không có {label?.toLowerCase()} nào.
  </p>
);

const ChatMediaSection = ({ messages = [] }) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("media");

  const { media, files, audio } = useMemo(
    () => categorizeAttachments(messages),
    [messages]
  );

  const links = useMemo(() => {
    const items = [];
    messages.forEach((message) => {
      extractLinks(message).forEach((link) => items.push(link));
    });
    return items;
  }, [messages]);

  const tabMap = {
    media,
    files,
    audio,
    links,
  };

  const counts = {
    media: media.length,
    files: files.length,
    audio: audio.length,
    links: links.length,
  };

  const renderMediaItem = ({ id, attachment, message }) => {
    const isImage = attachment?.mimeType?.startsWith("image/");
    return (
      <a
        key={id}
        href={attachment?.url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition"
      >
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          {isImage && attachment?.url ? (
            <img src={attachment.url} alt={attachment?.fileName} className="w-full h-full object-cover" />
          ) : (
            <BsImages className="text-gray-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
            {normalizeFileName(attachment)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {buildSubtitle(message)}
          </p>
        </div>
      </a>
    );
  };

  const renderFileItem = ({ id, attachment, message }) => {
    const meta = pickFileMeta(attachment?.mimeType, attachment?.fileName);
    const Icon = meta.Icon || BsFileEarmarkText;
    return (
      <a
        key={id}
        href={attachment?.url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition"
      >
        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Icon className={`text-lg ${meta.accent}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
            {normalizeFileName(attachment)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {buildSubtitle(message)}
          </p>
        </div>
      </a>
    );
  };

  const renderAudioItem = ({ id, attachment, message }) => (
    <a
      key={id}
      href={attachment?.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition"
    >
      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
        <BsMusicNoteBeamed />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
          {normalizeFileName(attachment)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {buildSubtitle(message)}
        </p>
      </div>
    </a>
  );

  const renderLinkItem = ({ id, url, message }) => (
    <a
      key={id}
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition"
    >
      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
        <BsLink45Deg />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 truncate">{url}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {buildSubtitle(message)}
        </p>
      </div>
    </a>
  );

  const renderActiveList = () => {
    const items = tabMap[activeTab] || [];
    if (!items.length) {
      const label = TABS.find((tab) => tab.id === activeTab)?.label || "mục";
      return <EmptyState label={label} />;
    }

    if (activeTab === "media") return items.map(renderMediaItem);
    if (activeTab === "files") return items.map(renderFileItem);
    if (activeTab === "audio") return items.map(renderAudioItem);
    return items.map(renderLinkItem);
  };

  return (
    <div className="bg-white dark:bg-[#252525] shadow-sm rounded-lg">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
      >
        <div className="flex flex-col text-left">
          <p className="text-[13px] font-semibold text-gray-800 dark:text-white leading-[18px]">
            File phương tiện, link và tài liệu
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-[16px]">Xem nhanh các nội dung đã chia sẻ</p>
        </div>
        <BsChevronDown
          className={`text-gray-500 transition-transform ${expanded ? "rotate-180" : "rotate-0"}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800">
          <div className="flex flex-wrap gap-2 px-4 py-3">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition ${
                  activeTab === id
                    ? "bg-[#00a884]/10 border-[#00a884] text-[#00a884]"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                <Icon />
                <span>{label}</span>
                <span className="text-xs font-semibold">{counts[id]}</span>
              </button>
            ))}
          </div>
          <div className="max-h-72 overflow-y-auto px-2 pb-3 space-y-1">
            {renderActiveList()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMediaSection;
