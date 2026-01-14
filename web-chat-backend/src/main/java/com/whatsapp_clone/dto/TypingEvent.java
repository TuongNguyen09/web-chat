package com.whatsapp_clone.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypingEvent {
    private String chatId;
    private String userId;
    private String displayName;
    private boolean typing;
}