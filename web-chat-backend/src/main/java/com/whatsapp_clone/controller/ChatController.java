package com.whatsapp_clone.controller;

import com.whatsapp_clone.dto.ApiResponse;
import com.whatsapp_clone.dto.request.CreateChatRequest;
import com.whatsapp_clone.dto.request.GroupChatRequest;
import com.whatsapp_clone.dto.request.UpdateGroupRequest;
import com.whatsapp_clone.dto.response.ChatResponse;
import com.whatsapp_clone.model.Chat;
import com.whatsapp_clone.model.User;
import com.whatsapp_clone.service.ChatService;
import com.whatsapp_clone.service.UserService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chats")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatController {

    ChatService chatService;
    UserService userService;

    // 🔹 Create a private chat between current user and another user
    @PostMapping("/private")
    public ApiResponse<Chat> createPrivateChat(@RequestBody CreateChatRequest request) {
        User reqUser = userService.getCurrentUserEntity();
        Chat chat = chatService.createChat(reqUser, request.getUserId());

        return ApiResponse.<Chat>builder()
                .message("Private chat created successfully!")
                .result(chat)
                .build();
    }

    // 🔹 Create a group chat
    @PostMapping("/group")
    public ApiResponse<Chat> createGroupChat(@RequestBody GroupChatRequest groupChatRequest) {
        User reqUser = userService.getCurrentUserEntity();
        Chat group = chatService.createGroup(reqUser, groupChatRequest);

        return ApiResponse.<Chat>builder()
                .message("Group chat created successfully!")
                .result(group)
                .build();
    }

    // 🔹 Get chat by ID
    @GetMapping("/{chatId}")
    public ApiResponse<Chat> getChatById(@PathVariable String chatId) {
        Chat chat = chatService.findChatById(chatId);

        return ApiResponse.<Chat>builder()
                .message("Chat information retrieved successfully!")
                .result(chat)
                .build();
    }

    // 🔹 Get all chats of the current user
    @GetMapping("/my-chats")
    public ApiResponse<List<ChatResponse>> getAllMyChats(
            @RequestParam(required = false) String keyword) {
        User reqUser = userService.getCurrentUserEntity();
        List<ChatResponse> chats = chatService.getMyChats(reqUser, keyword);

        return ApiResponse.<List<ChatResponse>>builder()
                .message("Your chat list retrieved successfully!")
                .result(chats)
                .build();
    }

    // 🔹 Add a user to a group (admin only)
    @PostMapping("/{chatId}/add-user/{userId}")
    public ApiResponse<Chat> addUserToGroup(
            @PathVariable String chatId,
            @PathVariable String userId
    ) {
        User currentUser = userService.getCurrentUserEntity();
        Chat chat = chatService.addUserToGroup(chatId, userId, currentUser);

        return ApiResponse.<Chat>builder()
                .message("User added to group successfully!")
                .result(chat)
                .build();
    }

    // 🔹 Remove a user from a group
    @DeleteMapping("/{chatId}/remove-user/{userId}")
    public ApiResponse<Chat> removeUserFromGroup(
            @PathVariable String chatId,
            @PathVariable String userId
    ) {
        User currentUser = userService.getCurrentUserEntity();
        Chat chat = chatService.removeFromGroup(chatId, userId, currentUser);

        return ApiResponse.<Chat>builder()
                .message("User removed from group successfully!")
                .result(chat)
                .build();
    }

    // 🔹 Delete a chat
    @DeleteMapping("/{chatId}")
    public ApiResponse<?> deleteChat(@PathVariable String chatId) {
        User currentUser = userService.getCurrentUserEntity();
        chatService.deleteChat(chatId, currentUser);

        return ApiResponse.<String>builder()
                .message("Chat deleted successfully!")
                .build();
    }

    // 🔹 Rename a group
    @PutMapping("/{chatId}/update")
    public ApiResponse<Chat> updateGroup(
            @PathVariable String chatId,
            @RequestBody UpdateGroupRequest request
    ) {
        User currentUser = userService.getCurrentUserEntity();
        Chat chat = chatService.updateGroup(chatId, request, currentUser);

        return ApiResponse.<Chat>builder()
                .message("Group updated successfully!")
                .result(chat)
                .build();
    }

}