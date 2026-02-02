package com.whatsapp_clone.service;

import com.whatsapp_clone.constant.MessageType;
import com.whatsapp_clone.dto.Attachment;
import com.whatsapp_clone.dto.PageResponse;
import com.whatsapp_clone.dto.request.SendMessageRequest;
import com.whatsapp_clone.dto.response.MessageResponse;
import com.whatsapp_clone.exception.AppException;
import com.whatsapp_clone.exception.ErrorCode;
import com.whatsapp_clone.mapper.MessageMapper;
import com.whatsapp_clone.model.Chat;
import com.whatsapp_clone.model.Message;
import com.whatsapp_clone.model.User;
import com.whatsapp_clone.repository.ChatRepository;
import com.whatsapp_clone.repository.MessageRepository;
import com.whatsapp_clone.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MessageService {

    MessageRepository messageRepository;
    ChatRepository chatRepository;
    UserRepository userRepository;
    MessageMapper messageMapper;
    UnreadCountService unreadCountService;
    UserService userService;

    public MessageResponse sendMessage(SendMessageRequest request) {
        Chat chat = chatRepository.findById(request.getChatId())
                .orElseThrow(() -> new AppException(ErrorCode.CHAT_NOT_EXISTED));

        ensureMember(chat, request.getSenderId());

        User sender = userRepository.findById(request.getSenderId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Check if sender is blocked by recipient in 1-1 chat
        if (!chat.isGroup() && chat.getMemberIds().size() == 2) {
            String recipientId = chat.getMemberIds().stream()
                    .filter(id -> !id.equals(sender.getId()))
                    .findFirst()
                    .orElseThrow(() -> new AppException(ErrorCode.CHAT_NOT_EXISTED));
            
            if (userService.isUserBlocked(recipientId, sender.getId())) {
                throw new AppException(ErrorCode.USER_BLOCKED);
            }
        }

        MessageType type = Optional.ofNullable(request.getType()).orElse(MessageType.TEXT);
        validatePayload(type, request);

        List<Attachment> attachments = Optional.ofNullable(request.getAttachments())
                .map(ArrayList::new)
                .orElseGet(ArrayList::new);

        Map<String, Object> metadata = new HashMap<>(
                Optional.ofNullable(request.getMetadata()).orElse(Map.of())
        );

        Message message = Message.builder()
                .chatId(chat.getId())
                .sender(sender)
                .content(request.getContent())
                .type(type)
                .attachments(attachments)
                .linkPreview(request.getLinkPreview())
                .metadata(metadata)
                .timestamp(java.time.Instant.now())
                .build();

        Message saved = messageRepository.save(message);

        unreadCountService.increaseUnreadForChat(
                chat.getId(),
                sender.getId(),
                chat.getMemberIds()
        );

        MessageResponse response = messageMapper.toMessageResponse(saved);
        if (response.getAttachments() == null) {
            response.setAttachments(List.of());
        }
        if (response.getMetadata() == null) {
            response.setMetadata(Map.of());
        }

        return response;
    }

    private void ensureMember(Chat chat, String userId) {
        if (!chat.getMemberIds().contains(userId)) {
            throw new AppException(ErrorCode.USER_NOT_PARTICIPANT);
        }
    }

    private void validatePayload(MessageType type, SendMessageRequest req) {
        List<Attachment> attachments = Optional.ofNullable(req.getAttachments()).orElse(List.of());
        switch (type) {
            case TEXT -> {
                if (!StringUtils.hasText(req.getContent())) {
                    throw new AppException(ErrorCode.MESSAGE_EMPTY);
                }
            }
            case IMAGE, VIDEO, AUDIO, FILE -> {
                if (attachments.isEmpty()) {
                    throw new AppException(ErrorCode.ATTACHMENT_REQUIRED);
                }
            }
            case LINK -> {
                if (req.getLinkPreview() == null || !StringUtils.hasText(req.getLinkPreview().getUrl())) {
                    throw new AppException(ErrorCode.LINK_PREVIEW_REQUIRED);
                }
            }
            case STICKER -> {
                if (attachments.isEmpty() && !StringUtils.hasText(req.getContent())) {
                    throw new AppException(ErrorCode.STICKER_ID_REQUIRED);
                }
            }
            default -> throw new AppException(ErrorCode.MESSAGE_TYPE_UNSUPPORTED);
        }
    }

    public PageResponse<MessageResponse> getMessagesFromChat(
            String chatId,
            User currentUser,
            int page,
            int size) {

        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new AppException(ErrorCode.CHAT_NOT_EXISTED));

        if (!chat.getMemberIds().contains(currentUser.getId())) {
            throw new AppException(ErrorCode.USER_NOT_PARTICIPANT);
        }

        Pageable pageable = PageRequest.of(
                page - 1,
                size,
                Sort.by(Sort.Direction.DESC, "timestamp")
        );

        Page<Message> pageData =
                messageRepository.findByChatId(chatId, pageable);

        List<MessageResponse> chunk = pageData.getContent()
                .stream()
                .map(messageMapper::toMessageResponse)
                .filter(m -> m.getTimeStamp() != null) // optional
                .sorted(Comparator.comparing(MessageResponse::getTimeStamp))
                .toList();

        return PageResponse.<MessageResponse>builder()
                .currentPage(page)
                .pageSize(pageData.getSize())
                .totalPages(pageData.getTotalPages())
                .totalElements(pageData.getTotalElements())
                .data(chunk)
                .build();
    }

    // 🔹 Tìm message theo ID
    public MessageResponse findMessageById(String messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new AppException(ErrorCode.MESSAGE_NOT_EXISTED));

        return messageMapper.toMessageResponse(message);
    }

    public void deleteMessage(String messageId, User currentUser) {

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new AppException(ErrorCode.MESSAGE_NOT_EXISTED));

        Chat chat = chatRepository.findById(message.getChatId())
                .orElseThrow(() -> new AppException(ErrorCode.CHAT_NOT_EXISTED));

        boolean isSender =
                message.getSender().getId().equals(currentUser.getId());

        boolean isAdmin = chat.getAdminIds().contains(currentUser.getId());

        if (!isSender && !isAdmin) {
            throw new AppException(ErrorCode.MESSAGE_DELETE_DENIED);
        }

        messageRepository.delete(message);
    }
}
