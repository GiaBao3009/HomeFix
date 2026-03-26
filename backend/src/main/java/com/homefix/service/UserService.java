package com.homefix.service;

import com.homefix.common.Role;
import com.homefix.common.TechnicianApprovalStatus;
import com.homefix.common.TechnicianType;
import com.homefix.dto.UserDto;
import com.homefix.entity.ServiceCategory;
import com.homefix.entity.User;
import com.homefix.repository.BookingRepository;
import com.homefix.repository.ReviewRepository;
import com.homefix.repository.ServiceCategoryRepository;
import com.homefix.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public UserDto getUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToDto(user);
    }

    @Transactional
    public UserDto updateProfile(String email, UserDto updateDto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (updateDto.getFullName() != null) user.setFullName(updateDto.getFullName());
        if (updateDto.getPhone() != null) user.setPhone(updateDto.getPhone());
        if (updateDto.getAddress() != null) user.setAddress(updateDto.getAddress());
        if (updateDto.getAvatarUrl() != null) user.setAvatarUrl(updateDto.getAvatarUrl());
        
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

        TechnicianType technicianType;
        try {
            technicianType = TechnicianType.valueOf(updateDto.getTechnicianType().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Loại thợ không hợp lệ");
        }

        user.setSpecialty(updateDto.getSpecialty().trim());
        user.setExperienceYears(updateDto.getExperienceYears());
        user.setWorkDescription(updateDto.getWorkDescription().trim());
        user.setCitizenId(citizenId);
        user.setTechnicianType(technicianType);
        user.setBaseLocation(updateDto.getBaseLocation());
        user.setAvailableFrom(updateDto.getAvailableFrom());
        user.setAvailableTo(updateDto.getAvailableTo());
        user.setAvailableForAutoAssign(updateDto.isAvailableForAutoAssign());
        if (updateDto.getCategoryIds() == null || updateDto.getCategoryIds().isEmpty()) {
            throw new RuntimeException("Vui lòng chọn ít nhất 1 chuyên mục kỹ thuật");
        }
        List<ServiceCategory> categories = serviceCategoryRepository.findAllById(updateDto.getCategoryIds());
        if (categories.size() != updateDto.getCategoryIds().size()) {
            throw new RuntimeException("Có chuyên mục không tồn tại");
        }
        // Hibernate needs a mutable collection to update this many-to-many association safely.
        user.setCategories(new LinkedHashSet<>(categories));
        user.setTechnicianProfileCompleted(true);
        if (technicianType == TechnicianType.MAIN) {
            user.setTechnicianApprovalStatus(TechnicianApprovalStatus.PENDING);
        } else {
            user.setTechnicianApprovalStatus(TechnicianApprovalStatus.APPROVED);
        }

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

    public UserDto updateUserRole(Long userId, String newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        try {
            user.setRole(Role.valueOf(newRole.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role");
        }
        if (user.getRole() == Role.TECHNICIAN) {
            user.setTechnicianProfileCompleted(false);
            user.setSpecialty(null);
            user.setExperienceYears(null);
            user.setWorkDescription(null);
            user.setCitizenId(null);
            user.setTechnicianType(null);
            user.setTechnicianApprovalStatus(TechnicianApprovalStatus.NOT_REQUIRED);
            user.setCategories(Set.of());
            user.setBaseLocation(null);
            user.setAvailableFrom(null);
            user.setAvailableTo(null);
            user.setAvailableForAutoAssign(true);
        } else {
            user.setTechnicianProfileCompleted(false);
            user.setSpecialty(null);
            user.setExperienceYears(null);
            user.setWorkDescription(null);
            user.setCitizenId(null);
            user.setTechnicianType(null);
            user.setTechnicianApprovalStatus(TechnicianApprovalStatus.NOT_REQUIRED);
            user.setCategories(Set.of());
            user.setBaseLocation(null);
            user.setAvailableFrom(null);
            user.setAvailableTo(null);
            user.setAvailableForAutoAssign(true);
        }

        User saved = userRepository.save(user);
        return mapToDto(saved);
    }

    public List<UserDto> getTechnicians() {
        return userRepository.findByRole(Role.TECHNICIAN).stream()
                .filter(this::isTechnicianEligibleForDispatch)
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public Map<String, Object> getTechnicianDashboard(String email) {
        User technician = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (technician.getRole() != Role.TECHNICIAN) {
            throw new RuntimeException("Tài khoản không phải kỹ thuật viên");
        }
        long pendingJobs = bookingRepository.countByTechnicianAndStatus(technician, com.homefix.common.BookingStatus.ASSIGNED);
        long inProgressJobs = bookingRepository.countByTechnicianAndStatus(technician, com.homefix.common.BookingStatus.IN_PROGRESS);
        long completedJobs = bookingRepository.countByTechnicianAndStatus(technician, com.homefix.common.BookingStatus.COMPLETED);
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
                user.getAvatarUrl()
        );
        dto.setSpecialty(user.getSpecialty());
        dto.setExperienceYears(user.getExperienceYears());
        dto.setWorkDescription(user.getWorkDescription());
        dto.setCitizenId(user.getCitizenId());
        dto.setTechnicianProfileCompleted(user.isTechnicianProfileCompleted());
        dto.setTechnicianType(user.getTechnicianType() != null ? user.getTechnicianType().name() : null);
        dto.setTechnicianApprovalStatus(user.getTechnicianApprovalStatus() != null ? user.getTechnicianApprovalStatus().name() : null);
        dto.setWalletBalance(user.getWalletBalance());
        dto.setBaseLocation(user.getBaseLocation());
        dto.setAvailableFrom(user.getAvailableFrom());
        dto.setAvailableTo(user.getAvailableTo());
        dto.setAvailableForAutoAssign(user.isAvailableForAutoAssign());
        dto.setCategoryIds(user.getCategories().stream().map(ServiceCategory::getId).toList());
        dto.setCategoryNames(user.getCategories().stream().map(ServiceCategory::getName).toList());
        Double avg = reviewRepository.findAverageRatingByTechnicianId(user.getId());
        Long totalReviews = reviewRepository.countByTechnicianId(user.getId());
        long completedJobs = bookingRepository.countByTechnicianAndStatus(
                user, com.homefix.common.BookingStatus.COMPLETED);
        dto.setAverageRating(avg == null ? 0.0 : Math.round(avg * 100.0) / 100.0);
        dto.setTotalReviews(totalReviews == null ? 0L : totalReviews);
        dto.setCompletedJobs(completedJobs);
        return dto;
    }
}
