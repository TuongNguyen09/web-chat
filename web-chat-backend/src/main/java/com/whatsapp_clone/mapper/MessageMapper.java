package com.whatsapp_clone.mapper;

import com.whatsapp_clone.dto.Attachment;
import com.whatsapp_clone.dto.response.MessageResponse;
import com.whatsapp_clone.dto.response.UserResponse;
import com.whatsapp_clone.model.Message;
import org.mapstruct.Mapper;

import java.util.List;
import java.util.Map;

@Mapper(componentModel = "spring")
public interface MessageMapper {

    default MessageResponse toMessageResponse(Message message) {
        if (message == null) return null;
        
        UserResponse sender = null;
        if (message.getSender() != null) {
            sender = UserResponse.builder()
                    .id(message.getSender().getId())
                    .fullName(message.getSender().getFullName())
                    .email(message.getSender().getEmail())
                    .phone(message.getSender().getPhone())
                    .profilePicture(message.getSender().getProfilePicture())
                    .build();
        }
        
        return MessageResponse.builder()
                .id(message.getId())
                .type(message.getType())
                .content(message.getContent())
                .timeStamp(message.getTimestamp())
                .chatId(message.getChatId())
                .sender(sender)
                .attachments(message.getAttachments() == null ? List.of() : message.getAttachments())
                .linkPreview(message.getLinkPreview())
                .metadata(message.getMetadata() == null ? Map.of() : message.getMetadata())
                .build();
    }
}

