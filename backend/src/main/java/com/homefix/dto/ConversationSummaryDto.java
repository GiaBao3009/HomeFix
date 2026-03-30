package com.homefix.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class ConversationSummaryDto {
    private Long id;
    private String title;
    private LocalDateTime createdAt;
    private LocalDateTime lastMessageAt;
    private String lastMessagePreview;
    private Long lastSenderId;
    private String lastSenderName;
    private long unreadCount;
    private List<ConversationParticipantDto> participants = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getLastMessageAt() {
        return lastMessageAt;
    }

    public void setLastMessageAt(LocalDateTime lastMessageAt) {
        this.lastMessageAt = lastMessageAt;
    }

    public String getLastMessagePreview() {
        return lastMessagePreview;
    }

    public void setLastMessagePreview(String lastMessagePreview) {
        this.lastMessagePreview = lastMessagePreview;
    }

    public Long getLastSenderId() {
        return lastSenderId;
    }

    public void setLastSenderId(Long lastSenderId) {
        this.lastSenderId = lastSenderId;
    }

    public String getLastSenderName() {
        return lastSenderName;
    }

    public void setLastSenderName(String lastSenderName) {
        this.lastSenderName = lastSenderName;
    }

    public long getUnreadCount() {
        return unreadCount;
    }

    public void setUnreadCount(long unreadCount) {
        this.unreadCount = unreadCount;
    }

    public List<ConversationParticipantDto> getParticipants() {
        return participants;
    }

    public void setParticipants(List<ConversationParticipantDto> participants) {
        this.participants = participants;
    }
}
