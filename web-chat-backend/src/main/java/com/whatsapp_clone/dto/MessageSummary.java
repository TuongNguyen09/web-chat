package com.whatsapp_clone.dto;

import com.whatsapp_clone.dto.response.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageSummary {
    String id;
    String content;
    Instant timestamp;
    UserResponse sender;
}