import React from "react";
import { DEFAULT_AVATAR } from "../../constants/defaults";
import { formatRelativeTime } from "../../utils/dateUtils";

const ChatCard = ({
  userImg,
  name,
  nameNode,
  timestamp,
  subtitle,
  preview,
  previewNode,
  unreadCount = 0,
  onClick,
  isOnline,
  showPresence,
}) => {
  const renderedName = nameNode || name;
  const renderedPreview =
    previewNode || preview || "Hãy gửi tin nhắn đầu tiên!";
  const userImage = userImg || DEFAULT_AVATAR;

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        w-full text-left 
        px-4 py-3 
        flex items-center gap-4
        hover:bg-gray-50 dark:hover:bg-gray-800
        focus:bg-gray-100 dark:focus:bg-gray-700
        border-b border-gray-100 dark:border-gray-700
        transition-colors
      "
    >
<div className="relative h-12 w-12 flex-shrink-0">
    <img
      className="h-12 w-12 rounded-full object-cover"
      src={userImage}
      alt={renderedName}
    />
    {showPresence && isOnline && (
      <span
        className="
          absolute -bottom-0.5 -right-0.5
          block h-3.5 w-3.5 rounded-full
          border-2 border-white
          bg-[#25D366]
        "
        aria-hidden="true"
      />
    )}
  </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-gray-800 dark:text-white truncate">{renderedName}</p>
          {timestamp && (
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {formatRelativeTime(timestamp)}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate mt-0.5">{subtitle}</p>
        )}

        <div className="mt-1 flex items-center gap-2">
          <p className="text-sm text-gray-500 dark:text-gray-400 flex-1 truncate">
            {renderedPreview}
          </p>

          {unreadCount > 0 && (
            <span
              className="
                ml-auto inline-flex items-center justify-center
                h-5 min-w-[20px] px-1
                rounded-full bg-[#00a884] text-white text-xs font-bold
              "
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default ChatCard;