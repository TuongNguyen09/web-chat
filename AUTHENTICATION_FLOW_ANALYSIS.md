# Phân Tích Luồng Authentication - Vấn Đề F5

## 🔴 VẤN ĐỀ PHÁT HIỆN

**Hiện tượng:** 
- Login vào homepage → F5 lần 1: Vẫn ở homepage ✅
- F5 lần 2: Bị văng sang trang login ❌

## 📋 LUỒNG BACKEND

### 1. **Login Flow (AuthController.java:37-56)**
```java
@PostMapping("/login")
public ResponseEntity<ApiResponse<AuthenticationResponse>> login(...) {
    AuthenticationResponse response = authService.authenticationResponse(request);
    
    // Set refresh token vào HTTP cookie
    ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", response.getRefreshToken())
            .httpOnly(true)
            .secure(false)  // dev mode
            .sameSite("Lax")
            .path("/")
            .maxAge(Duration.ofSeconds(REFRESH_DURATION)) // 7200 seconds
            .build();
    
    return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
            .body(ApiResponse.builder().result(response).build());
}
```

**Kết quả:**
- ✅ Access token trả về trong response body
- ✅ Refresh token được set vào HTTP cookie (httpOnly, secure)
- ✅ Refresh token được lưu vào Redis với key `rt:{jti}`

### 2. **Refresh Token Flow (AuthController.java:88-99)**
```java
@PostMapping("/refresh")
public ApiResponse<AuthenticationResponse> refresh(
        @CookieValue("refresh_token") String refreshToken) throws Exception {
    RefreshRequest request = new RefreshRequest();
    request.setRefreshToken(refreshToken);
    AuthenticationResponse newToken = authService.refreshToken(request);
    return ApiResponse.builder()
            .message("Token refreshed successfully!")
            .result(newToken)  // ⚠️ CHỈ TRẢ VỀ TRONG BODY, KHÔNG SET COOKIE MỚI!
            .build();
}
```

**Vấn đề phát hiện:**
- ❌ Backend **KHÔNG SET COOKIE MỚI** khi refresh!
- ❌ Refresh token mới chỉ có trong response body
- ❌ Cookie vẫn giữ refresh token cũ (đã bị revoke)

### 3. **AuthService.refreshToken() (AuthService.java:239-270)**
```java
public AuthenticationResponse refreshToken(RefreshRequest request) {
    // 1. Verify refresh token từ cookie
    SignedJWT refreshJwt = verifyToken(request.getRefreshToken(), "refresh");
    String jti = refreshJwt.getJWTClaimsSet().getJWTID();
    
    // 2. Kiểm tra refresh token có trong Redis không
    String userId = redisTokenService.getUserIdByRefreshToken(jti);
    if (userId == null) {
        throw new AppException(ErrorCode.UNAUTHENTICATED);
    }
    
    // 3. ⚠️ REVOKE refresh token cũ
    redisTokenService.revokeRefreshToken(jti);
    
    // 4. Tạo access token mới + refresh token mới
    String newAccessToken = generateAccessToken(user);
    String newRefreshToken = generateRefreshToken(user);
    
    // 5. Lưu refresh token mới vào Redis
    redisTokenService.storeRefreshToken(userId, newRefreshJwt.getJWTClaimsSet().getJWTID(), REFRESH_DURATION);
    
    // 6. Trả về cả 2 token trong response body
    return AuthenticationResponse.builder()
            .accessToken(newAccessToken)
            .refreshToken(newRefreshToken)  // ⚠️ Frontend không dùng!
            .build();
}
```

## 📋 LUỒNG FRONTEND

### 1. **Login (redux/auth/action.js:42-65)**
```javascript
export const login = (data) => async (dispatch) => {
  const res = await fetch(`${BASE_API_URL}/auth/login`, {
    method: "POST",
    credentials: "include",  // ✅ Gửi cookie
  });
  
  const result = await parseApiResponse(res);
  const accessToken = result?.accessToken;
  setAccessToken(accessToken);  // Lưu vào memory
  dispatch({ type: LOGIN, payload: { success: true, data: result } });
  dispatch(currentUser());
};
```

**Kết quả:**
- ✅ Access token lưu vào memory
- ✅ Refresh token được set vào cookie tự động (browser handle)
- ✅ Frontend không cần làm gì với refresh token

### 2. **Bootstrap Session (redux/auth/action.js:168-188)**
```javascript
export const bootstrapSession = () => async (dispatch) => {
  try {
    // Gọi /auth/refresh với refresh token từ cookie
    const res = await fetch(`${BASE_API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",  // ✅ Gửi cookie
    });
    
    const result = await parseApiResponse(res);
    setAccessToken(result.accessToken);  // Lưu access token mới
    await dispatch(currentUser());
  } catch (error) {
    clearAccessToken();
    dispatch({ type: REQ_USER, payload: null });
  } finally {
    dispatch({ type: "AUTH/BOOTSTRAP_FINISHED" });
  }
};
```

**Vấn đề:**
- ❌ Frontend **KHÔNG LẤY refresh token mới** từ response
- ❌ Frontend **KHÔNG SET COOKIE MỚI**
- ❌ Cookie vẫn chứa refresh token cũ (đã bị revoke ở backend)

## 🔍 PHÂN TÍCH VẤN ĐỀ

### **Luồng F5 Lần 1:**
```
1. App load → bootstrapSession() chạy
2. Gửi refresh token CŨ từ cookie → /auth/refresh
3. Backend:
   - Verify refresh token CŨ ✅
   - Revoke refresh token CŨ ❌
   - Tạo access token MỚI ✅
   - Tạo refresh token MỚI ✅
   - Trả về trong response body
4. Frontend:
   - Lấy access token MỚI ✅
   - Lưu vào memory ✅
   - **BỎ QUA refresh token MỚI** ❌
5. Cookie vẫn chứa refresh token CŨ (đã bị revoke) ❌
6. HomePage check → accessToken có → OK ✅
```

### **Luồng F5 Lần 2:**
```
1. App load → bootstrapSession() chạy
2. Gửi refresh token CŨ (đã bị revoke) từ cookie → /auth/refresh
3. Backend:
   - Verify refresh token CŨ ✅ (JWT vẫn valid)
   - Kiểm tra Redis: refresh token CŨ không còn trong Redis ❌
   - Throw UNAUTHENTICATED ❌
4. Frontend:
   - Catch error ❌
   - clearAccessToken() ❌
   - sessionHydrated = true
5. HomePage check → accessToken = null → Redirect /auth ❌
```

## 🐛 ROOT CAUSE

**Vấn đề chính:** 
1. Backend revoke refresh token cũ khi refresh
2. Backend tạo refresh token mới nhưng **KHÔNG SET COOKIE MỚI**
3. Frontend **KHÔNG LẤY refresh token mới** từ response để set cookie
4. Cookie vẫn chứa refresh token cũ (đã bị revoke)
5. Lần refresh tiếp theo → refresh token cũ không còn trong Redis → Fail

## ✅ GIẢI PHÁP ĐỀ XUẤT

### **Giải pháp 1: Backend Set Cookie Mới Khi Refresh (Khuyến nghị)**

**Sửa AuthController.java:**
```java
@PostMapping("/refresh")
public ResponseEntity<ApiResponse<AuthenticationResponse>> refresh(
        @CookieValue("refresh_token") String refreshToken) throws Exception {
    RefreshRequest request = new RefreshRequest();
    request.setRefreshToken(refreshToken);
    AuthenticationResponse newToken = authService.refreshToken(request);
    
    // ✅ SET COOKIE MỚI với refresh token mới
    boolean isHttps = false; // dev
    ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", newToken.getRefreshToken())
            .httpOnly(true)
            .secure(isHttps)
            .sameSite(isHttps ? "None" : "Lax")
            .path("/")
            .maxAge(Duration.ofSeconds(REFRESH_DURATION))
            .build();
    
    return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
            .body(ApiResponse.<AuthenticationResponse>builder()
                    .message("Token refreshed successfully!")
                    .result(newToken)
                    .build());
}
```

### **Giải pháp 2: Frontend Set Cookie Mới (Nếu không sửa backend)**

**Sửa bootstrapSession():**
```javascript
export const bootstrapSession = () => async (dispatch) => {
  try {
    const res = await fetch(`${BASE_API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    
    const result = await parseApiResponse(res);
    setAccessToken(result.accessToken);
    
    // ✅ SET COOKIE MỚI với refresh token mới
    if (result.refreshToken) {
      document.cookie = `refresh_token=${result.refreshToken}; path=/; max-age=${7200}; SameSite=Lax`;
    }
    
    await dispatch(currentUser());
  } catch (error) {
    // ...
  }
};
```

**Nhược điểm:** Không thể set httpOnly cookie từ JavaScript (security)

### **Giải pháp 3: Không Revoke Refresh Token Cũ (Không khuyến nghị)**

**Sửa AuthService.java:**
```java
// KHÔNG revoke refresh token cũ
// redisTokenService.revokeRefreshToken(jti);  // ❌ Comment out
```

**Nhược điểm:** Security risk - refresh token có thể bị reuse

## 📊 KẾT LUẬN

**Root Cause:** 
- Backend revoke refresh token cũ nhưng không set cookie mới
- Frontend không lấy refresh token mới từ response
- Cookie vẫn chứa refresh token cũ (đã bị revoke)

**Giải pháp tốt nhất:** 
- ✅ Backend nên set cookie mới khi refresh (Giải pháp 1)
- ✅ Đảm bảo refresh token rotation hoạt động đúng

**Priority:** 
- 🔴 CRITICAL: Sửa backend để set cookie mới khi refresh
