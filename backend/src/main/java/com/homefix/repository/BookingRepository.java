package com.homefix.repository;

import com.homefix.common.BookingStatus;
import com.homefix.entity.Booking;
import com.homefix.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.time.LocalDateTime;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByCustomerId(Long customerId);

    List<Booking> findByTechnicianId(Long technicianId);

    List<Booking> findByCustomer(User customer);

    List<Booking> findByTechnician(User technician);
    List<Booking> findByTechnicianAndStatus(User technician, BookingStatus status);
    long countByTechnicianAndStatusIn(User technician, List<BookingStatus> statuses);
    long countByTechnicianAndStatus(User technician, BookingStatus status);
    boolean existsByTechnicianAndBookingTimeAndStatusIn(User technician, LocalDateTime bookingTime, List<BookingStatus> statuses);
    List<Booking> findByTechnicianOrderByCreatedAtDesc(User technician);

    List<Booking> findByStatus(BookingStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Booking b WHERE b.id = :id")
    Optional<Booking> findByIdForUpdate(Long id);

    @org.springframework.data.jpa.repository.Query("SELECT b.servicePackage.name, COUNT(b) FROM Booking b WHERE b.status = 'COMPLETED' GROUP BY b.servicePackage.name ORDER BY COUNT(b) DESC")
    List<Object[]> findTopServices();

    @org.springframework.data.jpa.repository.Query("SELECT MONTH(b.createdAt), SUM(b.totalPrice) FROM Booking b WHERE b.status = 'COMPLETED' GROUP BY MONTH(b.createdAt) ORDER BY MONTH(b.createdAt)")
    List<Object[]> findRevenueByMonth();

    @org.springframework.data.jpa.repository.Query("SELECT MONTH(b.createdAt), SUM(b.platformProfit) FROM Booking b WHERE b.status = 'COMPLETED' GROUP BY MONTH(b.createdAt) ORDER BY MONTH(b.createdAt)")
    List<Object[]> findProfitByMonth();

    @org.springframework.data.jpa.repository.Query("SELECT b.status, COUNT(b) FROM Booking b GROUP BY b.status")
    List<Object[]> countByStatus();
}
