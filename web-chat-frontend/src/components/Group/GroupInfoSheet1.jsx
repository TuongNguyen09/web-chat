import React, { useState, useEffect } from "react";
import {
  AiOutlineClose,
  AiOutlinePlus,
  AiOutlineArrowLeft,
} from "react-icons/ai";
import { BsPencil, BsTrash, BsCamera } from "react-icons/bs";
import { BiSearch } from "react-icons/bi";

import { DEFAULT_AVATAR, DEFAULT_GROUP_IMAGE } from "../../constants/defaults";

const fallbackGroupImg = DEFAULT_GROUP_IMAGE;
const fallbackAvatar = DEFAULT_AVATAR;

const GroupInfoSheet = ({
  open,
  onClose,
  chat,
  currentUserId,
  isCurrentUserAdmin,
  isCurrentUserCreator,
  onRequestPhotoChange,
  onRequestNameChange,
  onRequestAddMember,
  onRequestRemoveMember,
  onRequestLeaveGroup,
  onRequestDeleteGroup,
  knownContacts = [],
  searchResults = [],
  onRequestSearchUser,
}) => {
  const [tab, setTab] = useState("info");
  const [nameDraft, setNameDraft] = useState(chat?.chatName || "");
  const [membersKeyword, setMembersKeyword] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerKeyword, setPickerKeyword] = useState("");

  useEffect(() => {
    setNameDraft(chat?.chatName || "");
  }, [chat]);

  useEffect(() => {
    if (!isPickerOpen) return;
    const value = pickerKeyword.trim();
    if (!value) return;
    const timeoutId = setTimeout(() => {
      onRequestSearchUser?.(value);
    }, 350);
    return () => clearTimeout(timeoutId);
  }, [pickerKeyword, isPickerOpen, onRequestSearchUser]);

  if (!open || !chat?.group) return null;

  const members = chat?.users ?? [];
  const adminIds = new Set(chat?.admins?.map((admin) => admin.id));
  const filteredMembers = membersKeyword.trim()
    ? members.filter((m) =>
        (m.fullName || "")
          .toLowerCase()
          .includes(membersKeyword.trim().toLowerCase())
      )
    : members;

  const existingMemberIds = new Set(members.map((m) => m.id));
  const suggestedContacts = knownContacts.filter(
    (contact) =>
      contact &&
      !existingMemberIds.has(contact.id) &&
      (!pickerKeyword.trim() ||
        (contact.fullName || "")
          .toLowerCase()
          .includes(pickerKeyword.trim().toLowerCase()))
  );

  const canRemoveMember = (memberId) =>
    isCurrentUserAdmin && memberId !== currentUserId;

  const renderMemberRow = (member) => {
    const isAdmin = adminIds.has(member.id);
    return (
      <div
        key={member.id}
        className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/70 hover:bg-white hover:shadow-sm transition-all"
      >
        <img
          src={member.profilePicture || fallbackAvatar}
          alt={member.fullName}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900">{member.fullName}</p>
            {isAdmin && (
              <span className="text-[11px] uppercase font-semibold text-[#008069] bg-[#008069]/10 px-2 py-0.5 rounded-full">
                Admin
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {member.email || member.phone || ""}
          </p>
        </div>
        {canRemoveMember(member.id) && (
          <button
            className="p-2 rounded-full text-red-500 hover:bg-red-50"
            onClick={() => onRequestRemoveMember?.(member.id)}
          >
            <BsTrash />
          </button>
        )}
      </div>
    );
  };

  const renderCandidateRow = (user) => {
    const alreadyMember = existingMemberIds.has(user.id);
    return (
      <div
        key={user.id}
        className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/80 hover:bg-white hover:shadow-sm transition-all"
      >
        <img
          src={user.profilePicture || fallbackAvatar}
          alt={user.fullName}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
          <p className="text-xs text-gray-500">
            {user.email || user.phone || ""}
          </p>
        </div>
        {alreadyMember ? (
          <span className="text-[11px] uppercase font-semibold text-gray-500 bg-gray-200/80 px-3 py-0.5 rounded-full">
            In group
          </span>
        ) : (
          <button
            className="w-8 h-8 rounded-full bg-[#008069] text-white flex items-center justify-center text-base shadow hover:opacity-90"
            onClick={() => onRequestAddMember?.(user.id)}
          >
            +
          </button>
        )}
      </div>
    );
  };

  const renderPicker = () => (
    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <button
          className="p-2 rounded-full hover:bg-white"
          onClick={() => {
            setIsPickerOpen(false);
            setPickerKeyword("");
          }}
        >
          <AiOutlineArrowLeft />
        </button>
        <div className="flex-1 relative">
          <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full border border-transparent bg-white rounded-full py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#008069]"
            placeholder="Tìm theo tên hoặc chọn từ suggestion..."
            value={pickerKeyword}
            onChange={(e) => setPickerKeyword(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase text-gray-500">
          Suggested ({suggestedContacts.length})
        </p>
        {suggestedContacts.length === 0 && (
          <p className="text-sm text-gray-500">Không có liên hệ phù hợp.</p>
        )}
        {suggestedContacts.map((contact) => renderCandidateRow(contact))}
      </div>

      {pickerKeyword.trim() && searchResults?.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs uppercase text-gray-500">
            Kết quả tìm kiếm ({searchResults.length})
          </p>
          {searchResults.map((user) => renderCandidateRow(user))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
      <div className="w-[420px] h-full bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <p className="text-sm text-gray-500">Group info</p>
            <h2 className="text-xl font-semibold text-gray-900">
              {chat.chatName || "Group chat"}
            </h2>
          </div>
          <button
            className="p-2 rounded-full hover:bg-gray-100"
            onClick={onClose}
          >
            <AiOutlineClose className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
          {/* Avatar & quick info */}
          <section className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={chat.chatImage || fallbackGroupImg}
                alt={chat.chatName}
                className="w-28 h-28 rounded-full object-cover border"
              />
              <button
                className="absolute bottom-0 right-0 bg-[#008069] text-white p-2 rounded-full hover:opacity-90"
                onClick={onRequestPhotoChange}
              >
                <BsCamera />
              </button>
            </div>

            <div className="w-full text-center">
              <div className="flex items-center gap-2 justify-center">
                <input
                  className="text-lg font-semibold text-gray-900 text-center border-b border-transparent focus:border-[#008069] outline-none bg-transparent"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  disabled={!isCurrentUserAdmin}
                />
                {isCurrentUserAdmin && (
                  <button
                    className="p-2 rounded-full hover:bg-gray-100"
                    onClick={() => onRequestNameChange?.(nameDraft)}
                  >
                    <BsPencil />
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Tabs */}
          <div className="flex rounded-full bg-gray-100 p-1 text-sm font-medium">
            <button
              className={`flex-1 py-2 rounded-full ${
                tab === "info" ? "bg-white shadow text-[#008069]" : "text-gray-500"
              }`}
              onClick={() => setTab("info")}
            >
              Details
            </button>
            <button
              className={`flex-1 py-2 rounded-full ${
                tab === "members"
                  ? "bg-white shadow text-[#008069]"
                  : "text-gray-500"
              }`}
              onClick={() => setTab("members")}
            >
              Members
            </button>
          </div>

          {/* Details Tab */}
          {tab === "info" && (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase text-gray-500 mb-2">Settings</p>
                <div className="rounded-lg border divide-y">
                  <button className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50">
                    <span className="text-sm text-gray-700">
                      Require admin approval to join
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-500">
                      Coming soon
                    </span>
                  </button>
                  <button className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50">
                    <span className="text-sm text-gray-700">
                      Only admins can send messages
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-500">
                      Coming soon
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase text-gray-500 mb-2">Shortcuts</p>
                <div className="grid grid-cols-2 gap-3">
                  {["Mute", "Pin Chat", "Clear Messages", "Leave Group"].map(
                    (item) => (
                      <button
                        key={item}
                        className="py-3 px-4 rounded-lg border text-sm text-gray-700 hover:border-[#008069]"
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Members Tab */}
          {tab === "members" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase text-gray-500">
                  Members ({members.length})
                </p>
                {isCurrentUserAdmin && (
                  <button
                    className="w-10 h-10 rounded-full bg-[#008069] text-white flex items-center justify-center text-lg"
                    onClick={() => setIsPickerOpen(true)}
                  >
                    <AiOutlinePlus />
                  </button>
                )}
              </div>

              {isPickerOpen ? (
                renderPicker()
              ) : (
                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 space-y-3">
                  <div className="relative">
                    <BiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      className="w-full border border-transparent bg-white rounded-full py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#008069]"
                      placeholder="Filter members..."
                      value={membersKeyword}
                      onChange={(e) => setMembersKeyword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    {filteredMembers.map((member) => renderMemberRow(member))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t px-5 py-4 flex justify-between gap-3">
          <button
            className="flex-1 text-red-500 font-semibold border border-red-200 rounded-full py-2"
            onClick={onRequestLeaveGroup}
          >
            Leave group
          </button>
          {isCurrentUserCreator && (
            <button
              className="flex-1 text-white bg-red-500 rounded-full py-2"
              onClick={onRequestDeleteGroup}
            >
              Delete group
            </button>
          )}
          <button
            className="flex-1 bg-[#008069] text-white rounded-full py-2"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoSheet;