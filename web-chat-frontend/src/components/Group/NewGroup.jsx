import React, { useState } from "react";
import { BsCheck2, BsCamera } from "react-icons/bs";
import { useDispatch } from "react-redux";
import { createGroupChat } from "../../redux/chat/action";
import toast from "react-hot-toast";
import { CircularProgress, Avatar } from "@mui/material";
import { DEFAULT_AVATAR } from "../../constants/defaults";
import { logger } from "../../utils/logger";
import { uploadImageToCloudinary } from "../../utils/cloudinaryUploader";

const NewGroup = ({ groupMember, setIsGroup, setNewGroup, onBack }) => {
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupImage, setGroupImage] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const dispatch = useDispatch();

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Vui lòng nhập tên nhóm");
      return;
    }
    if (groupMember.length < 1) {
      toast.error("Nhóm phải có ít nhất 1 thành viên");
      return;
    }

    setIsCreating(true);
    const group = {
      userId: groupMember.map((u) => u.id),
      chat_name: groupName.trim(),
      chat_image: groupImage,
    };

    try {
      const result = await dispatch(createGroupChat({ group }));
      if (result?.success) {
        toast.success("Tạo nhóm thành công!");
        setIsGroup(false);
        setNewGroup(false);
      } else {
        toast.error(result?.message || "Tạo nhóm thất bại!");
      }
    } catch (error) {
      toast.error("Đã có lỗi xảy ra khi tạo nhóm");
      console.error("Create group error:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const uploadToCloudinary = async (file) => {
    if (!file) return;

    setIsImageUploading(true);

    try {
      const uploaded = await uploadImageToCloudinary(file, { folder: "group_avatars" });
      setGroupImage(uploaded.secure_url);
      toast.success("Đã tải ảnh lên thành công");
    } catch (err) {
      toast.error("Tải ảnh lên thất bại");
      logger.error("NewGroup.uploadToCloudinary", err);
    } finally {
      setIsImageUploading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#0a0a0a] dark:text-white">
      {/* Nội dung giữ nguyên */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center py-8 px-4 border-b dark:border-gray-700">
          <div className="relative group">
            <Avatar
              sx={{ width: 120, height: 120, fontSize: "3rem" }}
              alt="Group icon"
              src={
                groupImage ||
                "https://cdn.pixabay.com/photo/2016/04/15/18/05/computer-1331579_340.png"
              }
              className="border-4 border-white dark:border-gray-700 shadow-lg"
            />

            <label
              htmlFor="imgInput"
              className="absolute bottom-0 right-0 bg-[#00a884] text-white p-2 rounded-full cursor-pointer hover:bg-[#008069] transition-colors shadow-md"
            >
              <BsCamera className="text-xl" />
              <input
                type="file"
                id="imgInput"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadToCloudinary(file);
                }}
                disabled={isImageUploading}
              />
            </label>

            {isImageUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <CircularProgress size={40} style={{ color: "#00a884" }} />
              </div>
            )}
          </div>

          <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">
            {isImageUploading ? "Đang tải ảnh lên..." : "Chọn ảnh nhóm (tùy chọn)"}
          </p>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Tên nhóm <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#252525] text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#00a884] focus:border-transparent outline-none transition-all"
              placeholder="Nhập tên nhóm..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={100}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
              {groupName.length}/100 ký tự
            </p>
          </div>

          <div className="mt-6 p-3 bg-gray-50 dark:bg-[#252525] rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300 font-semibold">Thành viên đã chọn:</span>
              <span className="bg-[#00a884] text-white text-sm px-3 py-1 rounded-full">
                {groupMember.length} người
              </span>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-gray-700 dark:text-gray-300 font-semibold mb-3">Danh sách thành viên:</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {groupMember.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <img
                    className="h-10 w-10 rounded-full object-cover"
                    src={member.profilePicture || DEFAULT_AVATAR}
                    alt={member.fullName}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-white truncate">
                      {member.fullName}
                    </p>
                    {member.email && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{member.email}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t dark:border-gray-700 p-4 bg-white dark:bg-[#252525]">
        <button
          onClick={handleCreateGroup}
          disabled={!groupName.trim() || isCreating || isImageUploading}
          className={`w-full py-3 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
            groupName.trim() && !isCreating && !isImageUploading
              ? "bg-[#00a884] text-white hover:bg-[#008069]"
              : "bg-gray-300 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 cursor-not-allowed"
          }`}
        >
          {isCreating ? (
            <>
              <CircularProgress size={20} color="inherit" />
              <span>Đang tạo nhóm...</span>
            </>
          ) : (
            <>
              <BsCheck2 className="text-xl" />
              <span>Tạo nhóm</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default NewGroup;