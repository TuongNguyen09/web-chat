package com.whatsapp_clone.controller;

import com.whatsapp_clone.dto.ApiResponse;
import com.whatsapp_clone.dto.PageResponse;
import com.whatsapp_clone.dto.request.SendMessageRequest;
import com.whatsapp_clone.dto.response.MessageResponse;
import com.whatsapp_clone.model.User;
import com.whatsapp_clone.service.MessageService;
import com.whatsapp_clone.service.UserService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MessageController {

    MessageService messageService;
    UserService userService;

    // 🔹 Gửi tin nhắn
    @PostMapping("/send")
    public ApiResponse<MessageResponse> sendMessage(@RequestBody SendMessageRequest request) {
        User sender = userService.getCurrentUserEntity();
        request.setSenderId(sender.getId()); // đảm bảo lấy từ auth context

        MessageResponse message = messageService.sendMessage(request);

        return ApiResponse.<MessageResponse>builder()
                .message("Message sent successfully")
                .result(message)
                .build();
    }

    @GetMapping("/chat/{chatId}")
    public ApiResponse<PageResponse<MessageResponse>> getMessagesFromChat(
            @PathVariable String chatId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        User currentUser = userService.getCurrentUserEntity();
        return ApiResponse.<PageResponse<MessageResponse>>builder()
                .message("Messages fetched successfully")
                .result(messageService.getMessagesFromChat(chatId, currentUser, page, size))
                .build();
    }

    // 🔹 Lấy tin nhắn theo ID
    @GetMapping("/{messageId}")
    public ApiResponse<MessageResponse> getMessageById(@PathVariable String messageId) {
        MessageResponse message = messageService.findMessageById(messageId);

        return ApiResponse.<MessageResponse>builder()
                .message("Message fetched successfully")
                .result(message)
                .build();
    }

    // 🔹 Xóa tin nhắn
    @DeleteMapping("/{messageId}")
    public ApiResponse<Void> deleteMessage(@PathVariable String messageId) {
        User currentUser = userService.getCurrentUserEntity();
        messageService.deleteMessage(messageId, currentUser);

        return ApiResponse.<Void>builder()
                .message("Message deleted successfully")
                .build();
    }
}