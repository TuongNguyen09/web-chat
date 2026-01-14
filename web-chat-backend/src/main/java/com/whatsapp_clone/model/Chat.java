package com.whatsapp_clone.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.*;

@Document(collection = "chats")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Chat {

    @Id
    @Builder.Default
    String id = new ObjectId().toString();

    @Field("chat_name")
    String chatName;

    @Field("chat_image")
    String chatImage;

    @Field("is_group")
    boolean isGroup;

    @Field("created_by")
    User createdBy;

    // ✅ chỉ lưu ID members
    @Builder.Default
    @Field("member_ids")
    Set<String> memberIds = new HashSet<>();

    // ✅ chỉ lưu ID admins
    @Builder.Default
    @Field("admin_ids")
    Set<String> adminIds = new HashSet<>();

//    @Builder.Default
//    @Field("messages")
//    List<Message> messages = new ArrayList<>();

    @Field("created_at")
    @Builder.Default
    Instant createdAt = Instant.now();
}