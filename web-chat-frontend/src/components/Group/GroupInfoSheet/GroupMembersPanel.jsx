import React, { useEffect, useMemo, useState } from "react";
import { AiOutlinePlus, AiOutlineUserAdd, AiOutlineSearch, AiOutlineArrowLeft } from "react-icons/ai";
import { BsThreeDotsVertical } from "react-icons/bs";
import { IconButton, Menu, MenuItem } from "@mui/material";
import { DEFAULT_AVATAR } from "../../../constants/defaults";

const fallbackAvatar = DEFAULT_AVATAR;
const getMemberAvatar = (user) =>
  user?.profile_picture ||
  user?.profilePicture ||
  user?.avatar ||
  user?.chatImage ||
  fallbackAvatar;

const GroupMembersPanel = ({
  chat,
  currentUserId,
  isCurrentUserAdmin,
  knownContacts,
  searchResults,
  onRequestSearchUser,
  onRequestAddMember,
  onRequestRemoveMember,
}) => {
  const members = chat?.members ?? [];
  const adminIds = new Set(chat?.admins?.map((admin) => admin.id));

  const [isAddMode, setIsAddMode] = useState(false);
  const [keyword, setKeyword] = useState("");
  
  // Debounce search
  useEffect(() => {
    if (!isAddMode) return;
    const timer = setTimeout(() => {
      if (keyword.trim()) onRequestSearchUser?.(keyword.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [keyword, isAddMode, onRequestSearchUser]);

  // Lọc thành viên ĐANG ở trong nhóm để hiển thị danh sách thành viên hiện tại
  const filteredCurrentMembers = useMemo(() => {
    if (isAddMode) return [];
    if (!keyword.trim()) return members;
    return members.filter((m) =>
      (m.fullName || "").toLowerCase().includes(keyword.toLowerCase())
    );
  }, [members, keyword, isAddMode]);

  // Set chứa ID của các thành viên đã có trong nhóm
  const existingMemberIds = useMemo(() => new Set(members.map((m) => m.id)), [members]);

  // --- LOGIC MỚI: Lọc bỏ những người đã có trong nhóm ra khỏi danh sách gợi ý/tìm kiếm ---
  
  // 1. Danh sách liên hệ gợi ý (đã loại bỏ người trong nhóm)
  const availableContacts = useMemo(() => {
      return (knownContacts || []).filter(u => !existingMemberIds.has(u.id));
  }, [knownContacts, existingMemberIds]);

  // 2. Kết quả tìm kiếm (đã loại bỏ người trong nhóm)
  const availableSearchResults = useMemo(() => {
      return (searchResults || []).filter(u => !existingMemberIds.has(u.id));
  }, [searchResults, existingMemberIds]);

  
  // Component render 1 thành viên ĐANG ở trong nhóm
  const MemberItem = ({ member, isAdmin, isSelf, canRemove }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const openMenu = Boolean(anchorEl);

    return (
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer group text-gray-900 dark:text-white">
        <img
          src={getMemberAvatar(member)}
          alt={member.fullName}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <p className="font-semibold text-gray-900 dark:text-white truncate">
              {isSelf ? "Bạn" : member.fullName}
            </p>
            {isAdmin && (
              <span className="text-[10px] font-bold text-[#00a884] dark:text-[#4fab7a] border border-[#00a884] dark:border-[#4fab7a] px-1.5 rounded ml-2 shrink-0">
                Quản trị viên
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {member.email || member.phone || "Hey there! I am using WhatsApp."}
          </p>
        </div>
        
        {(canRemove && !isSelf) && (
          <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity md:opacity-100">
                 <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); }}>
                   <BsThreeDotsVertical fontSize="small" />
               </IconButton>
                 <Menu
                   anchorEl={anchorEl}
                   open={openMenu}
                   onClose={() => setAnchorEl(null)}
                   disableScrollLock
                   slotProps={{
                     root: { sx: { zIndex: 2000 } },
                     paper: { sx: { zIndex: 2000 } },
                   }}
                 >
                   <MenuItem onClick={() => { onRequestRemoveMember(member.id); setAnchorEl(null); }} className="text-red-600">
                       Xóa khỏi nhóm
                   </MenuItem>
               </Menu>
            </div>
        )}
      </div>
    );
  };

  // Component render ứng viên để THÊM (Không cần check isAdded nữa vì đã lọc ở trên)
  const CandidateItem = ({ user }) => {
     return (
        <div 
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer transition-colors text-gray-900 dark:text-white"
            onClick={() => onRequestAddMember(user.id)}
        >
            <img src={getMemberAvatar(user)} className="w-10 h-10 rounded-full object-cover" alt="" />
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{user.fullName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#2a2a2a] group-hover:bg-[#00a884]/10">
                <AiOutlineUserAdd className="text-[#00a884] text-xl" />
            </div>
        </div>
     );
  };

  return (
    <div className="bg-white dark:bg-[#252525] shadow-sm">
      {/* Header Search */}
      <div className="px-4 py-3 border-b dark:border-gray-700 flex items-center gap-2 sticky top-0 bg-white dark:bg-[#252525] z-10">
        {isAddMode ? (
            <button onClick={() => { setIsAddMode(false); setKeyword(""); }} className="mr-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <AiOutlineArrowLeft className="text-gray-600 dark:text-gray-400" />
            </button>
        ) : (
            <AiOutlineSearch className="text-gray-400 dark:text-gray-500 text-lg" />
        )}
        
        <input 
            className="flex-1 outline-none text-sm text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-transparent"
            placeholder={isAddMode ? "Tìm người để thêm..." : "Tìm kiếm thành viên..."}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      {/* Button mở chế độ Add Member */}
      {!isAddMode && isCurrentUserAdmin && (
        <div 
            className="flex items-center gap-4 px-4 py-4 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer border-b border-gray-100 dark:border-gray-700 transition-colors text-gray-800 dark:text-white"
            onClick={() => { setIsAddMode(true); setKeyword(""); }}
        >
            <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center shadow-sm">
                <AiOutlinePlus className="text-white text-xl" />
            </div>
            <p className="font-semibold">Thêm thành viên</p>
        </div>
      )}

      {/* Content List */}
      <div className="divide-y dark:divide-gray-700 divide-gray-50 dark:divide-opacity-30">
          {/* --- CHẾ ĐỘ THÊM THÀNH VIÊN --- */}
          {isAddMode && (
              <>
                 <p className="px-4 py-2 text-xs font-extrabold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-[#0a0a0a] uppercase">
                     {keyword ? "Kết quả tìm kiếm" : "Gợi ý từ liên hệ"}
                 </p>
                 
                 {keyword ? (
                     // Hiển thị kết quả tìm kiếm (đã lọc)
                     availableSearchResults.length > 0 ? (
                        availableSearchResults.map(u => <CandidateItem key={u.id} user={u} />)
                     ) : <p className="px-4 py-8 text-sm text-gray-500 dark:text-gray-400 text-center">Không tìm thấy người dùng phù hợp.</p>
                 ) : (
                     // Hiển thị gợi ý ban đầu (đã lọc)
                     availableContacts.length > 0 ? (
                        availableContacts.map(u => <CandidateItem key={u.id} user={u} />)
                     ) : <p className="px-4 py-8 text-sm text-gray-500 dark:text-gray-400 text-center">Nhập tên hoặc email để tìm kiếm.</p>
                 )}
              </>
          )}

          {/* --- CHẾ ĐỘ XEM DANH SÁCH THÀNH VIÊN --- */}
          {!isAddMode && (
              <>
                <p className="px-4 py-2 text-xs font-extrabold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-[#0a0a0a] uppercase">
                    {filteredCurrentMembers.length} thành viên
                </p>
                {filteredCurrentMembers.map((member) => (
                    <MemberItem 
                        key={member.id} 
                        member={member} 
                        isAdmin={adminIds.has(member.id)}
                        isSelf={member.id === currentUserId}
                        canRemove={isCurrentUserAdmin}
                    />
                ))}
                {filteredCurrentMembers.length === 0 && (
                    <p className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">Không tìm thấy thành viên nào.</p>
                )}
              </>
          )}
      </div>
    </div>
  );
};

export default GroupMembersPanel;