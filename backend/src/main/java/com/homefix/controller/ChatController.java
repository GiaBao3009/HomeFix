package com.homefix.controller;

import com.homefix.dto.*;
import com.homefix.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationSummaryDto>> getMyConversations() {
        return ResponseEntity.ok(chatService.getMyConversations());
    }

    @PostMapping("/conversations")
    public ResponseEntity<ConversationSummaryDto> createConversation(@Valid @RequestBody CreateConversationRequest request) {
        return ResponseEntity.ok(chatService.createConversation(request));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<ConversationPageDto> getMessages(
            @PathVariable("conversationId") Long conversationId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "30") int size) {
        return ResponseEntity.ok(chatService.getMessages(conversationId, page, size));
    }

    @PutMapping("/conversations/{conversationId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable("conversationId") Long conversationId) {
        chatService.markConversationRead(conversationId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/messages/search")
    public ResponseEntity<ConversationPageDto> searchMessages(
            @RequestParam("keyword") String keyword,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        return ResponseEntity.ok(chatService.searchMessages(keyword, page, size));
    }

    @GetMapping("/users")
    public ResponseEntity<List<SimpleUserChatDto>> searchUsers(@RequestParam("keyword") String keyword) {
        return ResponseEntity.ok(chatService.searchUsers(keyword));
    }

    @GetMapping("/users/suggestions")
    public ResponseEntity<List<SimpleUserChatDto>> getSuggestedUsers() {
        return ResponseEntity.ok(chatService.getSuggestedUsers());
    }

    @PostMapping("/messages")
    public ResponseEntity<ConversationMessageDto> sendMessage(@RequestBody SendConversationMessageRequest request) {
        return ResponseEntity.ok(chatService.sendMessage(request));
    }

    @MessageMapping("/chat.send")
    public void sendRealtime(@Payload SendConversationMessageRequest request, Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new RuntimeException("Thiếu xác thực WebSocket");
        }
        chatService.sendMessage(principal.getName(), request);
    }

    @MessageMapping("/chat.typing")
    public void typing(@Payload TypingEventDto request, Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new RuntimeException("Thiếu xác thực WebSocket");
        }
        chatService.publishTyping(principal.getName(), request);
    }
}
