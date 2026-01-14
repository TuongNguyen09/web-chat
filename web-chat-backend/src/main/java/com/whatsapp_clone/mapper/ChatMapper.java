package com.whatsapp_clone.mapper;

import com.whatsapp_clone.dto.response.ChatResponse;
import com.whatsapp_clone.dto.response.UserResponse;
import com.whatsapp_clone.model.Chat;
import com.whatsapp_clone.model.Message;
import com.whatsapp_clone.model.User;
import com.whatsapp_clone.repository.UserRepository;
import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface ChatMapper {

    @Mapping(target = "id", source = "chat.id")
    @Mapping(target = "chatName", source = "chat.chatName")
    @Mapping(target = "chatImage", source = "chat.chatImage")
    @Mapping(target = "group", source = "chat.group")
    @Mapping(target = "createdAt", source = "chat.createdAt")
    @Mapping(
            target = "createdBy",
            expression = "java(mapUser(chat.getCreatedBy()))"
    )
    @Mapping(
            target = "members",
            expression = "java(mapUsers(chat.getMemberIds(), userRepository))"
    )
    @Mapping(
            target = "admins",
            expression = "java(mapUsers(chat.getAdminIds(), userRepository))"
    )
    @Mapping(target = "messages", source = "recentMessages")
    @Mapping(target = "lastMessage", source = "lastMessage")
    ChatResponse toChatResponse(
            Chat chat,
            Message lastMessage,
            List<Message> recentMessages,
            @Context UserRepository userRepository
    );

    /* ===================== HELPERS ===================== */

    default UserResponse mapUser(User user) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .profilePicture(user.getProfilePicture())
                .build();
    }

    default Set<UserResponse> mapUsers(
            Set<String> userIds,
            UserRepository userRepository
    ) {
        if (userIds == null || userIds.isEmpty()) {
            return Set.of();
        }

        return userRepository.findAllById(userIds)
                .stream()
                .map(this::mapUser)
                .collect(Collectors.toSet());
    }
}
