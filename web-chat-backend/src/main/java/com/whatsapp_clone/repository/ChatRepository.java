package com.whatsapp_clone.repository;

import com.whatsapp_clone.model.Chat;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRepository extends MongoRepository<Chat, String> {
    // Tìm tất cả chat mà user tham gia
    @Query("{ 'user_ids': ?0 }")
    List<Chat> findAllByUserId(String userId);

    // Tìm tất cả group chat mà user tham gia
    @Query("{ 'user_ids': ?0, 'is_group': true }")
    List<Chat> findGroupChatsByUserId(String userId);

    // Chat 1-1 giữa 2 user (EMBED USER)
    @Query("""
    {
      'is_group': false,
      'members.id': { $all: [?0, ?1] },
      'members': { $size: 2 }
    }
    """)
    Optional<Chat> findPrivateChatBetween(String user1Id, String user2Id);

    // Tìm chat theo ID
    @Query("{ '_id': ?0 }")
    Optional<Chat> findByIdWithUsers(String chatId);
}