package com.whatsapp_clone.repository;

import com.whatsapp_clone.model.InvalidToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InvalidTokenRepository extends MongoRepository<InvalidToken, String> {
}