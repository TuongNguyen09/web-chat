package com.whatsapp_clone.service;

import com.whatsapp_clone.dto.TypingEvent;
import com.whatsapp_clone.exception.AppException;
import com.whatsapp_clone.exception.ErrorCode;
import com.whatsapp_clone.model.Chat;
import com.whatsapp_clone.model.User;
import com.whatsapp_clone.repository.ChatRepository;
import com.whatsapp_clone.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TypingIndicatorService {

    static Duration TYPING_TTL = Duration.ofSeconds(5);

    RedisTemplate<String, Object> redisTemplate;
    ChatRepository chatRepository;
    UserRepository userRepository;
    SimpMessagingTemplate messagingTemplate;


    public void startTyping(String chatId, User user) {
        Chat chat = ensureMember(chatId, user.getId());
        String key = redisKey(chatId, user.getId());
        redisTemplate.opsForValue().set(key, true, TYPING_TTL);
        broadcast(chatId, user, true);
    }

    public void stopTyping(String chatId, User user) {
        ensureMember(chatId, user.getId());
        redisTemplate.delete(redisKey(chatId, user.getId()));
        broadcast(chatId, user, false);
    }

    public List<TypingEvent> getActiveTypers(String chatId, User requester) {
        Chat chat = ensureMember(chatId, requester.getId());
        Set<String> keys = Optional.ofNullable(
                redisTemplate.keys(redisKeyPattern(chatId))
        ).orElse(Collections.emptySet());

        List<User> members = userRepository.findAllById(chat.getMemberIds());

        Map<String, User> memberMap = members.stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));


        return keys.stream()
                .map(this::extractUserId)
                .filter(memberMap::containsKey)
                .map(userId -> TypingEvent.builder()
                        .chatId(chatId)
                        .userId(userId)
                        .displayName(memberMap.get(userId).getFullName())
                        .typing(true)
                        .build())
                .toList();
    }

    private Chat ensureMember(String chatId, String userId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new AppException(ErrorCode.CHAT_NOT_EXISTED));

        boolean isMember = chat.getMemberIds().contains(userId);

        if (!isMember) {
            throw new AppException(ErrorCode.USER_NOT_PARTICIPANT);
        }
        return chat;
    }

    private void broadcast(String chatId, User user, boolean typing) {
        TypingEvent payload = TypingEvent.builder()
                .chatId(chatId)
                .userId(user.getId())
                .displayName(user.getFullName())
                .typing(typing)
                .build();

        messagingTemplate.convertAndSend("/group/" + chatId + "/typing", payload);
    }

    private String redisKey(String chatId, String userId) {
        return "typing:%s:%s".formatted(chatId, userId);
    }

    private String redisKeyPattern(String chatId) {
        return "typing:%s:*".formatted(chatId);
    }

    private String extractUserId(String key) {
        return key.substring(key.lastIndexOf(':') + 1);
    }
}