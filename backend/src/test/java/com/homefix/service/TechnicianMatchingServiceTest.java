package com.homefix.service;

import com.homefix.common.Role;
import com.homefix.common.TechnicianApprovalStatus;
import com.homefix.common.TechnicianType;
import com.homefix.entity.ServiceCategory;
import com.homefix.entity.ServicePackage;
import com.homefix.entity.User;
import com.homefix.repository.BookingRepository;
import com.homefix.repository.ReviewRepository;
import com.homefix.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TechnicianMatchingServiceTest {
    @Mock
    private UserRepository userRepository;
    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private ReviewRepository reviewRepository;

    private TechnicianMatchingService matchingService;

    @BeforeEach
    void setUp() {
        matchingService = new TechnicianMatchingService(userRepository, bookingRepository, reviewRepository);
    }

    @Test
    void findMatchingTechnicians_shouldPrioritizeTechnicianWithBetterScore() {
        ServiceCategory category = new ServiceCategory();
        category.setId(10L);
        category.setName("Điện lạnh");
        ServicePackage servicePackage = new ServicePackage();
        servicePackage.setId(100L);
        servicePackage.setName("Sửa máy lạnh");
        servicePackage.setPrice(BigDecimal.valueOf(300000));
        servicePackage.setCategory(category);

        User techA = buildTechnician(1L, "A", "Cầu Giấy Hà Nội", LocalTime.of(8, 0), LocalTime.of(18, 0), category);
        User techB = buildTechnician(2L, "B", "Long Biên Hà Nội", LocalTime.of(8, 0), LocalTime.of(18, 0), category);

        when(userRepository.findTechniciansForMatchingWithLock()).thenReturn(List.of(techA, techB));
        when(bookingRepository.existsByTechnicianAndBookingTimeAndStatusIn(any(), any(), anyList())).thenReturn(false);
        when(bookingRepository.countByTechnicianAndStatusIn(any(), anyList())).thenReturn(1L);
        when(reviewRepository.findAverageRatingByTechnicianId(1L)).thenReturn(4.8);
        when(reviewRepository.findAverageRatingByTechnicianId(2L)).thenReturn(3.5);

        List<User> result = matchingService.findMatchingTechnicians(
                servicePackage,
                LocalDateTime.of(2026, 5, 10, 9, 0),
                "Ngõ 120 Cầu Giấy Hà Nội",
                2);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getId()).isEqualTo(1L);
    }

    @Test
    void findMatchingTechnicians_shouldFilterOutBusyTechnician() {
        ServiceCategory category = new ServiceCategory();
        category.setId(11L);
        ServicePackage servicePackage = new ServicePackage();
        servicePackage.setCategory(category);

        User tech = buildTechnician(5L, "Busy", "Đống Đa", LocalTime.of(8, 0), LocalTime.of(18, 0), category);

        when(userRepository.findTechniciansForMatchingWithLock()).thenReturn(List.of(tech));
        when(bookingRepository.existsByTechnicianAndBookingTimeAndStatusIn(any(), any(), anyList())).thenReturn(true);

        List<User> result = matchingService.findMatchingTechnicians(
                servicePackage,
                LocalDateTime.of(2026, 5, 10, 10, 0),
                "Đống Đa Hà Nội",
                3);

        assertThat(result).isEmpty();
    }

    @Test
    void addressSimilarity_shouldReturnHigherScoreForSimilarAddress() {
        double close = matchingService.addressSimilarity("Cầu Giấy Hà Nội", "Phố Cầu Giấy, Hà Nội");
        double far = matchingService.addressSimilarity("Hải Phòng", "Cầu Giấy, Hà Nội");

        assertThat(close).isGreaterThan(far);
    }

    private User buildTechnician(Long id, String name, String location, LocalTime from, LocalTime to, ServiceCategory category) {
        User user = new User();
        user.setId(id);
        user.setFullName(name);
        user.setEmail(name.toLowerCase() + "@homefix.test");
        user.setRole(Role.TECHNICIAN);
        user.setTechnicianProfileCompleted(true);
        user.setTechnicianType(TechnicianType.ASSISTANT);
        user.setTechnicianApprovalStatus(TechnicianApprovalStatus.APPROVED);
        user.setAvailableForAutoAssign(true);
        user.setBaseLocation(location);
        user.setAvailableFrom(from);
        user.setAvailableTo(to);
        user.setCategories(Set.of(category));
        return user;
    }
}
