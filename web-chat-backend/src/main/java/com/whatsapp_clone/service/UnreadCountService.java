package com.whatsapp_clone.service;

import com.whatsapp_clone.dto.response.UnreadNotification;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UnreadCountService {

    static final String KEY_PREFIX = "unread:";

    RedisTemplate<String, Object> redisTemplate;
    SimpMessagingTemplate simpMessagingTemplate;

    public void increaseUnreadForChat(String chatId, String senderId, Set<String> memberIds) {
        HashOperations<String, String, Long> hashOps = redisTemplate.opsForHash();
        memberIds.stream()
                .filter(memberId -> !memberId.equals(senderId))
                .forEach(memberId -> {
                    String key = redisKey(memberId);
                    Long updated = hashOps.increment(key, chatId, 1L);
                    pushRealtime(memberId, chatId, updated == null ? 1L : updated);
                });
    }

    public void resetUnread(String userId, String chatId) {
        HashOperations<String, String, Long> hashOps = redisTemplate.opsForHash();
        hashOps.delete(redisKey(userId), chatId);
        pushRealtime(userId, chatId, 0L);
    }

    public Map<String, Long> getAllUnread(String userId) {
        HashOperations<String, String, Long> hashOps = redisTemplate.opsForHash();
        return hashOps.entries(redisKey(userId));
    }

    private String redisKey(String userId) {
        return KEY_PREFIX + userId;
    }

    private void pushRealtime(String userId, String chatId, long count) {
        UnreadNotification payload = UnreadNotification.builder()
                .chatId(chatId)
                .unreadCount(count)
                .build();
        simpMessagingTemplate.convertAndSendToUser(userId, "/queue/unread", payload);
    }
}