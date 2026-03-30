package com.homefix.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ChatPresenceService {
    private final Map<Long, Set<String>> onlineSessions = new ConcurrentHashMap<>();
    private final Map<String, Long> sessionOwners = new ConcurrentHashMap<>();

    public boolean connect(Long userId, String sessionId) {
        sessionOwners.put(sessionId, userId);
        onlineSessions.computeIfAbsent(userId, key -> ConcurrentHashMap.newKeySet()).add(sessionId);
        return onlineSessions.getOrDefault(userId, Set.of()).size() == 1;
    }

    public DisconnectResult disconnect(String sessionId) {
        Long userId = sessionOwners.remove(sessionId);
        if (userId == null) {
            return null;
        }
        Set<String> sessions = onlineSessions.get(userId);
        if (sessions != null) {
            sessions.remove(sessionId);
            if (sessions.isEmpty()) {
                onlineSessions.remove(userId);
                return new DisconnectResult(userId, true);
            }
        }
        return new DisconnectResult(userId, false);
    }

    public boolean isOnline(Long userId) {
        return onlineSessions.containsKey(userId) && !onlineSessions.get(userId).isEmpty();
    }

    public record DisconnectResult(Long userId, boolean wentOffline) {
    }
}
