package com.whatsapp_clone.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.whatsapp_clone.dto.request.AuthenticationRequest;
import com.whatsapp_clone.dto.request.IntrospectRequest;
import com.whatsapp_clone.dto.request.LogoutRequest;
import com.whatsapp_clone.dto.request.RegisterRequest;
import com.whatsapp_clone.dto.response.AuthenticationResponse;
import com.whatsapp_clone.dto.response.IntrospectResponse;
import com.whatsapp_clone.dto.response.UserResponse;
import com.whatsapp_clone.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import jakarta.servlet.http.Cookie;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@TestPropertySource(properties = {
        "jwt.refreshable-duration=7200",
        "app.cookie.secure=false"
})
class AuthControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockBean
    AuthService authService;

    AuthenticationRequest request;
    AuthenticationResponse response;

        RegisterRequest registerRequest;
        UserResponse userResponse;

        IntrospectRequest introspectRequest;
        IntrospectResponse introspectResponse;

        LogoutRequest logoutRequest;

    @BeforeEach
    void setUp() {
        request = AuthenticationRequest.builder()
                .email("user@example.com")
                .password("password")
                .build();

        response = AuthenticationResponse.builder()
                .accessToken("access-token")
                .refreshToken("refresh-token")
                .authenticated(true)
                .build();

        registerRequest = RegisterRequest.builder()
                .fullName("John Doe")
                .email("john@example.com")
                .phone("0912345678")
                .password("password")
                .confirmPassword("password")
                .build();

        userResponse = UserResponse.builder()
                .id("user-id")
                .fullName("John Doe")
                .email("john@example.com")
                .phone("0912345678")
                .profilePicture(null)
                .build();

        introspectRequest = IntrospectRequest.builder()
                .token("access-token")
                .build();

        introspectResponse = IntrospectResponse.builder()
                .valid(true)
                .build();

        logoutRequest = new LogoutRequest("access-token");
    }

    @Test
    void login_success_shouldReturnTokensAndCookie() throws Exception {
        when(authService.authenticationResponse(ArgumentMatchers.any()))
                .thenReturn(response);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.accessToken").value("access-token"))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("refresh_token=refresh-token")))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("HttpOnly")))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("SameSite=Lax")))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("Path=/")));
    }

    @Test
    void login_invalidCredentials_shouldReturnUnauthorized() throws Exception {
        when(authService.authenticationResponse(ArgumentMatchers.any()))
                .thenThrow(new com.whatsapp_clone.exception.AppException(com.whatsapp_clone.exception.ErrorCode.UNAUTHENTICATED));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(com.whatsapp_clone.exception.ErrorCode.UNAUTHENTICATED.getCode()))
                .andExpect(jsonPath("$.message").value(com.whatsapp_clone.exception.ErrorCode.UNAUTHENTICATED.getMessage()));
    }

    @Test
    void register_success_shouldReturnUser() throws Exception {
        when(authService.register(ArgumentMatchers.any()))
                .thenReturn(userResponse);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.email").value("john@example.com"))
                .andExpect(jsonPath("$.result.fullName").value("John Doe"));
    }

    @Test
    void register_passwordNotMatch_shouldReturnBadRequest() throws Exception {
        when(authService.register(ArgumentMatchers.any()))
                .thenThrow(new com.whatsapp_clone.exception.AppException(com.whatsapp_clone.exception.ErrorCode.PASSWORD_NOT_MATCH));

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(com.whatsapp_clone.exception.ErrorCode.PASSWORD_NOT_MATCH.getCode()))
                .andExpect(jsonPath("$.message").value(com.whatsapp_clone.exception.ErrorCode.PASSWORD_NOT_MATCH.getMessage()));
    }

    @Test
    void register_invalidPayload_shouldReturnBadRequest() throws Exception {
        RegisterRequest invalid = RegisterRequest.builder()
                .fullName("")
                .email("not-an-email")
                .phone("123")
                .password("")
                .confirmPassword("")
                .build();

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    void introspect_success_shouldReturnValidTrue() throws Exception {
        when(authService.introspect(ArgumentMatchers.any()))
                .thenReturn(introspectResponse);

        mockMvc.perform(post("/auth/introspect")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(introspectRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.valid").value(true));
    }

    @Test
    void introspect_invalidToken_shouldReturnUnauthorized() throws Exception {
        when(authService.introspect(ArgumentMatchers.any()))
                .thenThrow(new com.whatsapp_clone.exception.AppException(com.whatsapp_clone.exception.ErrorCode.UNAUTHENTICATED));

        mockMvc.perform(post("/auth/introspect")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(introspectRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(com.whatsapp_clone.exception.ErrorCode.UNAUTHENTICATED.getCode()))
                .andExpect(jsonPath("$.message").value(com.whatsapp_clone.exception.ErrorCode.UNAUTHENTICATED.getMessage()));
    }

    @Test
    void logout_success_shouldReturnOk() throws Exception {
        mockMvc.perform(post("/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(logoutRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.message").value("Logout successful!"));
    }

    @Test
    void logout_invalidToken_shouldReturnUnauthorized() throws Exception {
        org.mockito.Mockito.doThrow(new com.whatsapp_clone.exception.AppException(com.whatsapp_clone.exception.ErrorCode.UNAUTHENTICATED))
                .when(authService).logout(ArgumentMatchers.any());

        mockMvc.perform(post("/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(logoutRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(com.whatsapp_clone.exception.ErrorCode.UNAUTHENTICATED.getCode()))
                .andExpect(jsonPath("$.message").value(com.whatsapp_clone.exception.ErrorCode.UNAUTHENTICATED.getMessage()));
    }

    @Test
    void refresh_success_shouldReturnNewTokensAndCookie() throws Exception {
        AuthenticationResponse refreshed = AuthenticationResponse.builder()
                .accessToken("new-access")
                .refreshToken("new-refresh")
                .authenticated(true)
                .build();

        when(authService.refreshToken(ArgumentMatchers.any()))
                .thenReturn(refreshed);

        mockMvc.perform(post("/auth/refresh")
                        .cookie(new Cookie("refresh_token", "old-refresh")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.accessToken").value("new-access"))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("refresh_token=new-refresh")))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("HttpOnly")))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("SameSite=Lax")));
    }

    @Test
    void refresh_invalidToken_shouldReturnUnauthorized() throws Exception {
        when(authService.refreshToken(ArgumentMatchers.any()))
                .thenThrow(new com.whatsapp_clone.exception.AppException(com.whatsapp_clone.exception.ErrorCode.UNAUTHENTICATED));

        mockMvc.perform(post("/auth/refresh")
                        .cookie(new Cookie("refresh_token", "bad")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(com.whatsapp_clone.exception.ErrorCode.UNAUTHENTICATED.getCode()))
                .andExpect(jsonPath("$.message").value(com.whatsapp_clone.exception.ErrorCode.UNAUTHENTICATED.getMessage()));
    }
}
