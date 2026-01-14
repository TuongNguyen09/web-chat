package com.whatsapp_clone.controller;

import com.whatsapp_clone.dto.ApiResponse;
import com.whatsapp_clone.dto.request.MarkReadRequest;
import com.whatsapp_clone.model.User;
import com.whatsapp_clone.service.ChatReadStateService;
import com.whatsapp_clone.service.UnreadCountService;
import com.whatsapp_clone.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/unread")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UnreadController {

    UserService userService;
    UnreadCountService unreadCountService;
    ChatReadStateService chatReadStateService;

    @GetMapping
    public ApiResponse<Map<String, Long>> getUnreadCounts() {
        User current = userService.getCurrentUserEntity();
        return ApiResponse.<Map<String, Long>>builder()
                .result(unreadCountService.getAllUnread(current.getId()))
                .build();
    }

    @PostMapping("/{chatId}/read")
    public ApiResponse<Void> markChatAsRead(
            @PathVariable String chatId,
            @RequestBody MarkReadRequest request
    ) {
        User current = userService.getCurrentUserEntity();
        chatReadStateService.markChatAsRead(chatId, current.getId(), request.getLastMessageId());
        return ApiResponse.<Void>builder().message("Chat marked as read").build();
    }
}