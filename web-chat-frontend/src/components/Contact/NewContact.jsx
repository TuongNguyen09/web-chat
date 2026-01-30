// src/components/Contact/NewContact.jsx
import React, { useState, useEffect, useRef } from "react";
import { BsArrowLeft, BsPersonPlus } from "react-icons/bs";
import { AiOutlineSearch } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { searchUser } from "../../redux/auth/action";
import UserCard from "./UserCard";

const NewContact = ({ onClose, onSelectUser }) => {
  const [keyword, setKeyword] = useState("");
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = (value) => {
    setKeyword(value);
    dispatch(searchUser({ keyword: value }));
  };

  const renderList = () => {
    if (!keyword?.trim()) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500 dark:text-gray-400">
          <div className="bg-gray-100 dark:bg-[#252525] p-4 rounded-full mb-4">
            <BsPersonPlus className="text-3xl text-gray-400 dark:text-gray-500" />
          </div>
          <p className="font-semibold text-gray-700 dark:text-gray-300">Tìm người liên hệ mới</p>
          <p className="text-sm mt-1">
            Nhập tên hoặc email để tìm và bắt đầu trò chuyện.
          </p>
        </div>
      );
    }

    if (!auth.searchUser?.length) {
      return (
        <div className="flex flex-col items-center justify-center pt-20 text-gray-500 dark:text-gray-400">
          <p>Không tìm thấy kết quả cho "{keyword}"</p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {auth.searchUser.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onSelect={(selected) => onSelectUser?.(selected)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a] dark:text-white">
      <div className="flex items-center px-4 py-3 bg-[#00a884] dark:bg-[#1e6940] text-white shrink-0">
        <button
          onClick={onClose}
          className="p-2 mr-2 rounded-full hover:bg-[#008f6f] transition-colors"
        >
          <BsArrowLeft className="text-xl" />
        </button>
        <h1 className="text-lg font-bold">Thêm liên hệ mới</h1>
      </div>

      <div className="px-4 py-3 bg-white dark:bg-[#252525] border-b border-gray-100 dark:border-gray-700 shrink-0 shadow-sm z-10">
        <div className="relative">
          <AiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-lg" />
          <input
            ref={inputRef}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-100 dark:bg-[#2a2a2a] text-gray-800 dark:text-white text-sm focus:bg-white dark:focus:bg-[#3a3a3a] focus:ring-2 focus:ring-[#00a884] focus:outline-none transition-all placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Tìm kiếm tên hoặc email..."
            value={keyword}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-[#0a0a0a]">
        {renderList()}
      </div>
    </div>
  );
};

export default NewContact;