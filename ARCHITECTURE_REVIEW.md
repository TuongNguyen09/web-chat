# Architecture Review: Unread, Typing, Presence

## 1. Current Structure

### Backend
```
Controllers:       UnreadController, TypingRestController, PresenceController
Services:         UnreadCountService, TypingIndicatorService, PresenceService
Storage:          Redis (tất cả 3 feature dùng Redis)
Real-time:        WebSocket (SimpMessagingTemplate) cho broadcast
```

### Frontend
```
Redux Modules:    unread, typing, presence (3 folder riêng)
Store:            store.js combine 3 reducers riêng
Actions:          fetchUnreadCounts, fetchActiveTypers, fetchPresenceSnapshot
WebSocket:        Receive push từ backend qua `/queue/*` endpoints
```

## 2. Analysis: Hợp lý hay không?

### ✅ BACKEND - Hợp lý 100%

**Lý do tách riêng:**
1. **Khác nhau về Business Logic**
   - Unread: Tính số lượng tin nhắn chưa đọc (dùng Counter)
   - Typing: Quản lý trạng thái đang gõ theo thời gian (TTL 5 giây)
   - Presence: Quản lý trạng thái online/offline (lưu timestamp)

2. **Khác nhau về Data Structure**
   - Unread: `Hash<userId, chatId -> count>`
   - Typing: `Key<chatId:userId> -> TTL`
   - Presence: `Hash<userId -> timestamp>`

3. **Khác nhau về Real-time Broadcast**
   - Unread: `/queue/unread` (riêng user)
   - Typing: `/group/chat/{chatId}` (riêng chat)
   - Presence: `/group/presence` (global) + `/queue/presence` (riêng user)

4. **Khác nhau về Frequency**
   - Unread: Update khi có message mới, hoặc mark read (trung bình)
   - Typing: Update liên tục khi user gõ (cao)
   - Presence: Update khi login/logout (thấp)

5. **Khác nhau về Complexity**
   - Unread: Phụ thuộc ChatReadStateService để track last read message
   - Typing: Cần xử lý TTL expiry, ensure member
   - Presence: Event listener cho WebSocket connect/disconnect

**Kết luận Backend:** ✅ Tách riêng là **ĐÚNG VÀ CẦN THIẾT**

---

### ⚠️ FRONTEND - Có thể optimize

**Hiện tại tách 3 Redux modules riêng:**
- Mỗi feature có folder riêng: `action.js`, `reducer.js`, `actionType.js`
- 3 reducers combine trong store.js
- State tree: `{ unread, typing, presence }`

**Phân tích:**

#### ✅ Những gì TỐT
1. **Clear separation of concerns** - Dễ maintain, dễ debug
2. **Independent scaling** - Nếu typing thay đổi không ảnh hưởng unread
3. **Reusable logic** - Có thể copy paste cho project khác

#### ⚠️ Những gì CÓ THỂ OPTIMIZE
1. **Redux overhead cho simple state**
   - Unread: Chỉ là `{ byChatId: {} }` - object đơn giản
   - Typing: Chỉ là `{ byChatId: {} }` - object đơn giản
   - Presence: Chỉ là `{ byUserId: {} }` - object đơn giản

2. **WebSocket listener code bị duplicate**
   - Unread: `handleUnreadPush()` - direct action
   - Typing: `handleTypingPush()` - direct action
   - Presence: `receivePresencePush()` - direct action
   - Tất cả pattern giống nhau: `payload -> dispatch(action)`

3. **Initial fetch logic bị duplicate**
   - Unread: `fetchUnreadCounts()` 
   - Typing: `fetchActiveTypers(chatId)`
   - Presence: `fetchPresenceSnapshot()` + `fetchPresenceByUser(userId)`
   - Tất cả: try-catch, authFetch, parseApiResponse, logger.error

---

## 3. 3 Lựa chọn

### Option A: Giữ nguyên (Current) ✅ RECOMMENDED
```
Pros:
- Clear, scalable, maintainable
- Industry standard (separate Redux modules)
- Dễ unit test từng feature
- Dễ thêm tính năng mới

Cons:
- Một chút boilerplate code
- Redux middleware overhead (nhỏ, không đáng kể)

Verdict: ✅ BEST for production code
```

### Option B: Merge thành 1 "realtime" module ⚠️
```
Pros:
- Giảm boilerplate (~30%)
- Dùng chung WebSocket listener setup

Cons:
- Khó maintain khi feature phức tạp
- Khó test từng feature
- Không clear separation of concerns
- Khi debugging khó trace signal

Verdict: ❌ NOT RECOMMENDED (trade-off không đáng)
```

### Option C: Context API thay Redux ⚠️
```
Pros:
- Giảm boilerplate code
- Không cần Redux boilerplate (actionType, action, reducer)

Cons:
- Khó quản lý khi state phức tạp
- Khó debugging (Redux DevTools tốt hơn)
- Performance: Context re-render children khi state thay đổi
- Typing notification cần update liên tục - Context sẽ slow

Verdict: ❌ NOT RECOMMENDED for real-time features
```

---

## 4. Recommendation

### 🎯 Backend: **PERFECT - Không thay đổi**
- Tách 3 services là lựa chọn đúng
- Logic khác nhau, storage khác, broadcast khác
- Scalable, testable, clean

### 🎯 Frontend: **KEEP REDUX - Tối ưu nhỏ nếu muốn**

**Nếu maintain không quá tay:**
- Giữ nguyên 3 modules Redux riêng ✅

**Nếu muốn optimize nhỏ:**
```javascript
// Tạo shared hook để handle WebSocket listeners
// Thay vì 3 cái `handleUnreadPush`, `handleTypingPush`, `receivePresencePush`
// Dùng 1 WebSocket manager chung nhận push và dispatch đúng action

// Tạo shared utility function cho fetch logic
// Thay vì duplicate try-catch, authFetch, parseApiResponse

// Tạo constants/actions.js để export tất cả action creators
// Để import dễ hơn: import { fetchUnread, fetchTyping, ... }
```

---

## 5. Real-time Data Flow Analysis

### Unread Flow
```
Message created → BE:UnreadCountService.increaseUnreadForChat()
                → Redis increment `unread:${memberId}:${chatId}`
                → WebSocket push to /queue/unread
                → FE:handleUnreadPush() → dispatch UNREAD_UPDATE
                → Redux state update → Component re-render with badge
```

### Typing Flow
```
User starts typing → FE dispatch action
                  → BE:TypingWsController.startTyping()
                  → Redis set `typing:${chatId}:${userId}` (TTL 5s)
                  → Broadcast to /group/chat/{chatId}
                  → Other users receive → FE:handleTypingPush()
                  → Redux TYPING_SET_STATE → "User is typing..."
```

### Presence Flow
```
User login → BE:PresenceEventListener.onConnect()
          → BE:PresenceService.markOnline()
          → Redis hash put `presence:online:${userId}`
          → Broadcast to /group/presence
          → All connected users receive → FE:receivePresencePush()
          → Redux UPSERT → Show green dot
```

**⚠️ Lưu ý: Typing update liên tục (mỗi keystroke) → cần Redux để efficient re-render**

---

## 6. Performance Considerations

### Why NOT Context API for Real-time?
```javascript
// Context approach (slow for typing)
<TypingProvider value={{ typers }}>
  <ChatBox /> // Re-render every typing update
  <UserList /> // Re-render every typing update (waste!)
  <ProfilePanel /> // Re-render every typing update (waste!)
</TypingProvider>

// Redux approach (efficient)
const typers = useSelector(state => state.typing.byChatId[chatId])
// Only ChatBox component re-render
```

**Redux selector memoization tốt hơn Context cho high-frequency updates**

---

## 7. Conclusion

| Aspect | Decision | Reasoning |
|--------|----------|-----------|
| **Backend Structure** | ✅ KEEP as-is | Different business logic, storage, broadcast |
| **Frontend Redux** | ✅ KEEP as-is | Industry standard, scalable, performance-optimized |
| **Optimization Needed?** | ⚠️ OPTIONAL | Can optimize WebSocket listener setup, but low priority |
| **Context API?** | ❌ NOT RECOMMENDED | Not suitable for real-time high-frequency updates |

**Final Verdict: Cấu trúc hiện tại là HỢP LÝ, CHUYÊN NGHIỆP, không cần thay đổi lớn** ✅
