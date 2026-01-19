# 🔴 CRITICAL BUG - Private Chat Duplicate Issue

## Problem Description

**Vấn đề:** Khi User A tạo chat private với User B, nếu User A tạo lại (hoặc cố tìm lại) thì API vẫn tạo chat **MỚI** thay vì trả về chat cũ.

**Expected Behavior:** Phải trả về chat cũ (nếu tồn tại) hoặc tạo chat mới (nếu chưa tồn tại).

---

## Root Cause Analysis

### 1. **Repository Query Issue** ❌

File: `ChatRepository.java` (line 22-27)

```java
// ❌ SAI: Query đang tìm trong "members" (EMBEDDED USER objects)
@Query("""
{
  'is_group': false,
  'members.id': { $all: [?0, ?1] },
  'members': { $size: 2 }
}
""")
Optional<Chat> findPrivateChatBetween(String user1Id, String user2Id);
```

### Problem:
- Model `Chat.java` lưu **member IDs** (`Set<String> memberIds`), **KHÔNG** lưu embedded user objects
- Query đang tìm trong `'members.id'` nhưng field thực tế là `'member_ids'`
- Kết quả: Query **KHÔNG TÌM THẤY** chat cũ → luôn tạo chat mới

### 2. **Proof from Chat Model** (line 14-25 in Chat.java)

```java
@Document(collection = "chats")
public class Chat {
    @Id
    String id;
    
    // ✅ Lưu ONLY IDs, KHÔNG embed User objects
    @Builder.Default
    @Field("member_ids")  // 👈 Field name là "member_ids"
    Set<String> memberIds = new HashSet<>();
    
    @Builder.Default
    @Field("admin_ids")
    Set<String> adminIds = new HashSet<>();
    
    // ...KHÔNG có "members" field
}
```

### 3. **Service Logic** (ChatService.java line 37-56)

```java
public Chat createChat(User reqUser, String userId2) {
    User user2 = fetchUser(userId2);

    Optional<Chat> existed =
            chatRepository.findPrivateChatBetween(reqUser.getId(), user2.getId());
    
    // ❌ Logic này ĐÚNG, nhưng query KHÔNG hoạt động
    if (existed.isPresent()) {
        return existed.get();  // Nếu tìm thấy → trả về
    }

    // Nếu không tìm thấy (do query sai) → tạo mới
    return chatRepository.save(
            Chat.builder()
                    .isGroup(false)
                    .memberIds(Set.of(reqUser.getId(), user2.getId()))
                    .build()
    );
}
```

---

## Solution

### Fix: Update Repository Query

**File:** `ChatRepository.java`

**Đổi từ:**
```java
@Query("""
{
  'is_group': false,
  'members.id': { $all: [?0, ?1] },
  'members': { $size: 2 }
}
""")
Optional<Chat> findPrivateChatBetween(String user1Id, String user2Id);
```

**Đổi thành:**
```java
@Query("""
{
  'is_group': false,
  'member_ids': { $all: [?0, ?1] },
  'member_ids': { $size: 2 }
}
""")
Optional<Chat> findPrivateChatBetween(String user1Id, String user2Id);
```

**Hoặc tốt hơn - dùng derived query:**
```java
// Đơn giản hơn, Spring tự generate query
Optional<Chat> findByIsGroupFalseAndMemberIdsContainsAllAndMemberIdsSize(
    Set<String> memberIds, int size
);
```

---

## Impact Analysis

### Affected:
- ❌ Every time User A creates private chat with User B → creates duplicate
- ❌ Chat list becomes messy with duplicate private chats
- ❌ Messages might be split across multiple chat records

### Severity:
- 🔴 **CRITICAL** - Core functionality broken

---

## Testing Steps

1. **Before Fix:**
   - User A creates chat with User B → Chat ID = "abc123"
   - User A tries to create chat with User B again → Chat ID = "xyz789" ❌ (DUPLICATE)

2. **After Fix:**
   - User A creates chat with User B → Chat ID = "abc123"
   - User A tries to create chat with User B again → Chat ID = "abc123" ✅ (SAME)

