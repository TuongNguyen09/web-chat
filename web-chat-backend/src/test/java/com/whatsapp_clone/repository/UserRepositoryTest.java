package com.whatsapp_clone.repository;

import com.whatsapp_clone.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataMongoTest
@Testcontainers
class UserRepositoryTest {

    @Container
    static final MongoDBContainer mongo = new MongoDBContainer("mongo:7.0.14");

    @DynamicPropertySource
    static void mongoProps(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri", mongo::getReplicaSetUrl);
    }

    @Autowired
    UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        userRepository.saveAll(List.of(
                User.builder().fullName("John Doe").email("john@example.com").phone("0901").password("pass").build(),
                User.builder().fullName("Jane Smith").email("jane@Example.com").phone("0902").password("pass").build(),
                User.builder().fullName("Alice Johnson").email("alice@sample.com").phone("0903").password("pass").build()
        ));
    }

    @Test
    void findByFullNameContainingIgnoreCase_shouldReturnMatchingUsers() {
        List<User> results = userRepository.findByFullNameContainingIgnoreCase("john");

        assertThat(results)
                .extracting(User::getFullName)
                .containsExactlyInAnyOrder("John Doe", "Alice Johnson");
    }

    @Test
    void findByEmailContainingIgnoreCase_shouldReturnMatchingUsers() {
        List<User> results = userRepository.findByEmailContainingIgnoreCase("example.com");

        assertThat(results)
                .extracting(User::getEmail)
                .containsExactlyInAnyOrder("john@example.com", "jane@Example.com");
    }

    @Test
    void findByEmail_shouldReturnOptional() {
        Optional<User> user = userRepository.findByEmail("john@example.com");

        assertThat(user).isPresent();
        assertThat(user.get().getFullName()).isEqualTo("John Doe");
    }

    @Test
    void searchUser_shouldMatchFullNameEmailOrPhone() {
        List<User> byFullName = userRepository.searchUser("Jane Smith");
        List<User> byEmail = userRepository.searchUser("alice@sample.com");
        List<User> byPhone = userRepository.searchUser("0901");

        assertThat(byFullName).extracting(User::getEmail).containsExactly("jane@Example.com");
        assertThat(byEmail).extracting(User::getFullName).containsExactly("Alice Johnson");
        assertThat(byPhone).extracting(User::getFullName).containsExactly("John Doe");
    }

    @Test
    void searchUser_noMatch_shouldReturnEmptyList() {
        List<User> results = userRepository.searchUser("nope");

        assertThat(results).isEmpty();
    }
}
