package com.whatsapp_clone.service;

import com.whatsapp_clone.dto.PresenceEvent;
import com.whatsapp_clone.model.User;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PresenceService {

    static String KEY = "presence:online";
    RedisTemplate<String, Object> redisTemplate;
    SimpMessagingTemplate messagingTemplate;

    public void markOnline(User user) {
        HashOperations<String, String, Object> hashOps = redisTemplate.opsForHash();
        hashOps.put(KEY, user.getId(), Instant.now().toEpochMilli());
        broadcast(user, true);
    }

    public void markOffline(User user) {
        HashOperations<String, String, Object> hashOps = redisTemplate.opsForHash();
        hashOps.delete(KEY, user.getId());
        broadcast(user, false);
    }

    public boolean isOnline(String userId) {
        return redisTemplate.opsForHash().hasKey(KEY, userId);
    }

    public Long getLastSeen(String userId) {
        Object value = redisTemplate.opsForHash().get(KEY, userId);
        return value instanceof Number ? ((Number) value).longValue() : null;
    }

    public Map<String, Long> getAllOnline() {
        return redisTemplate.<String, Long>opsForHash().entries(KEY);
    }

    private void broadcast(User user, boolean online) {
        PresenceEvent event = PresenceEvent.builder()
                .userId(user.getId())
                .displayName(user.getFullName())
                .online(online)
                .lastSeen(Instant.now().toEpochMilli())
                .build();

        messagingTemplate.convertAndSend("/group/presence", event);
        messagingTemplate.convertAndSendToUser(user.getId(), "/queue/presence", event);
    }
}