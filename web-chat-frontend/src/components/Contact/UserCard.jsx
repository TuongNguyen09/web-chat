// src/components/Contact/UserCard.jsx
import React from "react";
import { DEFAULT_AVATAR } from "../../constants/defaults";

const fallbackAvatar = DEFAULT_AVATAR;

const UserCard = ({ user, onSelect }) => {
  const { fullName, phone, email, profile_picture, profilePicture } = user || {};
  const avatarUrl = profile_picture || profilePicture || fallbackAvatar;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(user)}
      className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group"
    >
      {/* Avatar Container */}
      <div className="relative shrink-0">
        <img
          src={avatarUrl}
          alt={fullName}
          className="w-12 h-12 rounded-full object-cover border border-gray-100 group-hover:border-gray-200 transition-colors"
        />
      </div>

      {/* Info Container */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-baseline">
          <p className="text-[15px] font-medium text-gray-900 truncate pr-2">
            {fullName || "Người dùng không tên"}
          </p>
        </div>
        
        <div className="flex flex-col text-sm text-gray-500">
           {/* Ưu tiên hiển thị Email, nếu không có thì hiện Phone, nếu không có thì placeholder */}
           {email ? (
             <span className="truncate">{email}</span>
           ) : phone ? (
             <span className="truncate">{phone}</span>
           ) : (
             <span className="italic text-xs">Không có thông tin liên hệ</span>
           )}
           
           {/* Dòng phụ mô tả status nếu cần (tạm để trống hoặc thêm Bio sau này) */}
           {/* <p className="text-xs text-gray-400 mt-0.5 truncate">Hey there! I am using WhatsApp.</p> */}
        </div>
      </div>
    </button>
  );
};

export default UserCard;