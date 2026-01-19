package com.whatsapp_clone.controller;

import com.whatsapp_clone.dto.ApiResponse;
import com.whatsapp_clone.dto.request.*;
import com.whatsapp_clone.dto.response.AuthenticationResponse;
import com.whatsapp_clone.dto.response.IntrospectResponse;
import com.whatsapp_clone.dto.response.UserResponse;
import com.whatsapp_clone.service.AuthService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthController {

    AuthService authService;

    @NonFinal
    @Value("${jwt.refreshable-duration}")
    long REFRESH_DURATION;

    // 🔹 Login -> Return JWT token
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> login(@RequestBody @Valid AuthenticationRequest request) {
        AuthenticationResponse response = authService.authenticationResponse(request);

        boolean isHttps = false; // dev
        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", response.getRefreshToken())
                .httpOnly(true)
                .secure(isHttps)          // false ở dev
                .sameSite(isHttps ? "None" : "Lax")
                .path("/")
                .maxAge(Duration.ofSeconds(REFRESH_DURATION))
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(ApiResponse.<AuthenticationResponse>builder()
                        .message("Login successful!")
                        .result(response) // nhớ ẩn refresh token khỏi body nếu không cần
                        .build());
    }

    // 🔹 Register new user
    @PostMapping("/register")
    public ApiResponse<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse user = authService.register(request);
        return ApiResponse.<UserResponse>builder()
                .message("User registered successfully!")
                .result(user)
                .build();
    }

    // 🔹 Check if token is valid
    @PostMapping("/introspect")
    public ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest request) throws Exception {
        IntrospectResponse result = authService.introspect(request);
        return ApiResponse.<IntrospectResponse>builder()
                .message("Token introspection completed successfully!")
                .result(result)
                .build();
    }

    // 🔹 Logout -> Invalidate token
    @PostMapping("/logout")
    public ApiResponse<String> logout(@RequestBody LogoutRequest request) throws Exception {
        authService.logout(request);
        return ApiResponse.<String>builder()
                .message("Logout successful!")
//                .result("Token has been invalidated.")
                .build();
    }

    // 🔹 Refresh token
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> refresh(
            @CookieValue("refresh_token") String refreshToken) throws Exception {
        RefreshRequest request = new RefreshRequest();
        request.setRefreshToken(refreshToken);
        AuthenticationResponse newToken = authService.refreshToken(request);

        // Set refresh token mới vào HTTP cookie (giống như login)
        boolean isHttps = false; // dev
        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", newToken.getRefreshToken())
                .httpOnly(true)
                .secure(isHttps)          // false ở dev
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
}
