package com.whatsapp_clone.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.whatsapp_clone.constant.MessageType;
import com.whatsapp_clone.dto.PageResponse;
import com.whatsapp_clone.dto.request.SendMessageRequest;
import com.whatsapp_clone.dto.response.MessageResponse;
import com.whatsapp_clone.exception.AppException;
import com.whatsapp_clone.exception.ErrorCode;
import com.whatsapp_clone.model.User;
import com.whatsapp_clone.service.MessageService;
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

import java.time.LocalDateTime;
import java.util.Collections;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = MessageController.class)
@AutoConfigureMockMvc(addFilters = false)
@TestPropertySource(properties = {
        "jwt.refreshable-duration=7200",
        "app.cookie.secure=false"
})
class MessageControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

        @MockBean
        MessageService messageService;

        @MockBean
        UserService userService;

    User currentUser;
    MessageResponse messageResponse;
    PageResponse<MessageResponse> pageResponse;
    SendMessageRequest sendRequest;

    @BeforeEach
    void setUp() {
        currentUser = User.builder()
                .id("u1")
                .fullName("Sender")
                .email("sender@example.com")
                .build();

        messageResponse = MessageResponse.builder()
                .id("m1")
                .chatId("c1")
                .content("Hello")
                .type(MessageType.TEXT)
                .timeStamp(LocalDateTime.now())
                .build();

        pageResponse = PageResponse.<MessageResponse>builder()
                .currentPage(1)
                .totalPages(1)
                .pageSize(20)
                .totalElements(1)
                .data(Collections.singletonList(messageResponse))
                .build();

        sendRequest = SendMessageRequest.builder()
                .chatId("c1")
                .content("Hello")
                .type(MessageType.TEXT)
                .build();
    }

    @Test
    void sendMessage_success() throws Exception {
        when(userService.getCurrentUserEntity()).thenReturn(currentUser);
        when(messageService.sendMessage(any())).thenReturn(messageResponse);

        mockMvc.perform(post("/messages/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sendRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value("m1"))
                .andExpect(jsonPath("$.result.content").value("Hello"));
    }

    @Test
    void sendMessage_userNotParticipant_shouldReturnForbidden() throws Exception {
        when(userService.getCurrentUserEntity()).thenReturn(currentUser);
        when(messageService.sendMessage(any()))
                .thenThrow(new AppException(ErrorCode.USER_NOT_PARTICIPANT));

        mockMvc.perform(post("/messages/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sendRequest)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(ErrorCode.USER_NOT_PARTICIPANT.getCode()))
                .andExpect(jsonPath("$.message").value(ErrorCode.USER_NOT_PARTICIPANT.getMessage()));
    }

    @Test
    void getMessagesFromChat_success() throws Exception {
        when(userService.getCurrentUserEntity()).thenReturn(currentUser);
        when(messageService.getMessagesFromChat(anyString(), any(), anyInt(), anyInt()))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/messages/chat/c1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.data", hasSize(1)))
                .andExpect(jsonPath("$.result.data[0].id").value("m1"));
    }

    @Test
    void getMessagesFromChat_notParticipant_shouldReturnForbidden() throws Exception {
        when(userService.getCurrentUserEntity()).thenReturn(currentUser);
        when(messageService.getMessagesFromChat(anyString(), any(), anyInt(), anyInt()))
                .thenThrow(new AppException(ErrorCode.USER_NOT_PARTICIPANT));

        mockMvc.perform(get("/messages/chat/c1"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(ErrorCode.USER_NOT_PARTICIPANT.getCode()))
                .andExpect(jsonPath("$.message").value(ErrorCode.USER_NOT_PARTICIPANT.getMessage()));
    }

    @Test
    void getMessageById_success() throws Exception {
        when(messageService.findMessageById("m1")).thenReturn(messageResponse);

        mockMvc.perform(get("/messages/m1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value("m1"));
    }

    @Test
    void getMessageById_notFound_shouldReturnNotFound() throws Exception {
        when(messageService.findMessageById("m404"))
                .thenThrow(new AppException(ErrorCode.MESSAGE_NOT_EXISTED));

        mockMvc.perform(get("/messages/m404"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(ErrorCode.MESSAGE_NOT_EXISTED.getCode()))
                .andExpect(jsonPath("$.message").value(ErrorCode.MESSAGE_NOT_EXISTED.getMessage()));
    }

    @Test
    void deleteMessage_success() throws Exception {
        when(userService.getCurrentUserEntity()).thenReturn(currentUser);
        doNothing().when(messageService).deleteMessage("m1", currentUser);

        mockMvc.perform(delete("/messages/m1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.message").value("Message deleted successfully"));
    }

    @Test
    void deleteMessage_notAllowed_shouldReturnForbidden() throws Exception {
        when(userService.getCurrentUserEntity()).thenReturn(currentUser);
        org.mockito.Mockito.doThrow(new AppException(ErrorCode.MESSAGE_DELETE_DENIED))
                .when(messageService).deleteMessage("m1", currentUser);

        mockMvc.perform(delete("/messages/m1"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(ErrorCode.MESSAGE_DELETE_DENIED.getCode()))
                .andExpect(jsonPath("$.message").value(ErrorCode.MESSAGE_DELETE_DENIED.getMessage()));
    }
}
