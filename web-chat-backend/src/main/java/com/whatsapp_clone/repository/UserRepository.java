package com.whatsapp_clone.repository;

import com.whatsapp_clone.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository

public interface UserRepository extends MongoRepository<User, String> {
    @Query("{ 'full_name': { $regex: ?0, $options: 'i' } }")
    List<User> findByFullNameContainingIgnoreCase(String fullName);

    @Query("{ 'email': { $regex: ?0, $options: 'i' } }")
    List<User> findByEmailContainingIgnoreCase(String email);

    // ✅ BẮT BUỘC: Optional
    Optional<User> findByEmail(String email);

    @Query("{ $or: [ { 'full_name': { $regex: ?0, $options: 'i' } }, { 'email': { $regex: ?0, $options: 'i' } } ] }")
    List<User> searchUser(String keyword);

}