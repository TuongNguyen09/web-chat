package com.whatsapp_clone.controller;

import com.whatsapp_clone.dto.TypingEvent;
import com.whatsapp_clone.exception.AppException;
import com.whatsapp_clone.exception.ErrorCode;
import com.whatsapp_clone.model.User;
import com.whatsapp_clone.service.TypingIndicatorService;
import com.whatsapp_clone.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TypingWsController {

    TypingIndicatorService typingIndicatorService;
    UserService userService;

    @MessageMapping("/typing/start")
    public void startTyping(@Payload TypingEvent event, Principal principal) {
        User current = resolveCurrentUser(principal);
        typingIndicatorService.startTyping(event.getChatId(), current);
    }

    @MessageMapping("/typing/stop")
    public void stopTyping(@Payload TypingEvent event, Principal principal) {
        User current = resolveCurrentUser(principal);
        typingIndicatorService.stopTyping(event.getChatId(), current);
    }

    private User resolveCurrentUser(Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return userService.getUserByEmail(principal.getName());
    }
}