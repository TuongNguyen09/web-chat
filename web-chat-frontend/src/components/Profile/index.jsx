import React, { useState, useEffect } from "react";
import { BsArrowLeft, BsPencil, BsCheck2, BsCamera } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { updateUser } from "../../redux/auth/action";
import { CircularProgress } from "@mui/material";
import toast from "react-hot-toast";
import { DEFAULT_AVATAR } from "../../constants/defaults";
import { logger } from "../../utils/logger";
import { ENV_CONFIG } from "../../config/env";
import { uploadImageToCloudinary } from "../../utils/cloudinaryUploader";

const Profile = ({ onClose }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [username, setUsername] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const auth = useSelector((store) => store.auth);
  const dispatch = useDispatch();

  const handleStartEditing = () => {
    setUsername(auth.reqUser?.fullName || "");
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      toast.error("Tên không được để trống");
      return;
    }
    if (trimmed === auth.reqUser?.fullName) {
      setIsEditingName(false);
      return;
    }

    try {
      await dispatch(
        updateUser({
          id: auth.reqUser?.id,
          data: { fullName: trimmed },
        })
      );
      setIsEditingName(false);
      toast.success("Cập nhật tên thành công");
    } catch (error) {
      toast.error("Cập nhật tên thất bại");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSaveName();
    if (e.key === "Escape") setIsEditingName(false);
  };

  const uploadToCloudinary = async (file) => {
    if (!file) return;

    setIsUploading(true);

    try {
      const resData = await uploadImageToCloudinary(file, { folder: "avatars" });

      await dispatch(
        updateUser({
          id: auth.reqUser?.id,
          data: { profilePicture: resData.secure_url },
        })
      );

      toast.success("Cập nhật ảnh đại diện thành công");
    } catch (err) {
      logger.error("Profile.uploadAvatar", err);
      toast.error("Tải ảnh lên thất bại");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (isEditingName) {
      setUsername(auth.reqUser?.fullName || "");
    }
  }, [auth.reqUser, isEditingName]);

  return (
    <div className="h-full flex flex-col bg-[#f0f2f5] dark:bg-[#252525] dark:text-white">
      <div className="flex items-center px-4 py-3 bg-[#00a884] dark:bg-[#1e6940] text-white shrink-0">
        <button
          onClick={onClose}
          className="p-2 hover:bg-[#008069] rounded-full transition-colors mr-3"
        >
          <BsArrowLeft className="text-xl" />
        </button>
        <h1 className="text-lg font-bold">Hồ sơ</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex justify-center py-8">
          <div className="relative group">
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-sm">
              {isUploading ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-[#2a2a2a]">
                  <CircularProgress style={{ color: "#00a884" }} />
                </div>
              ) : (
                <img
                  className="w-full h-full object-cover"
                  src={auth.reqUser?.profilePicture || DEFAULT_AVATAR}
                  alt="profile"
                />
              )}
            </div>

            <label
              htmlFor="imgInput"
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
            >
              <BsCamera className="text-2xl mb-2" />
              <span className="text-xs font-semibold uppercase text-center px-2">
                Thay đổi
                <br />
                ảnh đại diện
              </span>
              <input
                id="imgInput"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => uploadToCloudinary(e.target.files?.[0])}
                disabled={isUploading}
              />
            </label>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2a2a2a] shadow-sm mb-4 px-4 py-4 md:px-8">
          <p className="text-[#008069] dark:text-[#4fab7a] text-sm font-semibold mb-3">Tên hiển thị</p>

          {!isEditingName ? (
            <div className="flex justify-between items-center group">
              <p className="text-gray-800 dark:text-white text-lg flex-1 truncate pr-4">
                {auth.reqUser?.fullName || "Chưa đặt tên"}
              </p>
              <button
                onClick={handleStartEditing}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-[#00a884] dark:hover:text-[#4db876] transition-colors"
              >
                <BsPencil className="text-xl" />
              </button>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <div className="flex-1 border-b-2 border-[#00a884] transition-colors">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full outline-none py-1 text-lg text-gray-800 dark:text-white bg-transparent"
                  autoFocus
                  maxLength={25}
                />
                <div className="text-right text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {25 - username.length}
                </div>
              </div>
              <button
                onClick={handleSaveName}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-[#00a884] dark:hover:text-[#4db876] mb-1"
              >
                <BsCheck2 className="text-2xl" />
              </button>
            </div>
          )}
        </div>

        <div className="px-4 md:px-8 mb-8">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Đây không phải là tên người dùng hoặc mã PIN của bạn. Tên này sẽ hiển thị với các liên hệ WhatsApp của bạn.
          </p>
        </div>

        <div className="bg-white dark:bg-[#2a2a2a] shadow-sm px-4 py-4 md:px-8 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#3a3a3a] transition-colors">
          <p className="text-[#008069] dark:text-[#4fab7a] text-sm font-semibold mb-1">Giới thiệu</p>
          <div className="flex justify-between items-center">
            <p className="text-gray-800 dark:text-gray-300">Hey there! I am using WhatsApp.</p>
            <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-[#00a884] dark:hover:text-[#4db876]">
              <BsPencil className="text-xl" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;