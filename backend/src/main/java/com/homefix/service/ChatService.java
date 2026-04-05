package com.homefix.service;

import com.homefix.dto.*;
import com.homefix.entity.*;
import com.homefix.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatService {
    private static final int MAX_MESSAGE_LENGTH = 4000;
    private static final int MAX_ATTACHMENTS = 5;
    private static final long MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final ConversationMessageRepository messageRepository;
    private final MessageAttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatPresenceService chatPresenceService;

    public ChatService(
            ConversationRepository conversationRepository,
            ConversationParticipantRepository participantRepository,
            ConversationMessageRepository messageRepository,
            MessageAttachmentRepository attachmentRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            SimpMessagingTemplate messagingTemplate,
            ChatPresenceService chatPresenceService) {
        this.conversationRepository = conversationRepository;
        this.participantRepository = participantRepository;
        this.messageRepository = messageRepository;
        this.attachmentRepository = attachmentRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.messagingTemplate = messagingTemplate;
        this.chatPresenceService = chatPresenceService;
    }

    @Transactional(readOnly = true)
    public List<ConversationSummaryDto> getMyConversations() {
        User currentUser = getCurrentUser();
        return conversationRepository.findVisibleConversationsForUser(currentUser).stream()
                .map(conversation -> mapSummary(conversation, currentUser))
                .toList();
    }

    @Transactional
    public ConversationSummaryDto createConversation(CreateConversationRequest request) {
        User currentUser = getCurrentUser();
        String title = request.getTitle() == null ? "" : request.getTitle().trim();
        if (title.isBlank()) {
            throw new RuntimeException("Tên cuộc trò chuyện không được để trống");
        }

        Set<Long> participantIds = new LinkedHashSet<>(request.getParticipantIds());
        participantIds.add(currentUser.getId());
        if (participantIds.size() < 2) {
            throw new RuntimeException("Cần ít nhất 2 người tham gia");
        }

        List<User> participants = userRepository.findAllById(participantIds);
        if (participants.size() != participantIds.size()) {
            throw new RuntimeException("Danh sách người tham gia không hợp lệ");
        }

        Conversation conversation = new Conversation();
        conversation.setTitle(title);
        conversation.setCreatedBy(currentUser);
        conversation.setLastMessageAt(LocalDateTime.now());
        Conversation savedConversation = conversationRepository.save(conversation);

        for (User user : participants) {
            ConversationParticipant participant = new ConversationParticipant();
            participant.setConversation(savedConversation);
            participant.setUser(user);
            participant.setLastReadAt(user.getId().equals(currentUser.getId()) ? LocalDateTime.now() : null);
            participantRepository.save(participant);
            savedConversation.getParticipants().add(participant);
        }

        ConversationSummaryDto summary = mapSummary(conversationRepository.findById(savedConversation.getId()).orElseThrow(), currentUser);
        for (User participant : participants) {
            if (!participant.getId().equals(currentUser.getId())) {
                notificationService.createNotification(
                        participant,
                        "Cuộc trò chuyện mới",
                        currentUser.getFullName() + " đã thêm bạn vào cuộc trò chuyện \"" + title + "\"",
                        "CHAT_CONVERSATION",
                        savedConversation.getId());
                messagingTemplate.convertAndSendToUser(participant.getEmail(), "/queue/chat/conversations", summary);
            }
        }
        return summary;
    }

    @Transactional(readOnly = true)
    public ConversationPageDto getMessages(Long conversationId, int page, int size) {
        User currentUser = getCurrentUser();
        Conversation conversation = requireConversationMember(conversationId, currentUser);
        int safeSize = Math.min(Math.max(size, 1), 50);
        int safePage = Math.max(page, 0);

        Page<ConversationMessage> messagePage = messageRepository.findByConversationAndDeletedFalseOrderByCreatedAtDesc(
                conversation,
                PageRequest.of(safePage, safeSize));

        List<ConversationMessageDto> items = messagePage.getContent().stream()
                .map(this::mapMessage)
                .collect(Collectors.toList());
        Collections.reverse(items);

        ConversationPageDto dto = new ConversationPageDto();
        dto.setItems(items);
        dto.setPage(safePage);
        dto.setSize(safeSize);
        dto.setTotalElements(messagePage.getTotalElements());
        dto.setHasNext(messagePage.hasNext());
        return dto;
    }

    @Transactional(readOnly = true)
    public ConversationPageDto searchMessages(String keyword, int page, int size) {
        User currentUser = getCurrentUser();
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        if (normalizedKeyword.length() < 2) {
            throw new RuntimeException("Từ khóa tìm kiếm phải có ít nhất 2 ký tự");
        }

        int safeSize = Math.min(Math.max(size, 1), 50);
        int safePage = Math.max(page, 0);
        Page<ConversationMessage> messagePage = messageRepository.searchVisibleMessages(
                currentUser.getId(),
                normalizedKeyword,
                PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt")));

        ConversationPageDto dto = new ConversationPageDto();
        dto.setItems(messagePage.getContent().stream().map(this::mapMessage).toList());
        dto.setPage(safePage);
        dto.setSize(safeSize);
        dto.setTotalElements(messagePage.getTotalElements());
        dto.setHasNext(messagePage.hasNext());
        return dto;
    }

    @Transactional(readOnly = true)
    public List<SimpleUserChatDto> searchUsers(String keyword) {
        User currentUser = getCurrentUser();
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        if (normalizedKeyword.length() < 2) {
            return List.of();
        }
        return userRepository.searchForChat(currentUser.getId(), normalizedKeyword).stream()
                .limit(20)
                .map(this::mapSimpleUser)
                .toList();
    }

    @Transactional
    public ConversationMessageDto sendMessage(SendConversationMessageRequest request) {
        User currentUser = getCurrentUser();
        return sendMessage(currentUser, request);
    }

    @Transactional
    public ConversationMessageDto sendMessage(String email, SendConversationMessageRequest request) {
        return sendMessage(getUserByEmail(email), request);
    }

    @Transactional
    public ConversationMessageDto sendMessage(User sender, SendConversationMessageRequest request) {
        if (request.getConversationId() == null) {
            throw new RuntimeException("Thiếu conversationId");
        }

        Conversation conversation = requireConversationMember(request.getConversationId(), sender);
        String content = request.getContent() == null ? "" : request.getContent().trim();
        boolean hasAttachments = request.getAttachments() != null && !request.getAttachments().isEmpty();
        if (content.isBlank() && !hasAttachments) {
            throw new RuntimeException("Tin nhắn không được để trống");
        }
        if (content.length() > MAX_MESSAGE_LENGTH) {
            throw new RuntimeException("Tin nhắn vượt quá độ dài cho phép");
        }

        List<ConversationParticipant> participants = participantRepository.findByConversation(conversation);
        Set<Long> participantIds = participants.stream().map(item -> item.getUser().getId()).collect(Collectors.toSet());
        List<Long> mentionedUserIds = request.getMentionedUserIds() == null ? List.of() : request.getMentionedUserIds();
        if (!participantIds.containsAll(mentionedUserIds)) {
            throw new RuntimeException("Mention không hợp lệ");
        }

        ConversationMessage parentMessage = null;
        if (request.getParentMessageId() != null) {
            parentMessage = messageRepository.findById(request.getParentMessageId())
                    .orElseThrow(() -> new RuntimeException("Tin nhắn reply không tồn tại"));
            if (!parentMessage.getConversation().getId().equals(conversation.getId())) {
                throw new RuntimeException("Tin nhắn reply không cùng conversation");
            }
        }

        validateAttachments(request.getAttachments());

        ConversationMessage message = new ConversationMessage();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setContent(content.isBlank() ? "[Đã gửi tệp đính kèm]" : content);
        message.setParentMessage(parentMessage);
        message.setMentionedUserIds(mentionedUserIds.isEmpty()
                ? null
                : mentionedUserIds.stream().map(String::valueOf).collect(Collectors.joining(",")));
        ConversationMessage savedMessage = messageRepository.save(message);

        if (request.getAttachments() != null) {
            for (ChatAttachmentDto attachmentDto : request.getAttachments()) {
                MessageAttachment attachment = new MessageAttachment();
                attachment.setMessage(savedMessage);
                attachment.setFileName(attachmentDto.getFileName());
                attachment.setFileUrl(attachmentDto.getFileUrl());
                attachment.setContentType(attachmentDto.getContentType());
                attachment.setSizeBytes(attachmentDto.getSizeBytes());
                attachmentRepository.save(attachment);
            }
        }

        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        ConversationParticipant senderParticipant = participantRepository.findByConversationAndUser(conversation, sender)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy participant hiện tại"));
        senderParticipant.setLastReadAt(LocalDateTime.now());
        participantRepository.save(senderParticipant);

        ConversationMessageDto dto = mapMessage(savedMessage);
        dto.setClientMessageId(request.getClientMessageId());
        messagingTemplate.convertAndSend("/topic/chat/conversations/" + conversation.getId(), dto);

        for (ConversationParticipant participant : participants) {
            if (participant.getUser().getId().equals(sender.getId())) {
                continue;
            }
            notificationService.createNotification(
                    participant.getUser(),
                    "Tin nhắn mới",
                    sender.getFullName() + ": " + preview(message.getContent()),
                    "CHAT_MESSAGE",
                    conversation.getId());
            messagingTemplate.convertAndSendToUser(
                    participant.getUser().getEmail(),
                    "/queue/chat/conversations",
                    mapSummary(conversation, participant.getUser()));
        }
        messagingTemplate.convertAndSendToUser(sender.getEmail(), "/queue/chat/conversations", mapSummary(conversation, sender));

        for (Long mentionedUserId : mentionedUserIds) {
            if (!mentionedUserId.equals(sender.getId())) {
                User mentionedUser = participants.stream()
                        .map(ConversationParticipant::getUser)
                        .filter(user -> user.getId().equals(mentionedUserId))
                        .findFirst()
                        .orElse(null);
                if (mentionedUser != null) {
                    notificationService.createNotification(
                            mentionedUser,
                            "Bạn được nhắc đến trong chat",
                            sender.getFullName() + " đã mention bạn trong \"" + conversation.getTitle() + "\"",
                            "CHAT_MENTION",
                            conversation.getId());
                }
            }
        }

        return dto;
    }

    @Transactional
    public void markConversationRead(Long conversationId) {
        User currentUser = getCurrentUser();
        Conversation conversation = requireConversationMember(conversationId, currentUser);
        ConversationParticipant participant = participantRepository.findByConversationAndUser(conversation, currentUser)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người tham gia"));
        participant.setLastReadAt(LocalDateTime.now());
        participantRepository.save(participant);
        messagingTemplate.convertAndSendToUser(currentUser.getEmail(), "/queue/chat/conversations", mapSummary(conversation, currentUser));
    }

    public void publishTyping(String email, TypingEventDto request) {
        User user = getUserByEmail(email);
        Conversation conversation = requireConversationMember(request.getConversationId(), user);
        ChatPresenceEventDto event = new ChatPresenceEventDto();
        event.setUserId(user.getId());
        event.setFullName(user.getFullName());
        event.setConversationId(conversation.getId());
        event.setTyping(request.isTyping());
        event.setOnline(chatPresenceService.isOnline(user.getId()));
        messagingTemplate.convertAndSend("/topic/chat/conversations/" + conversation.getId() + "/typing", event);
    }

    public void handleSessionConnected(String email, String sessionId) {
        User user = getUserByEmail(email);
        boolean firstSession = chatPresenceService.connect(user.getId(), sessionId);
        if (firstSession) {
            publishPresenceToUserConversations(user, true);
        }
    }

    public void handleSessionDisconnected(String email, String sessionId) {
        User user = getUserByEmail(email);
        ChatPresenceService.DisconnectResult result = chatPresenceService.disconnect(sessionId);
        if (result != null && result.wentOffline()) {
            publishPresenceToUserConversations(user, false);
        }
    }

    private void publishPresenceToUserConversations(User user, boolean online) {
        ChatPresenceEventDto event = new ChatPresenceEventDto();
        event.setUserId(user.getId());
        event.setFullName(user.getFullName());
        event.setOnline(online);
        event.setTyping(false);
        for (ConversationParticipant participant : participantRepository.findByUser(user)) {
            event.setConversationId(participant.getConversation().getId());
            messagingTemplate.convertAndSend("/topic/chat/conversations/" + participant.getConversation().getId() + "/presence", event);
        }
    }

    private Conversation requireConversationMember(Long conversationId, User user) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation không tồn tại"));
        participantRepository.findByConversationAndUser(conversation, user)
                .orElseThrow(() -> new RuntimeException("Bạn không thuộc cuộc trò chuyện này"));
        return conversation;
    }

    private void validateAttachments(List<ChatAttachmentDto> attachments) {
        if (attachments == null || attachments.isEmpty()) {
            return;
        }
        if (attachments.size() > MAX_ATTACHMENTS) {
            throw new RuntimeException("Tối đa 5 tệp cho mỗi tin nhắn");
        }
        for (ChatAttachmentDto attachment : attachments) {
            if (attachment.getFileName() == null || attachment.getFileName().isBlank()
                    || attachment.getFileUrl() == null || attachment.getFileUrl().isBlank()
                    || attachment.getContentType() == null || attachment.getContentType().isBlank()) {
                throw new RuntimeException("Thông tin tệp đính kèm không hợp lệ");
            }
            if (!attachment.getFileUrl().contains("/api/files/download/")) {
                throw new RuntimeException("Tệp đính kèm phải được tải lên từ hệ thống");
            }
            if (attachment.getSizeBytes() <= 0 || attachment.getSizeBytes() > MAX_ATTACHMENT_BYTES) {
                throw new RuntimeException("Kích thước tệp vượt quá giới hạn cho phép");
            }
        }
    }

    private ConversationSummaryDto mapSummary(Conversation conversation, User currentUser) {
        ConversationSummaryDto dto = new ConversationSummaryDto();
        dto.setId(conversation.getId());
        dto.setTitle(conversation.getTitle());
        dto.setCreatedAt(conversation.getCreatedAt());
        dto.setLastMessageAt(conversation.getLastMessageAt());
        List<ConversationParticipant> conversationParticipants = participantRepository.findByConversation(conversation);
        dto.setParticipants(conversationParticipants.stream()
                .sorted(Comparator.comparing(item -> item.getUser().getFullName()))
                .map(this::mapParticipant)
                .toList());

        ConversationParticipant participant = conversationParticipants.stream()
                .filter(item -> item.getUser().getId().equals(currentUser.getId()))
                .findFirst()
                .orElse(null);
        LocalDateTime lastReadAt = participant == null ? null : participant.getLastReadAt();
        long unreadCount = lastReadAt == null
                ? messageRepository.countByConversationAndDeletedFalse(conversation)
                : messageRepository.countByConversationAndDeletedFalseAndCreatedAtAfter(conversation, lastReadAt);
        dto.setUnreadCount(unreadCount);

        Page<ConversationMessage> latestMessage = messageRepository.findByConversationAndDeletedFalseOrderByCreatedAtDesc(
                conversation,
                PageRequest.of(0, 1));
        if (!latestMessage.isEmpty()) {
            ConversationMessage lastMessage = latestMessage.getContent().get(0);
            dto.setLastMessagePreview(preview(lastMessage.getContent()));
            dto.setLastSenderId(lastMessage.getSender().getId());
            dto.setLastSenderName(lastMessage.getSender().getFullName());
        }
        return dto;
    }

    private ConversationParticipantDto mapParticipant(ConversationParticipant participant) {
        ConversationParticipantDto dto = new ConversationParticipantDto();
        dto.setUserId(participant.getUser().getId());
        dto.setFullName(participant.getUser().getFullName());
        dto.setEmail(participant.getUser().getEmail());
        dto.setAvatarUrl(participant.getUser().getAvatarUrl());
        dto.setOnline(chatPresenceService.isOnline(participant.getUser().getId()));
        return dto;
    }

    private ConversationMessageDto mapMessage(ConversationMessage message) {
        ConversationMessageDto dto = new ConversationMessageDto();
        dto.setId(message.getId());
        dto.setConversationId(message.getConversation().getId());
        dto.setSenderId(message.getSender().getId());
        dto.setSenderName(message.getSender().getFullName());
        dto.setSenderAvatarUrl(message.getSender().getAvatarUrl());
        dto.setContent(message.getContent());
        dto.setCreatedAt(message.getCreatedAt());
        dto.setEditedAt(message.getEditedAt());
        dto.setDeleted(message.isDeleted());
        if (message.getParentMessage() != null) {
            dto.setParentMessageId(message.getParentMessage().getId());
            dto.setParentMessagePreview(preview(message.getParentMessage().getContent()));
        }
        if (message.getMentionedUserIds() != null && !message.getMentionedUserIds().isBlank()) {
            dto.setMentionedUserIds(Arrays.stream(message.getMentionedUserIds().split(","))
                    .map(String::trim)
                    .filter(value -> !value.isBlank())
                    .map(Long::valueOf)
                    .toList());
        }
        dto.setAttachments(attachmentRepository.findByMessage(message).stream()
                .map(this::mapAttachment)
                .toList());
        return dto;
    }

    private ChatAttachmentDto mapAttachment(MessageAttachment attachment) {
        ChatAttachmentDto dto = new ChatAttachmentDto();
        dto.setId(attachment.getId());
        dto.setFileName(attachment.getFileName());
        dto.setFileUrl(attachment.getFileUrl());
        dto.setContentType(attachment.getContentType());
        dto.setSizeBytes(attachment.getSizeBytes());
        return dto;
    }

    private SimpleUserChatDto mapSimpleUser(User user) {
        SimpleUserChatDto dto = new SimpleUserChatDto();
        dto.setId(user.getId());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setRole(user.getRole() == null ? null : user.getRole().name());
        return dto;
    }

    private String preview(String content) {
        if (content == null) {
            return "";
        }
        return content.length() > 80 ? content.substring(0, 80) + "..." : content;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return getUserByEmail(email);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
