import React, { useState } from "react";
import {
  BsThreeDotsVertical,
  BsDownload,
} from "react-icons/bs";
import { Menu, MenuItem } from "@mui/material";
import toast from "react-hot-toast";
import { pickFileMeta } from "../../utils/fileMeta";
import { formatTime } from "../../utils/dateUtils";
import { logger } from "../../utils/logger";
import { downloadFile } from "../../utils/fileDownloader";


const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "--";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

const BUBBLE_PALETTE = {
  own: {
    cardBg: "bg-[#bde8c4] dark:bg-[#1e6940]",
    cardHover: "hover:bg-[#aee2b8] dark:hover:bg-[#3a9561]",
    downloadText: "text-[#0a7755] dark:text-[#4fab7a]",
    iconRing: "ring-[#0a7755]/20 dark:ring-[#4fab7a]/20",
  },
  other: {
    cardBg: "bg-white/90 dark:bg-[#2a2a2a]",
    cardHover: "hover:bg-white dark:hover:bg-gray-900",
    downloadText: "text-[#475569] dark:text-[#4fab7a]",
    iconRing: "ring-gray-200 dark:ring-[#4fab7a]/20",
  },
};

// MessageCard.jsx (đặt trên đầu file)
const LINK_REGEX = /((https?:\/\/)|www\.)[^\s]+/gi;

const renderTextWithLinks = (text) => {
  if (!text) return null;
  const matches = [...text.matchAll(LINK_REGEX)];
  if (!matches.length) return text;

  const nodes = [];
  let lastIndex = 0;

  matches.forEach((match, idx) => {
    const url = match[0];
    const start = match.index ?? 0;

    if (start > lastIndex) nodes.push(text.slice(lastIndex, start));

    const normalized = url.startsWith('http') ? url : `https://${url}`;
    nodes.push(
      <a
        key={`${url}-${idx}`}
        href={normalized}
        target="_blank"
        rel="noreferrer"
        className="text-[#0A84FF] hover:text-[#0077cc] dark:text-[#8cc5ff] dark:hover:text-[#b2ddff] underline underline-offset-4 font-semibold"
      >
        {url}
      </a>
    );

    lastIndex = start + url.length;
  });

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
};

// Use centralized downloadFile utility instead of local implementation

const MessageCard = ({ message, isRequestMessage, onDelete, onImageClick }) => {
  const { id, content, attachments, type, timeStamp } = message;
  const safeAttachments = Array.isArray(attachments) ? attachments : [];

  const palette = isRequestMessage ? BUBBLE_PALETTE.other : BUBBLE_PALETTE.own;

  const imageAttachments = safeAttachments.filter(att => att.mimeType?.startsWith("image/"));
  const otherAttachments = safeAttachments.filter(att => !att.mimeType?.startsWith("image/"));

  const [anchorEl, setAnchorEl] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const open = Boolean(anchorEl);

  const formattedTime = formatTime(timeStamp);

  const renderImageGrid = (images) => {
    if (!images.length) return null;

    return (
      <div className={`rounded-xl overflow-hidden p-1.5 ${palette.cardBg}`}>
        <div className="grid grid-cols-2 gap-1 max-w-[180px]">
          {images.map((att) => (
            <div
              key={att.id || att.url}
              className="relative rounded-lg overflow-hidden"
            >
              <button
                type="button"
                className="peer block w-[70px] aspect-square focus-visible:outline-none"
                onClick={() => onImageClick?.(att)}
              >
                <img
                  src={att.url}
                  alt={att.fileName || "attachment"}
                  className="h-full w-full object-cover"
                />
              </button>

              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  await downloadFile(att.url, att.fileName || "image");
                }}
                title="Tải ảnh này"
                aria-label="Tải ảnh này"
                className="pointer-events-none absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white opacity-0 transition-opacity peer-hover:opacity-100 peer-focus-visible:opacity-100 peer-hover:pointer-events-auto peer-focus-visible:pointer-events-auto"
              >
                <BsDownload size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFileCard = (att) => {
    const { Icon, label, accent } = pickFileMeta(att.mimeType, att.fileName);
    const fileLabel = att.fileName || label;

    const handleDownload = async (e) => {
      e.preventDefault();
      await downloadFile(att.url, fileLabel);
    };

    return (
      <button
        type="button"
        onClick={handleDownload}
        className={`w-full text-left flex items-center gap-3 rounded-lg px-3 py-2 shadow-sm ${palette.cardBg} ${palette.cardHover} transition-colors`}
      >
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-lg bg-white/80 ring ${palette.iconRing}`}
        >
          <Icon className={accent} size={22} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{fileLabel}</p>
          <p className="text-xs text-gray-500 dark:text-gray-300 truncate">
            {label} · {formatBytes(att.size)}
          </p>
        </div>
        <span className={`ml-2 ${palette.downloadText}`}>
          <BsDownload size={18} />
        </span>
      </button>
    );
  };

  const renderAttachment = (att) => {
    const key = att?.id || att?.url;
    const mime = att?.mimeType ?? "";

    if (mime.startsWith("image/")) {
      return (
        <div key={key} className="relative group inline-block">
          <button
            type="button"
            className="focus-visible:outline-none"
            onClick={() => onImageClick?.(att)}
          >
            <img
              src={att.url}
              alt={att.fileName || "attachment"}
              className="max-w-[250px] rounded-lg transition-transform group-hover:scale-[1.02]"
            />
          </button>
          <a
            href={att.url}
            download={att.fileName || "image"}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2 right-2 rounded-full bg-black/60 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <BsDownload size={16} />
          </a>
        </div>
      );
    }

    if (mime.startsWith("video/")) {
      return (
        <div key={key} className={`inline-block rounded-lg overflow-hidden ${palette.cardBg} p-1`}>
          <video
            src={att.url}
            controls
            className="max-w-[260px] rounded"
          />
        </div>
      );
    }

    if (mime.startsWith("audio/")) {
      return (
        <div key={key} className={`inline-block w-56 rounded-lg overflow-hidden ${palette.cardBg} p-1`}>
          <audio
            src={att.url}
            controls
            className="w-full rounded"
          />
        </div>
      );
    }

    return renderFileCard(att);
  };

  const handleOpenMenu = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => setAnchorEl(null);

  const handleDelete = async () => {
    if (!onDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(id);
    } finally {
      setIsDeleting(false);
      handleCloseMenu();
    }
  };

  const bubbleClass = isRequestMessage
    ? "bg-white dark:bg-[#3a3a3a] text-gray-800 dark:text-white"
    : "bg-[#d1f6d3] dark:bg-[#1e6940] text-gray-900 dark:text-white";

  return (
    <div
      className={`w-full flex mb-3 ${isRequestMessage ? "justify-start" : "justify-end"
        }`}
      data-message-id={id}
    >
      <div className="group flex items-center gap-2">
        <button
          type="button"
          onClick={handleOpenMenu}
          className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 p-1 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a884]"
        >
          <BsThreeDotsVertical />
        </button>

        <div
          className={`py-2 px-3 rounded-2xl shadow-md dark:shadow-lg max-w-sm break-words whitespace-pre-wrap flex flex-col gap-2 ${bubbleClass}`}
        >
          {content && (
            <p className="leading-relaxed break-words text-[15px] font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
              {renderTextWithLinks(content)}
            </p>
          )}

          {imageAttachments.length > 0 && (
            <>
              {renderImageGrid(imageAttachments)}
              {/* {imageAttachments.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    imageAttachments.forEach(async (att) =>
                      await downloadFile(att.url, att.fileName || "image")
                    )
                  }
                  title="Tải tất cả ảnh trong tin"
                  aria-label="Tải tất cả ảnh trong tin"
                  className="inline-flex items-center gap-1 rounded-full bg-white/40 px-2 py-1 text-[#0a7755] dark:text-[#4db876] hover:bg-white/70 dark:hover:bg-white/20"
                >
                  <BsDownload size={14} />
                </button>
              )} */}
            </>
          )}

          {otherAttachments.length > 0 &&
            otherAttachments.map((attachment) => renderAttachment(attachment))}

          {formattedTime && (
            <span className="text-[11px] text-gray-500 dark:text-gray-400 ml-auto font-normal">{formattedTime}</span>
          )}
        </div>
      </div>

      <Menu anchorEl={anchorEl} open={open} onClose={handleCloseMenu}>
        <MenuItem onClick={handleCloseMenu}>Reply</MenuItem>
        <MenuItem onClick={handleCloseMenu}>Copy</MenuItem>
        <MenuItem disabled={isDeleting} onClick={handleDelete}>
          {isDeleting ? "Deleting..." : "Delete"}
        </MenuItem>
      </Menu>
    </div>
  );
};

export default MessageCard;