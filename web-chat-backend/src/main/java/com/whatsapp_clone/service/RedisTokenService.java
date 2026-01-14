package com.whatsapp_clone.service;

import lombok.RequiredArgsConstructor;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisTokenService {

    private final RedisTemplate<String, Object> redisTemplate;

    @NonFinal
    @Value("${jwt.refreshable-duration}")
    long REFRESH_DURATION;

    /* ACCESS TOKEN BLACKLIST */
    public void blacklistAccessToken(String jti, long ttlSeconds) {
        redisTemplate.opsForValue()
                .set("bl:access:" + jti, "1", ttlSeconds, TimeUnit.SECONDS);
    }

    public boolean isAccessTokenBlacklisted(String jti) {
        return Boolean.TRUE.equals(
                redisTemplate.hasKey("bl:access:" + jti)
        );
    }

    /* REFRESH TOKEN */
    public void storeRefreshToken(String userId, String jti, long ttlSeconds) {
        log.info("Store refresh token jti={}, userId={}", jti, userId);
        redisTemplate.opsForValue().set("rt:" + jti, userId, ttlSeconds, TimeUnit.SECONDS);
        redisTemplate.opsForValue().set("user:rt:" + userId, jti, ttlSeconds, TimeUnit.SECONDS);
    }

    public String getUserIdByRefreshToken(String jti) {
        Object value = redisTemplate.opsForValue().get("rt:" + jti);
        return value == null ? null : value.toString();
    }

    public void revokeRefreshToken(String jti) {
        redisTemplate.delete("rt:" + jti);
    }

    public void revokeUserRefreshToken(String userId) {
        Object jtiObj = redisTemplate.opsForValue().get("user:rt:" + userId);
        if (jtiObj != null) {
            redisTemplate.delete("rt:" + jtiObj.toString());
        }
        redisTemplate.delete("user:rt:" + userId);
    }
}