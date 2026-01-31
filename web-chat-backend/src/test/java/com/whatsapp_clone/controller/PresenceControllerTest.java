package com.whatsapp_clone.controller;

import com.whatsapp_clone.dto.PresenceEvent;
import com.whatsapp_clone.exception.AppException;
import com.whatsapp_clone.exception.ErrorCode;
import com.whatsapp_clone.model.User;
import com.whatsapp_clone.service.PresenceService;
import com.whatsapp_clone.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PresenceController.class)
@AutoConfigureMockMvc(addFilters = false)
@TestPropertySource(properties = {
        "jwt.refreshable-duration=7200",
        "app.cookie.secure=false"
})
class PresenceControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    PresenceService presenceService;

    @MockBean
    UserService userService;

    User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id("u1")
                .fullName("Alice")
                .email("alice@example.com")
                .build();
    }

    @Test
    void getAllOnline_success() throws Exception {
        when(presenceService.getAllOnline()).thenReturn(Map.of("u1", 123L));

        mockMvc.perform(get("/presence/online"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.u1").value(123L));
    }

    @Test
    void getPresence_success() throws Exception {
        when(presenceService.isOnline("u1")).thenReturn(true);
        when(presenceService.getLastSeen("u1")).thenReturn(456L);
        when(userService.getUserById("u1")).thenReturn(user);

        mockMvc.perform(get("/presence/u1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.userId").value("u1"))
                .andExpect(jsonPath("$.result.displayName").value("Alice"))
                .andExpect(jsonPath("$.result.online").value(true))
                .andExpect(jsonPath("$.result.lastSeen").value(456L));
    }

    @Test
    void getPresence_userNotFound_shouldReturnNotFound() throws Exception {
        when(presenceService.isOnline(anyString())).thenReturn(false);
        when(presenceService.getLastSeen(anyString())).thenReturn(null);
        when(userService.getUserById("u404")).thenThrow(new AppException(ErrorCode.USER_NOT_EXISTED));

        mockMvc.perform(get("/presence/u404"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(ErrorCode.USER_NOT_EXISTED.getCode()))
                .andExpect(jsonPath("$.message").value(ErrorCode.USER_NOT_EXISTED.getMessage()));
    }
}
