package com.whatsapp_clone.model;

import com.whatsapp_clone.constant.MessageType;
import com.whatsapp_clone.dto.Attachment;
import com.whatsapp_clone.dto.LinkPreview;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Document(collection = "messages")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Message {

    @Id
    String id;

    @Field("chat_id")
    String chatId;

    User sender;

    String content;

    @Field("type")
    @Builder.Default
    MessageType type = MessageType.TEXT;

    @Field("attachments")
    @Builder.Default
    List<Attachment> attachments = new ArrayList<>();

    @Field("link_preview")
    LinkPreview linkPreview;

    @Field("metadata")
    @Builder.Default
    Map<String, Object> metadata = new HashMap<>();

    @Field("time_stamp")
    Instant timestamp;
}