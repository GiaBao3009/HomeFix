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
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class BookingService {
    private static final BigDecimal COMMISSION_RATE = new BigDecimal("0.10");
    private static final List<BookingStatus> ACTIVE_WORK_STATUSES = List.of(BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS);

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ServicePackageRepository servicePackageRepository;
    private final CouponRepository couponRepository;
    private final NotificationService notificationService;
    private final TechnicianMatchingService technicianMatchingService;
    private final TechnicianEngagementService technicianEngagementService;
    private final JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@homefix.local}")
    private String mailFrom;

    public BookingService(BookingRepository bookingRepository, UserRepository userRepository,
            ServicePackageRepository servicePackageRepository, CouponRepository couponRepository,
            NotificationService notificationService, TechnicianMatchingService technicianMatchingService,
            TechnicianEngagementService technicianEngagementService, JavaMailSender mailSender) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.servicePackageRepository = servicePackageRepository;
        this.couponRepository = couponRepository;
        this.notificationService = notificationService;
        this.technicianMatchingService = technicianMatchingService;
        this.technicianEngagementService = technicianEngagementService;
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
        booking.setPaymentMethod(normalizePaymentMethod(dto.getPaymentMethod()));
        booking.setPaymentStatus("PENDING");
        booking.setStatus(BookingStatus.CONFIRMED);

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

        notificationService.createNotification(
                customer,
                "Booking created",
                "Booking #" + saved.getId() + " is waiting for a matching technician.",
                "ORDER",
                saved.getId());
        publishBooking(saved, null);

        try {
            sendBookingCreatedEmail(saved);
        } catch (RuntimeException ignored) {
        }

        BookingDto result = mapToDto(saved);
        result.setDiscountAmount(discountAmount);
        result.setCouponCode(dto.getCouponCode());
        return result;
    }

    @Transactional(readOnly = true)
    public List<BookingDto> getMyBookings() {
        User user = getCurrentUser();

        List<Booking> bookings;
        if (user.getRole() == Role.ADMIN) {
            bookings = bookingRepository.findAll();
        } else if (user.getRole() == Role.TECHNICIAN) {
            bookings = bookingRepository.findVisibleToTechnicianOrderByCreatedAtDesc(user);
        } else {
            bookings = bookingRepository.findByCustomer(user);
        }

        return bookings.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingDto> getAllBookings() {
        return bookingRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingDto> getAvailableBookingsForTechnician() {
        User technician = getCurrentUser();
        if (technician.getRole() != Role.TECHNICIAN) {
            throw new RuntimeException("Only technicians can see dispatch feed");
        }

        return bookingRepository.findOpenBookingsForDispatch().stream()
                .filter(booking -> technicianMatchingService.canSeeDispatchFeed(technician, booking))
                .map(booking -> {
                    BookingDto dto = mapToDto(booking);
                    String dispatchBlockReason = technicianMatchingService.getDispatchBlockReason(technician, booking);
                    dto.setDispatchEligible(dispatchBlockReason == null);
                    dto.setDispatchBlockReason(dispatchBlockReason);
                    return dto;
                })
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
            if (!isTechnicianOnBooking(currentUser, booking)) {
                throw new RuntimeException("You are not part of this booking");
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
            technicianEngagementService.notifyChatRetentionAfterCompletion(booking);
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
        throw new RuntimeException("Manual admin assignment is disabled in the live dispatch flow");
    }

    @Transactional
    public BookingDto claimBooking(Long bookingId) {
        User technician = getCurrentUser();
        ensureTechnicianCanWork(technician);

        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!technicianMatchingService.isOpenForDispatch(booking) || booking.getTechnician() != null) {
            throw new RuntimeException("This booking has already been claimed");
        }
        if (!technicianMatchingService.canClaimBooking(technician, booking)) {
            throw new RuntimeException("You are not eligible to claim this booking");
        }

        booking.setTechnician(technician);
        booking.setStatus(BookingStatus.ASSIGNED);
        booking.setRejectionReason(null);

        notificationService.createNotification(
                booking.getCustomer(),
                "Technician claimed booking",
                "Technician " + technician.getFullName() + " claimed booking #" + booking.getId() + ".",
                "ORDER",
                booking.getId());
        notificationService.createNotification(
                technician,
                "Booking claimed",
                "You claimed booking #" + booking.getId() + ".",
                "JOB_ASSIGNMENT",
                booking.getId());

        return mapToDto(bookingRepository.save(booking));
    }

    @Transactional
    public BookingDto technicianResponse(Long bookingId, boolean accepted, String reason) {
        User technician = getCurrentUser();
        ensureTechnicianCanWork(technician);

        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getTechnician() == null || !booking.getTechnician().getId().equals(technician.getId())) {
            throw new RuntimeException("You are not assigned as the main technician of this booking");
        }
        if (booking.getStatus() != BookingStatus.ASSIGNED) {
            throw new RuntimeException("Only ASSIGNED booking can be accepted or released");
        }

        if (accepted) {
            booking.setStatus(BookingStatus.IN_PROGRESS);
            booking.setRejectionReason(null);
            notificationService.createNotification(
                    booking.getCustomer(),
                    "Technician started the job",
                    "Technician " + technician.getFullName() + " started booking #" + booking.getId() + ".",
                    "ORDER",
                    booking.getId());
        } else {
            if (reason == null || reason.trim().isEmpty()) {
                throw new RuntimeException("Please provide a reason for rejection");
            }

            notifyAssistantsReleased(booking);
            booking.setRejectionReason(reason.trim());
            booking.setTechnician(null);
            booking.setAssistantTechnicians(new LinkedHashSet<>());
            booking.setStatus(BookingStatus.CONFIRMED);

            notificationService.createNotification(
                    booking.getCustomer(),
                    "Booking reopened",
                    "Booking #" + booking.getId() + " is back in the dispatch queue.",
                    "ORDER",
                    booking.getId());
            publishBooking(booking, technician.getId());
        }

        return mapToDto(bookingRepository.save(booking));
    }

    @Transactional
    public BookingDto addAssistantToBooking(Long bookingId, Long assistantId) {
        User mainTechnician = getCurrentUser();
        ensureMainTechnicianCanManageAssistants(mainTechnician);

        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (booking.getTechnician() == null || !booking.getTechnician().getId().equals(mainTechnician.getId())) {
            throw new RuntimeException("You are not the main technician of this booking");
        }
        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot add assistants to a closed booking");
        }

        User assistant = userRepository.findById(assistantId)
                .orElseThrow(() -> new RuntimeException("Assistant not found"));
        ensureAssistantEligibleForBooking(assistant, mainTechnician, booking);

        booking.getAssistantTechnicians().add(assistant);
        Booking saved = bookingRepository.save(booking);

        notificationService.createNotification(
                assistant,
                "Assigned as assistant",
                "You were added as an assistant to booking #" + booking.getId() + ".",
                "JOB_ASSIGNMENT",
                booking.getId());
        notificationService.createNotification(
                booking.getCustomer(),
                "Booking team updated",
                "Main technician " + mainTechnician.getFullName() + " added an assistant to booking #" + booking.getId() + ".",
                "ORDER",
                booking.getId());

        return mapToDto(saved);
    }

    @Transactional
    public BookingDto removeAssistantFromBooking(Long bookingId, Long assistantId) {
        User mainTechnician = getCurrentUser();
        ensureMainTechnicianCanManageAssistants(mainTechnician);

        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (booking.getTechnician() == null || !booking.getTechnician().getId().equals(mainTechnician.getId())) {
            throw new RuntimeException("You are not the main technician of this booking");
        }

        User removedAssistant = booking.getAssistantTechnicians().stream()
                .filter(item -> item.getId().equals(assistantId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Assistant is not on this booking"));

        booking.getAssistantTechnicians().removeIf(item -> item.getId().equals(assistantId));
        Booking saved = bookingRepository.save(booking);

        notificationService.createNotification(
                removedAssistant,
                "Removed from booking",
                "You were removed from booking #" + booking.getId() + ".",
                "JOB_ASSIGNMENT",
                booking.getId());

        return mapToDto(saved);
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
            publishBooking(booking, null);
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
            throw new RuntimeException("Cannot confirm payment for a cancelled booking");
        }
        booking.setPaymentStatus("PAID");
        return mapToDto(bookingRepository.save(booking));
    }

    @Transactional(readOnly = true)
    public List<BookingDto> getMyCompletedJobsWithEarnings() {
        User technician = getCurrentUser();
        if (technician.getRole() != Role.TECHNICIAN) {
            throw new RuntimeException("Account is not a technician");
        }
        return bookingRepository.findByTechnicianAndStatus(technician, BookingStatus.COMPLETED).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingDto cancelBooking(Long bookingId) {
        User currentUser = getCurrentUser();

        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (currentUser.getRole() != Role.ADMIN &&
                !booking.getCustomer().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You are not allowed to cancel this booking");
        }
        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new RuntimeException("Only PENDING/CONFIRMED bookings can be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        notifyAssistantsReleased(booking);
        Booking saved = bookingRepository.save(booking);

        if (booking.getTechnician() != null) {
            notificationService.createNotification(
                    booking.getTechnician(),
                    "Booking cancelled",
                    "Booking #" + booking.getId() + " has been cancelled by the customer/admin.",
                    "ORDER_CANCELLED",
                    booking.getId());
        }
        for (User assistant : booking.getAssistantTechnicians()) {
            notificationService.createNotification(
                    assistant,
                    "Booking cancelled",
                    "Booking #" + booking.getId() + " has been cancelled.",
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
            case PENDING -> Set.of(BookingStatus.CONFIRMED, BookingStatus.CANCELLED).contains(target);
            case CONFIRMED -> Set.of(BookingStatus.ASSIGNED, BookingStatus.CANCELLED).contains(target);
            case ASSIGNED -> Set.of(BookingStatus.IN_PROGRESS, BookingStatus.CONFIRMED, BookingStatus.CANCELLED)
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

        BigDecimal commission = booking.getTotalPrice().multiply(COMMISSION_RATE)
                .setScale(0, java.math.RoundingMode.HALF_UP);
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
            throw new RuntimeException("Technician must complete profile before taking jobs");
        }
        if (technician.getTechnicianType() == TechnicianType.MAIN
                && technician.getTechnicianApprovalStatus() != TechnicianApprovalStatus.APPROVED) {
            throw new RuntimeException("Main technician is still waiting for approval");
        }
        if (technician.getTechnicianType() == TechnicianType.ASSISTANT
                && technician.getSupervisingTechnician() == null) {
            throw new RuntimeException("Assistant technician must belong to a main technician");
        }
    }

    private boolean isTechnicianReadyForDispatch(User technician) {
        try {
            ensureTechnicianCanWork(technician);
            return technician.isAvailableForAutoAssign();
        } catch (RuntimeException ex) {
            return false;
        }
    }

    private void ensureMainTechnicianCanManageAssistants(User technician) {
        ensureTechnicianCanWork(technician);
        if (technician.getTechnicianType() != TechnicianType.MAIN) {
            throw new RuntimeException("Only main technicians can manage assistants");
        }
    }

    private boolean isTechnicianOnBooking(User technician, Booking booking) {
        if (booking.getTechnician() != null && booking.getTechnician().getId().equals(technician.getId())) {
            return true;
        }
        return booking.getAssistantTechnicians().stream()
                .anyMatch(assistant -> assistant.getId().equals(technician.getId()));
    }

    private void ensureAssistantEligibleForBooking(User assistant, User mainTechnician, Booking booking) {
        if (assistant.getId().equals(mainTechnician.getId())) {
            throw new RuntimeException("Main technician cannot add themselves as assistant");
        }
        if (assistant.getRole() != Role.TECHNICIAN
                || assistant.getTechnicianType() != TechnicianType.ASSISTANT
                || !assistant.isTechnicianProfileCompleted()
                || assistant.getTechnicianApprovalStatus() != TechnicianApprovalStatus.APPROVED) {
            throw new RuntimeException("Selected technician is not an eligible assistant");
        }
        if (assistant.getSupervisingTechnician() == null
                || !assistant.getSupervisingTechnician().getId().equals(mainTechnician.getId())) {
            throw new RuntimeException("Assistant must belong to the current main technician");
        }
        if (!isWithinAvailability(assistant, booking.getBookingTime())) {
            throw new RuntimeException("Assistant is outside their availability window");
        }
        if (bookingRepository.existsByTechnicianAndBookingTimeAndStatusIn(
                assistant,
                booking.getBookingTime(),
                ACTIVE_WORK_STATUSES)
                || bookingRepository.existsByAssistantTechniciansContainingAndBookingTimeAndStatusIn(
                        assistant,
                        booking.getBookingTime(),
                        ACTIVE_WORK_STATUSES)) {
            throw new RuntimeException("Assistant already has another booking at this timeslot");
        }
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

    private void publishBooking(Booking booking, Long excludedTechnicianId) {
        List<User> candidates = technicianMatchingService.findMatchingTechnicians(
                booking.getServicePackage(),
                booking.getBookingTime(),
                booking.getAddress(),
                20);

        List<User> notifiedTechnicians = candidates.stream()
                .filter(candidate -> excludedTechnicianId == null || !candidate.getId().equals(excludedTechnicianId))
                .toList();

        if (notifiedTechnicians.isEmpty()) {
            List<User> admins = userRepository.findByRole(Role.ADMIN);
            for (User admin : admins) {
                notificationService.createNotification(
                        admin,
                        "No technician available",
                        "Booking #" + booking.getId() + " is open but no matching technician is available right now.",
                        "JOB_MATCHING",
                        booking.getId());
            }
            return;
        }

        for (User technician : notifiedTechnicians) {
            notificationService.createNotification(
                    technician,
                    "New open booking",
                    "Booking #" + booking.getId() + " matches your category. Claim it before another technician does.",
                    "JOB_ASSIGNMENT",
                    booking.getId());
        }
    }

    private void notifyAssistantsReleased(Booking booking) {
        for (User assistant : booking.getAssistantTechnicians()) {
            notificationService.createNotification(
                    assistant,
                    "Assistant assignment released",
                    "Your assistant assignment on booking #" + booking.getId() + " has been removed.",
                    "JOB_ASSIGNMENT",
                    booking.getId());
        }
    }

    private String getPaymentStatusText(String paymentStatus) {
        return switch (paymentStatus) {
            case "PAID" -> "Paid";
            case "FAILED" -> "Failed";
            default -> "Pending";
        };
    }

    private String getPaymentMethodText(String paymentMethod) {
        return switch (paymentMethod) {
            case "MOMO" -> "MoMo";
            case "VNPAY" -> "VNPay";
            default -> "Cash";
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
            helper.setSubject("HomeFix - Booking #" + booking.getId());
            helper.setText(
                    "Hello " + booking.getCustomer().getFullName() + ",\n\n"
                            + "Your booking has been created successfully.\n"
                            + "Booking ID: #" + booking.getId() + "\n"
                            + "Scheduled time: " + bookingTimeText + "\n"
                            + "Address: " + booking.getAddress() + "\n"
                            + "Payment method: " + paymentMethodText + "\n"
                            + "Payment status: " + paymentStatusText + "\n"
                            + "Total: " + totalPriceText + " VND\n\n"
                            + "HomeFix",
                    "<!doctype html><html lang=\"en\"><head><meta charset=\"UTF-8\" />"
                            + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /></head>"
                            + "<body style=\"margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a;\">"
                            + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"padding:24px 12px;\">"
                            + "<tr><td align=\"center\"><table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:620px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;\">"
                            + "<tr><td style=\"padding:24px;background:linear-gradient(135deg,#2563eb,#06b6d4);color:#ffffff;\">"
                            + "<div style=\"font-size:22px;font-weight:700;line-height:30px;\">HomeFix</div>"
                            + "<div style=\"font-size:14px;line-height:22px;margin-top:6px;opacity:0.95;\">Booking confirmation</div>"
                            + "</td></tr>"
                            + "<tr><td style=\"padding:24px;\">"
                            + "<p style=\"margin:0 0 14px;font-size:15px;line-height:23px;\">Hello <strong>" + booking.getCustomer().getFullName() + "</strong>,</p>"
                            + "<p style=\"margin:0 0 16px;font-size:14px;line-height:22px;color:#334155;\">Your booking is now in the live technician dispatch queue.</p>"
                            + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"border-collapse:collapse;font-size:14px;line-height:22px;color:#1e293b;\">"
                            + "<tr><td style=\"padding:8px 0;width:42%;color:#64748b;\">Booking ID</td><td style=\"padding:8px 0;\">#" + booking.getId() + "</td></tr>"
                            + "<tr><td style=\"padding:8px 0;color:#64748b;\">Scheduled time</td><td style=\"padding:8px 0;\">" + bookingTimeText + "</td></tr>"
                            + "<tr><td style=\"padding:8px 0;color:#64748b;\">Address</td><td style=\"padding:8px 0;\">" + booking.getAddress() + "</td></tr>"
                            + "<tr><td style=\"padding:8px 0;color:#64748b;\">Payment method</td><td style=\"padding:8px 0;\">" + paymentMethodText + "</td></tr>"
                            + "<tr><td style=\"padding:8px 0;color:#64748b;\">Payment status</td><td style=\"padding:8px 0;\">" + paymentStatusText + "</td></tr>"
                            + "<tr><td style=\"padding:8px 0;color:#64748b;\">Total</td><td style=\"padding:8px 0;\">" + totalPriceText + " VND</td></tr>"
                            + "</table>"
                            + "</td></tr>"
                            + "</table></td></tr></table></body></html>");

            mailSender.send(message);
        } catch (MailException | MessagingException ex) {
            throw new RuntimeException("Unable to send booking confirmation email");
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
        dto.setAssistantTechnicianIds(entity.getAssistantTechnicians().stream().map(User::getId).toList());
        dto.setAssistantTechnicianNames(entity.getAssistantTechnicians().stream().map(User::getFullName).toList());
        return dto;
    }
}
