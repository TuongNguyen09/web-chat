import React from "react";
import { TbCircleDashed } from "react-icons/tb";
import { BiCommentDetail } from "react-icons/bi";
import { AiOutlineSearch } from "react-icons/ai";
import { BsFilter, BsThreeDotsVertical } from "react-icons/bs";
import { Menu, MenuItem } from "@mui/material";
import ChatCard from "../ChatCard";
import ThemeToggle from "../ThemeToggle";
import { isGroupChat, getChatTitle, getChatAvatar, getChatPartner } from "../../utils/chatUtils";

const SidePanel = ({
  auth,
  chats = [],
  serverKeyword,
  defaultAvatar,
  defaultGroupImage,
  buildMatchMeta,
  chatKeyword,
  onSearchChats,
  onSelectChat,
  onGoStatus,
  onOpenProfile,
  onOpenContact,
  onOpenGroup,
  onLogout,
  menuAnchor,
  isMenuOpen,
  onMenuOpen,
  onMenuClose,
  unreadByChat = {},
  presenceByUserId = {},
}) => {
  const currentUserId = auth.reqUser?.id;

  const renderChats = () => {
    if (!chats.length) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Không có cuộc trò chuyện nào</p>
        </div>
      );
    }

    return chats.map((chat) => {
      const isGroup = isGroupChat(chat);
      const otherUser = !isGroup ? getChatPartner(chat, currentUserId) : null;

      const meta = buildMatchMeta(chat, serverKeyword, currentUserId);

      const avatar = getChatAvatar(chat, currentUserId, {
        avatar: defaultAvatar,
        groupImage: defaultGroupImage,
      });

      const title = getChatTitle(chat, currentUserId);

      const unreadCount = unreadByChat[chat.id] || 0;

      const isOnline =
        !isGroup && otherUser
          ? Boolean(presenceByUserId[otherUser.id]?.online)
          : false;

      return (
        <div
          key={chat.id}
          onClick={() => onSelectChat(chat, meta)}
          className="cursor-pointer"
        >
          <ChatCard
            userImg={avatar}
            name={title}
            timestamp={meta.timestamp}
            previewNode={meta.previewNode}
            preview={meta.previewText}
            unreadCount={unreadCount}
            isOnline={isOnline}
            showPresence={!isGroup}
          />
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#252525] dark:text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div
          onClick={onOpenProfile}
          className="flex items-center gap-3 cursor-pointer"
        >
          <img
            className="h-10 w-10 rounded-full object-cover"
            src={auth.reqUser?.profilePicture || defaultAvatar}
            alt={auth.reqUser?.fullName}
          />
          <p className="font-semibold text-gray-800 dark:text-white">
            {auth.reqUser?.fullName}
          </p>
        </div>

        <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
          <TbCircleDashed
            size={22}
            className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-300"
            onClick={onGoStatus}
          />
          <BiCommentDetail
            size={22}
            className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-300"
          />
          <ThemeToggle />
          <BsThreeDotsVertical
            size={22}
            className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-300"
            onClick={onMenuOpen}
          />

          <Menu anchorEl={menuAnchor} open={isMenuOpen} onClose={onMenuClose}>
            <MenuItem onClick={() => { onMenuClose(); onOpenProfile(); }}>
              Hồ sơ
            </MenuItem>
            <MenuItem onClick={() => { onMenuClose(); onOpenContact(); }}>
              Liên hệ mới
            </MenuItem>
            <MenuItem onClick={() => { onMenuClose(); onOpenGroup(); }}>
              Tạo nhóm
            </MenuItem>
            <MenuItem onClick={() => { onMenuClose(); onLogout(); }}>
              Đăng xuất
            </MenuItem>
          </Menu>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <AiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full bg-gray-100 dark:bg-[#2a2a2a] rounded-lg pl-10 pr-4 py-2 text-sm outline-none
                       text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
                       focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-[#00a884]"
            placeholder="Tìm kiếm hoặc bắt đầu chat mới"
            value={chatKeyword}
            onChange={(e) => onSearchChats(e.target.value)}
          />
          <BsFilter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-2 divide-y divide-gray-100 dark:divide-gray-700">
          {renderChats()}
        </div>
      </div>
    </div>
  );
};

export default SidePanel;
