package com.whatsapp_clone.service;

import com.whatsapp_clone.dto.request.AuthenticationRequest;
import com.whatsapp_clone.dto.response.AuthenticationResponse;
import com.whatsapp_clone.exception.AppException;
import com.whatsapp_clone.exception.ErrorCode;
import com.whatsapp_clone.model.User;
import com.whatsapp_clone.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    UserRepository userRepository;

    @Mock
    RedisTokenService redisTokenService;

    @Mock
    PasswordEncoder passwordEncoder;

    @InjectMocks
    AuthService authService;

    User user;
    AuthenticationRequest request;

    @BeforeEach
    void setUp() {
        // Set signer key and durations for token generation
        String signerKey = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"; // 64 chars
        ReflectionTestUtils.setField(authService, "SIGNER_KEY", signerKey);
        ReflectionTestUtils.setField(authService, "VALID_DURATION", 3600L);
        ReflectionTestUtils.setField(authService, "REFRESH_DURATION", 7200L);

        user = User.builder()
                .id("user-id")
                .email("user@example.com")
                .password("hashed")
                .fullName("User")
                .phone("0912345678")
                .build();

        request = AuthenticationRequest.builder()
                .email("user@example.com")
                .password("password")
                .build();
    }

    @Test
    void authenticationResponse_success_returnsTokensAndStoresRefresh() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        doNothing().when(redisTokenService).storeRefreshToken(anyString(), anyString(), anyLong());

        AuthenticationResponse resp = authService.authenticationResponse(request);

        assertThat(resp.isAuthenticated()).isTrue();
        assertThat(resp.getAccessToken()).isNotBlank();
        assertThat(resp.getRefreshToken()).isNotBlank();
        verify(redisTokenService).storeRefreshToken(anyString(), anyString(), anyLong());
    }

    @Test
    void authenticationResponse_userNotFound_throwsUnauthenticated() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> authService.authenticationResponse(request));
        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.UNAUTHENTICATED);
    }

    @Test
    void authenticationResponse_passwordMismatch_throwsUnauthenticated() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        AppException ex = assertThrows(AppException.class, () -> authService.authenticationResponse(request));
        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.UNAUTHENTICATED);
    }
}
