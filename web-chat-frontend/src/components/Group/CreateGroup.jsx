// src/components/Group/CreateGroup.jsx
import React, { useState, useEffect, useRef } from "react";
import { BsArrowLeft, BsArrowRight, BsSearch } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import SelectedMember from "./SelectedMember";
import NewGroup from "./NewGroup";
import { searchUser } from "../../redux/auth/action";
import { DEFAULT_AVATAR } from "../../constants/defaults";

const CreateGroup = ({ setIsGroup, onClose }) => {
  const [newGroup, setNewGroup] = useState(false);
  const [query, setQuery] = useState("");
  const [groupMember, setGroupMember] = useState([]);
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  const searchInputRef = useRef(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleAddMember = (user) => {
    if (groupMember.some((m) => m.id === user.id)) {
      toast.error("User already added");
      return;
    }
    setGroupMember((prev) => [...prev, user]);
    setQuery("");
  };

  const handleRemoveMember = (user) => {
    setGroupMember((prev) => prev.filter((m) => m.id !== user.id));
  };

  const handleNext = () => {
    if (groupMember.length < 1) {
      toast.error("Vui lòng chọn ít nhất 1 thành viên");
      return;
    }
    setNewGroup(true);
  };

  const handleBack = () => {
    if (newGroup) {
      setNewGroup(false);
    } else {
      onClose?.();
    }
  };

  const handleSearchChange = (value) => {
    setQuery(value);
    dispatch(searchUser({ keyword: value }));
  };

  const renderSearchState = () => {
    if (!query.trim()) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
          <BsSearch className="text-4xl mb-4 opacity-50" />
          <p className="text-center">Tìm kiếm người dùng để thêm vào nhóm</p>
          <p className="text-sm mt-2 text-center">
            Nhập tên hoặc email vào ô tìm kiếm
          </p>
        </div>
      );
    }

    if (!auth.searchUser?.length) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
          <p className="text-center">Không tìm thấy người dùng</p>
          <p className="text-sm mt-2 text-center">Thử tìm kiếm với tên khác</p>
        </div>
      );
    }

    return (
      <div className="divide-y">
        {auth.searchUser.map((user) => (
          <button
            key={user.id}
            onClick={() => handleAddMember(user)}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <img
                className="h-12 w-12 rounded-full object-cover"
                src={user.profilePicture || DEFAULT_AVATAR}
                alt={user.fullName}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">
                  {user.fullName}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {user.email || user.phone || "No contact info"}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center px-4 py-3 bg-[#00a884] text-white">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-[#008069] rounded-full transition-colors"
        >
          <BsArrowLeft className="text-xl" />
        </button>
        <div className="ml-4">
          <h1 className="text-lg font-semibold">
            {newGroup ? "Tạo nhóm mới" : "Thêm thành viên"}
          </h1>
          <p className="text-sm opacity-90">
            {newGroup
              ? `Đã chọn ${groupMember.length} thành viên`
              : "Chọn người để thêm vào nhóm"}
          </p>
        </div>
      </div>

      {!newGroup ? (
        <div className="flex-1 flex flex-col">
          {groupMember.length > 0 && (
            <div className="px-4 py-3 border-b bg-gray-50">
              <div className="flex flex-wrap gap-2">
                {groupMember.map((member) => (
                  <SelectedMember
                    key={member.id}
                    member={member}
                    handleRemoveMember={() => handleRemoveMember(member)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="p-4 border-b">
            <div className="relative">
              <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-[#00a884] transition-all"
                placeholder="Tìm kiếm người dùng..."
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">{renderSearchState()}</div>

          {groupMember.length > 0 && (
            <div className="border-t p-4 bg-white">
              <button
                onClick={handleNext}
                className="w-full py-3 bg-[#00a884] text-white font-medium rounded-lg hover:bg-[#008069] transition-colors flex items-center justify-center gap-2"
              >
                <span>Tiếp theo</span>
                <BsArrowRight />
              </button>
            </div>
          )}
        </div>
      ) : (
        <NewGroup
          setIsGroup={setIsGroup}
          setNewGroup={setNewGroup}
          groupMember={groupMember}
          onBack={() => setNewGroup(false)}
        />
      )}
    </div>
  );
};

export default CreateGroup;