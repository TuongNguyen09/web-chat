package com.whatsapp_clone.controller;

import com.whatsapp_clone.dto.ApiResponse;
import com.whatsapp_clone.dto.PresenceEvent;
import com.whatsapp_clone.model.User;
import com.whatsapp_clone.service.PresenceService;
import com.whatsapp_clone.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/presence")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PresenceController {

    UserService userService;
    PresenceService presenceService;

    @GetMapping("/online")
    public ApiResponse<Map<String, Long>> getAllOnline() {
        return ApiResponse.<Map<String, Long>>builder()
                .result(presenceService.getAllOnline())
                .build();
    }

    @GetMapping("/{userId}")
    public ApiResponse<PresenceEvent> getPresence(@PathVariable String userId) {
        boolean online = presenceService.isOnline(userId);
        Long lastSeen = presenceService.getLastSeen(userId);

        User user = userService.getUserById(userId);

        PresenceEvent event = PresenceEvent.builder()
                .userId(userId)
                .displayName(user.getFullName())
                .online(online)
                .lastSeen(lastSeen != null ? lastSeen : System.currentTimeMillis())
                .build();

        return ApiResponse.<PresenceEvent>builder().result(event).build();
    }
}