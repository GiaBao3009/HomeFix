package com.homefix.repository;

import com.homefix.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    boolean existsByBooking_Id(Long bookingId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.booking.technician.id = :technicianId")
    Double findAverageRatingByTechnicianId(@Param("technicianId") Long technicianId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.booking.technician.id = :technicianId")
    Long countByTechnicianId(@Param("technicianId") Long technicianId);

    @Query("SELECT r FROM Review r WHERE r.booking.technician.id = :technicianId ORDER BY r.createdAt DESC")
    List<Review> findByTechnicianIdOrderByCreatedAtDesc(@Param("technicianId") Long technicianId);
}
