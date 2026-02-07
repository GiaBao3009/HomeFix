package com.homefix.dto;

import java.time.LocalDateTime;

public class NotificationDto {
    private Long id;
    private String title;
    private String message;
    private boolean isRead;
    private LocalDateTime createdAt;
    private String type;
    private Long relatedId;

    public NotificationDto(Long id, String title, String message, boolean isRead, LocalDateTime createdAt, String type, Long relatedId) {
        this.id = id;
        this.title = title;
        this.message = message;
        this.isRead = isRead;
        this.createdAt = createdAt;
        this.type = type;
        this.relatedId = relatedId;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Long getRelatedId() { return relatedId; }
    public void setRelatedId(Long relatedId) { this.relatedId = relatedId; }
}
