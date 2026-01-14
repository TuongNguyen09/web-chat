//package com.whatsapp_clone.configuration;
//
//import com.whatsapp_clone.model.Chat;
//import com.whatsapp_clone.model.ChatIndex;
//import com.whatsapp_clone.repository.ChatRepository;
//import com.whatsapp_clone.repository.ChatSearchRepository;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.boot.ApplicationRunner;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//
//import java.util.List;
//
//@Slf4j
//@Configuration
//@RequiredArgsConstructor
//public class SyncChatIndexRunner {
//    private final ChatRepository chatRepository;
//    private final ChatSearchRepository chatSearchRepository;
//
//    @Bean
//    public ApplicationRunner syncChatIndexAtStartup() {
//        return args -> {
//            log.info("🚀 Syncing Chats from MySQL → Elasticsearch...");
//
//            // IMPORTANT: dùng fetch join để tránh lazy error
//            List<Chat> chats = chatRepository.findAllWithUsers();
//
//            if (chats.isEmpty()) {
//                log.warn("⚠ No chats found in MySQL.");
//                return;
//            }
//
//            for (Chat chat : chats) {
//                ChatIndex index = ChatIndex.builder()
//                        .id(chat.getId())
//                        .chatName(chat.getChatName())
//                        .isGroup(chat.isGroup())
//                        .userIds(chat.getUsers().stream()
//                                .map(u -> u.getId())
//                                .toList())
//                        .build();
//
//                chatSearchRepository.save(index);
//            }
//
//            log.info("✅ Sync completed: {} chats indexed!", chats.size());
//        };
//    }
//
//}