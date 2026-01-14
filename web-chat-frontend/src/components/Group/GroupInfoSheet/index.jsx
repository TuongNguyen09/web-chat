import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import GroupInfoMain from "./GroupInfoMain";
import GroupMembersPanel from "./GroupMembersPanel";
import toast from "react-hot-toast";
import { updateChat } from "../../../redux/chat/action";

const GroupInfoSheet = (props) => {
  const { open, chat } = props;

  const [nameDraft, setNameDraft] = useState(chat?.chatName || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    setNameDraft(chat?.chatName || "");
  }, [chat]);

  if (!open || !chat?.group) return null;

  const handleGroupAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "whatsapp");
      formData.append("folder", "group_avatars");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dj923dmx3/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error("Upload failed");

      await dispatch(
        updateChat({
          chatId: chat.id,
          data: { chatImage: data.secure_url },
        })
      );

      toast.success("Cập nhật ảnh nhóm thành công");
    } catch (err) {
      console.error("Error updating group avatar:", err);
      toast.error("Cập nhật ảnh nhóm thất bại");
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = "";
    }
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
        <GroupMembersPanel {...props} />
      </div>
    </GroupInfoMain>
  );
};

export default GroupInfoSheet;