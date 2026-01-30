package com.whatsapp_clone.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.whatsapp_clone.dto.request.CreateChatRequest;
import com.whatsapp_clone.dto.request.GroupChatRequest;
import com.whatsapp_clone.dto.request.UpdateGroupRequest;
import com.whatsapp_clone.dto.response.ChatResponse;
import com.whatsapp_clone.exception.AppException;
import com.whatsapp_clone.exception.ErrorCode;
import com.whatsapp_clone.model.Chat;
import com.whatsapp_clone.model.User;
import com.whatsapp_clone.service.ChatService;
import com.whatsapp_clone.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Set;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ChatController.class)
@AutoConfigureMockMvc(addFilters = false)
@TestPropertySource(properties = {
        "jwt.refreshable-duration=7200",
        "app.cookie.secure=false"
})
class ChatControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

        @MockBean
        ChatService chatService;

        @MockBean
        UserService userService;

    User currentUser;
    Chat chat;
    ChatResponse chatResponse;

    @BeforeEach
    void setUp() {
        currentUser = User.builder()
                .id("current")
                .fullName("Current User")
                .email("current@example.com")
                .build();

        chat = Chat.builder()
                .id("chat-1")
                .chatName("Chat 1")
                .isGroup(false)
                .createdBy(currentUser)
                .memberIds(Set.of("current", "user-2"))
                .adminIds(Set.of("current"))
                .build();

        chatResponse = ChatResponse.builder()
                .id("chat-1")
                .chatName("Chat 1")
                .group(false)
                .createdAt(Instant.now())
                .build();
    }

    @Test
    void createPrivateChat_success() throws Exception {
        when(userService.getCurrentUserEntity()).thenReturn(currentUser);
        when(chatService.createChat(ArgumentMatchers.any(), ArgumentMatchers.anyString())).thenReturn(chat);

        CreateChatRequest request = CreateChatRequest.builder().userId("user-2").build();

        mockMvc.perform(post("/chats/private")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value("chat-1"))
                .andExpect(jsonPath("$.result.chatName").value("Chat 1"));
    }

    @Test
    void createGroupChat_success() throws Exception {
        when(userService.getCurrentUserEntity()).thenReturn(currentUser);
        when(chatService.createGroup(ArgumentMatchers.any(), ArgumentMatchers.any())).thenReturn(chat);

        GroupChatRequest request = GroupChatRequest.builder()
                .chat_name("Group A")
                .chat_image("img.png")
                .userId(List.of("u1", "u2"))
                .build();

        mockMvc.perform(post("/chats/group")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.chatName").value("Chat 1"))
                .andExpect(jsonPath("$.code").value(1000));
    }

    @Test
    void getChatById_success() throws Exception {
        when(chatService.findChatById("chat-1")).thenReturn(chat);

        mockMvc.perform(get("/chats/chat-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.id").value("chat-1"))
                .andExpect(jsonPath("$.code").value(1000));
    }

    @Test
    void getChatById_notFound() throws Exception {
        when(chatService.findChatById("chat-404"))
                .thenThrow(new AppException(ErrorCode.CHAT_NOT_EXISTED));

        mockMvc.perform(get("/chats/chat-404"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(ErrorCode.CHAT_NOT_EXISTED.getCode()))
                .andExpect(jsonPath("$.message").value(ErrorCode.CHAT_NOT_EXISTED.getMessage()));
    }

    @Test
    void getMyChats_success() throws Exception {
        when(userService.getCurrentUserEntity()).thenReturn(currentUser);
        when(chatService.getMyChats(ArgumentMatchers.any(), ArgumentMatchers.any()))
                .thenReturn(List.of(chatResponse));

        mockMvc.perform(get("/chats/my-chats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result", hasSize(1)))
                .andExpect(jsonPath("$.result[0].id", is("chat-1")));
    }

    @Test
    void addUserToGroup_success() throws Exception {
        when(userService.getCurrentUserEntity()).thenReturn(currentUser);
        when(chatService.addUserToGroup("chat-1", "user-2", currentUser)).thenReturn(chat);

        mockMvc.perform(post("/chats/chat-1/add-user/user-2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.message").value("User added to group successfully!"));
    }

    @Test
    void addUserToGroup_notAdmin() throws Exception {
        when(userService.getCurrentUserEntity()).thenReturn(currentUser);
        when(chatService.addUserToGroup("chat-1", "user-2", currentUser))
                .thenThrow(new AppException(ErrorCode.NOT_GROUP_ADMIN));

        mockMvc.perform(post("/chats/chat-1/add-user/user-2"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(ErrorCode.NOT_GROUP_ADMIN.getCode()))
                .andExpect(jsonPath("$.message").value(ErrorCode.NOT_GROUP_ADMIN.getMessage()));
    }

    @Test
    void removeUserFromGroup_success() throws Exception {
        when(userService.getCurrentUserEntity()).thenReturn(currentUser);
        when(chatService.removeFromGroup("chat-1", "user-2", currentUser)).thenReturn(chat);

        mockMvc.perform(delete("/chats/chat-1/remove-user/user-2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.message").value("User removed from group successfully!"));
    }

    @Test
    void removeUserFromGroup_notAdmin() throws Exception {
        when(userService.getCurrentUserEntity()).thenReturn(currentUser);
        when(chatService.removeFromGroup("chat-1", "user-2", currentUser))
                .thenThrow(new AppException(ErrorCode.NOT_GROUP_ADMIN));

        mockMvc.perform(delete("/chats/chat-1/remove-user/user-2"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(ErrorCode.NOT_GROUP_ADMIN.getCode()))
                .andExpect(jsonPath("$.message").value(ErrorCode.NOT_GROUP_ADMIN.getMessage()));
    }

    @Test
    void deleteChat_success() throws Exception {
        when(userService.getCurrentUserEntity()).thenReturn(currentUser);

        mockMvc.perform(delete("/chats/chat-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.message").value("Chat deleted successfully!"));
    }

    @Test
    void deleteChat_notFound() throws Exception {
        when(userService.getCurrentUserEntity()).thenReturn(currentUser);
        org.mockito.Mockito.doThrow(new AppException(ErrorCode.CHAT_NOT_EXISTED))
                .when(chatService).deleteChat("chat-404", currentUser);

        mockMvc.perform(delete("/chats/chat-404"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(ErrorCode.CHAT_NOT_EXISTED.getCode()))
                .andExpect(jsonPath("$.message").value(ErrorCode.CHAT_NOT_EXISTED.getMessage()));
    }

    @Test
    void updateGroup_success() throws Exception {
        when(userService.getCurrentUserEntity()).thenReturn(currentUser);
        when(chatService.updateGroup(ArgumentMatchers.eq("chat-1"), ArgumentMatchers.any(), ArgumentMatchers.eq(currentUser)))
                .thenReturn(chat);

        UpdateGroupRequest req = UpdateGroupRequest.builder().newName("New Name").chatImage("img2.png").build();

        mockMvc.perform(put("/chats/chat-1/update")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.chatName").value("Chat 1"));
    }

    @Test
    void updateGroup_notGroupChat() throws Exception {
        when(userService.getCurrentUserEntity()).thenReturn(currentUser);
        when(chatService.updateGroup(ArgumentMatchers.eq("chat-1"), ArgumentMatchers.any(), ArgumentMatchers.eq(currentUser)))
                .thenThrow(new AppException(ErrorCode.NOT_A_GROUP_CHAT));

        UpdateGroupRequest req = UpdateGroupRequest.builder().newName("New Name").chatImage("img2.png").build();

        mockMvc.perform(put("/chats/chat-1/update")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(ErrorCode.NOT_A_GROUP_CHAT.getCode()))
                .andExpect(jsonPath("$.message").value(ErrorCode.NOT_A_GROUP_CHAT.getMessage()));
    }

}
