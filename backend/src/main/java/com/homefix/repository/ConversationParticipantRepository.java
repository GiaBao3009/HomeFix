package com.homefix.repository;

import com.homefix.entity.Conversation;
import com.homefix.entity.ConversationParticipant;
import com.homefix.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConversationParticipantRepository extends JpaRepository<ConversationParticipant, Long> {
    Optional<ConversationParticipant> findByConversationAndUser(Conversation conversation, User user);

    List<ConversationParticipant> findByConversation(Conversation conversation);

    List<ConversationParticipant> findByUser(User user);
}
