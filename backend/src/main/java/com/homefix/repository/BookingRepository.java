package com.homefix.repository;

import com.homefix.common.BookingStatus;
import com.homefix.entity.Booking;
import com.homefix.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByCustomerId(Long customerId);

    List<Booking> findByTechnicianId(Long technicianId);

    List<Booking> findByCustomer(User customer);

    List<Booking> findByTechnician(User technician);

    List<Booking> findByStatus(BookingStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT b.servicePackage.name, COUNT(b) FROM Booking b WHERE b.status = 'COMPLETED' GROUP BY b.servicePackage.name ORDER BY COUNT(b) DESC")
    List<Object[]> findTopServices();

    @org.springframework.data.jpa.repository.Query("SELECT MONTH(b.createdAt), SUM(b.totalPrice) FROM Booking b WHERE b.status = 'COMPLETED' GROUP BY MONTH(b.createdAt) ORDER BY MONTH(b.createdAt)")
    List<Object[]> findRevenueByMonth();

    @org.springframework.data.jpa.repository.Query("SELECT b.status, COUNT(b) FROM Booking b GROUP BY b.status")
    List<Object[]> countByStatus();
}
