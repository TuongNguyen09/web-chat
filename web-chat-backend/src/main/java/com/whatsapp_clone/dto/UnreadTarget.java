package com.whatsapp_clone.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UnreadTarget {
    String userId;
    String chatId;
    int unreadCount;
}