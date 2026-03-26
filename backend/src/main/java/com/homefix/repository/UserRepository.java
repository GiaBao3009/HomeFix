package com.homefix.repository;

import com.homefix.common.TechnicianType;
import com.homefix.common.Role;
import com.homefix.entity.User;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(Role role);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.categories WHERE u.role = com.homefix.common.Role.TECHNICIAN")
    List<User> findTechniciansForMatchingWithLock();

    List<User> findBySupervisingTechnician(User supervisingTechnician);

    List<User> findByTechnicianTypeAndAssistantPromoteAtBefore(TechnicianType technicianType, LocalDateTime assistantPromoteAt);
}
