import React, { useEffect, useMemo, useState } from "react";
import { AiOutlinePlus, AiOutlineUserAdd, AiOutlineSearch, AiOutlineArrowLeft } from "react-icons/ai";
import { BsThreeDotsVertical } from "react-icons/bs";
import { IconButton, Menu, MenuItem } from "@mui/material";
import { DEFAULT_AVATAR } from "../../../constants/defaults";

const fallbackAvatar = DEFAULT_AVATAR;

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
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group">
        <img
          src={member.chatImage || fallbackAvatar}
          alt={member.fullName}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <p className="font-medium text-gray-900 truncate">
              {isSelf ? "Bạn" : member.fullName}
            </p>
            {isAdmin && (
              <span className="text-[10px] font-semibold text-[#00a884] border border-[#00a884] px-1.5 rounded ml-2 shrink-0">
                Quản trị viên
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">
            {member.email || member.phone || "Hey there! I am using WhatsApp."}
          </p>
        </div>
        
        {(canRemove && !isSelf) && (
            <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
               <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
                   <BsThreeDotsVertical fontSize="small" />
               </IconButton>
               <Menu anchorEl={anchorEl} open={openMenu} onClose={() => setAnchorEl(null)}>
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
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onRequestAddMember(user.id)}
        >
            <img src={user.chatImage || fallbackAvatar} className="w-10 h-10 rounded-full object-cover" alt="" />
            <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{user.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 group-hover:bg-[#00a884]/10">
                <AiOutlineUserAdd className="text-[#00a884] text-xl" />
            </div>
        </div>
     );
  };

  return (
    <div className="bg-white shadow-sm">
      {/* Header Search */}
      <div className="px-4 py-3 border-b flex items-center gap-2 sticky top-0 bg-white z-10">
        {isAddMode ? (
            <button onClick={() => { setIsAddMode(false); setKeyword(""); }} className="mr-2 p-1 rounded-full hover:bg-gray-100">
                <AiOutlineArrowLeft className="text-gray-600" />
            </button>
        ) : (
            <AiOutlineSearch className="text-gray-400 text-lg" />
        )}
        
        <input 
            className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
            placeholder={isAddMode ? "Tìm người để thêm..." : "Tìm kiếm thành viên..."}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      {/* Button mở chế độ Add Member */}
      {!isAddMode && isCurrentUserAdmin && (
        <div 
            className="flex items-center gap-4 px-4 py-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors"
            onClick={() => { setIsAddMode(true); setKeyword(""); }}
        >
            <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center shadow-sm">
                <AiOutlinePlus className="text-white text-xl" />
            </div>
            <p className="font-medium text-gray-800">Thêm thành viên</p>
        </div>
      )}

      {/* Content List */}
      <div className="divide-y divide-gray-50">
          {/* --- CHẾ ĐỘ THÊM THÀNH VIÊN --- */}
          {isAddMode && (
              <>
                 <p className="px-4 py-2 text-xs font-bold text-gray-400 bg-gray-50 uppercase">
                     {keyword ? "Kết quả tìm kiếm" : "Gợi ý từ liên hệ"}
                 </p>
                 
                 {keyword ? (
                     // Hiển thị kết quả tìm kiếm (đã lọc)
                     availableSearchResults.length > 0 ? (
                        availableSearchResults.map(u => <CandidateItem key={u.id} user={u} />)
                     ) : <p className="px-4 py-8 text-sm text-gray-500 text-center">Không tìm thấy người dùng phù hợp.</p>
                 ) : (
                     // Hiển thị gợi ý ban đầu (đã lọc)
                     availableContacts.length > 0 ? (
                        availableContacts.map(u => <CandidateItem key={u.id} user={u} />)
                     ) : <p className="px-4 py-8 text-sm text-gray-500 text-center">Nhập tên hoặc email để tìm kiếm.</p>
                 )}
              </>
          )}

          {/* --- CHẾ ĐỘ XEM DANH SÁCH THÀNH VIÊN --- */}
          {!isAddMode && (
              <>
                <p className="px-4 py-2 text-xs font-bold text-gray-400 bg-gray-50 uppercase">
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
                    <p className="px-4 py-4 text-sm text-gray-500 text-center">Không tìm thấy thành viên nào.</p>
                )}
              </>
          )}
      </div>
    </div>
  );
};

export default GroupMembersPanel;