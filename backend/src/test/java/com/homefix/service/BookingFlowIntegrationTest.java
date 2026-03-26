package com.homefix.service;

import com.homefix.common.BookingStatus;
import com.homefix.common.Role;
import com.homefix.common.TechnicianApprovalStatus;
import com.homefix.common.TechnicianType;
import com.homefix.dto.BookingDto;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
    private User mainTechnician;
    private User assistantA;
    private User assistantB;
    private ServicePackage servicePackage;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        servicePackageRepository.deleteAll();
        serviceCategoryRepository.deleteAll();
        userRepository.deleteAll();

        ServiceCategory category = new ServiceCategory();
        category.setName("Dien lanh");
        category.setDescription("Dich vu dien lanh");
        category = serviceCategoryRepository.save(category);

        servicePackage = new ServicePackage();
        servicePackage.setName("Sua dieu hoa");
        servicePackage.setPrice(BigDecimal.valueOf(450000));
        servicePackage.setCategory(category);
        servicePackage = servicePackageRepository.save(servicePackage);

        customer = new User();
        customer.setFullName("Customer One");
        customer.setEmail("customer1@test.com");
        customer.setPassword("x");
        customer.setRole(Role.CUSTOMER);
        customer = userRepository.save(customer);

        mainTechnician = buildTechnician("main@test.com", "Cau Giay", category, TechnicianType.MAIN, null);
        assistantA = buildTechnician("assistant-a@test.com", "Cau Giay", category, TechnicianType.ASSISTANT, mainTechnician);
        assistantB = buildTechnician("assistant-b@test.com", "Long Bien", category, TechnicianType.ASSISTANT, mainTechnician);

        when(reviewRepository.findAverageRatingByTechnicianId(mainTechnician.getId())).thenReturn(4.8);
        when(reviewRepository.findAverageRatingByTechnicianId(assistantA.getId())).thenReturn(5.0);
        when(reviewRepository.findAverageRatingByTechnicianId(assistantB.getId())).thenReturn(3.0);
    }

    @Test
    void createBooking_shouldStayOpenUntilATechnicianClaimsIt() {
        authenticate(customer.getEmail());

        BookingDto dto = new BookingDto();
        dto.setServiceId(servicePackage.getId());
        dto.setBookingTime(LocalDateTime.of(2026, 5, 20, 9, 0));
        dto.setAddress("Ngo 12 Cau Giay Ha Noi");
        dto.setPaymentMethod("cash");

        BookingDto result = bookingService.createBooking(dto);

        assertThat(result.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
        assertThat(result.getTechnicianId()).isNull();
        assertThat(result.getPaymentStatus()).isEqualTo("PENDING");
        assertThat(result.getPaymentMethod()).isEqualTo("CASH");

        authenticate(assistantA.getEmail());
        assertThat(bookingService.getAvailableBookingsForTechnician())
                .extracting(BookingDto::getId)
                .contains(result.getId());
    }

    @Test
    void firstTechnicianToClaim_shouldBlockLaterClaims() {
        BookingDto created = createBookingForCustomer(LocalDateTime.of(2026, 5, 20, 10, 0));

        authenticate(assistantA.getEmail());
        BookingDto claimed = bookingService.claimBooking(created.getId());

        assertThat(claimed.getStatus()).isEqualTo(BookingStatus.ASSIGNED);
        assertThat(claimed.getTechnicianId()).isEqualTo(assistantA.getId());

        authenticate(assistantB.getEmail());
        assertThatThrownBy(() -> bookingService.claimBooking(created.getId()))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("already been claimed");
    }

    @Test
    void mainTechnician_canAddOwnAssistantAfterClaimingBooking() {
        BookingDto created = createBookingForCustomer(LocalDateTime.of(2026, 5, 21, 9, 0));

        authenticate(mainTechnician.getEmail());
        BookingDto claimed = bookingService.claimBooking(created.getId());
        BookingDto withAssistant = bookingService.addAssistantToBooking(claimed.getId(), assistantA.getId());

        assertThat(withAssistant.getAssistantTechnicianIds()).containsExactly(assistantA.getId());
        assertThat(withAssistant.getAssistantTechnicianNames()).containsExactly(assistantA.getFullName());
    }

    private BookingDto createBookingForCustomer(LocalDateTime bookingTime) {
        authenticate(customer.getEmail());
        BookingDto dto = new BookingDto();
        dto.setServiceId(servicePackage.getId());
        dto.setBookingTime(bookingTime);
        dto.setAddress("Ngo 12 Cau Giay Ha Noi");
        return bookingService.createBooking(dto);
    }

    private User buildTechnician(String email, String location, ServiceCategory category, TechnicianType technicianType,
            User supervisor) {
        User technician = new User();
        technician.setFullName(email);
        technician.setEmail(email);
        technician.setPassword("x");
        technician.setRole(Role.TECHNICIAN);
        technician.setTechnicianProfileCompleted(true);
        technician.setTechnicianType(technicianType);
        technician.setTechnicianApprovalStatus(TechnicianApprovalStatus.APPROVED);
        technician.setAvailableForAutoAssign(true);
        technician.setBaseLocation(location);
        technician.setAvailableFrom(LocalTime.of(8, 0));
        technician.setAvailableTo(LocalTime.of(18, 0));
        technician.setCategories(Set.of(category));
        if (technicianType == TechnicianType.ASSISTANT) {
            technician.setSupervisingTechnician(supervisor);
            technician.setAssistantStartedAt(LocalDateTime.now().minusDays(10));
            technician.setAssistantPromoteAt(LocalDateTime.now().plusDays(20));
        }
        return userRepository.save(technician);
    }

    private void authenticate(String email) {
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(email, null, List.of()));
    }
}
