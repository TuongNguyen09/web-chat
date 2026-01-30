package com.whatsapp_clone.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.whatsapp_clone.dto.request.MarkReadRequest;
import com.whatsapp_clone.model.User;
import com.whatsapp_clone.service.ChatReadStateService;
import com.whatsapp_clone.service.UnreadCountService;
import com.whatsapp_clone.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = UnreadController.class)
@AutoConfigureMockMvc(addFilters = false)
@TestPropertySource(properties = {
        "jwt.refreshable-duration=7200",
        "app.cookie.secure=false"
})
class UnreadControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    UserService userService;

    @MockBean
    UnreadCountService unreadCountService;

    @MockBean
    ChatReadStateService chatReadStateService;

    @Autowired
    ObjectMapper objectMapper;

    User currentUser;

    @BeforeEach
    void setUp() {
        currentUser = User.builder()
                .id("u1")
                .fullName("Alice")
                .email("alice@example.com")
                .build();
    }

    @Test
    void getUnreadCounts_success() throws Exception {
        when(userService.getCurrentUserEntity()).thenReturn(currentUser);
        when(unreadCountService.getAllUnread("u1")).thenReturn(Map.of("chat-1", 2L));

        mockMvc.perform(get("/unread"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result['chat-1']").value(2));
    }

    @Test
    void markChatAsRead_success() throws Exception {
        when(userService.getCurrentUserEntity()).thenReturn(currentUser);
        doNothing().when(chatReadStateService).markChatAsRead("chat-1", "u1", "m5");

        MarkReadRequest req = new MarkReadRequest();
        req.setLastMessageId("m5");

        mockMvc.perform(post("/unread/chat-1/read")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.message").value("Chat marked as read"));
    }
}
