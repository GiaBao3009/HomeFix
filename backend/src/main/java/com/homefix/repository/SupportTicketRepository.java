package com.homefix.repository;

import com.homefix.common.TicketStatus;
import com.homefix.entity.SupportTicket;
import com.homefix.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    List<SupportTicket> findByTechnicianOrderByCreatedAtDesc(User technician);
    List<SupportTicket> findByTechnicianAndStatusOrderByCreatedAtDesc(User technician, TicketStatus status);
    long countByTechnicianAndStatusIn(User technician, List<TicketStatus> statuses);
    long countByTechnicianAndDueAtBeforeAndStatusIn(User technician, LocalDateTime time, List<TicketStatus> statuses);
}
