package com.homefix.security;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ChatWebSocketChannelInterceptor implements ChannelInterceptor {
    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;

    public ChatWebSocketChannelInterceptor(JwtUtils jwtUtils, UserDetailsService userDetailsService) {
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = firstHeader(accessor, "Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new RuntimeException("Thiếu token xác thực WebSocket");
            }

            String jwt = authHeader.substring(7);
            String email = jwtUtils.extractUsername(jwt);
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            if (!jwtUtils.isTokenValid(jwt, userDetails)) {
                throw new RuntimeException("Token WebSocket không hợp lệ");
            }

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetails,
                    null,
                    userDetails.getAuthorities());
            accessor.setUser(authentication);
        }
        return message;
    }

    private String firstHeader(StompHeaderAccessor accessor, String name) {
        List<String> values = accessor.getNativeHeader(name);
        if (values == null || values.isEmpty()) {
            return null;
        }
        return values.get(0);
    }
}
