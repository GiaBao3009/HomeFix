package com.homefix.service;

import com.homefix.common.BookingStatus;
import com.homefix.common.Role;
import com.homefix.common.TechnicianApprovalStatus;
import com.homefix.common.TechnicianType;
import com.homefix.dto.UserDto;
import com.homefix.entity.Booking;
import com.homefix.entity.ServiceCategory;
import com.homefix.entity.User;
import com.homefix.repository.BookingRepository;
import com.homefix.repository.ReviewRepository;
import com.homefix.repository.ServiceCategoryRepository;
import com.homefix.repository.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ServiceCategoryRepository serviceCategoryRepository;
    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder,
            ServiceCategoryRepository serviceCategoryRepository, ReviewRepository reviewRepository,
            BookingRepository bookingRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.serviceCategoryRepository = serviceCategoryRepository;
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserDto getUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToDto(user);
    }

    @Transactional
    public UserDto updateProfile(String email, UserDto updateDto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (updateDto.getFullName() != null) {
            user.setFullName(updateDto.getFullName());
        }
        if (updateDto.getPhone() != null) {
            user.setPhone(updateDto.getPhone());
        }
        if (updateDto.getAddress() != null) {
            user.setAddress(updateDto.getAddress());
        }
        if (updateDto.getAvatarUrl() != null) {
            user.setAvatarUrl(updateDto.getAvatarUrl());
        }

        return mapToDto(userRepository.save(user));
    }

    @Transactional
    public UserDto updateTechnicianProfile(String email, UserDto updateDto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != Role.TECHNICIAN) {
            throw new RuntimeException("Tài khoản không phải kỹ thuật viên");
        }
        if (updateDto.getSpecialty() == null || updateDto.getSpecialty().isBlank()) {
            throw new RuntimeException("Vui lòng nhập chuyên môn kỹ thuật");
        }
        if (updateDto.getExperienceYears() == null || updateDto.getExperienceYears() < 0) {
            throw new RuntimeException("Số năm kinh nghiệm không hợp lệ");
        }
        if (updateDto.getWorkDescription() == null || updateDto.getWorkDescription().isBlank()) {
            throw new RuntimeException("Vui lòng nhập mô tả công việc");
        }
        String citizenId = updateDto.getCitizenId() == null ? "" : updateDto.getCitizenId().trim();
        if (!citizenId.matches("\\d{9,12}")) {
            throw new RuntimeException("Số CCCD không hợp lệ");
        }
        if (updateDto.getTechnicianType() == null || updateDto.getTechnicianType().isBlank()) {
            throw new RuntimeException("Vui lòng chọn loại thợ");
        }
        if (updateDto.getAvailableFrom() != null
                && updateDto.getAvailableTo() != null
                && !updateDto.getAvailableFrom().isBefore(updateDto.getAvailableTo())) {
            throw new RuntimeException("Giờ bắt đầu phải sớm hơn giờ kết thúc");
        }
        if (updateDto.getCategoryIds() == null || updateDto.getCategoryIds().isEmpty()) {
            throw new RuntimeException("Vui lòng chọn ít nhất 1 chuyên mục kỹ thuật");
        }

        TechnicianType technicianType;
        try {
            technicianType = TechnicianType.valueOf(updateDto.getTechnicianType().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Loại thợ không hợp lệ");
        }

        List<ServiceCategory> categories = serviceCategoryRepository.findAllById(updateDto.getCategoryIds());
        if (categories.size() != updateDto.getCategoryIds().size()) {
            throw new RuntimeException("Có chuyên mục không tồn tại");
        }

        TechnicianType previousType = user.getTechnicianType();
        Long previousSupervisorId = user.getSupervisingTechnician() != null ? user.getSupervisingTechnician().getId() : null;
        LocalDateTime previousAssistantStartedAt = user.getAssistantStartedAt();

        user.setSpecialty(updateDto.getSpecialty().trim());
        user.setExperienceYears(updateDto.getExperienceYears());
        user.setWorkDescription(updateDto.getWorkDescription().trim());
        user.setCitizenId(citizenId);
        user.setTechnicianType(technicianType);
        user.setBaseLocation(updateDto.getBaseLocation() == null ? null : updateDto.getBaseLocation().trim());
        user.setAvailableFrom(updateDto.getAvailableFrom());
        user.setAvailableTo(updateDto.getAvailableTo());
        user.setAvailableForAutoAssign(updateDto.isAvailableForAutoAssign());
        user.setCategories(new LinkedHashSet<>(categories));
        user.setTechnicianProfileCompleted(true);

        if (technicianType == TechnicianType.MAIN) {
            user.setSupervisingTechnician(null);
            user.setAssistantStartedAt(null);
            user.setAssistantPromoteAt(null);
            if (previousType != TechnicianType.MAIN
                    || user.getTechnicianApprovalStatus() != TechnicianApprovalStatus.APPROVED) {
                user.setTechnicianApprovalStatus(TechnicianApprovalStatus.PENDING);
            }
        } else {
            if (!userRepository.findBySupervisingTechnician(user).isEmpty()) {
                throw new RuntimeException("Khong the chuyen sang tho phu khi van con tho phu truc thuoc");
            }
            User supervisor = resolveSupervisor(user, updateDto.getSupervisingTechnicianId());
            user.setSupervisingTechnician(supervisor);
            LocalDateTime assistantStartedAt = resolveAssistantStartedAt(
                    previousType,
                    previousSupervisorId,
                    previousAssistantStartedAt,
                    supervisor.getId());
            user.setAssistantStartedAt(assistantStartedAt);
            user.setAssistantPromoteAt(assistantStartedAt.plusMonths(1));
            user.setTechnicianApprovalStatus(TechnicianApprovalStatus.APPROVED);
        }

        return mapToDto(userRepository.save(user));
    }

    @Transactional
    public UserDto updateBankInfo(String email, java.util.Map<String, String> bankInfo) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() != Role.TECHNICIAN) {
            throw new RuntimeException("Only technicians can update bank info");
        }
        String bankName = bankInfo.get("bankName");
        String bankAccountNumber = bankInfo.get("bankAccountNumber");
        String bankAccountHolder = bankInfo.get("bankAccountHolder");
        if (bankName == null || bankName.isBlank() || bankAccountNumber == null || bankAccountNumber.isBlank()
                || bankAccountHolder == null || bankAccountHolder.isBlank()) {
            throw new RuntimeException("All bank fields are required");
        }
        user.setBankName(bankName.trim());
        user.setBankAccountNumber(bankAccountNumber.trim());
        user.setBankAccountHolder(bankAccountHolder.trim().toUpperCase());
        return mapToDto(userRepository.save(user));
    }

    @Transactional
    public void changePassword(String email, String oldPassword, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Old password does not match");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public UserDto updateUserRole(Long userId, String newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Role role;
        try {
            role = Role.valueOf(newRole.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Invalid role");
        }

        if (role != Role.TECHNICIAN && !userRepository.findBySupervisingTechnician(user).isEmpty()) {
            throw new RuntimeException("Không thể đổi vai trò của thợ chính khi vẫn còn thợ phụ trực thuộc");
        }

        user.setRole(role);
        clearTechnicianMetadata(user);
        return mapToDto(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<UserDto> getTechnicians() {
        return userRepository.findByRole(Role.TECHNICIAN).stream()
                .filter(this::isTechnicianEligibleForDispatch)
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getTechnicianDashboard(String email) {
        User technician = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (technician.getRole() != Role.TECHNICIAN) {
            throw new RuntimeException("Tài khoản không phải kỹ thuật viên");
        }

        long pendingJobs = bookingRepository.countVisibleToTechnicianAndStatus(technician, BookingStatus.ASSIGNED);
        long inProgressJobs = bookingRepository.countVisibleToTechnicianAndStatus(technician, BookingStatus.IN_PROGRESS);
        long completedJobs = bookingRepository.countVisibleToTechnicianAndStatus(technician, BookingStatus.COMPLETED);
        Double averageRating = reviewRepository.findAverageRatingByTechnicianId(technician.getId());
        Long totalReviews = reviewRepository.countByTechnicianId(technician.getId());

        return Map.of(
                "pendingJobs", pendingJobs,
                "inProgressJobs", inProgressJobs,
                "completedJobs", completedJobs,
                "averageRating", averageRating == null ? 0.0 : Math.round(averageRating * 100.0) / 100.0,
                "totalReviews", totalReviews == null ? 0L : totalReviews,
                "walletBalance", technician.getWalletBalance());
    }

    @Transactional
    public UserDto approveTechnician(Long userId, boolean approved) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() != Role.TECHNICIAN) {
            throw new RuntimeException("User is not technician");
        }
        if (user.getTechnicianType() != TechnicianType.MAIN) {
            throw new RuntimeException("Chỉ thợ chính cần duyệt");
        }
        user.setTechnicianApprovalStatus(approved ? TechnicianApprovalStatus.APPROVED : TechnicianApprovalStatus.REJECTED);
        return mapToDto(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAssistantCandidates(String email, Long bookingId) {
        User mainTechnician = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (mainTechnician.getRole() != Role.TECHNICIAN || mainTechnician.getTechnicianType() != TechnicianType.MAIN) {
            throw new RuntimeException("Chỉ thợ chính mới được chọn thợ phụ");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (booking.getTechnician() == null || !booking.getTechnician().getId().equals(mainTechnician.getId())) {
            throw new RuntimeException("Bạn không phụ trách booking này");
        }

        List<BookingStatus> activeStatuses = List.of(BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS);
        return userRepository.findBySupervisingTechnician(mainTechnician).stream()
                .filter(User::isTechnicianProfileCompleted)
                .filter(candidate -> candidate.getTechnicianType() == TechnicianType.ASSISTANT)
                .filter(candidate -> candidate.getTechnicianApprovalStatus() == TechnicianApprovalStatus.APPROVED)
                .filter(candidate -> !bookingRepository.existsByTechnicianAndBookingTimeAndStatusIn(
                        candidate,
                        booking.getBookingTime(),
                        activeStatuses))
                .filter(candidate -> !bookingRepository.existsByAssistantTechniciansContainingAndBookingTimeAndStatusIn(
                        candidate,
                        booking.getBookingTime(),
                        activeStatuses))
                .filter(candidate -> booking.getAssistantTechnicians().stream()
                        .noneMatch(existing -> existing.getId().equals(candidate.getId())))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Scheduled(fixedDelay = 3600000)
    @Transactional
    public void promoteEligibleAssistants() {
        List<User> assistants = userRepository.findByTechnicianTypeAndAssistantPromoteAtBefore(
                TechnicianType.ASSISTANT,
                LocalDateTime.now());
        for (User assistant : assistants) {
            if (assistant.getRole() != Role.TECHNICIAN || !assistant.isTechnicianProfileCompleted()) {
                continue;
            }
            assistant.setTechnicianType(TechnicianType.MAIN);
            assistant.setTechnicianApprovalStatus(TechnicianApprovalStatus.APPROVED);
            assistant.setSupervisingTechnician(null);
            assistant.setAssistantStartedAt(null);
            assistant.setAssistantPromoteAt(null);
        }
    }

    private boolean isTechnicianEligibleForDispatch(User user) {
        if (!user.isTechnicianProfileCompleted()) {
            return false;
        }
        if (user.getTechnicianType() == TechnicianType.MAIN) {
            return user.getTechnicianApprovalStatus() == TechnicianApprovalStatus.APPROVED;
        }
        return user.getTechnicianType() == TechnicianType.ASSISTANT;
    }

    private UserDto mapToDto(User user) {
        UserDto dto = new UserDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getAddress(),
                user.getRole().name(),
                user.getAvatarUrl());
        dto.setSpecialty(user.getSpecialty());
        dto.setExperienceYears(user.getExperienceYears());
        dto.setWorkDescription(user.getWorkDescription());
        dto.setCitizenId(user.getCitizenId());
        dto.setTechnicianProfileCompleted(user.isTechnicianProfileCompleted());
        dto.setTechnicianType(user.getTechnicianType() != null ? user.getTechnicianType().name() : null);
        dto.setTechnicianApprovalStatus(
                user.getTechnicianApprovalStatus() != null ? user.getTechnicianApprovalStatus().name() : null);
        dto.setWalletBalance(user.getWalletBalance());
        dto.setBaseLocation(user.getBaseLocation());
        dto.setAvailableFrom(user.getAvailableFrom());
        dto.setAvailableTo(user.getAvailableTo());
        dto.setAvailableForAutoAssign(user.isAvailableForAutoAssign());
        dto.setSupervisingTechnicianId(
                user.getSupervisingTechnician() != null ? user.getSupervisingTechnician().getId() : null);
        dto.setSupervisingTechnicianName(
                user.getSupervisingTechnician() != null ? user.getSupervisingTechnician().getFullName() : null);
        dto.setAssistantStartedAt(user.getAssistantStartedAt());
        dto.setAssistantPromoteAt(user.getAssistantPromoteAt());
        dto.setCategoryIds(user.getCategories().stream().map(ServiceCategory::getId).toList());
        dto.setCategoryNames(user.getCategories().stream().map(ServiceCategory::getName).toList());
        Double averageRating = reviewRepository.findAverageRatingByTechnicianId(user.getId());
        Long totalReviews = reviewRepository.countByTechnicianId(user.getId());
        long completedJobs = bookingRepository.countVisibleToTechnicianAndStatus(user, BookingStatus.COMPLETED);
        dto.setAverageRating(averageRating == null ? 0.0 : Math.round(averageRating * 100.0) / 100.0);
        dto.setTotalReviews(totalReviews == null ? 0L : totalReviews);
        dto.setCompletedJobs(completedJobs);
        dto.setBankName(user.getBankName());
        dto.setBankAccountNumber(user.getBankAccountNumber());
        dto.setBankAccountHolder(user.getBankAccountHolder());
        return dto;
    }

    private void clearTechnicianMetadata(User user) {
        user.setTechnicianProfileCompleted(false);
        user.setSpecialty(null);
        user.setExperienceYears(null);
        user.setWorkDescription(null);
        user.setCitizenId(null);
        user.setTechnicianType(null);
        user.setTechnicianApprovalStatus(TechnicianApprovalStatus.NOT_REQUIRED);
        user.setCategories(new LinkedHashSet<>());
        user.setBaseLocation(null);
        user.setAvailableFrom(null);
        user.setAvailableTo(null);
        user.setAvailableForAutoAssign(true);
        user.setSupervisingTechnician(null);
        user.setAssistantStartedAt(null);
        user.setAssistantPromoteAt(null);
    }

    private User resolveSupervisor(User assistant, Long supervisingTechnicianId) {
        if (supervisingTechnicianId == null) {
            throw new RuntimeException("Thợ phụ phải chọn thợ chính phụ trách");
        }
        User supervisor = userRepository.findById(supervisingTechnicianId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thợ chính phụ trách"));
        if (supervisor.getId().equals(assistant.getId())) {
            throw new RuntimeException("Không thể tự chọn chính mình làm thợ chính phụ trách");
        }
        if (supervisor.getRole() != Role.TECHNICIAN
                || supervisor.getTechnicianType() != TechnicianType.MAIN
                || supervisor.getTechnicianApprovalStatus() != TechnicianApprovalStatus.APPROVED) {
            throw new RuntimeException("Thợ chính phụ trách phải là thợ chính đã được duyệt");
        }
        return supervisor;
    }

    private LocalDateTime resolveAssistantStartedAt(TechnicianType previousType, Long previousSupervisorId,
            LocalDateTime previousAssistantStartedAt, Long currentSupervisorId) {
        if (previousType == TechnicianType.ASSISTANT
                && previousAssistantStartedAt != null
                && previousSupervisorId != null
                && previousSupervisorId.equals(currentSupervisorId)) {
            return previousAssistantStartedAt;
        }
        return LocalDateTime.now();
    }
}
