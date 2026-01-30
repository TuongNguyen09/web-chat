import React, { useMemo, useState } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import { BsChevronDown } from "react-icons/bs";
import { formatDateTime } from "../../../utils/dateUtils";

const escapeRegExp = (text = "") => text.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

const highlightText = (text = "", keyword = "") => {
  if (!text || !keyword) return text;
  const pattern = escapeRegExp(keyword.trim());
  if (!pattern) return text;
  const regex = new RegExp(`(${pattern})`, "ig");
  const parts = text.split(regex);
  const lowered = keyword.trim().toLowerCase();

  return parts.map((part, index) => {
    if (part.toLowerCase() === lowered) {
      return (
        <mark
          key={`${part}-${index}`}
          className="bg-yellow-200 text-gray-900 rounded px-0.5"
        >
          {part}
        </mark>
      );
    }
    return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
  });
};

const ChatMessageSearchSection = ({ messages = [], onSelectMessage }) => {
  const [expanded, setExpanded] = useState(false);
  const [keyword, setKeyword] = useState("");

  const normalizedKeyword = keyword.trim().toLowerCase();

  const results = useMemo(() => {
    if (!normalizedKeyword) return [];
    return messages
      .filter((msg) => typeof msg?.content === "string" && msg.content.toLowerCase().includes(normalizedKeyword))
      .slice(0, 40);
  }, [messages, normalizedKeyword]);

  const handleSelect = (messageId) => {
    if (!messageId) return;
    onSelectMessage?.(messageId);
  };

  const renderResults = () => {
    if (!keyword.trim()) {
      return (
        <p className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
          Nhập từ khóa để tìm tin nhắn.
        </p>
      );
    }

    if (!results.length) {
      return (
        <p className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
          Không tìm thấy tin nhắn phù hợp.
        </p>
      );
    }

    return results.map((message) => {
      const sender = message?.sender?.fullName || (message?.sender?.id ? "Thành viên" : "Bạn");
      const timestamp = message?.timeStamp ? formatDateTime(message.timeStamp) : "";
      const preview = message?.content?.trim() || "(Tin nhắn trống)";

      return (
        <button
          key={message.id}
          type="button"
          onClick={() => handleSelect(message.id)}
          className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
        >
          <div className="flex items-start justify-between gap-3 mb-1">
            <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
              {sender}
            </p>
            {timestamp && (
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {timestamp}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {highlightText(preview, keyword)}
          </p>
        </button>
      );
    });
  };

  return (
    <div className="bg-white dark:bg-[#252525] shadow-sm rounded-lg">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
      >
        <div className="flex flex-col text-left">
          <p className="text-[13px] font-semibold text-gray-800 dark:text-white leading-[18px]">Tìm kiếm tin nhắn</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-[16px]">Tra cứu nhanh nội dung trong đoạn chat</p>
        </div>
        <BsChevronDown
          className={`text-gray-500 transition-transform ${expanded ? "rotate-180" : "rotate-0"}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <AiOutlineSearch className="text-gray-400 dark:text-gray-500" size={18} />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Nhập nội dung cần tìm..."
              className="flex-1 bg-transparent outline-none text-sm text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {renderResults()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessageSearchSection;
