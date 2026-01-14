package com.whatsapp_clone.repository;

import com.whatsapp_clone.model.ChatReadState;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ChatReadStateRepository extends MongoRepository<ChatReadState, String> {
    Optional<ChatReadState> findByChatIdAndUserId(String chatId, String userId);
}