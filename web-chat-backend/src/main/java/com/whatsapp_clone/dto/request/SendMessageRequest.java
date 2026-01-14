package com.whatsapp_clone.dto.request;

import com.whatsapp_clone.constant.MessageType;
import com.whatsapp_clone.dto.Attachment;
import com.whatsapp_clone.dto.LinkPreview;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SendMessageRequest {
    String chatId;
    String senderId;
    MessageType type;
    String content;
    List<Attachment> attachments;
    LinkPreview linkPreview;
    Map<String, Object> metadata;
}
