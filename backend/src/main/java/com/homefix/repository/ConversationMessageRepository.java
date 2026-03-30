package com.homefix.repository;

import com.homefix.entity.Conversation;
import com.homefix.entity.ConversationMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ConversationMessageRepository extends JpaRepository<ConversationMessage, Long> {
    Page<ConversationMessage> findByConversationAndDeletedFalseOrderByCreatedAtDesc(Conversation conversation, Pageable pageable);

    long countByConversationAndDeletedFalseAndCreatedAtAfter(Conversation conversation, java.time.LocalDateTime createdAt);

    long countByConversationAndDeletedFalse(Conversation conversation);

    @Query("SELECT m FROM ConversationMessage m JOIN m.conversation c JOIN c.participants p WHERE p.user.id = :userId AND m.deleted = false AND LOWER(m.content) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY m.createdAt DESC")
    Page<ConversationMessage> searchVisibleMessages(Long userId, String keyword, Pageable pageable);
}
