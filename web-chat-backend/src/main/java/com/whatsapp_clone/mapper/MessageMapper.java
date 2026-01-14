package com.whatsapp_clone.mapper;

import com.whatsapp_clone.dto.Attachment;
import com.whatsapp_clone.dto.response.MessageResponse;
import com.whatsapp_clone.model.Message;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface MessageMapper {

    @Mapping(target = "timeStamp", source = "timestamp")
    @Mapping(target = "attachments", expression = "java(message.getAttachments() == null ? java.util.List.of() : message.getAttachments())")
    @Mapping(target = "metadata", expression = "java(message.getMetadata() == null ? java.util.Map.of() : message.getMetadata())")
    MessageResponse toMessageResponse(Message message);
}
