package com.homefix.repository;

import com.homefix.entity.TechnicianInteractionLog;
import com.homefix.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TechnicianInteractionLogRepository extends JpaRepository<TechnicianInteractionLog, Long> {
    List<TechnicianInteractionLog> findTop100ByTechnicianOrderByCreatedAtDesc(User technician);
}
