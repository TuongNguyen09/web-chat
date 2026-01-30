package com.whatsapp_clone.controller;

import com.whatsapp_clone.dto.PresenceEvent;
import com.whatsapp_clone.dto.TypingEvent;
import com.whatsapp_clone.dto.request.SendMessageRequest;
import com.whatsapp_clone.dto.response.MessageResponse;
import com.whatsapp_clone.service.MessageService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Controller
public class RealtimeChat {
    SimpMessagingTemplate simpMessagingTemplate;
    MessageService messageService;

    @MessageMapping("/message")
    public void receiveMessage(@Payload SendMessageRequest request) {
        try {
            MessageResponse savedMessage = messageService.sendMessage(request);
            simpMessagingTemplate.convertAndSend("/group/" + savedMessage.getChatId(), savedMessage);
        } catch (Exception e) {
            System.err.println("❌ Error in receiveMessage: " + e.getMessage());
            e.printStackTrace();
        }
    }
}