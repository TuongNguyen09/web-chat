# Giải Thích Luồng AccessToken & RefreshToken Sau Khi Cập Nhật

## 📋 TỔNG QUAN

Sau khi cập nhật, hệ thống sử dụng **Token Rotation Pattern** với:
- **Access Token**: Lưu trong memory (frontend), thời gian sống ngắn (3600s = 1 giờ)
- **Refresh Token**: Lưu trong HTTP cookie (httpOnly), thời gian sống dài (7200s = 2 giờ)

---

## 🔐 1. LUỒNG LOGIN

### **Backend (AuthController.java:37-56)**

```java
@PostMapping("/login")
public ResponseEntity<ApiResponse<AuthenticationResponse>> login(...) {
    // 1. Tạo access token + refresh token
    AuthenticationResponse response = authService.authenticationResponse(request);
    
    // 2. Set refresh token vào HTTP cookie
    ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", response.getRefreshToken())
            .httpOnly(true)      // JavaScript không thể đọc (security)
            .secure(false)       // Dev mode
            .sameSite("Lax")     // CSRF protection
            .path("/")           // Cookie có hiệu lực cho toàn bộ domain
            .maxAge(7200)        // 2 giờ
            .build();
    
    // 3. Trả về:
    //    - Access token trong response body
    //    - Refresh token trong HTTP cookie (Set-Cookie header)
    return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
            .body(ApiResponse.builder().result(response).build());
}
```

### **Frontend (redux/auth/action.js:42-65)**

```javascript
export const login = (data) => async (dispatch) => {
  const res = await fetch(`${BASE_API_URL}/auth/login`, {
    method: "POST",
    credentials: "include",  // ✅ Quan trọng: Gửi cookie
  });
  
  const result = await parseApiResponse(res);
  const accessToken = result?.accessToken;
  
  // ✅ Lưu access token vào MEMORY (không persist)
  setAccessToken(accessToken);
  
  // ✅ Refresh token được browser tự động lưu vào cookie
  //    (không cần code gì thêm)
  
  dispatch({ type: LOGIN, payload: { success: true, data: result } });
  dispatch(currentUser());
};
```

### **Kết quả sau Login:**

```
┌─────────────────────────────────────────┐
│  FRONTEND (Browser)                     │
├─────────────────────────────────────────┤
│  Memory:                                │
│    accessToken = "eyJhbGc..."          │
│                                         │
│  Cookie (httpOnly):                     │
│    refresh_token = "eyJhbGc..."        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  BACKEND (Redis)                        │
├─────────────────────────────────────────┤
│  Key: rt:{jti}                          │
│  Value: userId                          │
│  TTL: 7200 seconds                      │
└─────────────────────────────────────────┘
```

---

## 🔄 2. LUỒNG REFRESH TOKEN (Khi F5 hoặc Access Token hết hạn)

### **Khi User F5 Page:**

#### **Bước 1: App Load (App.jsx)**

```javascript
useEffect(() => {
  dispatch(bootstrapSession());  // ✅ Tự động chạy khi app load
}, [dispatch]);
```

#### **Bước 2: Bootstrap Session (redux/auth/action.js:168-188)**

```javascript
export const bootstrapSession = () => async (dispatch) => {
  try {
    // ✅ Gửi refresh token từ cookie (browser tự động gửi)
    const res = await fetch(`${BASE_API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",  // ✅ Quan trọng: Gửi cookie
    });
    
    const result = await parseApiResponse(res);
    
    // ✅ Lấy access token MỚI từ response
    setAccessToken(result.accessToken);
    
    // ✅ Refresh token MỚI được browser tự động cập nhật từ Set-Cookie header
    //    (không cần code gì thêm)
    
    await dispatch(currentUser());
  } catch (error) {
    clearAccessToken();
    dispatch({ type: REQ_USER, payload: null });
  } finally {
    dispatch({ type: "AUTH/BOOTSTRAP_FINISHED" });
  }
};
```

#### **Bước 3: Backend Xử Lý Refresh (AuthController.java:88-114)**

```java
@PostMapping("/refresh")
public ResponseEntity<ApiResponse<AuthenticationResponse>> refresh(
        @CookieValue("refresh_token") String refreshToken) throws Exception {
    
    // 1. Lấy refresh token từ cookie
    RefreshRequest request = new RefreshRequest();
    request.setRefreshToken(refreshToken);
    
    // 2. Gọi service để refresh
    AuthenticationResponse newToken = authService.refreshToken(request);
    //    - Verify refresh token
    //    - Revoke refresh token CŨ
    //    - Tạo access token MỚI
    //    - Tạo refresh token MỚI
    //    - Lưu refresh token MỚI vào Redis
    
    // 3. ✅ SET COOKIE MỚI với refresh token mới
    ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", newToken.getRefreshToken())
            .httpOnly(true)
            .secure(false)
            .sameSite("Lax")
            .path("/")
            .maxAge(Duration.ofSeconds(REFRESH_DURATION))
            .build();
    
    // 4. Trả về:
    //    - Access token MỚI trong response body
    //    - Refresh token MỚI trong Set-Cookie header
    return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
            .body(ApiResponse.builder().result(newToken).build());
}
```

#### **Bước 4: AuthService.refreshToken() (AuthService.java:239-270)**

```java
public AuthenticationResponse refreshToken(RefreshRequest request) {
    // 1. Verify refresh token (JWT signature, expiry, type)
    SignedJWT refreshJwt = verifyToken(request.getRefreshToken(), "refresh");
    String jti = refreshJwt.getJWTClaimsSet().getJWTID();
    
    // 2. Kiểm tra refresh token có trong Redis không
    String userId = redisTokenService.getUserIdByRefreshToken(jti);
    if (userId == null) {
        throw new AppException(ErrorCode.UNAUTHENTICATED);
    }
    
    // 3. ⚠️ REVOKE refresh token CŨ (Token Rotation)
    redisTokenService.revokeRefreshToken(jti);
    //    → Xóa khỏi Redis: rt:{jti}
    
    // 4. Tạo tokens MỚI
    String newAccessToken = generateAccessToken(user);   // 1 giờ
    String newRefreshToken = generateRefreshToken(user); // 2 giờ
    
    // 5. Lưu refresh token MỚI vào Redis
    SignedJWT newRefreshJwt = SignedJWT.parse(newRefreshToken);
    redisTokenService.storeRefreshToken(
        userId,
        newRefreshJwt.getJWTClaimsSet().getJWTID(),
        REFRESH_DURATION
    );
    //    → Lưu vào Redis: rt:{newJti} = userId
    
    // 6. Trả về cả 2 token
    return AuthenticationResponse.builder()
            .accessToken(newAccessToken)
            .refreshToken(newRefreshToken)
            .build();
}
```

### **Kết quả sau Refresh:**

```
TRƯỚC REFRESH:
┌─────────────────────────────────────────┐
│  FRONTEND                               │
├─────────────────────────────────────────┤
│  Memory: accessToken = "old_token"     │
│  Cookie: refresh_token = "old_refresh" │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  BACKEND (Redis)                        │
├─────────────────────────────────────────┤
│  rt:{oldJti} = userId ✅                │
└─────────────────────────────────────────┘

SAU REFRESH:
┌─────────────────────────────────────────┐
│  FRONTEND                               │
├─────────────────────────────────────────┤
│  Memory: accessToken = "new_token" ✅   │
│  Cookie: refresh_token = "new_refresh" ✅│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  BACKEND (Redis)                        │
├─────────────────────────────────────────┤
│  rt:{oldJti} = ❌ (đã bị xóa)           │
│  rt:{newJti} = userId ✅                │
└─────────────────────────────────────────┘
```

---

## 🔒 3. LUỒNG SỬ DỤNG ACCESS TOKEN

### **Khi Frontend Gọi API (utils/authFetch.js)**

```javascript
export const authFetch = async (path, options = {}) => {
  // 1. Lấy access token từ memory
  const token = getAccessToken();
  
  // 2. Gửi request với Authorization header
  const res = await fetch(`${BASE_API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  
  // 3. Nếu 401 → Access token hết hạn hoặc invalid
  if (res.status === 401) {
    clearAccessToken();
    throw new Error("Unauthorized");
  }
  
  return res;
};
```

### **Backend Verify Access Token**

```java
// Trong SecurityConfig hoặc JWT Filter
public SignedJWT verifyToken(String token, String expectedType) {
    // 1. Parse và verify JWT signature
    SignedJWT jwt = SignedJWT.parse(token);
    JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());
    if (!jwt.verify(verifier)) {
        throw new AppException(ErrorCode.UNAUTHENTICATED);
    }
    
    // 2. Kiểm tra expiry
    Date exp = jwt.getJWTClaimsSet().getExpirationTime();
    if (exp == null || exp.before(new Date())) {
        throw new AppException(ErrorCode.UNAUTHENTICATED);
    }
    
    // 3. Kiểm tra type
    String type = jwt.getJWTClaimsSet().getStringClaim("type");
    if (!expectedType.equals(type)) {
        throw new AppException(ErrorCode.UNAUTHENTICATED);
    }
    
    // 4. Kiểm tra blacklist (nếu logout)
    if ("access".equals(type)) {
        String jti = jwt.getJWTClaimsSet().getJWTID();
        if (redisTokenService.isAccessTokenBlacklisted(jti)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }
    
    return jwt;
}
```

---

## 🔄 4. TOKEN ROTATION PATTERN

### **Tại sao cần Token Rotation?**

1. **Security**: Mỗi refresh token chỉ dùng được 1 lần
2. **Theft Detection**: Nếu refresh token bị đánh cắp, chỉ có thể dùng 1 lần
3. **Revocation**: Có thể revoke refresh token ngay lập tức

### **Luồng Token Rotation:**

```
Lần 1: Refresh
  Refresh Token A → Access Token 1 + Refresh Token B
  → Revoke Token A
  → Store Token B

Lần 2: Refresh
  Refresh Token B → Access Token 2 + Refresh Token C
  → Revoke Token B
  → Store Token C

Lần 3: Refresh
  Refresh Token C → Access Token 3 + Refresh Token D
  → Revoke Token C
  → Store Token D
```

### **Nếu Refresh Token bị đánh cắp:**

```
Attacker dùng Refresh Token B:
  → Backend verify OK
  → Revoke Token B
  → Tạo Token C
  → Attacker nhận Token C

User hợp pháp dùng Refresh Token B:
  → Backend kiểm tra Redis: Token B không còn ❌
  → Throw UNAUTHENTICATED
  → User phải login lại
```

---

## ⏰ 5. THỜI GIAN SỐNG CỦA TOKEN

### **Access Token:**
- **Thời gian sống**: 3600 giây (1 giờ)
- **Lưu trữ**: Memory (frontend)
- **Mất khi**: F5 page, đóng tab, clear memory
- **Giải pháp**: Tự động refresh khi cần

### **Refresh Token:**
- **Thời gian sống**: 7200 giây (2 giờ)
- **Lưu trữ**: HTTP cookie (httpOnly)
- **Mất khi**: Cookie hết hạn, user logout, clear cookies
- **Giải pháp**: User phải login lại

### **Luồng thời gian:**

```
Login:
  Access Token: 0s → 3600s ✅
  Refresh Token: 0s → 7200s ✅

Sau 1 giờ (Access Token hết hạn):
  → Frontend gọi API → 401
  → Tự động gọi /auth/refresh
  → Nhận Access Token mới (1 giờ mới)
  → Nhận Refresh Token mới (2 giờ mới)

Sau 2 giờ (Refresh Token hết hạn):
  → /auth/refresh → 401
  → User phải login lại
```

---

## 🔐 6. BẢO MẬT

### **Access Token:**
- ✅ Short-lived (1 giờ)
- ✅ Có thể blacklist khi logout
- ❌ Lưu trong memory → mất khi F5 (nhưng tự động refresh)

### **Refresh Token:**
- ✅ Long-lived (2 giờ)
- ✅ HttpOnly cookie → JavaScript không thể đọc
- ✅ Token rotation → chỉ dùng 1 lần
- ✅ Revoke ngay sau khi dùng
- ✅ SameSite=Lax → CSRF protection

### **Các tình huống bảo mật:**

**1. XSS Attack:**
```
Attacker inject script → Có thể đọc access token từ memory
→ Nhưng KHÔNG thể đọc refresh token (httpOnly cookie)
→ Access token chỉ dùng được 1 giờ
→ Refresh token an toàn
```

**2. CSRF Attack:**
```
Attacker gửi request từ site khác
→ Cookie được gửi tự động
→ Nhưng SameSite=Lax ngăn chặn cross-site requests
→ An toàn
```

**3. Token Theft:**
```
Attacker đánh cắp refresh token
→ Chỉ dùng được 1 lần (token rotation)
→ Token hợp pháp bị revoke
→ User phát hiện và login lại
```

---

## 📊 7. TÓM TẮT LUỒNG HOẠT ĐỘNG

### **Login:**
1. User nhập email/password
2. Backend tạo access token + refresh token
3. Access token → response body → frontend memory
4. Refresh token → HTTP cookie (httpOnly)
5. Refresh token → Redis (rt:{jti} = userId)

### **F5 Page:**
1. App load → `bootstrapSession()`
2. Gửi refresh token từ cookie → `/auth/refresh`
3. Backend:
   - Verify refresh token
   - Revoke refresh token cũ
   - Tạo access token mới + refresh token mới
   - Set cookie mới với refresh token mới
4. Frontend:
   - Lấy access token mới → memory
   - Browser tự động cập nhật cookie với refresh token mới

### **Gọi API:**
1. Frontend lấy access token từ memory
2. Gửi `Authorization: Bearer {accessToken}`
3. Backend verify access token
4. Nếu 401 → Frontend tự động refresh

### **Logout:**
1. Frontend gọi `/auth/logout` với access token
2. Backend:
   - Blacklist access token
   - Revoke refresh token trong Redis
3. Frontend:
   - Clear access token từ memory
   - Cookie tự động expire (hoặc backend set cookie với maxAge=0)

---

## ✅ KẾT LUẬN

**Sau khi cập nhật:**
- ✅ Refresh token được rotate mỗi lần refresh
- ✅ Cookie được cập nhật tự động
- ✅ F5 nhiều lần vẫn hoạt động bình thường
- ✅ Bảo mật tốt hơn với token rotation
- ✅ User experience mượt mà (không cần login lại thường xuyên)

**Lợi ích:**
- Security: Token rotation, httpOnly cookie
- UX: Tự động refresh, không cần login lại
- Scalability: Token có thể revoke ngay lập tức
