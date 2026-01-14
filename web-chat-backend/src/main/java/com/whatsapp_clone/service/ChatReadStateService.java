package com.whatsapp_clone.service;

import com.whatsapp_clone.model.ChatReadState;
import com.whatsapp_clone.repository.ChatReadStateRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatReadStateService {

    ChatReadStateRepository repository;
    UnreadCountService unreadCountService;

    public void markChatAsRead(String chatId, String userId, String lastMessageId) {
        ChatReadState state = repository.findByChatIdAndUserId(chatId, userId)
                .map(existing -> {
                    existing.setLastReadMessageId(lastMessageId);
                    existing.setUpdatedAt(Instant.now());
                    return existing;
                })
                .orElse(ChatReadState.builder()
                        .chatId(chatId)
                        .userId(userId)
                        .lastReadMessageId(lastMessageId)
                        .updatedAt(Instant.now())
                        .build());

        repository.save(state);
        unreadCountService.resetUnread(userId, chatId);
    }
}