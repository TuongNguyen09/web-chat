import React from "react";

const EmptyChatState = () => (
  <div className="h-full flex flex-col items-center justify-center bg-white text-center p-4">
    <div className="max-w-md">
      <img
        src="https://res.cloudinary.com/zarmariya/image/upload/v1662264838/whatsapp_multi_device_support_update_image_1636207150180-removebg-preview_jgyy3t.png"
        alt="WhatsApp Web"
        className="mx-auto w-64 md:w-80 mb-8"
      />
      <h1 className="text-3xl md:text-4xl font-light text-gray-700 mb-4">
        WhatsApp Web
      </h1>
      <p className="text-sm md:text-base text-gray-500 leading-relaxed mb-6">
        Gửi và nhận tin nhắn mà không cần giữ điện thoại trực tuyến.
        <br />
        Sử dụng WhatsApp trên tối đa 4 thiết bị được liên kết và 1 điện thoại cùng lúc.
      </p>
      <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,1L3,5v6c0,5.55,3.84,10.74,9,12c5.16-1.26,9-6.45,9-12V5L12,1z M12,7c1.1,0,2,0.9,2,2s-0.9,2-2,2s-2-0.9-2-2S10.9,7,12,7z" />
        </svg>
        <span>Mã hóa đầu cuối</span>
      </div>
    </div>
  </div>
);

export default EmptyChatState;