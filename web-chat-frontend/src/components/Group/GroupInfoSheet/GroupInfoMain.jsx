import React, { useRef } from "react";
import { createPortal } from "react-dom";
import { AiOutlineClose } from "react-icons/ai";
import { BsPencil, BsCamera, BsThreeDotsVertical } from "react-icons/bs";
import { MdDelete, MdExitToApp } from "react-icons/md";

const fallbackGroupImg =
  "https://plus.unsplash.com/premium_photo-1664474619075-644dd191935f?auto=format&fit=crop&w=200&q=80";

const GroupInfoMain = ({
  chat,
  onClose,
  nameDraft,
  setNameDraft,
  isCurrentUserAdmin,
  onRequestPhotoChange,
  onRequestNameChange,
  isUploadingAvatar,
  isCurrentUserCreator,
  onRequestLeaveGroup,
  onRequestDeleteGroup,
  children,
}) => {
  const overlayRef = useRef(null);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

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
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Thông tin nhóm</h2>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0a0a0a] custom-scrollbar">
          {/* Avatar & Name Section */}
          <div className="bg-white dark:bg-[#252525] px-6 py-8 mb-3 shadow-sm flex flex-col items-center">
            <div className="relative group mb-4">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-md border-4 border-white dark:border-gray-700">
                {isUploadingAvatar ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <div className="h-8 w-8 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <img
                    src={chat.chatImage || fallbackGroupImg}
                    alt={chat.chatName}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {isCurrentUserAdmin && !isUploadingAvatar && (
                <label
                  htmlFor="groupAvatarInput"
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                >
                  <BsCamera className="text-2xl mb-1" />
                  <span className="text-xs font-semibold uppercase text-center px-2">
                    Đổi ảnh nhóm
                  </span>
                  <input
                    id="groupAvatarInput"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onRequestPhotoChange}
                  />
                </label>
              )}
            </div>

            <div className="w-full flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 max-w-full">
                {isCurrentUserAdmin ? (
                  <div className="flex items-center border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus-within:border-[#00a884] transition-colors pb-1">
                    <input
                      className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white text-center bg-transparent outline-none min-w-[100px]"
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      onBlur={() => onRequestNameChange?.(nameDraft)}
                      onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                    />
                    <BsPencil className="text-gray-400 dark:text-gray-500 ml-2 cursor-pointer" />
                  </div>
                ) : (
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white text-center">
                    {chat.chatName}
                  </h2>
                )}
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Nhóm • {chat.members?.length || 0} thành viên
              </p>
            </div>
          </div>

          {/* Nội dung động */}
          <div className="space-y-3">{children}</div>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-[#252525] mt-3 shadow-sm divide-y dark:divide-gray-700">
            <button
              className="w-full flex items-center gap-4 px-6 py-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
              onClick={onRequestLeaveGroup}
            >
              <MdExitToApp className="text-xl" />
              <span className="font-semibold">Rời nhóm</span>
            </button>

            {isCurrentUserCreator && (
              <button
                className="w-full flex items-center gap-4 px-6 py-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                onClick={onRequestDeleteGroup}
              >
                <MdDelete className="text-xl" />
                <span className="font-semibold">Xóa nhóm</span>
              </button>
            )}
          </div>

          <div className="h-10" />
        </div>
      </div>
    </div>,
    document.body
  );
};

const Details = () => (
  <div className="bg-white dark:bg-[#252525] shadow-sm px-2 py-2">
    <div className="divide-y dark:divide-gray-700">
      {["Cài đặt nhóm", "Quyền của quản trị viên"].map((text) => (
        <button
          key={text}
          className="flex items-center justify-between w-full px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg text-gray-700 dark:text-gray-300"
        >
          <span className="font-medium">{text}</span>
          <BsThreeDotsVertical className="text-gray-400 dark:text-gray-500" />
        </button>
      ))}
    </div>

  </div>
);

GroupInfoMain.Details = Details;

export default GroupInfoMain;