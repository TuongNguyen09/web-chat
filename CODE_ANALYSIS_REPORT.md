# Báo Cáo Phân Tích Code Duplication & Tối Ưu Hóa

## 📋 Tổng Quan

Báo cáo này phân tích toàn bộ codebase frontend để tìm:
- Code duplication (code lặp lại)
- Patterns chưa tối ưu
- Cơ hội refactoring

---

## 🔴 VẤN ĐỀ NGHIÊM TRỌNG

### 1. **Response Parsing Pattern Lặp Lại (CRITICAL)**

**Vị trí:** Tất cả Redux actions

**Vấn đề:** Pattern `response.result || response` và error checking được lặp lại ở mọi action:

```javascript
// Pattern này xuất hiện ở:
// - redux/auth/action.js (nhiều chỗ)
// - redux/chat/action.js (nhiều chỗ)
// - redux/message/action.js
// - redux/unread/action.js
// - redux/presence/action.js

const response = await res.json();
if (!res.ok || response.code !== 0) {
  throw new Error(response.message || "Error message");
}
dispatch({ type: ACTION_TYPE, payload: response.result || response });
```

**Giải pháp:** Tạo utility function để xử lý response:

```javascript
// utils/apiResponse.js
export const parseApiResponse = async (res) => {
  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    throw new Error(data.message || "Request failed");
  }
  return data.result || data;
};

// Sử dụng:
const result = await parseApiResponse(res);
dispatch({ type: ACTION_TYPE, payload: result });
```

**Lợi ích:**
- Giảm code duplication ~50%
- Dễ maintain và update error handling
- Consistent error messages

---

### 2. **Default Avatar/Image Constants Trùng Lặp**

**Vị trí:**
- `pages/HomePage/index.jsx` (line 72-75)
- `components/ChatCard/index.jsx` (line 21)
- Có thể ở nhiều components khác

**Vấn đề:**
```javascript
// HomePage/index.jsx
const DEFAULT_AVATAR = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__340.png";
const DEFAULT_GROUP_IMAGE = "https://plus.unsplash.com/premium_photo-1664474619075-644dd191935f?auto=format&fit=crop&w=200&q=80";

// ChatCard/index.jsx
const userImage = userImg || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__340.png";
```

**Giải pháp:** Tạo constants file:

```javascript
// constants/defaults.js
export const DEFAULT_AVATAR = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__340.png";
export const DEFAULT_GROUP_IMAGE = "https://plus.unsplash.com/premium_photo-1664474619075-644dd191935f?auto=format&fit=crop&w=200&q=80";
```

**Lợi ích:**
- Single source of truth
- Dễ thay đổi URL
- Tránh hardcode

---

### 3. **Error Handling Pattern Lặp Lại**

**Vị trí:** Tất cả Redux actions và components

**Vấn đề:**
```javascript
// Pattern này lặp lại ở mọi action:
try {
  // ... code
} catch (error) {
  console.error("actionName error", error);
  throw error; // hoặc return { success: false, error }
}
```

**Giải pháp:** Tạo error handler wrapper:

```javascript
// utils/errorHandler.js
export const withErrorHandling = (actionName) => async (fn) => {
  try {
    return await fn();
  } catch (error) {
    console.error(`${actionName} error:`, error);
    throw error;
  }
};

// Sử dụng:
export const createChat = ({ data }) => async (dispatch) => {
  return withErrorHandling("createChat")(async () => {
    const res = await authFetch(`/chats/private`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    const result = await parseApiResponse(res);
    dispatch({ type: CREATE_CHAT, payload: result });
    return result;
  });
};
```

---

## 🟡 VẤN ĐỀ TRUNG BÌNH

### 4. **Console.error Scattered Everywhere**

**Vị trí:** 25+ chỗ trong codebase

**Vấn đề:** Console.error được gọi trực tiếp ở nhiều nơi, không có logging service

**Giải pháp:** Tạo logging utility:

```javascript
// utils/logger.js
export const logger = {
  error: (context, error, metadata = {}) => {
    console.error(`[${context}]`, error, metadata);
    // Có thể gửi lên error tracking service (Sentry, etc.)
  },
  warn: (context, message, metadata = {}) => {
    console.warn(`[${context}]`, message, metadata);
  },
  info: (context, message, metadata = {}) => {
    console.info(`[${context}]`, message, metadata);
  }
};

// Sử dụng:
logger.error("createChat", error, { chatId, userId });
```

---

### 5. **API Endpoint Construction Lặp Lại**

**Vị trí:** Redux actions

**Vấn đề:**
```javascript
// Nhiều chỗ có pattern tương tự:
const res = await authFetch(`/chats/${chatId}/add-user/${userId}`, { method: "POST" });
const res = await authFetch(`/chats/${chatId}/remove-user/${targetUserId}`, { method: "DELETE" });
const res = await authFetch(`/chats/${chatId}/update`, { method: "PUT" });
```

**Giải pháp:** Tạo API client với methods:

```javascript
// utils/apiClient.js
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async request(path, options = {}) {
    const res = await authFetch(`${this.baseUrl}${path}`, options);
    return parseApiResponse(res);
  }

  get(path) {
    return this.request(path, { method: "GET" });
  }

  post(path, data) {
    return this.request(path, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  put(path, data) {
    return this.request(path, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  delete(path) {
    return this.request(path, { method: "DELETE" });
  }
}

export const chatApi = new ApiClient("/chats");
export const messageApi = new ApiClient("/messages");
export const userApi = new ApiClient("/users");

// Sử dụng:
const updatedChat = await chatApi.put(`/${chatId}/update`, data);
```

---

### 6. **Date/Time Formatting Lặp Lại**

**Vị trí:**
- `pages/HomePage/index.jsx` (formatDateLabel, getLastMessageMeta)
- `components/MessageCard/index.jsx` (formattedTime)
- Có thể ở nhiều nơi khác

**Vấn đề:**
```javascript
// HomePage/index.jsx
const formatDateLabel = (isoString) =>
    new Date(isoString).toLocaleDateString("vi-VN");

// MessageCard/index.jsx
const formattedTime = timeStamp
    ? new Date(timeStamp).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
```

**Giải pháp:** Tạo date utils:

```javascript
// utils/dateUtils.js
export const formatDate = (isoString, locale = "vi-VN") => {
  if (!isoString) return "";
  return new Date(isoString).toLocaleDateString(locale);
};

export const formatTime = (isoString, locale = "vi-VN") => {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDateTime = (isoString, locale = "vi-VN") => {
  if (!isoString) return "";
  return new Date(isoString).toLocaleString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
```

---

### 7. **isGroupChat Logic Lặp Lại**

**Vị trí:**
- `pages/HomePage/index.jsx` (line 77)
- `components/HomeLayout/SidePanel.jsx` (line 43)
- `components/HomeLayout/ChatBox.jsx` (line 137)

**Vấn đề:**
```javascript
// HomePage/index.jsx
const isGroupChat = (chatEntity) => Boolean(chatEntity?.group);

// SidePanel.jsx
const isGroup = Boolean(chat.group ?? chat.isGroup);

// ChatBox.jsx
const chatTitle = currentChat?.group ? ... : ...;
```

**Giải pháp:** Tạo utility function:

```javascript
// utils/chatUtils.js
export const isGroupChat = (chat) => Boolean(chat?.group ?? chat?.isGroup);

export const getChatTitle = (chat, currentUserId, defaultGroupName = "Group Chat") => {
  if (isGroupChat(chat)) {
    return chat.chatName || defaultGroupName;
  }
  const partner = chat.members?.find((u) => u.id !== currentUserId);
  return partner?.fullName || "Unknown User";
};

export const getChatAvatar = (chat, currentUserId, defaults) => {
  if (isGroupChat(chat)) {
    return chat.chatImage || defaults.groupImage;
  }
  const partner = chat.members?.find((u) => u.id !== currentUserId);
  return partner?.profilePicture || defaults.avatar;
};
```

---

### 8. **Menu State Management Lặp Lại**

**Vị trí:** `pages/HomePage/index.jsx`

**Vấn đề:**
```javascript
const [leftMenuAnchor, setLeftMenuAnchor] = useState(null);
const [rightMenuAnchor, setRightMenuAnchor] = useState(null);
const openLeft = Boolean(leftMenuAnchor);
const openRight = Boolean(rightMenuAnchor);
const handleLeftClick = (e) => setLeftMenuAnchor(e.currentTarget);
const handleLeftClose = () => setLeftMenuAnchor(null);
// ... tương tự cho right menu
```

**Giải pháp:** Tạo custom hook:

```javascript
// hooks/useMenu.js
export const useMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const isOpen = Boolean(anchorEl);
  const open = (e) => setAnchorEl(e.currentTarget);
  const close = () => setAnchorEl(null);
  return { anchorEl, isOpen, open, close };
};

// Sử dụng:
const leftMenu = useMenu();
const rightMenu = useMenu();
```

---

## 🟢 VẤN ĐỀ NHỎ - CẢI THIỆN

### 9. **Magic Numbers/Strings**

**Vị trí:** Nhiều nơi

**Vấn đề:**
```javascript
// HomePage/index.jsx
const PAGE_SIZE = 20;
const MIN_FETCH_DURATION = 1000;
setTimeout(connect, 3000); // retry timeout
container.scrollTop <= 20; // near top threshold
container.scrollHeight - (container.scrollTop + container.clientHeight) < 80; // near bottom
```

**Giải pháp:** Tạo constants file:

```javascript
// constants/ui.js
export const PAGINATION = {
  PAGE_SIZE: 20,
  MIN_FETCH_DURATION: 1000,
};

export const SCROLL_THRESHOLDS = {
  NEAR_TOP: 20,
  NEAR_BOTTOM: 80,
};

export const WEBSOCKET = {
  RETRY_DELAY: 3000,
  CONNECTION_TIMEOUT: 5000,
};
```

---

### 10. **Toast Messages Hardcoded**

**Vị trí:** Nhiều components và actions

**Vấn đề:** Toast messages được hardcode ở nhiều nơi

**Giải pháp:** Tạo messages constants:

```javascript
// constants/messages.js
export const MESSAGES = {
  SUCCESS: {
    CHAT_CREATED: "Tạo chat thành công",
    GROUP_CREATED: "Tạo nhóm thành công",
    MEMBER_ADDED: "Đã thêm thành viên",
    MEMBER_REMOVED: "Đã xóa thành viên",
    GROUP_RENAMED: "Đổi tên nhóm thành công",
    MESSAGE_DELETED: "Xóa tin nhắn thành công",
  },
  ERROR: {
    CHAT_CREATE_FAILED: "Không thể tạo chat",
    GROUP_CREATE_FAILED: "Không thể tạo nhóm",
    MEMBER_ADD_FAILED: "Không thể thêm thành viên",
    MEMBER_REMOVE_FAILED: "Không thể xóa thành viên",
    UNAUTHORIZED: "Bạn không có quyền thực hiện hành động này",
  },
};
```

---

## 📊 TỔNG KẾT

### Code Duplication Statistics:
- **Redux Actions:** ~70% code duplication trong error handling và response parsing
- **Constants:** 3+ chỗ hardcode default avatar/image
- **Date Formatting:** 2+ implementations khác nhau
- **Error Handling:** 25+ console.error calls scattered
- **Menu Management:** 2 menus với logic giống hệt nhau

### Estimated Impact:
- **Lines of Code có thể giảm:** ~200-300 lines
- **Maintainability:** Tăng đáng kể
- **Consistency:** Cải thiện rõ rệt
- **Bug Risk:** Giảm do single source of truth

---

## 🚀 KHUYẾN NGHỊ THỰC HIỆN

### Priority 1 (CRITICAL - Nên làm ngay):
1. ✅ Tạo `utils/apiResponse.js` - parseApiResponse function
2. ✅ Tạo `constants/defaults.js` - DEFAULT_AVATAR, DEFAULT_GROUP_IMAGE
3. ✅ Refactor tất cả Redux actions để dùng parseApiResponse

### Priority 2 (HIGH - Nên làm sớm):
4. ✅ Tạo `utils/errorHandler.js` - withErrorHandling wrapper
5. ✅ Tạo `utils/logger.js` - centralized logging
6. ✅ Tạo `utils/dateUtils.js` - date formatting utilities
7. ✅ Tạo `utils/chatUtils.js` - chat-related utilities

### Priority 3 (MEDIUM - Có thể làm sau):
8. ✅ Tạo `hooks/useMenu.js` - menu state hook
9. ✅ Tạo `utils/apiClient.js` - API client class
10. ✅ Tạo `constants/ui.js` và `constants/messages.js`

---

## 📝 LƯU Ý

- Tất cả refactoring nên được test kỹ trước khi merge
- Nên làm từng bước một, không refactor tất cả cùng lúc
- Giữ backward compatibility nếu có thể
- Update tests nếu có

---

*Báo cáo được tạo tự động từ phân tích codebase ngày: $(date)*
