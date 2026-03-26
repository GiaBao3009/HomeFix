package com.homefix.service;

import com.homefix.common.BookingStatus;
import com.homefix.common.Role;
import com.homefix.common.TechnicianApprovalStatus;
import com.homefix.common.TechnicianType;
import com.homefix.dto.BookingDto;
import com.homefix.entity.Booking;
import com.homefix.entity.Coupon;
import com.homefix.entity.ServicePackage;
import com.homefix.entity.User;
import com.homefix.repository.BookingRepository;
import com.homefix.repository.CouponRepository;
import com.homefix.repository.ServicePackageRepository;
import com.homefix.repository.UserRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class BookingService {
    private static final BigDecimal COMMISSION_RATE = new BigDecimal("0.10");
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ServicePackageRepository servicePackageRepository;
    private final CouponRepository couponRepository;
    private final NotificationService notificationService;
    private final TechnicianMatchingService technicianMatchingService;
    private final JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@homefix.local}")
    private String mailFrom;

    public BookingService(BookingRepository bookingRepository, UserRepository userRepository,
            ServicePackageRepository servicePackageRepository, CouponRepository couponRepository,
            NotificationService notificationService, TechnicianMatchingService technicianMatchingService,
            JavaMailSender mailSender) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.servicePackageRepository = servicePackageRepository;
        this.couponRepository = couponRepository;
        this.notificationService = notificationService;
        this.technicianMatchingService = technicianMatchingService;
        this.mailSender = mailSender;
    }

    @Transactional
    public BookingDto createBooking(BookingDto dto) {
        User customer = getCurrentUser();

        ServicePackage servicePackage = servicePackageRepository.findById(dto.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found"));

        Booking booking = new Booking();
        booking.setCustomer(customer);
        booking.setServicePackage(servicePackage);
        booking.setBookingTime(dto.getBookingTime());
        booking.setAddress(dto.getAddress());
        booking.setNote(dto.getNote());
        String paymentMethod = normalizePaymentMethod(dto.getPaymentMethod());
        booking.setPaymentMethod(paymentMethod);
        booking.setPaymentStatus("UNPAID");
        booking.setStatus(BookingStatus.PENDING);

        BigDecimal originalPrice = servicePackage.getPrice();
        BigDecimal finalPrice = originalPrice;
        BigDecimal discountAmount = BigDecimal.ZERO;

        if (dto.getCouponCode() != null && !dto.getCouponCode().trim().isEmpty()) {
            Coupon coupon = couponRepository.findByCode(dto.getCouponCode())
                    .orElseThrow(() -> new RuntimeException("Coupon not found"));

            if (!"ACTIVE".equals(coupon.getStatus())) {
                throw new RuntimeException("Coupon is not active");
            }
            if (coupon.getValidUntil() != null && coupon.getValidUntil().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Coupon has expired");
            }
            if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
                throw new RuntimeException("Coupon usage limit exceeded");
            }

            BigDecimal discount = originalPrice.multiply(BigDecimal.valueOf(coupon.getDiscountPercent() / 100.0));
            if (coupon.getMaxDiscountAmount() != null) {
                discount = discount.min(coupon.getMaxDiscountAmount());
            }

            discountAmount = discount;
            finalPrice = originalPrice.subtract(discount);
            if (finalPrice.compareTo(BigDecimal.ZERO) < 0) {
                finalPrice = BigDecimal.ZERO;
            }

            booking.setCoupon(coupon);
            coupon.setUsedCount(coupon.getUsedCount() + 1);
            couponRepository.save(coupon);
        }

        booking.setTotalPrice(finalPrice);
        Booking saved = bookingRepository.save(booking);
        autoAssignTechnician(saved);
        saved = bookingRepository.save(saved);

        notificationService.createNotification(
                customer,
                "Booking created",
                "Your booking #" + saved.getId() + " has been created successfully.",
                "ORDER",
                saved.getId());
        try {
            sendBookingCreatedEmail(saved);
        } catch (RuntimeException ignored) {
        }

        BookingDto result = mapToDto(saved);
        result.setDiscountAmount(discountAmount);
        result.setCouponCode(dto.getCouponCode());
        return result;
    }

    public List<BookingDto> getMyBookings() {
        User user = getCurrentUser();

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

    @Transactional
    public BookingDto updateStatus(Long bookingId, BookingStatus newStatus) {
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (newStatus == null) {
            throw new RuntimeException("Status is required");
        }

        User currentUser = getCurrentUser();
        BookingStatus currentStatus = booking.getStatus();

        if (currentUser.getRole() == Role.TECHNICIAN) {
            ensureTechnicianCanWork(currentUser);
            if (booking.getTechnician() == null || !booking.getTechnician().getId().equals(currentUser.getId())) {
                throw new RuntimeException("You are not assigned to this booking");
            }
            if (!Set.of(BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED).contains(newStatus)) {
                throw new RuntimeException("Technician can only move booking to IN_PROGRESS or COMPLETED");
            }
        }

        if (!isValidTransition(currentStatus, newStatus)) {
            throw new RuntimeException("Invalid booking status transition: " + currentStatus + " -> " + newStatus);
        }

        booking.setStatus(newStatus);

        if (newStatus == BookingStatus.COMPLETED) {
            booking.setCompletedAt(LocalDateTime.now());
            booking.setPaymentStatus("PAID");
            applyTechnicianSettlement(booking);
            notificationService.createNotification(
                    booking.getCustomer(),
                    "Booking completed",
                    "Booking #" + booking.getId() + " is completed. Please leave a review.",
                    "ORDER_COMPLETED",
                    booking.getId());
        } else {
            booking.setCompletedAt(null);
            notificationService.createNotification(
                    booking.getCustomer(),
                    "Booking status updated",
                    "Booking #" + booking.getId() + " status changed to: " + newStatus,
                    "ORDER",
                    booking.getId());
        }

        Booking saved = bookingRepository.save(booking);
        return mapToDto(saved);
    }

    @Transactional
    public BookingDto assignTechnician(Long bookingId, Long technicianId) {
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new RuntimeException("Technician not found"));

        if (technician.getRole() != Role.TECHNICIAN) {
            throw new RuntimeException("User is not a technician");
        }
        ensureTechnicianCanWork(technician);

        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Cannot assign technician for completed/cancelled booking");
        }

        if (bookingRepository.existsByTechnicianAndBookingTimeAndStatusIn(
                technician,
                booking.getBookingTime(),
                List.of(BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS))) {
            throw new RuntimeException("Technician already has another booking at this timeslot");
        }

        booking.setTechnician(technician);
        booking.setStatus(BookingStatus.ASSIGNED);
        Booking saved = bookingRepository.save(booking);

        notificationService.createNotification(
                technician,
                "New job assigned",
                "You have been assigned booking #" + booking.getId() + ".",
                "JOB_ASSIGNMENT",
                booking.getId());

        return mapToDto(saved);
    }

    @Transactional
    public BookingDto technicianResponse(Long bookingId, boolean accepted, String reason) {
        User technician = getCurrentUser();
        ensureTechnicianCanWork(technician);

        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getTechnician() == null || !booking.getTechnician().getId().equals(technician.getId())) {
            throw new RuntimeException("You are not assigned to this booking");
        }

        if (booking.getStatus() != BookingStatus.ASSIGNED) {
            throw new RuntimeException("Only ASSIGNED booking can be accepted/rejected by technician");
        }

        if (accepted) {
            booking.setStatus(BookingStatus.IN_PROGRESS);
            booking.setRejectionReason(null);

            notificationService.createNotification(
                    booking.getCustomer(),
                    "Technician accepted booking",
                    "Technician " + technician.getFullName() + " accepted booking #" + booking.getId(),
                    "ORDER",
                    booking.getId());
        } else {
            if (reason == null || reason.trim().isEmpty()) {
                throw new RuntimeException("Please provide a reason for rejection");
            }
            booking.setRejectionReason(reason.trim());
            List<User> candidates = technicianMatchingService.findMatchingTechnicians(
                    booking.getServicePackage(),
                    booking.getBookingTime(),
                    booking.getAddress(),
                    5);
            User nextTechnician = candidates.stream()
                    .filter(candidate -> !candidate.getId().equals(technician.getId()))
                    .findFirst()
                    .orElse(null);
            if (nextTechnician != null) {
                booking.setTechnician(nextTechnician);
                booking.setStatus(BookingStatus.ASSIGNED);
                booking.setRejectionReason(null);
                notificationService.createNotification(
                        nextTechnician,
                        "New job assigned",
                        "You have been auto-assigned booking #" + booking.getId() + ".",
                        "JOB_ASSIGNMENT",
                        booking.getId());
                notificationService.createNotification(
                        booking.getCustomer(),
                        "Booking re-assigned",
                        "Booking #" + booking.getId() + " has been reassigned to another technician.",
                        "ORDER",
                        booking.getId());
            } else {
                booking.setTechnician(null);
                booking.setStatus(BookingStatus.CONFIRMED);
                List<User> admins = userRepository.findByRole(Role.ADMIN);
                for (User admin : admins) {
                    notificationService.createNotification(
                            admin,
                            "Need manual follow-up",
                            "No replacement technician found for booking #" + booking.getId()
                                    + " after rejection. Reason: " + reason,
                            "JOB_REJECTED",
                            booking.getId());
                }
            }
        }

        return mapToDto(bookingRepository.save(booking));
    }

    @Transactional
    public BookingDto reviewDecline(Long bookingId, boolean approve) {
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() != BookingStatus.DECLINED) {
            throw new RuntimeException("Booking is not in DECLINED status");
        }

        if (approve) {
            booking.setTechnician(null);
            booking.setStatus(BookingStatus.CONFIRMED);
            booking.setRejectionReason(null);
        } else {
            booking.setStatus(BookingStatus.ASSIGNED);
            if (booking.getTechnician() != null) {
                notificationService.createNotification(
                        booking.getTechnician(),
                        "Rejection denied",
                        "Admin denied your rejection for booking #" + booking.getId() + ". Please continue this job.",
                        "JOB_FORCED",
                        booking.getId());
            }
        }

        return mapToDto(bookingRepository.save(booking));
    }

    @Transactional
    public BookingDto confirmPayment(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Không thể xác nhận thanh toán cho đơn đã hủy");
        }
        booking.setPaymentStatus("PAID");
        return mapToDto(bookingRepository.save(booking));
    }

    public List<BookingDto> getMyCompletedJobsWithEarnings() {
        User technician = getCurrentUser();
        if (technician.getRole() != Role.TECHNICIAN) {
            throw new RuntimeException("Tài khoản không phải kỹ thuật viên");
        }
        return bookingRepository.findByTechnicianAndStatus(technician, BookingStatus.COMPLETED).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingDto cancelBooking(Long bookingId) {
        User currentUser = getCurrentUser();

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (currentUser.getRole() != Role.ADMIN &&
                !booking.getCustomer().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You are not allowed to cancel this booking");
        }

        if (booking.getStatus() != BookingStatus.PENDING &&
                booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new RuntimeException("Only PENDING/CONFIRMED bookings can be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);

        List<User> admins = userRepository.findByRole(Role.ADMIN);
        for (User admin : admins) {
            notificationService.createNotification(
                    admin,
                    "Booking cancelled",
                    "Customer " + booking.getCustomer().getFullName() + " cancelled booking #" + booking.getId(),
                    "ORDER_CANCELLED",
                    booking.getId());
        }

        return mapToDto(saved);
    }

    private boolean isValidTransition(BookingStatus current, BookingStatus target) {
        if (current == null || target == null) {
            return false;
        }
        if (current == target) {
            return true;
        }

        return switch (current) {
            case PENDING -> Set.of(BookingStatus.CONFIRMED, BookingStatus.ASSIGNED, BookingStatus.CANCELLED)
                    .contains(target);
            case CONFIRMED -> Set.of(BookingStatus.ASSIGNED, BookingStatus.CANCELLED).contains(target);
            case ASSIGNED -> Set.of(BookingStatus.IN_PROGRESS, BookingStatus.DECLINED, BookingStatus.CANCELLED)
                    .contains(target);
            case IN_PROGRESS -> Set.of(BookingStatus.COMPLETED, BookingStatus.CANCELLED).contains(target);
            case DECLINED -> Set.of(BookingStatus.CONFIRMED, BookingStatus.ASSIGNED, BookingStatus.CANCELLED)
                    .contains(target);
            case COMPLETED, CANCELLED -> false;
        };
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private String normalizePaymentMethod(String paymentMethod) {
        if (paymentMethod == null || paymentMethod.isBlank()) {
            return "CASH";
        }
        return paymentMethod.trim().toUpperCase();
    }

    private void applyTechnicianSettlement(Booking booking) {
        if (booking.getTechnician() == null || booking.getTotalPrice() == null) {
            return;
        }
        if (booking.getTechnicianEarning() != null && booking.getTechnicianEarning().compareTo(BigDecimal.ZERO) > 0) {
            return;
        }
        BigDecimal commission = booking.getTotalPrice().multiply(COMMISSION_RATE).setScale(0, java.math.RoundingMode.HALF_UP);
        BigDecimal technicianIncome = booking.getTotalPrice().subtract(commission);
        if (technicianIncome.compareTo(BigDecimal.ZERO) < 0) {
            technicianIncome = BigDecimal.ZERO;
        }
        booking.setPlatformProfit(commission);
        booking.setTechnicianEarning(technicianIncome);
        User technician = booking.getTechnician();
        BigDecimal currentBalance = technician.getWalletBalance() == null ? BigDecimal.ZERO : technician.getWalletBalance();
        technician.setWalletBalance(currentBalance.add(technicianIncome));
        userRepository.save(technician);
    }

    private void ensureTechnicianCanWork(User technician) {
        if (technician.getRole() != Role.TECHNICIAN) {
            return;
        }
        if (!technician.isTechnicianProfileCompleted()) {
            throw new RuntimeException("Kỹ thuật viên cần hoàn tất hồ sơ trước khi nhận việc");
        }
        if (technician.getTechnicianType() == TechnicianType.MAIN
                && technician.getTechnicianApprovalStatus() != TechnicianApprovalStatus.APPROVED) {
            throw new RuntimeException("Thợ chính đang chờ admin duyệt kỹ năng");
        }
    }

    private void autoAssignTechnician(Booking booking) {
        List<User> candidates = technicianMatchingService.findMatchingTechnicians(
                booking.getServicePackage(),
                booking.getBookingTime(),
                booking.getAddress(),
                5);
        if (candidates.isEmpty()) {
            booking.setStatus(BookingStatus.CONFIRMED);
            List<User> admins = userRepository.findByRole(Role.ADMIN);
            for (User admin : admins) {
                notificationService.createNotification(
                        admin,
                        "No technician matched",
                        "Booking #" + booking.getId() + " requires manual follow-up.",
                        "JOB_MATCHING",
                        booking.getId());
            }
            return;
        }

        User selected = candidates.get(0);
        booking.setTechnician(selected);
        booking.setStatus(BookingStatus.ASSIGNED);
        notificationService.createNotification(
                selected,
                "New job assigned",
                "You have been auto-assigned booking #" + booking.getId() + ".",
                "JOB_ASSIGNMENT",
                booking.getId());
    }

    private String getPaymentStatusText(String paymentStatus) {
        return switch (paymentStatus) {
            case "PAID" -> "Đã thanh toán";
            case "PENDING_ADMIN_CONFIRMATION" -> "Đã chuyển khoản, chờ admin xác nhận";
            case "FAILED" -> "Thanh toán thất bại";
            default -> "Chưa thanh toán";
        };
    }

    private String getPaymentMethodText(String paymentMethod) {
        return switch (paymentMethod) {
            case "MOMO" -> "MoMo (chuyển khoản)";
            case "VNPAY" -> "VNPay (chuyển khoản)";
            default -> "Tiền mặt";
        };
    }

    private void sendBookingCreatedEmail(Booking booking) {
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            String bookingTimeText = booking.getBookingTime().format(formatter);
            String paymentStatusText = getPaymentStatusText(booking.getPaymentStatus());
            String paymentMethodText = getPaymentMethodText(booking.getPaymentMethod());
            String totalPriceText = booking.getTotalPrice() == null ? "0" : booking.getTotalPrice().toPlainString();

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(booking.getCustomer().getEmail());
            helper.setSubject("HomeFix - Xác nhận đặt lịch #" + booking.getId());
            helper.setText(
                    "Xin chào " + booking.getCustomer().getFullName() + ",\n\n"
                            + "Đơn đặt lịch của bạn đã được tạo thành công.\n"
                            + "Mã đơn: #" + booking.getId() + "\n"
                            + "Thời gian hẹn: " + bookingTimeText + "\n"
                            + "Địa chỉ thực hiện: " + booking.getAddress() + "\n"
                            + "Phương thức thanh toán: " + paymentMethodText + "\n"
                            + "Trạng thái thanh toán: " + paymentStatusText + "\n"
                            + "Tổng tiền: " + totalPriceText + " VND\n\n"
                            + "Trân trọng,\nHomeFix",
                    "<!doctype html><html lang=\"vi\"><head><meta charset=\"UTF-8\" />"
                            + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /></head>"
                            + "<body style=\"margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a;\">"
                            + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"padding:24px 12px;\">"
                            + "<tr><td align=\"center\"><table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:620px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;\">"
                            + "<tr><td style=\"padding:24px;background:linear-gradient(135deg,#2563eb,#06b6d4);color:#ffffff;\">"
                            + "<div style=\"font-size:22px;font-weight:700;line-height:30px;\">HomeFix</div>"
                            + "<div style=\"font-size:14px;line-height:22px;margin-top:6px;opacity:0.95;\">Xác nhận đặt lịch dịch vụ</div>"
                            + "</td></tr>"
                            + "<tr><td style=\"padding:24px;\">"
                            + "<p style=\"margin:0 0 14px;font-size:15px;line-height:23px;\">Xin chào <strong>" + booking.getCustomer().getFullName() + "</strong>,</p>"
                            + "<p style=\"margin:0 0 16px;font-size:14px;line-height:22px;color:#334155;\">Đơn đặt lịch của bạn đã được tạo thành công. Thông tin chi tiết như sau:</p>"
                            + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"border-collapse:collapse;font-size:14px;line-height:22px;color:#1e293b;\">"
                            + "<tr><td style=\"padding:8px 0;width:42%;color:#64748b;\">Mã đơn</td><td style=\"padding:8px 0;\">#" + booking.getId() + "</td></tr>"
                            + "<tr><td style=\"padding:8px 0;color:#64748b;\">Thời gian hẹn</td><td style=\"padding:8px 0;\">" + bookingTimeText + "</td></tr>"
                            + "<tr><td style=\"padding:8px 0;color:#64748b;\">Địa chỉ thực hiện</td><td style=\"padding:8px 0;\">" + booking.getAddress() + "</td></tr>"
                            + "<tr><td style=\"padding:8px 0;color:#64748b;\">Phương thức thanh toán</td><td style=\"padding:8px 0;\">" + paymentMethodText + "</td></tr>"
                            + "<tr><td style=\"padding:8px 0;color:#64748b;\">Trạng thái thanh toán</td><td style=\"padding:8px 0;\">" + paymentStatusText + "</td></tr>"
                            + "<tr><td style=\"padding:8px 0;color:#64748b;\">Tổng tiền</td><td style=\"padding:8px 0;\">" + totalPriceText + " VND</td></tr>"
                            + "</table>"
                            + "<p style=\"margin:18px 0 0;font-size:13px;line-height:21px;color:#64748b;\">Cảm ơn bạn đã sử dụng dịch vụ HomeFix.</p>"
                            + "</td></tr>"
                            + "</table></td></tr></table></body></html>");

            mailSender.send(message);
        } catch (MailException | MessagingException ex) {
            throw new RuntimeException("Không thể gửi email xác nhận đặt lịch");
        }
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
        dto.setTechnicianEarning(entity.getTechnicianEarning());
        dto.setPlatformProfit(entity.getPlatformProfit());

        return dto;
    }
}
