package com.homefix.service;

import com.homefix.common.BookingStatus;
import com.homefix.common.Role;
import com.homefix.dto.BookingDto;
import com.homefix.entity.Booking;
import com.homefix.entity.ServicePackage;
import com.homefix.entity.User;
import com.homefix.entity.Coupon;
import com.homefix.repository.CouponRepository;
import com.homefix.repository.BookingRepository;
import com.homefix.repository.ServicePackageRepository;
import com.homefix.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingService {
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ServicePackageRepository servicePackageRepository;
    private final CouponRepository couponRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public BookingService(BookingRepository bookingRepository, UserRepository userRepository,
            ServicePackageRepository servicePackageRepository, CouponRepository couponRepository,
            NotificationService notificationService, EmailService emailService) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.servicePackageRepository = servicePackageRepository;
        this.couponRepository = couponRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    @Transactional
    public BookingDto createBooking(BookingDto dto) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User customer = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ServicePackage servicePackage = servicePackageRepository.findById(dto.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found"));

        Booking booking = new Booking();
        booking.setCustomer(customer);
        booking.setServicePackage(servicePackage);
        booking.setBookingTime(dto.getBookingTime());
        booking.setAddress(dto.getAddress());
        booking.setNote(dto.getNote());
        booking.setPaymentMethod(dto.getPaymentMethod());
        booking.setPaymentStatus("PENDING");
        booking.setStatus(BookingStatus.PENDING);

        BigDecimal originalPrice = servicePackage.getPrice();
        BigDecimal finalPrice = originalPrice;
        BigDecimal discountAmount = BigDecimal.ZERO;

        // Handle Coupon
        if (dto.getCouponCode() != null && !dto.getCouponCode().trim().isEmpty()) {
            Coupon coupon = couponRepository.findByCode(dto.getCouponCode())
                    .orElseThrow(() -> new RuntimeException("Mã giảm giá không tồn tại"));

            // Validate Coupon
            if (!"ACTIVE".equals(coupon.getStatus())) {
                throw new RuntimeException("Mã giảm giá không hoạt động");
            }
            if (coupon.getValidUntil() != null && coupon.getValidUntil().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Mã giảm giá đã hết hạn");
            }
            if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
                throw new RuntimeException("Mã giảm giá đã hết lượt sử dụng");
            }

            // Calculate Discount
            BigDecimal discount = originalPrice.multiply(BigDecimal.valueOf(coupon.getDiscountPercent() / 100.0));
            if (coupon.getMaxDiscountAmount() != null) {
                discount = discount.min(coupon.getMaxDiscountAmount());
            }

            discountAmount = discount;
            finalPrice = originalPrice.subtract(discount);
            if (finalPrice.compareTo(BigDecimal.ZERO) < 0) {
                finalPrice = BigDecimal.ZERO;
            }

            // Update Coupon Usage
            coupon.setUsedCount(coupon.getUsedCount() + 1);
            couponRepository.save(coupon);
        }

        booking.setTotalPrice(finalPrice);

        Booking saved = bookingRepository.save(booking);

        // Notify Customer
        notificationService.createNotification(
                customer,
                "Đặt lịch thành công",
                "Đơn hàng #" + saved.getId() + " của bạn đã được tạo thành công.",
                "ORDER",
                saved.getId());

        BookingDto result = mapToDto(saved);
        result.setDiscountAmount(discountAmount);
        result.setCouponCode(dto.getCouponCode());

        // Send booking confirmation email for CASH payment immediately
        if ("CASH".equals(saved.getPaymentMethod())) {
            emailService.sendBookingConfirmationEmail(saved);
        }

        return result;
    }

    @Transactional
    public BookingDto confirmPayment(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if ("PAID".equals(booking.getPaymentStatus())) {
            throw new RuntimeException("Đơn hàng đã được xác nhận thanh toán rồi");
        }

        booking.setPaymentStatus("PAID");
        Booking saved = bookingRepository.save(booking);

        // Notify customer
        notificationService.createNotification(
                booking.getCustomer(),
                "Xác nhận thanh toán",
                "Đơn hàng #" + booking.getId() + " đã được xác nhận thanh toán.",
                "PAYMENT",
                booking.getId());

        // Send booking confirmation email after payment confirmed
        emailService.sendBookingConfirmationEmail(saved);

        return mapToDto(saved);
    }

    public List<BookingDto> getMyBookings() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        List<Booking> bookings;
        if (user.getRole() == Role.ADMIN) {
            bookings = bookingRepository.findAll();
        } else if (user.getRole() == Role.TECHNICIAN) {
            bookings = bookingRepository.findByTechnician(user);
        } else {
            bookings = bookingRepository.findByCustomer(user);
        }

        return bookings.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<BookingDto> getAllBookings() {
        return bookingRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public BookingDto updateStatus(Long bookingId, BookingStatus status) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Add logic validation if needed (e.g. only Admin/Tech can update)
        booking.setStatus(status);
        
        if (status == BookingStatus.COMPLETED) {
            booking.setCompletedAt(LocalDateTime.now());
            booking.setPaymentStatus("PAID"); // Auto mark as paid if completed (or depend on payment method)
            
            // Notify Customer to rate
            notificationService.createNotification(
                booking.getCustomer(),
                "Đơn hàng hoàn thành",
                "Đơn hàng #" + booking.getId() + " đã hoàn thành. Vui lòng đánh giá dịch vụ.",
                "ORDER_COMPLETED",
                booking.getId());
        } else {
             // Notify Customer
            notificationService.createNotification(
                booking.getCustomer(),
                "Cập nhật trạng thái đơn hàng",
                "Đơn hàng #" + booking.getId() + " đã chuyển sang trạng thái: " + status,
                "ORDER",
                booking.getId());
        }
        
        Booking saved = bookingRepository.save(booking);

        return mapToDto(saved);
    }

    public BookingDto assignTechnician(Long bookingId, Long technicianId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new RuntimeException("Technician not found"));

        if (technician.getRole() != Role.TECHNICIAN) {
            throw new RuntimeException("User is not a technician");
        }

        booking.setTechnician(technician);
        booking.setStatus(BookingStatus.ASSIGNED);
        Booking saved = bookingRepository.save(booking);

        // Notify Technician
        notificationService.createNotification(
                technician,
                "Phân công công việc mới",
                "Bạn được phân công đơn hàng #" + booking.getId() + ". Vui lòng xác nhận.",
                "JOB_ASSIGNMENT",
                booking.getId());

        return mapToDto(saved);
    }

    public BookingDto technicianResponse(Long bookingId, boolean accepted, String reason) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User technician = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Verify that the current user is indeed the assigned technician
        if (booking.getTechnician() == null || !booking.getTechnician().getId().equals(technician.getId())) {
            throw new RuntimeException("Bạn không được phân công cho đơn hàng này");
        }

        if (accepted) {
            booking.setStatus(BookingStatus.IN_PROGRESS);
            booking.setRejectionReason(null);

            // Notify Customer
            notificationService.createNotification(
                    booking.getCustomer(),
                    "Kỹ thuật viên đã nhận đơn",
                    "Kỹ thuật viên " + technician.getFullName() + " đã tiếp nhận đơn hàng #" + booking.getId(),
                    "ORDER",
                    booking.getId());
        } else {
            // Require reason for rejection
            if (reason == null || reason.trim().isEmpty()) {
                throw new RuntimeException("Vui lòng cung cấp lý do từ chối");
            }
            booking.setStatus(BookingStatus.DECLINED);
            booking.setRejectionReason(reason);

            // Notify Admins
            List<User> admins = userRepository.findByRole(Role.ADMIN);
            for (User admin : admins) {
                notificationService.createNotification(
                        admin,
                        "Kỹ thuật viên từ chối công việc",
                        "Kỹ thuật viên " + technician.getFullName() + " muốn từ chối đơn hàng #" + booking.getId()
                                + ". Lý do: " + reason,
                        "JOB_REJECTED",
                        booking.getId());
            }
        }

        return mapToDto(bookingRepository.save(booking));
    }

    public BookingDto reviewDecline(Long bookingId, boolean approve) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() != BookingStatus.DECLINED) {
            throw new RuntimeException("Booking is not in DECLINED state");
        }

        if (approve) {
            // Admin accepts the rejection -> Remove technician, set back to CONFIRMED
            // (ready for new assignment)
            // Or PENDING depending on logic. Let's use CONFIRMED as it was paid/verified.
            booking.setTechnician(null);
            booking.setStatus(BookingStatus.CONFIRMED);
            booking.setRejectionReason(null);

            // Optional: Notify technician they are free? Or just silent.
        } else {
            // Admin rejects the rejection -> Force technician to do it
            booking.setStatus(BookingStatus.ASSIGNED);
            // Notify Technician
            if (booking.getTechnician() != null) {
                notificationService.createNotification(
                        booking.getTechnician(),
                        "Yêu cầu từ chối bị bác bỏ",
                        "Admin không chấp nhận lý do từ chối của bạn cho đơn hàng #" + booking.getId()
                                + ". Vui lòng thực hiện công việc.",
                        "JOB_FORCED",
                        booking.getId());
            }
        }

        return mapToDto(bookingRepository.save(booking));
    }

    private BookingDto mapToDto(Booking entity) {
        BookingDto dto = new BookingDto(
                entity.getId(),
                entity.getCustomer().getId(),
                entity.getCustomer().getFullName(),
                entity.getServicePackage().getId(),
                entity.getServicePackage().getName(),
                entity.getTechnician() != null ? entity.getTechnician().getId() : null,
                entity.getTechnician() != null ? entity.getTechnician().getFullName() : null,
                entity.getBookingTime(),
                entity.getAddress(),
                entity.getNote(),
                entity.getPaymentMethod(),
                entity.getPaymentStatus(),
                entity.getStatus(),
                entity.getTotalPrice(),
                entity.getCreatedAt(),
                entity.getRejectionReason());

        if (entity.getCoupon() != null) {
            dto.setCouponId(entity.getCoupon().getId());
            dto.setCouponCode(entity.getCoupon().getCode());
        }

        return dto;
    }
}
