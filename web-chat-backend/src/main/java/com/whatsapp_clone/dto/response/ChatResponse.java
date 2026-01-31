package com.whatsapp_clone.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatResponse {
    String id;
    String chatName;
    String chatImage;
    boolean group;
    Instant createdAt;

    UserResponse createdBy;
    Set<UserResponse> members;
    Set<UserResponse> admins;
    Set<MessageResponse> messages;
    MessageResponse lastMessage;
}
