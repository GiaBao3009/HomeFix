package com.homefix.repository;

import com.homefix.entity.Conversation;
import com.homefix.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    @Query("SELECT DISTINCT c FROM Conversation c JOIN FETCH c.participants p JOIN FETCH p.user WHERE EXISTS (SELECT 1 FROM ConversationParticipant cp WHERE cp.conversation = c AND cp.user = :user AND cp.archived = false) ORDER BY COALESCE(c.lastMessageAt, c.createdAt) DESC")
    List<Conversation> findVisibleConversationsForUser(User user);
}
