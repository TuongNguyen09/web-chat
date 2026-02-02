import React, { useRef } from "react";
import { createPortal } from "react-dom";
import { AiOutlineClose } from "react-icons/ai";
import { MdBlock, MdDelete } from "react-icons/md";
import { getChatAvatar, getChatPartner } from "../../../utils/chatUtils";
import { DEFAULT_AVATAR } from "../../../constants/defaults";

const UserInfoMain = ({
    chat,
    currentUserId,
    onClose,
    onRequestBlockUser,
    onRequestDeleteChat,
    blockStatus = { isBlockedByUser: false, userBlockedByMe: false },
    children
}) => {
    const overlayRef = useRef(null);
    
    // Determine the partner
    const partner = getChatPartner(chat, currentUserId) || {};
    const avatarUrl = getChatAvatar(chat, currentUserId, { avatar: DEFAULT_AVATAR });
    
    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current) onClose();
    };

    // If user is blocked BY partner, show only blocked message
    if (blockStatus?.isBlockedByUser) {
        return createPortal(
            <div
                ref={overlayRef}
                onClick={handleOverlayClick}
                className="fixed inset-0 z-[1500] flex justify-end bg-black/50 backdrop-blur-sm transition-opacity"
            >
                <div className="w-full md:w-[400px] lg:w-[450px] h-full bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white shadow-2xl flex flex-col animate-slide-in-right">
                    {/* Header */}
                    <div className="flex items-center px-4 py-3 bg-white dark:bg-[#252525] border-b border-gray-100 dark:border-gray-700 shrink-0">
                        <button
                            onClick={onClose}
                            className="p-2 mr-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <AiOutlineClose className="text-gray-600 dark:text-gray-400 text-xl" />
                        </button>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Thông tin liên hệ</h2>
                    </div>

                    {/* Blocked Message */}
                    <div className="flex-1 flex items-center justify-center px-6">
                        <div className="text-center space-y-4">
                            <p className="text-red-600 dark:text-red-400 font-semibold text-lg">
                                Bạn đã bị chặn
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Bạn không thể xem thông tin của người dùng này vì đã bị chặn.
                            </p>
                            <button
                                onClick={() => onRequestBlockUser?.(partner.id, true)}
                                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors"
                            >
                                Bỏ chặn
                            </button>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    return createPortal(
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className="fixed inset-0 z-[1500] flex justify-end bg-black/50 backdrop-blur-sm transition-opacity"
      >
        <div className="w-full md:w-[400px] lg:w-[450px] h-full bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white shadow-2xl flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center px-4 py-3 bg-white dark:bg-[#252525] border-b border-gray-100 dark:border-gray-700 shrink-0">
                    <button
                        onClick={onClose}
                        className="p-2 mr-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <AiOutlineClose className="text-gray-600 dark:text-gray-400 text-xl" />
                    </button>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Thông tin liên hệ</h2>
                </div>

                {/* Content */}
                 <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0a0a0a] custom-scrollbar">
                    {/* Identity */}
                    <div className="bg-white dark:bg-[#252525] px-6 py-8 mb-3 shadow-sm flex flex-col items-center">
                         <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-md border-4 border-white dark:border-gray-700 mb-4">
                            <img
                                src={avatarUrl}
                                alt={partner.fullName}
                                className="w-full h-full object-cover"
                            />
                         </div>
                         <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white text-center">
                            {partner.fullName || "Unknown User"}
                         </h2>
                         <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            {partner.email}
                         </p>
                    </div>

                    {/* Dynamic Children / Details */}
                    <div className="space-y-3">{children}</div>

                    {/* Danger Zone */}
                    <div className="bg-white dark:bg-[#252525] mt-3 shadow-sm divide-y dark:divide-gray-700">
                         <button
                            className="w-full flex items-center gap-4 px-6 py-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                            onClick={() => onRequestBlockUser?.(partner.id, blockStatus?.userBlockedByMe)}
                        >
                            <MdBlock className="text-xl" />
                            <span className="font-semibold">
                                {blockStatus?.userBlockedByMe ? `Bỏ chặn ${partner.fullName || "User"}` : `Chặn ${partner.fullName || "User"}`}
                            </span>
                        </button>
                        <button
                            className="w-full flex items-center gap-4 px-6 py-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                            onClick={() => onRequestDeleteChat?.()}
                        >
                            <MdDelete className="text-xl" />
                            <span className="font-semibold">Xóa đoạn chat</span>
                        </button>
                    </div>
                 </div>
            </div>
          </div>,
          document.body
        );
};

// Reuse simple details for now
const Details = () => (
  <div className="bg-white dark:bg-[#252525] shadow-sm px-2 py-2">
    <div className="px-4 py-2">
       <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-extrabold mb-2">Thông tin</p>
       <p className="text-gray-700 dark:text-gray-300 text-sm">
         Đây là đoạn chat riêng tư giữa bạn và người dùng này.
       </p>
    </div>
  </div>
);

UserInfoMain.Details = Details;

export default UserInfoMain;