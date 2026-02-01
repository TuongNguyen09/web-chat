package com.whatsapp_clone.service;

import com.whatsapp_clone.dto.request.GroupChatRequest;
import com.whatsapp_clone.dto.request.UpdateGroupRequest;
import com.whatsapp_clone.dto.response.ChatResponse;
import com.whatsapp_clone.exception.AppException;
import com.whatsapp_clone.exception.ErrorCode;
import com.whatsapp_clone.mapper.ChatMapper;
import com.whatsapp_clone.model.Chat;
import com.whatsapp_clone.model.Message;
import com.whatsapp_clone.model.User;
import com.whatsapp_clone.repository.ChatRepository;
import com.whatsapp_clone.repository.MessageRepository;
import com.whatsapp_clone.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatService {

    ChatRepository chatRepository;
    UserRepository userRepository;
    MessageRepository messageRepository;
    ChatMapper chatMapper;

    /* ===================== CREATE CHAT ===================== */

    // 🔹 Chat 1-1: nếu tồn tại thì trả về, KHÔNG tạo mới
    public Chat createChat(User reqUser, String userId2) {
        User user2 = fetchUser(userId2);

        Optional<Chat> existed =
                chatRepository.findPrivateChatBetween(reqUser.getId(), user2.getId());

        if (existed.isPresent()) {
            return existed.get();
        }

        return chatRepository.save(
                Chat.builder()
                        .isGroup(false)
                        .createdBy(reqUser) // ⚠️ tạm giữ, vì model bạn CHƯA đổi field này
                        .memberIds(Set.of(reqUser.getId(), user2.getId()))
                        .adminIds(Set.of())
                        .build()
        );

    }

    // 🔹 Tạo group chat (BẮT BUỘC >= 3 members)
    public Chat createGroup(User creator, GroupChatRequest req) {

        if (req.getUserId() == null || req.getUserId().size() < 2) {
            throw new AppException(ErrorCode.GROUP_MUST_HAVE_MEMBERS);
        }

        // Resolve users từ list ID
        Set<User> members = resolveUsers(req.getUserId());

        // Loại creator nếu client gửi trùng
        members.removeIf(u -> u.getId().equals(creator.getId()));

        // Sau khi loại trùng, vẫn phải >= 2 người + creator = 3
        if (members.size() < 2) {
            throw new AppException(ErrorCode.GROUP_MUST_HAVE_MEMBERS);
        }

        Set<String> memberIds = new HashSet<>(req.getUserId());
        memberIds.add(creator.getId());

        return chatRepository.save(
                Chat.builder()
                        .chatName(req.getChat_name())
                        .chatImage(req.getChat_image())
                        .isGroup(true)
                        .createdBy(creator)
                        .memberIds(memberIds)
                        .adminIds(Set.of(creator.getId()))
                        .build()
        );

    }


    /* ===================== QUERY ===================== */

    public Chat findChatById(String chatId) {
        return chatRepository.findById(chatId)
                .orElseThrow(() -> new AppException(ErrorCode.CHAT_NOT_EXISTED));
    }

    // 🔹 Tất cả chat user tham gia (EMBED USER → members.id)
    public List<Chat> findAllChatByUser(User user) {
        return chatRepository.findAll()
                .stream()
                .filter(chat -> chat.getMemberIds().contains(user.getId()))
                .toList();
    }

    /* ===================== LIST + SEARCH ===================== */

    public List<ChatResponse> getMyChats(User user, String keyword) {
        List<Chat> chats = findAllChatByUser(user);

        Map<String, Message> previewByChatId = buildPreviewMap(keyword, chats);
        Map<String, List<Message>> recentMessages = loadRecentMessages(chats);

        // Build map of chat -> latest message for sorting
        Map<String, ChatResponse> responseMap = chats.stream()
                .filter(chat -> filterChat(chat, keyword, previewByChatId))
                .collect(Collectors.toMap(
                        Chat::getId,
                        chat -> toResponse(chat, previewByChatId, recentMessages)
                ));

        // Sort by latest message timestamp (descending)
        return responseMap.values().stream()
                .sorted((c1, c2) -> {
                    Instant t1 = c1.getLastMessage() != null && c1.getLastMessage().getTimeStamp() != null 
                            ? c1.getLastMessage().getTimeStamp() 
                            : Instant.MIN;
                    Instant t2 = c2.getLastMessage() != null && c2.getLastMessage().getTimeStamp() != null 
                            ? c2.getLastMessage().getTimeStamp() 
                            : Instant.MIN;
                    return t2.compareTo(t1);
                })
                .toList();
    }

    private ChatResponse toResponse(Chat chat,
                                    Map<String, Message> previewByChatId,
                                    Map<String, List<Message>> recentMessages) {

        List<Message> recent = recentMessages.getOrDefault(chat.getId(), Collections.emptyList());
        Message last = recent.isEmpty()
                ? messageRepository.findTopByChatIdOrderByTimestampDesc(chat.getId()).orElse(null)
                : recent.get(recent.size() - 1);

        // If last message has null timestamp (old messages), set it to chat's createdAt as fallback
        if (last != null && last.getTimestamp() == null && chat.getCreatedAt() != null) {
            last.setTimestamp(chat.getCreatedAt());
        }

        ChatResponse response = chatMapper.toChatResponse(
                chat,
                last,
                recent,
                userRepository
        );
        
        // FIX: Manually set timestamp since MapStruct mapper not working
        if (response.getLastMessage() != null && last != null && last.getTimestamp() != null) {
            response.getLastMessage().setTimeStamp(last.getTimestamp());
        }

        return response;
    }

    private Map<String, List<Message>> loadRecentMessages(List<Chat> chats) {
        return chats.stream()
                .collect(Collectors.toMap(
                        Chat::getId,
                        chat -> {
                            List<Message> desc = messageRepository
                                    .findTop20ByChatIdOrderByTimestampDesc(chat.getId());
                            Collections.reverse(desc); // trả về theo thời gian tăng dần
                            return desc;
                        }
                ));
    }

    private Map<String, Message> buildPreviewMap(String keyword, List<Chat> chats) {
        if (!StringUtils.hasText(keyword)) {
            return Collections.emptyMap();
        }
        String normalized = keyword.trim().toLowerCase(Locale.ROOT);
        Pattern pattern = Pattern.compile(Pattern.quote(normalized), Pattern.CASE_INSENSITIVE);

        Set<String> chatIds = chats.stream().map(Chat::getId).collect(Collectors.toSet());

        return messageRepository.searchByChatIdsAndContentRegex(chatIds, pattern.pattern())
                .stream()
                .collect(Collectors.toMap(
                        Message::getChatId,
                        msg -> msg,
                        (oldMsg, newMsg) -> newMsg.getTimestamp().isAfter(oldMsg.getTimestamp()) ? newMsg : oldMsg
                ));
    }

    private boolean filterChat(Chat chat,
                               String keyword,
                               Map<String, Message> previewByChatId) {
        if (!StringUtils.hasText(keyword)) return true;

        String normalized = keyword.trim().toLowerCase(Locale.ROOT);

        return matchesChatName(chat, normalized)
                || matchesParticipant(chat, normalized)
                || previewByChatId.containsKey(chat.getId());
    }

    /* ===================== GROUP ACTIONS ===================== */

    public Chat addUserToGroup(String chatId, String newUserId, User currentUser) {
        Chat chat = validateGroupAndPrivileges(chatId, currentUser);
        User newUser = fetchUser(newUserId);

        if (chat.getMemberIds().contains(newUserId)) {
            throw new AppException(ErrorCode.USER_ALREADY_IN_GROUP);
        }

        chat.getMemberIds().add(newUserId);
        return chatRepository.save(chat);
    }

    public Chat updateGroup(String chatId, UpdateGroupRequest req, User currentUser) {
        Chat chat = validateGroupAndPrivileges(chatId, currentUser);

        boolean changed = false;

        if (StringUtils.hasText(req.getNewName())
                && !req.getNewName().trim().equals(chat.getChatName())) {
            chat.setChatName(req.getNewName().trim());
            changed = true;
        }

        if (StringUtils.hasText(req.getChatImage())
                && !req.getChatImage().equals(chat.getChatImage())) {
            chat.setChatImage(req.getChatImage());
            changed = true;
        }

        if (!changed) {
            return null;
        }

        return chatRepository.save(chat);
    }

    public Chat removeFromGroup(String chatId, String targetUserId, User currentUser) {
        Chat chat = findChatById(chatId);

        if (!chat.isGroup()) {
            throw new AppException(ErrorCode.NOT_A_GROUP_CHAT);
        }

        boolean isSelf = currentUser.getId().equals(targetUserId);
        boolean isAdmin = isAdmin(chat, currentUser.getId()) || isCreator(chat, currentUser.getId());

        if (!isSelf && !isAdmin) {
            throw new AppException(ErrorCode.NOT_GROUP_ADMIN);
        }

        chat.getMemberIds().remove(targetUserId);
        chat.getAdminIds().remove(targetUserId);

        return chatRepository.save(chat);
    }

    public void deleteChat(String chatId, User currentUser) {
        Chat chat = findChatById(chatId);

        if (chat.isGroup() && !isCreator(chat, currentUser.getId())) {
            throw new AppException(ErrorCode.NOT_GROUP_ADMIN);
        }

        if (!chat.isGroup() && !chat.getMemberIds().contains(currentUser.getId())) {
            throw new AppException(ErrorCode.USER_NOT_IN_CHAT);
        }

        chatRepository.delete(chat);
    }

    /* ===================== HELPERS ===================== */

    private boolean matchesChatName(Chat chat, String keyword) {
        return chat.getChatName() != null
                && chat.getChatName().toLowerCase(Locale.ROOT).contains(keyword);
    }

    private boolean matchesParticipant(Chat chat, String keyword) {
        List<User> users = userRepository.findAllById(chat.getMemberIds());

        return users.stream()
                .map(User::getFullName)
                .filter(Objects::nonNull)
                .map(String::toLowerCase)
                .anyMatch(name -> name.contains(keyword));
    }

    private Chat validateGroupAndPrivileges(String chatId, User currentUser) {
        Chat chat = findChatById(chatId);
        if (!chat.isGroup()) {
            throw new AppException(ErrorCode.NOT_A_GROUP_CHAT);
        }
        if (!isAdmin(chat, currentUser.getId()) && !isCreator(chat, currentUser.getId())) {
            throw new AppException(ErrorCode.NOT_GROUP_ADMIN);
        }
        return chat;
    }

    private boolean isCreator(Chat chat, String userId) {
        return chat.getCreatedBy() != null
                && chat.getCreatedBy().getId().equals(userId);
    }

    private boolean isAdmin(Chat chat, String userId) {
        return containsUserId(chat.getAdminIds(), userId);
    }

    private boolean containsUserId(Set<String> ids, String userId) {
        return ids.contains(userId);
    }


    private Set<User> resolveUsers(List<String> ids) {
        if (ids == null || ids.isEmpty()) return new HashSet<>();
        List<User> users = userRepository.findAllById(ids);
        if (users.size() != ids.size()) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }
        return new HashSet<>(users);
    }

    private User fetchUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }
}
