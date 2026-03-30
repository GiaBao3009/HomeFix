package com.homefix.repository;

import com.homefix.entity.Booking;
import com.homefix.entity.BookingChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingChatMessageRepository extends JpaRepository<BookingChatMessage, Long> {
    List<BookingChatMessage> findByBookingAndDeletedFalseAndExpiresAtAfterOrderByCreatedAtAsc(Booking booking, LocalDateTime now);
    List<BookingChatMessage> findByDeletedFalseAndExpiresAtBefore(LocalDateTime now);
}
