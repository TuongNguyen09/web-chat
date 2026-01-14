package com.whatsapp_clone.repository;

import com.whatsapp_clone.model.Message;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {

    List<Message> findByChatIdOrderByTimestampAsc(String chatId);

    List<Message> findTop20ByChatIdOrderByTimestampDesc(String chatId);

    Page<Message> findByChatId(String chatId, Pageable pageable);

    Optional<Message> findTopByChatIdOrderByTimestampDesc(String chatId);

    @Query(value = "{ 'chat_id': { $in: ?0 }, 'content': { $regex: ?1, $options: 'i' } }",
            fields = "{ 'chat_id': 1, 'content': 1, 'timestamp': 1, 'sender': 1 }")
    List<Message> searchByChatIdsAndContentRegex(Collection<String> chatIds, String regex);
}