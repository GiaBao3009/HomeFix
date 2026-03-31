package com.homefix.repository;

import com.homefix.common.WithdrawalStatus;
import com.homefix.entity.User;
import com.homefix.entity.WithdrawalRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WithdrawalRepository extends JpaRepository<WithdrawalRequest, Long> {
    List<WithdrawalRequest> findByTechnicianOrderByCreatedAtDesc(User technician);
    List<WithdrawalRequest> findAllByOrderByCreatedAtDesc();
    long countByTechnicianAndStatus(User technician, WithdrawalStatus status);
}
