package com.homefix.service;

import com.homefix.common.BookingStatus;
import com.homefix.common.Role;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ServiceDeletionSafetyIntegrationTest {
    @Autowired
    private HomeService homeService;
    @Autowired
    private ServiceCategoryService serviceCategoryService;
    @Autowired
    private BookingSnapshotService bookingSnapshotService;
    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private ServicePackageRepository servicePackageRepository;
    @Autowired
    private ServiceCategoryRepository serviceCategoryRepository;
    @Autowired
    private UserRepository userRepository;
    @MockBean
    private JavaMailSender javaMailSender;

    private ServiceCategory category;
    private ServicePackage servicePackage;
    private Booking booking;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        servicePackageRepository.deleteAll();
        serviceCategoryRepository.deleteAll();
        userRepository.deleteAll();

        category = new ServiceCategory();
        category.setName("Dien nuoc");
        category.setDescription("Sua chua dan dung");
        category = serviceCategoryRepository.save(category);

        servicePackage = new ServicePackage();
        servicePackage.setName("Sua ong nuoc");
        servicePackage.setPrice(BigDecimal.valueOf(250000));
        servicePackage.setCategory(category);
        servicePackage = servicePackageRepository.save(servicePackage);

        User customer = new User();
        customer.setFullName("Customer Delete Guard");
        customer.setEmail("delete-guard@test.com");
        customer.setPassword("x");
        customer.setRole(Role.CUSTOMER);
        customer = userRepository.save(customer);

        booking = new Booking();
        booking.setCustomer(customer);
        booking.setServicePackage(servicePackage);
        booking.setBookingTime(LocalDateTime.of(2026, 6, 10, 9, 0));
        booking.setAddress("123 Delete Guard Street");
        booking.setStatus(BookingStatus.COMPLETED);
        booking.setTotalPrice(servicePackage.getPrice());
        booking = bookingRepository.save(booking);
    }

    @Test
    void deleteCategory_shouldRejectWhenServicesStillExistAndKeepBookingHistory() {
        assertThatThrownBy(() -> serviceCategoryService.deleteCategory(category.getId()))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Khong the xoa danh muc");

        assertThat(serviceCategoryRepository.existsById(category.getId())).isTrue();
        assertThat(servicePackageRepository.existsById(servicePackage.getId())).isTrue();
        assertThat(bookingRepository.existsById(booking.getId())).isTrue();

        ServicePackage savedPackage = servicePackageRepository.findById(servicePackage.getId()).orElseThrow();
        assertThat(savedPackage.getCategory()).isNotNull();
        assertThat(savedPackage.getCategory().getId()).isEqualTo(category.getId());
    }

    @Test
    void deletePackage_shouldRejectWhenBookingsExistAndKeepBookingHistory() {
        assertThatThrownBy(() -> homeService.deletePackage(servicePackage.getId()))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Khong the xoa dich vu");

        assertThat(servicePackageRepository.existsById(servicePackage.getId())).isTrue();
        assertThat(bookingRepository.existsById(booking.getId())).isTrue();

        Booking savedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        assertThat(savedBooking.getServicePackage()).isNotNull();
        assertThat(savedBooking.getServicePackage().getId()).isEqualTo(servicePackage.getId());
    }

    @Test
    void saveBooking_shouldCaptureServiceSnapshotAutomatically() {
        Booking savedBooking = bookingRepository.findById(booking.getId()).orElseThrow();

        assertThat(savedBooking.getServiceNameSnapshot()).isEqualTo("Sua ong nuoc");
        assertThat(savedBooking.getServiceCategoryNameSnapshot()).isEqualTo("Dien nuoc");
        assertThat(savedBooking.getServicePriceSnapshot()).isEqualByComparingTo(BigDecimal.valueOf(250000));
    }

    @Test
    void backfillMissingSnapshots_shouldRestoreFrozenServiceData() {
        booking.setServiceNameSnapshot(null);
        booking.setServiceCategoryNameSnapshot(null);
        booking.setServicePriceSnapshot(null);
        bookingRepository.saveAndFlush(booking);

        int updated = bookingSnapshotService.backfillMissingSnapshots();

        Booking savedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        assertThat(updated).isGreaterThanOrEqualTo(1);
        assertThat(savedBooking.getServiceNameSnapshot()).isEqualTo("Sua ong nuoc");
        assertThat(savedBooking.getServiceCategoryNameSnapshot()).isEqualTo("Dien nuoc");
        assertThat(savedBooking.getServicePriceSnapshot()).isEqualByComparingTo(BigDecimal.valueOf(250000));
    }
}
