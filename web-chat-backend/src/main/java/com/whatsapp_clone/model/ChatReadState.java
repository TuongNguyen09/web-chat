package com.whatsapp_clone.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "chat_read_state")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@CompoundIndex(name = "chat_user_idx", def = "{'chatId': 1, 'userId': 1}", unique = true)
public class ChatReadState {

    @Id
    @Builder.Default
    String id = new ObjectId().toString();

    String chatId;
    String userId;
    String lastReadMessageId;
    Instant updatedAt;
}