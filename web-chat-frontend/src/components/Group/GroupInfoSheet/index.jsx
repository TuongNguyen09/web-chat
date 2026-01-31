import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import GroupInfoMain from "./GroupInfoMain";
import GroupMembersPanel from "./GroupMembersPanel";
import toast from "react-hot-toast";
import { updateChat } from "../../../redux/chat/action";
import { logger } from "../../../utils/logger";
import { uploadImageToCloudinary } from "../../../utils/cloudinaryUploader";
import ChatMediaSection from "./ChatMediaSection";
import ChatMessageSearchSection from "./ChatMessageSearchSection";

const GroupInfoSheet = (props) => {
  const { open, chat, messages = [], onClose, onRequestJumpToMessage } = props;

  const [nameDraft, setNameDraft] = useState(chat?.chatName || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    setNameDraft(chat?.chatName || "");
  }, [chat]);

  if (!open) return null;

  // render suppressed in production; removed debug log

  const handleGroupAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);

      const data = await uploadImageToCloudinary(file, { folder: "group_avatars" });

      await dispatch(
        updateChat({
          chatId: chat.id,
          data: { chatImage: data.secure_url },
        })
      );

      toast.success("Cập nhật ảnh nhóm thành công");
    } catch (err) {
      logger.error("GroupInfoSheet.updateAvatar", err, { chatId: chat?.id });
      toast.error("Cập nhật ảnh nhóm thất bại");
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSelectMessage = (messageId) => {
    if (!messageId) return;
    onRequestJumpToMessage?.(messageId);
    onClose?.();
  };

  return (
    <GroupInfoMain
      {...props}
      nameDraft={nameDraft}
      setNameDraft={setNameDraft}
      onRequestPhotoChange={handleGroupAvatarChange}
      isUploadingAvatar={isUploadingAvatar}
    >
      <div className="flex flex-col gap-3">
        <GroupInfoMain.Details />
        <ChatMessageSearchSection messages={messages} onSelectMessage={handleSelectMessage} />
        <ChatMediaSection messages={messages} />
        <GroupMembersPanel {...props} />
      </div>
    </GroupInfoMain>
  );
};

export default GroupInfoSheet;