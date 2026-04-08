package com.homefix.dto;

import java.util.ArrayList;
import java.util.List;

public class SendConversationMessageRequest {
    private Long conversationId;
    private String clientMessageId;
    private String content;
    private Long parentMessageId;
    private String clientMessageId;
    private List<Long> mentionedUserIds = new ArrayList<>();
    private List<ChatAttachmentDto> attachments = new ArrayList<>();

    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }

    public String getContent() {
        return content;
    }

    public String getClientMessageId() {
        return clientMessageId;
    }

    public void setClientMessageId(String clientMessageId) {
        this.clientMessageId = clientMessageId;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Long getParentMessageId() {
        return parentMessageId;
    }

    public void setParentMessageId(Long parentMessageId) {
        this.parentMessageId = parentMessageId;
    }

    public String getClientMessageId() {
        return clientMessageId;
    }

    public void setClientMessageId(String clientMessageId) {
        this.clientMessageId = clientMessageId;
    }

    public List<Long> getMentionedUserIds() {
        return mentionedUserIds;
    }

    public void setMentionedUserIds(List<Long> mentionedUserIds) {
        this.mentionedUserIds = mentionedUserIds;
    }

    public List<ChatAttachmentDto> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<ChatAttachmentDto> attachments) {
        this.attachments = attachments;
    }
}
