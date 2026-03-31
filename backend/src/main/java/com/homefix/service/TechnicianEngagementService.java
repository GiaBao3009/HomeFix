package com.homefix.service;

import com.homefix.common.BookingStatus;
import com.homefix.common.Role;
import com.homefix.common.TicketPriority;
import com.homefix.common.TicketStatus;
import com.homefix.dto.BookingChatMessageDto;
import com.homefix.dto.SupportTicketDto;
import com.homefix.dto.TechnicianLeaderboardDto;
import com.homefix.dto.TicketMessageDto;
import com.homefix.entity.Booking;
import com.homefix.entity.BookingChatMessage;
import com.homefix.entity.SupportTicket;
import com.homefix.entity.SupportTicketMessage;
import com.homefix.entity.TechnicianInteractionLog;
import com.homefix.entity.User;
import com.homefix.repository.BookingChatMessageRepository;
import com.homefix.repository.BookingRepository;
import com.homefix.repository.ReviewRepository;
import com.homefix.repository.SupportTicketMessageRepository;
import com.homefix.repository.SupportTicketRepository;
import com.homefix.repository.TechnicianInteractionLogRepository;
import com.homefix.repository.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class TechnicianEngagementService {
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final SupportTicketMessageRepository supportTicketMessageRepository;
    private final BookingChatMessageRepository bookingChatMessageRepository;
    private final TechnicianInteractionLogRepository technicianInteractionLogRepository;
    private final NotificationService notificationService;

    public TechnicianEngagementService(UserRepository userRepository, BookingRepository bookingRepository,
            ReviewRepository reviewRepository, SupportTicketRepository supportTicketRepository,
            SupportTicketMessageRepository supportTicketMessageRepository,
            BookingChatMessageRepository bookingChatMessageRepository,
            TechnicianInteractionLogRepository technicianInteractionLogRepository,
            NotificationService notificationService) {
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.reviewRepository = reviewRepository;
        this.supportTicketRepository = supportTicketRepository;
        this.supportTicketMessageRepository = supportTicketMessageRepository;
        this.bookingChatMessageRepository = bookingChatMessageRepository;
        this.technicianInteractionLogRepository = technicianInteractionLogRepository;
        this.notificationService = notificationService;
    }

    public List<TechnicianLeaderboardDto> getTechnicianLeaderboard() {
        List<User> technicians = userRepository.findByRole(Role.TECHNICIAN);
        List<TechnicianLeaderboardDto> rows = new ArrayList<>();
        for (User technician : technicians) {
            TechnicianLeaderboardDto dto = new TechnicianLeaderboardDto();
            dto.setTechnicianId(technician.getId());
            dto.setTechnicianName(technician.getFullName());
            Double avg = reviewRepository.findAverageRatingByTechnicianId(technician.getId());
            Long reviewCount = reviewRepository.countByTechnicianId(technician.getId());
            long completed = bookingRepository.countByTechnicianAndStatus(technician, BookingStatus.COMPLETED);
            dto.setAverageRating(avg == null ? 0.0 : Math.round(avg * 100.0) / 100.0);
            dto.setTotalReviews(reviewCount == null ? 0L : reviewCount);
            dto.setCompletedJobs(completed);
            rows.add(dto);
        }
        rows.sort(Comparator
                .comparing(TechnicianLeaderboardDto::getAverageRating, Comparator.reverseOrder())
                .thenComparing(TechnicianLeaderboardDto::getCompletedJobs, Comparator.reverseOrder())
                .thenComparing(TechnicianLeaderboardDto::getTotalReviews, Comparator.reverseOrder()));
        for (int i = 0; i < rows.size(); i++) {
            rows.get(i).setRank(i + 1);
        }
        return rows;
    }

    public Map<String, Object> getAdvancedAnalytics() {
        User technician = getCurrentTechnician();
        long assigned = bookingRepository.countByTechnicianAndStatus(technician, BookingStatus.ASSIGNED);
        long inProgress = bookingRepository.countByTechnicianAndStatus(technician, BookingStatus.IN_PROGRESS);
        long completed = bookingRepository.countByTechnicianAndStatus(technician, BookingStatus.COMPLETED);
        long cancelled = bookingRepository.countByTechnicianAndStatus(technician, BookingStatus.CANCELLED);
        long declined = bookingRepository.countByTechnicianAndStatus(technician, BookingStatus.DECLINED);
        long totalHandled = assigned + inProgress + completed + cancelled + declined;
        double completionRate = totalHandled == 0 ? 0 : (completed * 100.0 / totalHandled);
        Double avgRating = reviewRepository.findAverageRatingByTechnicianId(technician.getId());
        long overdueTickets = supportTicketRepository.countByTechnicianAndDueAtBeforeAndStatusIn(
                technician,
                LocalDateTime.now(),
                List.of(TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_CUSTOMER));
        return Map.of(
                "assigned", assigned,
                "inProgress", inProgress,
                "completed", completed,
                "cancelled", cancelled,
                "declined", declined,
                "completionRate", Math.round(completionRate * 100.0) / 100.0,
                "averageRating", avgRating == null ? 0.0 : Math.round(avgRating * 100.0) / 100.0,
                "overdueTickets", overdueTickets);
    }

    @Transactional
    public SupportTicketDto createTicket(SupportTicketDto dto) {
        User technician = getCurrentTechnician();
        User customer = userRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        if (customer.getRole() != Role.CUSTOMER) {
            throw new RuntimeException("Invalid customer");
        }
        SupportTicket ticket = new SupportTicket();
        ticket.setTitle(dto.getTitle());
        ticket.setDescription(dto.getDescription());
        ticket.setCategory(dto.getCategory());
        ticket.setPriority(dto.getPriority() == null ? TicketPriority.MEDIUM : dto.getPriority());
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setTechnician(technician);
        ticket.setCustomer(customer);
        if (dto.getBookingId() != null) {
            Booking booking = bookingRepository.findById(dto.getBookingId())
                    .orElseThrow(() -> new RuntimeException("Booking not found"));
            ticket.setBooking(booking);
        }
        ticket.setDueAt(calculateDueAt(ticket.getPriority()));
        SupportTicket saved = supportTicketRepository.save(ticket);
        notificationService.createNotification(
                customer,
                "Bạn có ticket hỗ trợ mới",
                "Kỹ thuật viên đã mở ticket hỗ trợ: " + saved.getTitle(),
                "SUPPORT_TICKET",
                saved.getId());
        logInteraction(technician, customer, ticket.getBooking(), "TICKET_CREATED", saved.getTitle());
        return mapTicket(saved);
    }

    @Transactional
    public SupportTicketDto updateTicketStatus(Long ticketId, TicketStatus status) {
        User technician = getCurrentTechnician();
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        if (!ticket.getTechnician().getId().equals(technician.getId())) {
            throw new RuntimeException("Bạn không có quyền cập nhật ticket này");
        }
        ticket.setStatus(status);
        if (status == TicketStatus.RESOLVED || status == TicketStatus.CLOSED) {
            ticket.setResolvedAt(LocalDateTime.now());
        }
        SupportTicket saved = supportTicketRepository.save(ticket);
        notificationService.createNotification(
                ticket.getCustomer(),
                "Cập nhật ticket hỗ trợ",
                "Ticket #" + ticket.getId() + " đã chuyển sang trạng thái " + status.name(),
                "SUPPORT_TICKET",
                ticket.getId());
        logInteraction(technician, ticket.getCustomer(), ticket.getBooking(), "TICKET_STATUS", status.name());
        return mapTicket(saved);
    }

    @Transactional
    public TicketMessageDto addTicketMessage(Long ticketId, String content) {
        User sender = getCurrentUser();
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        if (!ticket.getTechnician().getId().equals(sender.getId()) && !ticket.getCustomer().getId().equals(sender.getId())) {
            throw new RuntimeException("Bạn không có quyền gửi tin nhắn ticket này");
        }
        SupportTicketMessage message = new SupportTicketMessage();
        message.setTicket(ticket);
        message.setSender(sender);
        message.setContent(content.trim());
        SupportTicketMessage saved = supportTicketMessageRepository.save(message);
        User receiver = ticket.getTechnician().getId().equals(sender.getId()) ? ticket.getCustomer() : ticket.getTechnician();
        notificationService.createNotification(
                receiver,
                "Tin nhắn ticket mới",
                sender.getFullName() + ": " + saved.getContent(),
                "SUPPORT_TICKET_MESSAGE",
                ticket.getId());
        logInteraction(ticket.getTechnician(), ticket.getCustomer(), ticket.getBooking(), "TICKET_MESSAGE", saved.getContent());
        return mapTicketMessage(saved);
    }

    public List<SupportTicketDto> getMyTickets() {
        User technician = getCurrentTechnician();
        return supportTicketRepository.findByTechnicianOrderByCreatedAtDesc(technician).stream()
                .map(this::mapTicket)
                .toList();
    }

    public List<TicketMessageDto> getTicketMessages(Long ticketId) {
        User user = getCurrentUser();
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        if (!ticket.getTechnician().getId().equals(user.getId()) && !ticket.getCustomer().getId().equals(user.getId())) {
            throw new RuntimeException("Bạn không có quyền xem ticket này");
        }
        return supportTicketMessageRepository.findByTicketOrderByCreatedAtAsc(ticket).stream()
                .map(this::mapTicketMessage)
                .toList();
    }

    @Transactional
    public BookingChatMessageDto sendChatMessage(Long bookingId, String content) {
        User sender = getCurrentUser();
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (booking.getTechnician() == null) {
            throw new RuntimeException("Booking chưa có kỹ thuật viên");
        }
        boolean allowed = sender.getId().equals(booking.getCustomer().getId())
                || sender.getId().equals(booking.getTechnician().getId())
                || sender.getRole() == Role.ADMIN;
        if (!allowed) {
            throw new RuntimeException("Bạn không có quyền chat trong booking này");
        }
        BookingChatMessage message = new BookingChatMessage();
        message.setBooking(booking);
        message.setSender(sender);
        message.setContent(content.trim());
        LocalDateTime base = booking.getCompletedAt() != null ? booking.getCompletedAt() : LocalDateTime.now();
        message.setExpiresAt(base.plusHours(10));
        BookingChatMessage saved = bookingChatMessageRepository.save(message);
        User receiver = sender.getId().equals(booking.getCustomer().getId()) ? booking.getTechnician() : booking.getCustomer();
        notificationService.createNotification(
                receiver,
                "Tin nhắn booking mới",
                sender.getFullName() + ": " + saved.getContent(),
                "BOOKING_CHAT",
                bookingId);
        if (booking.getTechnician() != null) {
            logInteraction(booking.getTechnician(), booking.getCustomer(), booking, "CHAT_MESSAGE", saved.getContent());
        }
        return mapChat(saved);
    }

    public List<BookingChatMessageDto> getBookingChatMessages(Long bookingId) {
        User user = getCurrentUser();
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        boolean allowed = booking.getCustomer().getId().equals(user.getId())
                || (booking.getTechnician() != null && booking.getTechnician().getId().equals(user.getId()))
                || user.getRole() == Role.ADMIN;
        if (!allowed) {
            throw new RuntimeException("Bạn không có quyền xem chat booking này");
        }
        return bookingChatMessageRepository
                .findByBookingAndDeletedFalseAndExpiresAtAfterOrderByCreatedAtAsc(booking, LocalDateTime.now())
                .stream()
                .map(this::mapChat)
                .toList();
    }

    @Transactional
    @Scheduled(fixedDelay = 300000)
    public void purgeExpiredChats() {
        List<BookingChatMessage> expired = bookingChatMessageRepository.findByDeletedFalseAndExpiresAtBefore(LocalDateTime.now());
        if (expired.isEmpty()) {
            return;
        }
        for (BookingChatMessage message : expired) {
            message.setDeleted(true);
        }
        bookingChatMessageRepository.saveAll(expired);
    }

    @Transactional
    public void notifyChatRetentionAfterCompletion(Booking booking) {
        if (booking.getCustomer() != null) {
            notificationService.createNotification(
                    booking.getCustomer(),
                    "Chat booking sẽ tự xóa sau 10 giờ",
                    "Đơn #" + booking.getId() + " đã hoàn thành. Lịch sử chat sẽ tự xóa sau 10 giờ.",
                    "BOOKING_CHAT_RETENTION",
                    booking.getId());
        }
        if (booking.getTechnician() != null) {
            notificationService.createNotification(
                    booking.getTechnician(),
                    "Chat booking sẽ tự xóa sau 10 giờ",
                    "Đơn #" + booking.getId() + " đã hoàn thành. Lịch sử chat sẽ tự xóa sau 10 giờ.",
                    "BOOKING_CHAT_RETENTION",
                    booking.getId());
        }
    }

    public List<Map<String, Object>> getInteractionHistory() {
        User technician = getCurrentTechnician();
        return technicianInteractionLogRepository.findTop100ByTechnicianOrderByCreatedAtDesc(technician).stream()
                .map(log -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", log.getId());
                    row.put("interactionType", log.getInteractionType());
                    row.put("detail", log.getDetail());
                    row.put("customerName", log.getCustomer() == null ? null : log.getCustomer().getFullName());
                    row.put("bookingId", log.getBooking() == null ? null : log.getBooking().getId());
                    row.put("createdAt", log.getCreatedAt());
                    return row;
                })
                .toList();
    }

    public List<Map<String, Object>> getSmartAlerts() {
        User technician = getCurrentTechnician();
        List<Map<String, Object>> alerts = new ArrayList<>();
        long overdueTickets = supportTicketRepository.countByTechnicianAndDueAtBeforeAndStatusIn(
                technician,
                LocalDateTime.now(),
                List.of(TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_CUSTOMER));
        if (overdueTickets > 0) {
            alerts.add(alert("HIGH", "Bạn có " + overdueTickets + " ticket quá hạn cần xử lý ngay"));
        }
        Double avg = reviewRepository.findAverageRatingByTechnicianId(technician.getId());
        if (avg != null && avg < 3.5) {
            alerts.add(alert("MEDIUM", "Điểm rating hiện tại thấp (" + Math.round(avg * 100.0) / 100.0 + "). Hãy cải thiện phản hồi khách hàng."));
        }
        long activeJobs = bookingRepository.countByTechnicianAndStatusIn(
                technician, List.of(BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS));
        if (activeJobs >= 5) {
            alerts.add(alert("MEDIUM", "Khối lượng việc cao (" + activeJobs + " đơn). Nên cân đối lịch làm việc."));
        }
        if (alerts.isEmpty()) {
            alerts.add(alert("LOW", "Không có cảnh báo mới. Hiệu suất đang ổn định."));
        }
        return alerts;
    }

    public Map<String, Object> generateAutoReport() {
        User technician = getCurrentTechnician();
        long completed = bookingRepository.countByTechnicianAndStatus(technician, BookingStatus.COMPLETED);
        long inProgress = bookingRepository.countByTechnicianAndStatus(technician, BookingStatus.IN_PROGRESS);
        Double avgRating = reviewRepository.findAverageRatingByTechnicianId(technician.getId());
        long reviewCount = reviewRepository.countByTechnicianId(technician.getId());
        BigDecimal revenue = bookingRepository.findByTechnicianAndStatus(technician, BookingStatus.COMPLETED).stream()
                .map(item -> item.getTechnicianEarning() == null ? BigDecimal.ZERO : item.getTechnicianEarning())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("technicianId", technician.getId());
        report.put("technicianName", technician.getFullName());
        report.put("generatedAt", LocalDateTime.now());
        report.put("completedJobs", completed);
        report.put("inProgressJobs", inProgress);
        report.put("averageRating", avgRating == null ? 0.0 : Math.round(avgRating * 100.0) / 100.0);
        report.put("reviewCount", reviewCount);
        report.put("revenue", revenue);
        report.put("recommendation", buildRecommendation(avgRating, completed, inProgress));
        return report;
    }

    private String buildRecommendation(Double avgRating, long completed, long inProgress) {
        if (avgRating != null && avgRating < 4) {
            return "Ưu tiên nâng chất lượng giao tiếp và chăm sóc sau dịch vụ.";
        }
        if (inProgress > completed) {
            return "Tối ưu lịch làm việc để tăng tỉ lệ hoàn thành.";
        }
        return "Hiệu suất ổn định. Tiếp tục duy trì tốc độ phản hồi nhanh.";
    }

    private LocalDateTime calculateDueAt(TicketPriority priority) {
        return switch (priority) {
            case URGENT -> LocalDateTime.now().plusHours(4);
            case HIGH -> LocalDateTime.now().plusHours(12);
            case MEDIUM -> LocalDateTime.now().plusDays(1);
            case LOW -> LocalDateTime.now().plusDays(2);
        };
    }

    private Map<String, Object> alert(String severity, String message) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("severity", severity);
        row.put("message", message);
        row.put("createdAt", LocalDateTime.now());
        return row;
    }

    private SupportTicketDto mapTicket(SupportTicket ticket) {
        SupportTicketDto dto = new SupportTicketDto();
        dto.setId(ticket.getId());
        dto.setBookingId(ticket.getBooking() == null ? null : ticket.getBooking().getId());
        dto.setCustomerId(ticket.getCustomer().getId());
        dto.setCustomerName(ticket.getCustomer().getFullName());
        dto.setTechnicianId(ticket.getTechnician().getId());
        dto.setTechnicianName(ticket.getTechnician().getFullName());
        dto.setTitle(ticket.getTitle());
        dto.setDescription(ticket.getDescription());
        dto.setCategory(ticket.getCategory());
        dto.setPriority(ticket.getPriority());
        dto.setStatus(ticket.getStatus());
        dto.setDueAt(ticket.getDueAt());
        dto.setResolvedAt(ticket.getResolvedAt());
        dto.setCreatedAt(ticket.getCreatedAt());
        dto.setUpdatedAt(ticket.getUpdatedAt());
        return dto;
    }

    private TicketMessageDto mapTicketMessage(SupportTicketMessage message) {
        TicketMessageDto dto = new TicketMessageDto();
        dto.setId(message.getId());
        dto.setTicketId(message.getTicket().getId());
        dto.setSenderId(message.getSender().getId());
        dto.setSenderName(message.getSender().getFullName());
        dto.setContent(message.getContent());
        dto.setCreatedAt(message.getCreatedAt());
        return dto;
    }

    private BookingChatMessageDto mapChat(BookingChatMessage message) {
        BookingChatMessageDto dto = new BookingChatMessageDto();
        dto.setId(message.getId());
        dto.setBookingId(message.getBooking().getId());
        dto.setSenderId(message.getSender().getId());
        dto.setSenderName(message.getSender().getFullName());
        dto.setContent(message.getContent());
        dto.setCreatedAt(message.getCreatedAt());
        dto.setExpiresAt(message.getExpiresAt());
        return dto;
    }

    private void logInteraction(User technician, User customer, Booking booking, String type, String detail) {
        TechnicianInteractionLog log = new TechnicianInteractionLog();
        log.setTechnician(technician);
        log.setCustomer(customer);
        log.setBooking(booking);
        log.setInteractionType(type);
        log.setDetail(detail);
        technicianInteractionLogRepository.save(log);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private User getCurrentTechnician() {
        User user = getCurrentUser();
        if (user.getRole() != Role.TECHNICIAN) {
            throw new RuntimeException("Tài khoản không phải kỹ thuật viên");
        }
        return user;
    }
}
