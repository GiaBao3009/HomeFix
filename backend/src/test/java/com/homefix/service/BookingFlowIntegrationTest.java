package com.homefix.service;

import com.homefix.common.BookingStatus;
import com.homefix.common.Role;
import com.homefix.common.TechnicianApprovalStatus;
import com.homefix.common.TechnicianType;
import com.homefix.dto.BookingDto;
import com.homefix.entity.Booking;
import com.homefix.entity.ServiceCategory;
import com.homefix.entity.ServicePackage;
import com.homefix.entity.User;
import com.homefix.repository.BookingRepository;
import com.homefix.repository.ServiceCategoryRepository;
import com.homefix.repository.ServicePackageRepository;
import com.homefix.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BookingFlowIntegrationTest {
    @Autowired
    private BookingService bookingService;
    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ServicePackageRepository servicePackageRepository;
    @Autowired
    private ServiceCategoryRepository serviceCategoryRepository;
    @MockBean
    private NotificationService notificationService;
    @MockBean
    private JavaMailSender javaMailSender;
    @MockBean
    private com.homefix.repository.ReviewRepository reviewRepository;

    private User customer;
    private User technicianA;
    private User technicianB;
    private ServicePackage servicePackage;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        servicePackageRepository.deleteAll();
        serviceCategoryRepository.deleteAll();
        userRepository.deleteAll();

        ServiceCategory category = new ServiceCategory();
        category.setName("Điện lạnh");
        category.setDescription("Dịch vụ điện lạnh");
        category = serviceCategoryRepository.save(category);

        servicePackage = new ServicePackage();
        servicePackage.setName("Sửa điều hòa");
        servicePackage.setPrice(BigDecimal.valueOf(450000));
        servicePackage.setCategory(category);
        servicePackage = servicePackageRepository.save(servicePackage);

        customer = new User();
        customer.setFullName("Customer One");
        customer.setEmail("customer1@test.com");
        customer.setPassword("x");
        customer.setRole(Role.CUSTOMER);
        customer = userRepository.save(customer);

        technicianA = buildTechnician("techa@test.com", "Cầu Giấy", category);
        technicianB = buildTechnician("techb@test.com", "Long Biên", category);
        when(reviewRepository.findAverageRatingByTechnicianId(technicianA.getId())).thenReturn(5.0);
        when(reviewRepository.findAverageRatingByTechnicianId(technicianB.getId())).thenReturn(3.0);
    }

    @Test
    void createBooking_shouldAutoAssignBestTechnician() {
        authenticate(customer.getEmail());
        BookingDto dto = new BookingDto();
        dto.setServiceId(servicePackage.getId());
        dto.setBookingTime(LocalDateTime.of(2026, 5, 20, 9, 0));
        dto.setAddress("Ngõ 12 Cầu Giấy Hà Nội");
        dto.setPaymentMethod("cash");

        BookingDto result = bookingService.createBooking(dto);

        assertThat(result.getStatus()).isEqualTo(BookingStatus.ASSIGNED);
        assertThat(result.getTechnicianId()).isEqualTo(technicianA.getId());
    }

    @Test
    void technicianReject_shouldReassignAnotherTechnicianAutomatically() {
        authenticate(customer.getEmail());
        BookingDto dto = new BookingDto();
        dto.setServiceId(servicePackage.getId());
        dto.setBookingTime(LocalDateTime.of(2026, 5, 20, 10, 0));
        dto.setAddress("Ngõ 12 Cầu Giấy Hà Nội");
        BookingDto created = bookingService.createBooking(dto);

        authenticate(technicianA.getEmail());
        BookingDto afterReject = bookingService.technicianResponse(created.getId(), false, "Bận lịch");

        assertThat(afterReject.getStatus()).isEqualTo(BookingStatus.ASSIGNED);
        assertThat(afterReject.getTechnicianId()).isEqualTo(technicianB.getId());
    }

    private User buildTechnician(String email, String location, ServiceCategory category) {
        User technician = new User();
        technician.setFullName(email);
        technician.setEmail(email);
        technician.setPassword("x");
        technician.setRole(Role.TECHNICIAN);
        technician.setTechnicianProfileCompleted(true);
        technician.setTechnicianType(TechnicianType.ASSISTANT);
        technician.setTechnicianApprovalStatus(TechnicianApprovalStatus.APPROVED);
        technician.setAvailableForAutoAssign(true);
        technician.setBaseLocation(location);
        technician.setAvailableFrom(LocalTime.of(8, 0));
        technician.setAvailableTo(LocalTime.of(18, 0));
        technician.setCategories(Set.of(category));
        technician = userRepository.save(technician);

        return technician;
    }

    private void authenticate(String email) {
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(email, null, List.of()));
    }
}
