import React from "react";
import { TbCircleDashed } from "react-icons/tb";
import { BiCommentDetail } from "react-icons/bi";
import { AiOutlineSearch } from "react-icons/ai";
import { BsFilter, BsThreeDotsVertical } from "react-icons/bs";
import { Menu, MenuItem } from "@mui/material";
import ChatCard from "../ChatCard";

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
      const isGroup = Boolean(chat.group ?? chat.isGroup);
      const members = chat.members || [];

      const otherUser = !isGroup
        ? members.find((u) => u.id !== currentUserId)
        : null;

      const meta = buildMatchMeta(chat, serverKeyword, currentUserId);

      const avatar = isGroup
        ? chat.chatImage || defaultGroupImage
        : otherUser?.profilePicture || defaultAvatar;

      const title = isGroup
        ? chat.chatName || "Group Chat"
        : otherUser?.fullName || "Unknown User";

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
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div
          onClick={onOpenProfile}
          className="flex items-center gap-3 cursor-pointer"
        >
          <img
            className="h-10 w-10 rounded-full object-cover"
            src={auth.reqUser?.profilePicture || defaultAvatar}
            alt={auth.reqUser?.fullName}
          />
          <p className="font-medium text-gray-800">
            {auth.reqUser?.fullName}
          </p>
        </div>

        <div className="flex items-center gap-4 text-gray-600">
          <TbCircleDashed
            size={22}
            className="cursor-pointer hover:text-gray-800"
            onClick={onGoStatus}
          />
          <BiCommentDetail
            size={22}
            className="cursor-pointer hover:text-gray-800"
          />
          <BsThreeDotsVertical
            size={22}
            className="cursor-pointer hover:text-gray-800"
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
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <AiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full bg-gray-100 rounded-lg pl-10 pr-4 py-2 text-sm outline-none
                       focus:bg-white focus:ring-2 focus:ring-[#00a884]"
            placeholder="Tìm kiếm hoặc bắt đầu chat mới"
            value={chatKeyword}
            onChange={(e) => onSearchChats(e.target.value)}
          />
          <BsFilter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-2 divide-y divide-gray-100">
          {renderChats()}
        </div>
      </div>
    </div>
  );
};

export default SidePanel;
