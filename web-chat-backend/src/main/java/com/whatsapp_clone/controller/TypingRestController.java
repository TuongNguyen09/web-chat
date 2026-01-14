package com.whatsapp_clone.controller;

import com.whatsapp_clone.dto.ApiResponse;
import com.whatsapp_clone.dto.TypingEvent;
import com.whatsapp_clone.model.User;
import com.whatsapp_clone.service.TypingIndicatorService;
import com.whatsapp_clone.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/typing")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TypingRestController {

    TypingIndicatorService typingIndicatorService;
    UserService userService;

    @GetMapping("/{chatId}")
    public ApiResponse<List<TypingEvent>> getActiveTypers(@PathVariable String chatId) {
        User current = userService.getCurrentUserEntity();
        List<TypingEvent> result = typingIndicatorService.getActiveTypers(chatId, current);
        return ApiResponse.<List<TypingEvent>>builder()
                .result(result)
                .build();
    }
}