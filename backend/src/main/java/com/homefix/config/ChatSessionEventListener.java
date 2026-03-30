package com.homefix.config;

import com.homefix.service.ChatService;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class ChatSessionEventListener {
    private final ChatService chatService;

    public ChatSessionEventListener(ChatService chatService) {
        this.chatService = chatService;
    }

    @EventListener
    public void handleSessionConnected(SessionConnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        if (accessor.getUser() != null) {
            chatService.handleSessionConnected(accessor.getUser().getName(), accessor.getSessionId());
        }
    }

    @EventListener
    public void handleSessionDisconnected(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        if (accessor.getUser() != null) {
            chatService.handleSessionDisconnected(accessor.getUser().getName(), accessor.getSessionId());
        }
    }
}
