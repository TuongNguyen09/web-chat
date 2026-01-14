package com.whatsapp_clone.dto.response;

import com.whatsapp_clone.constant.MessageType;
import com.whatsapp_clone.dto.Attachment;
import com.whatsapp_clone.dto.LinkPreview;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MessageResponse {
    String id;
    MessageType type;
    String content;
    LocalDateTime timeStamp;
    String chatId;
    UserResponse sender;
    List<Attachment> attachments;
    LinkPreview linkPreview;
    Map<String, Object> metadata;

}