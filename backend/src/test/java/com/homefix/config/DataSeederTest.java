package com.homefix.config;

import com.homefix.entity.User;
import com.homefix.repository.BookingRepository;
import com.homefix.repository.CouponRepository;
import com.homefix.repository.ReviewRepository;
import com.homefix.repository.ServiceCategoryRepository;
import com.homefix.repository.ServicePackageRepository;
import com.homefix.repository.UserRepository;
import com.homefix.repository.WebsiteContentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataSeederTest {
    @Mock
    private UserRepository userRepository;
    @Mock
    private ServiceCategoryRepository categoryRepository;
    @Mock
    private ServicePackageRepository packageRepository;
    @Mock
    private CouponRepository couponRepository;
    @Mock
    private WebsiteContentRepository contentRepository;
    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    private DataSeeder dataSeeder;

    @BeforeEach
    void setUp() {
        dataSeeder = new DataSeeder(
                userRepository,
                categoryRepository,
                packageRepository,
                couponRepository,
                contentRepository,
                bookingRepository,
                reviewRepository,
                passwordEncoder
        );
    }

    @Test
    void run_shouldNotDeleteOrOverwriteExistingData() throws Exception {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(new User()));
        when(categoryRepository.count()).thenReturn(1L);
        when(couponRepository.count()).thenReturn(1L);
        when(contentRepository.count()).thenReturn(1L);
        when(bookingRepository.count()).thenReturn(1L);

        dataSeeder.run();

        verify(reviewRepository, never()).deleteAllInBatch();
        verify(bookingRepository, never()).deleteAllInBatch();
        verify(couponRepository, never()).deleteAllInBatch();
        verify(packageRepository, never()).deleteAllInBatch();
        verify(categoryRepository, never()).deleteAllInBatch();
        verify(userRepository, never()).deleteAllInBatch();
        verify(contentRepository, never()).deleteAllInBatch();
        verify(contentRepository, never()).deleteAll();
        verify(userRepository, never()).save(any(User.class));
        verify(categoryRepository, never()).saveAll(any());
        verify(packageRepository, never()).saveAll(any());
        verify(couponRepository, never()).saveAll(any());
        verify(contentRepository, never()).saveAll(any());
    }
}
