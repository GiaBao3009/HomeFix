package com.homefix.service;

import com.homefix.common.BookingStatus;
import com.homefix.common.Role;
import com.homefix.common.TechnicianApprovalStatus;
import com.homefix.common.TechnicianType;
import com.homefix.entity.Booking;
import com.homefix.entity.ServiceCategory;
import com.homefix.entity.ServicePackage;
import com.homefix.entity.User;
import com.homefix.repository.BookingRepository;
import com.homefix.repository.ReviewRepository;
import com.homefix.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class TechnicianMatchingService {
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;

    public TechnicianMatchingService(UserRepository userRepository, BookingRepository bookingRepository,
            ReviewRepository reviewRepository) {
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.reviewRepository = reviewRepository;
    }

    public List<User> findMatchingTechnicians(ServicePackage servicePackage, LocalDateTime bookingTime, String bookingAddress,
            int maxResults) {
        ServiceCategory category = servicePackage.getCategory();
        List<User> technicians = userRepository.findTechniciansForMatchingWithLock();
        List<MatchResult> matches = new ArrayList<>();

        for (User technician : technicians) {
            if (!isEligibleForDispatch(technician)) {
                continue;
            }
            if (!matchesCategory(technician, category)) {
                continue;
            }
            if (!isWithinAvailability(technician, bookingTime)) {
                continue;
            }
            if (hasConflict(technician, bookingTime)) {
                continue;
            }
            double score = calculateScore(technician, bookingAddress);
            matches.add(new MatchResult(technician, score));
        }

        return matches.stream()
                .sorted(Comparator.comparingDouble(MatchResult::score).reversed())
                .limit(Math.max(1, maxResults))
                .map(MatchResult::technician)
                .toList();
    }

    public boolean isEligibleForDispatch(User technician) {
        if (technician.getRole() != Role.TECHNICIAN) {
            return false;
        }
        if (!technician.isTechnicianProfileCompleted()) {
            return false;
        }
        if (!technician.isAvailableForAutoAssign()) {
            return false;
        }
        if (technician.getTechnicianType() == TechnicianType.MAIN) {
            return technician.getTechnicianApprovalStatus() == TechnicianApprovalStatus.APPROVED;
        }
        return technician.getTechnicianType() == TechnicianType.ASSISTANT;
    }

    public boolean canClaimBooking(User technician, Booking booking) {
        return getDispatchBlockReason(technician, booking) == null;
    }

    public boolean isOpenForDispatch(Booking booking) {
        if (booking == null) {
            return false;
        }
        return booking.getStatus() == BookingStatus.PENDING || booking.getStatus() == BookingStatus.CONFIRMED;
    }

    public boolean canSeeDispatchFeed(User technician, Booking booking) {
        if (technician == null || technician.getRole() != Role.TECHNICIAN) {
            return false;
        }
        if (!isOpenForDispatch(booking) || booking.getTechnician() != null) {
            return false;
        }
        return booking.getServicePackage() != null && matchesCategory(technician, booking.getServicePackage().getCategory());
    }

    public String getDispatchBlockReason(User technician, Booking booking) {
        if (booking == null || booking.getServicePackage() == null) {
            return "ÄÆ¡n khĂ´ng há»£p lá»‡";
        }
        if (booking.getServicePackage().getCategory() == null) {
            return "Dich vu nay khong con danh muc hop le de dieu phoi";
        }
        if (!isOpenForDispatch(booking) || booking.getTechnician() != null) {
            return "ÄÆ¡n khĂ´ng cĂ²n má»Ÿ";
        }
        if (technician == null || technician.getRole() != Role.TECHNICIAN) {
            return "TĂ i khoáº£n khĂ´ng pháº£i ká»¹ thuáº­t viĂªn";
        }
        if (!technician.isTechnicianProfileCompleted()) {
            return "ChÆ°a hoĂ n táº¥t há»“ sÆ¡ ká»¹ thuáº­t viĂªn";
        }
        if (!technician.isAvailableForAutoAssign()) {
            return "Báº¡n Ä‘ang táº¯t nháº­n phĂ¢n cĂ´ng tá»± Ä‘á»™ng";
        }
        if (technician.getTechnicianType() == TechnicianType.MAIN
                && technician.getTechnicianApprovalStatus() != TechnicianApprovalStatus.APPROVED) {
            return "Há»“ sÆ¡ thá»£ chĂ­nh Ä‘ang chá» duyá»‡t";
        }
        if (technician.getTechnicianType() == TechnicianType.ASSISTANT
                && technician.getSupervisingTechnician() == null) {
            return "Thá»£ phá»¥ chÆ°a Ä‘Æ°á»£c gĂ¡n thá»£ chĂ­nh phá»¥ trĂ¡ch";
        }
        if (!matchesCategory(technician, booking.getServicePackage().getCategory())) {
            return "ÄÆ¡n nĂ y khĂ´ng thuá»™c chuyĂªn má»¥c cá»§a báº¡n";
        }
        if (!isWithinAvailability(technician, booking.getBookingTime())) {
            return "ÄÆ¡n náº±m ngoĂ i ca lĂ m viá»‡c Ä‘Ă£ cáº¥u hĂ¬nh";
        }
        if (hasConflict(technician, booking.getBookingTime())) {
            return "Báº¡n Ä‘ang bá»‹ trĂ¹ng lá»‹ch á»Ÿ khung giá» nĂ y";
        }
        return null;
    }

    private boolean matchesCategory(User technician, ServiceCategory targetCategory) {
        if (targetCategory == null || targetCategory.getId() == null) {
            return false;
        }
        return technician.getCategories().stream().anyMatch(c -> c.getId().equals(targetCategory.getId()));
    }

    private boolean isWithinAvailability(User technician, LocalDateTime bookingTime) {
        LocalTime from = technician.getAvailableFrom();
        LocalTime to = technician.getAvailableTo();
        if (from == null || to == null) {
            return true;
        }
        LocalTime time = bookingTime.toLocalTime();
        return !time.isBefore(from) && !time.isAfter(to);
    }

    private boolean hasConflict(User technician, LocalDateTime bookingTime) {
        List<BookingStatus> activeStatuses = List.of(BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS);
        return bookingRepository.existsByTechnicianAndBookingTimeAndStatusIn(
                technician,
                bookingTime,
                activeStatuses)
                || bookingRepository.existsByAssistantTechniciansContainingAndBookingTimeAndStatusIn(
                        technician,
                        bookingTime,
                        activeStatuses);
    }

    private double calculateScore(User technician, String bookingAddress) {
        double categoryScore = 50;
        double locationScore = addressSimilarity(technician.getBaseLocation(), bookingAddress) * 20;
        double ratingScore = normalizedRating(technician.getId()) * 20;
        double workloadScore = workloadScore(technician) * 10;
        return categoryScore + locationScore + ratingScore + workloadScore;
    }

    private double normalizedRating(Long technicianId) {
        Double averageRating = reviewRepository.findAverageRatingByTechnicianId(technicianId);
        if (averageRating == null) {
            return 0.5;
        }
        return Math.min(1, Math.max(0, averageRating / 5.0));
    }

    private double workloadScore(User technician) {
        long activeJobs = bookingRepository.countVisibleToTechnicianAndStatusIn(
                technician, List.of(BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS));
        if (activeJobs >= 5) {
            return 0;
        }
        return (5.0 - activeJobs) / 5.0;
    }

    double addressSimilarity(String techAddress, String bookingAddress) {
        if (techAddress == null || techAddress.isBlank() || bookingAddress == null || bookingAddress.isBlank()) {
            return 0.3;
        }
        Set<String> technicianTokens = tokenize(techAddress);
        Set<String> bookingTokens = tokenize(bookingAddress);
        if (technicianTokens.isEmpty() || bookingTokens.isEmpty()) {
            return 0.3;
        }
        long common = technicianTokens.stream().filter(bookingTokens::contains).count();
        long denominator = Math.max(technicianTokens.size(), bookingTokens.size());
        return Math.min(1, (double) common / denominator);
    }

    private Set<String> tokenize(String value) {
        String normalized = value.toLowerCase(Locale.ROOT)
                .replace(",", " ")
                .replace(".", " ")
                .replace("-", " ")
                .replace("/", " ");
        String[] tokens = normalized.split("\\s+");
        Set<String> result = new HashSet<>();
        for (String token : tokens) {
            if (token.length() >= 2) {
                result.add(token);
            }
        }
        return result;
    }

    private record MatchResult(User technician, double score) {
    }
}
