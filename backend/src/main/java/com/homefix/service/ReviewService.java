package com.homefix.service;

import com.homefix.common.BookingStatus;
import com.homefix.dto.ReviewDto;
import com.homefix.entity.Booking;
import com.homefix.entity.Review;
import com.homefix.repository.BookingRepository;
import com.homefix.repository.ReviewRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;

    public ReviewService(ReviewRepository reviewRepository, BookingRepository bookingRepository,
            NotificationService notificationService) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.notificationService = notificationService;
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
        String autoReply = dto.getRating() >= 4
                ? "Cảm ơn bạn đã đánh giá tích cực. Kỹ thuật viên sẽ tiếp tục giữ chất lượng phục vụ tốt."
                : "Cảm ơn phản hồi của bạn. Hệ thống đã ghi nhận và sẽ cải thiện chất lượng dịch vụ.";
        if (booking.getTechnician() != null) {
            notificationService.createNotification(
                    booking.getTechnician(),
                    "Bạn có đánh giá mới",
                    autoReply + " Điểm: " + dto.getRating() + "/5",
                    "REVIEW",
                    booking.getId());
        }
        notificationService.createNotification(
                booking.getCustomer(),
                "Hệ thống đã ghi nhận đánh giá",
                autoReply,
                "REVIEW_AUTO_REPLY",
                booking.getId());
        return mapToDto(saved);
    }

    public List<ReviewDto> getReviewsByService(Long serviceId) {
        return reviewRepository.findAll().stream()
                .filter(r -> r.getBooking().getServicePackage().getId().equals(serviceId))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<ReviewDto> getReviewsByTechnician(Long technicianId) {
        return reviewRepository.findByTechnicianIdOrderByCreatedAtDesc(technicianId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public Map<String, Object> getBookingInfoByToken(String token) {
        Booking booking = bookingRepository.findByReviewToken(token)
                .orElseThrow(() -> new RuntimeException("Link đánh giá không hợp lệ hoặc đã hết hạn"));
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new RuntimeException("Đơn hàng chưa hoàn thành");
        }
        boolean alreadyReviewed = reviewRepository.findAll().stream()
                .anyMatch(r -> r.getBooking().getId().equals(booking.getId()));
        Map<String, Object> info = new HashMap<>();
        info.put("bookingId", booking.getId());
        info.put("serviceName", booking.getServicePackage().getName());
        info.put("technicianName", booking.getTechnician() != null ? booking.getTechnician().getFullName() : "N/A");
        info.put("completedAt", booking.getCompletedAt());
        info.put("alreadyReviewed", alreadyReviewed);
        return info;
    }

    public ReviewDto createReviewByToken(String token, ReviewDto dto) {
        Booking booking = bookingRepository.findByReviewToken(token)
                .orElseThrow(() -> new RuntimeException("Link đánh giá không hợp lệ hoặc đã hết hạn"));
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new RuntimeException("Đơn hàng chưa hoàn thành");
        }
        boolean alreadyReviewed = reviewRepository.findAll().stream()
                .anyMatch(r -> r.getBooking().getId().equals(booking.getId()));
        if (alreadyReviewed) {
            throw new RuntimeException("Đơn hàng này đã được đánh giá rồi");
        }
        dto.setBookingId(booking.getId());
        return createReview(dto);
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

