package com.whatsapp_clone.websocket.listener;

import com.whatsapp_clone.model.User;
import com.whatsapp_clone.service.PresenceService;
import com.whatsapp_clone.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
@RequiredArgsConstructor
@Slf4j
public class PresenceEventListener {

    private final UserService userService;
    private final PresenceService presenceService;

    @EventListener
    public void handleConnectEvent(SessionConnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String email = accessor.getUser() != null ? accessor.getUser().getName() : null;

        if (email == null) return;

        User user = userService.getUserByEmail(email);
        presenceService.markOnline(user);
        log.info("User {} online", email);
    }

    @EventListener
    public void handleDisconnectEvent(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String email = accessor.getUser() != null ? accessor.getUser().getName() : null;
        if (email == null) return;

        User user = userService.getUserByEmail(email);
        presenceService.markOffline(user);
        log.info("User {} offline", email);
    }
}
