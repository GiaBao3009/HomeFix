package com.homefix.service;

import com.homefix.common.BookingStatus;
import com.homefix.dto.ReviewDto;
import com.homefix.entity.Booking;
import com.homefix.entity.Review;
import com.homefix.entity.User;
import com.homefix.repository.BookingRepository;
import com.homefix.repository.ReviewRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
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

    @Transactional
    public ReviewDto createReview(ReviewDto dto) {
        Booking booking = bookingRepository.findById(dto.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        ensureBookingBelongsToCurrentCustomer(booking);
        return createReviewForBooking(booking, dto);
    }

    @Transactional
    public ReviewDto createReviewByToken(String token, ReviewDto dto) {
        Booking booking = bookingRepository.findByReviewToken(token)
                .orElseThrow(() -> new RuntimeException("Link đánh giá không hợp lệ hoặc đã hết hạn"));
        dto.setBookingId(booking.getId());
        return createReviewForBooking(booking, dto);
    }

    private ReviewDto createReviewForBooking(Booking booking, ReviewDto dto) {
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new RuntimeException("Only completed bookings can be reviewed");
        }
        if (reviewRepository.existsByBooking_Id(booking.getId())) {
            throw new RuntimeException("Booking already reviewed");
        }

        Integer rating = dto.getRating();
        if (rating == null || rating < 1 || rating > 5) {
            throw new RuntimeException("Rating must be from 1 to 5");
        }
        BigDecimal tipAmount = normalizeTip(dto.getTipAmount());

        Review review = new Review();
        review.setBooking(booking);
        review.setRating(rating);
        review.setComment(dto.getComment());

        Review saved = reviewRepository.save(review);
        applyTipToBooking(booking, tipAmount);

        String autoReply = rating >= 4
                ? "Cảm ơn bạn đã đánh giá tích cực. Kỹ thuật viên sẽ tiếp tục giữ chất lượng phục vụ tốt."
                : "Cảm ơn phản hồi của bạn. Hệ thống đã ghi nhận và sẽ cải thiện chất lượng dịch vụ.";
        if (booking.getTechnician() != null) {
            String technicianMessage = autoReply + " Điểm: " + rating + "/5";
            if (tipAmount.compareTo(BigDecimal.ZERO) > 0) {
                technicianMessage += ". Tip: " + tipAmount.toPlainString() + " VND";
            }
            notificationService.createNotification(
                    booking.getTechnician(),
                    "Bạn có đánh giá mới",
                    technicianMessage,
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
                .filter(r -> r.getBooking().getServicePackage() != null
                        && r.getBooking().getServicePackage().getId().equals(serviceId))
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
        boolean alreadyReviewed = reviewRepository.existsByBooking_Id(booking.getId());
        Map<String, Object> info = new HashMap<>();
        info.put("bookingId", booking.getId());
        info.put("serviceName", booking.resolveServiceName());
        info.put("technicianName", booking.getTechnician() != null ? booking.getTechnician().getFullName() : "N/A");
        info.put("completedAt", booking.getCompletedAt());
        info.put("alreadyReviewed", alreadyReviewed);
        return info;
    }

    private void ensureBookingBelongsToCurrentCustomer(Booking booking) {
        String email = SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getName()
                : null;
        if (email == null || booking.getCustomer() == null || !email.equalsIgnoreCase(booking.getCustomer().getEmail())) {
            throw new RuntimeException("You can only review your own completed booking");
        }
    }

    private BigDecimal normalizeTip(BigDecimal tipAmount) {
        if (tipAmount == null) {
            return BigDecimal.ZERO;
        }
        if (tipAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Tip amount must be positive");
        }
        return tipAmount.setScale(0, RoundingMode.HALF_UP);
    }

    private void applyTipToBooking(Booking booking, BigDecimal tipAmount) {
        if (tipAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        User technician = booking.getTechnician();
        if (technician == null) {
            throw new RuntimeException("Booking has no technician to receive tip");
        }

        booking.setTipAmount(tipAmount);
        BigDecimal currentEarning = booking.getTechnicianEarning() == null ? BigDecimal.ZERO : booking.getTechnicianEarning();
        booking.setTechnicianEarning(currentEarning.add(tipAmount));
        BigDecimal currentBalance = technician.getWalletBalance() == null ? BigDecimal.ZERO : technician.getWalletBalance();
        technician.setWalletBalance(currentBalance.add(tipAmount));
        bookingRepository.save(booking);
    }

    private ReviewDto mapToDto(Review entity) {
        ReviewDto dto = new ReviewDto(
                entity.getId(),
                entity.getBooking().getId(),
                entity.getBooking().resolveServiceName(),
                entity.getBooking().getCustomer().getFullName(),
                entity.getRating(),
                entity.getComment(),
                entity.getCreatedAt());
        dto.setTipAmount(entity.getBooking().getTipAmount());
        return dto;
    }
}
