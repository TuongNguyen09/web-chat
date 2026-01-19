# 🔴 CODE DUPLICATION REPORT - web-chat-frontend

## Summary
Phát hiện **4 vấn đề code duplication** trong dự án, có thể giảm ~150-200 dòng code.

---

## 1. **downloadFile Function** (CRITICAL)

### Vị trí lặp lại:
- ❌ `src/components/HomeLayout/ChatBox.jsx` (line 397-416)
- ❌ `src/components/MessageCard/index.jsx` (line 78-101)

### Code hiện tại:
```javascript
// ChatBox.jsx & MessageCard/index.jsx - GIỐNG NHAU
const downloadFile = async (url, filename = "attachment") => {
  try {
    const response = await fetch(url, { credentials: "omit" });
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const tempUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = tempUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    a.remove();
    URL.revokeObjectURL(tempUrl);
  } catch (err) {
    toast.error("Không tải được file");
    logger.error("downloadFile", err, { url, filename });
  }
};
```

### Giải pháp:
Tạo utility file: `src/utils/fileDownloader.js`

---

## 2. **uploadToCloudinary Function** (CRITICAL)

### Vị trí lặp lại:
- ❌ `src/components/HomeLayout/ChatBox.jsx` (line 149-158)
- ❌ `src/components/Profile/index.jsx` (line 54-74)
- ❌ `src/components/Group/GroupInfoSheet/index.jsx` (line 26-47)
- ❌ `src/components/Group/NewGroup.jsx` (line 52-74)

### Vấn đề:
- **4 implementations khác nhau** của cùng 1 logic
- Có 2 cách gọi API khác nhau: `axios` vs `fetch`
- Hardcoded URL ở NewGroup & GroupInfoSheet (chưa dùng ENV_CONFIG)
- Không consistent error handling

### ChatBox.jsx (dùng axios):
```javascript
const uploadToCloudinary = (file, fileId) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", ENV_CONFIG.CLOUDINARY.UPLOAD_PRESET);
  formData.append("folder", "chat_attachments");

  return axios.post(ENV_CONFIG.CLOUDINARY.API_URL, formData, {
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      updateFileProgress(fileId, percentCompleted);
    }
  }).then(response => response.data);
};
```

### Profile/index.jsx (dùng fetch):
```javascript
const uploadToCloudinary = async (file) => {
  if (!file) return;
  setIsUploading(true);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", ENV_CONFIG.CLOUDINARY.UPLOAD_PRESET);
  formData.append("folder", "avatars");

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${ENV_CONFIG.CLOUDINARY.CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );
    const resData = await res.json();
    if (!res.ok) throw new Error("Upload failed");
    // dispatch update...
  } catch (err) {
    logger.error("Profile.uploadAvatar", err);
    toast.error("Tải ảnh lên thất bại");
  } finally {
    setIsUploading(false);
  }
};
```

### GroupInfoSheet/index.jsx (HARDCODED - NOT USING ENV):
```javascript
const res = await fetch(
  "https://api.cloudinary.com/v1_1/dj923dmx3/image/upload", // ❌ HARDCODED
  { method: "POST", body: formData }
);
```

### NewGroup.jsx (HARDCODED - NOT USING ENV):
```javascript
fetch("https://api.cloudinary.com/v1_1/dcpesbd8q/image/upload", { // ❌ HARDCODED + WRONG CLOUD_NAME
  method: "POST",
  body: data,
})
```

### Giải pháp:
Tạo utility: `src/utils/cloudinaryUploader.js` với options:
- Progress callback (optional)
- Folder path
- Error callback

---

## 3. **toast.error Message Hardcoding** (MEDIUM)

### Vị trí:
- Multiple files: `toast.error("Không tải được file")`, `toast.error("Tải file thất bại")`, v.v.

### Giải pháp:
Sử dụng `constants/messages.js` (đã tạo trong CODE_ANALYSIS_REPORT.md)

---

## 4. **Image/Video Rendering Logic** (MEDIUM)

### Vị trí:
- `src/components/HomeLayout/ChatBox.jsx` - renderImageGrid, image lightbox
- `src/components/MessageCard/index.jsx` - renderImageGrid, renderAttachment

### Giải pháp:
Tạo component: `src/components/MediaViewer/` hoặc utility function

---

## 📋 KHUYẾN NGHỊ THỰ HIỆN (Priority Order)

### Priority 1 - NÊN LÀM NGAY:
1. ✅ Tạo `src/utils/fileDownloader.js` - centralize downloadFile
2. ✅ Tạo `src/utils/cloudinaryUploader.js` - centralize upload logic
3. ✅ Cập nhật `GroupInfoSheet/index.jsx` - dùng ENV_CONFIG
4. ✅ Cập nhật `NewGroup.jsx` - dùng ENV_CONFIG

### Priority 2 - NÊN LÀM SAU:
5. Tạo constants/messages.js cho toast messages
6. Refactor image rendering logic thành component

---

## 📊 IMPACT:
- **Code reduction:** ~200 lines
- **Maintainability:** Rất tốt
- **Bug reduction:** Cao (single source of truth)
- **Performance:** Neutral

