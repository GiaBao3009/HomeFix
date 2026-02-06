package com.homefix.service;

import com.homefix.common.BookingStatus;
import com.homefix.dto.ReviewDto;
import com.homefix.entity.Booking;
import com.homefix.entity.Review;
import com.homefix.repository.BookingRepository;
import com.homefix.repository.ReviewRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;

    public ReviewService(ReviewRepository reviewRepository, BookingRepository bookingRepository) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
    }

    public ReviewDto createReview(ReviewDto dto) {
        Booking booking = bookingRepository.findById(dto.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new RuntimeException("Only completed bookings can be reviewed");
        }
        
        Review review = new Review();
        review.setBooking(booking);
        review.setRating(dto.getRating());
        review.setComment(dto.getComment());

        Review saved = reviewRepository.save(review);
        return mapToDto(saved);
    }

    public List<ReviewDto> getReviewsByService(Long serviceId) {
        return reviewRepository.findAll().stream()
                .filter(r -> r.getBooking().getServicePackage().getId().equals(serviceId))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private ReviewDto mapToDto(Review entity) {
        return new ReviewDto(
                entity.getId(),
                entity.getBooking().getId(),
                entity.getBooking().getServicePackage().getName(),
                entity.getBooking().getCustomer().getFullName(),
                entity.getRating(),
                entity.getComment(),
                entity.getCreatedAt()
        );
    }
}

