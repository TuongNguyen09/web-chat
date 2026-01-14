package com.whatsapp_clone.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresenceEvent {
    private String userId;
    private String displayName;
    private boolean online;
    private long lastSeen; // epoch milli
}