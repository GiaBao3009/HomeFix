package com.homefix.service;

import com.homefix.common.Role;
import com.homefix.common.WithdrawalStatus;
import com.homefix.dto.WithdrawalDto;
import com.homefix.entity.User;
import com.homefix.entity.WithdrawalRequest;
import com.homefix.repository.UserRepository;
import com.homefix.repository.WithdrawalRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WithdrawalService {
    private final WithdrawalRepository withdrawalRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public WithdrawalService(WithdrawalRepository withdrawalRepository,
            UserRepository userRepository, NotificationService notificationService) {
        this.withdrawalRepository = withdrawalRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public WithdrawalDto createWithdrawal(WithdrawalDto dto) {
        User technician = getCurrentUser();
        if (technician.getRole() != Role.TECHNICIAN) {
            throw new RuntimeException("Only technicians can request withdrawals");
        }
        if (technician.getBankName() == null || technician.getBankAccountNumber() == null) {
            throw new RuntimeException("Vui lòng cập nhật thông tin ngân hàng trước khi rút tiền");
        }
        if (dto.getAmount() == null || dto.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Số tiền rút phải lớn hơn 0");
        }
        BigDecimal balance = technician.getWalletBalance() != null ? technician.getWalletBalance() : BigDecimal.ZERO;
        if (dto.getAmount().compareTo(balance) > 0) {
            throw new RuntimeException("Số dư không đủ. Số dư hiện tại: " + balance + " VNĐ");
        }
        long pendingCount = withdrawalRepository.countByTechnicianAndStatus(technician, WithdrawalStatus.PENDING);
        if (pendingCount > 0) {
            throw new RuntimeException("Bạn đã có yêu cầu rút tiền đang chờ xử lý");
        }

        WithdrawalRequest request = new WithdrawalRequest();
        request.setTechnician(technician);
        request.setAmount(dto.getAmount());
        request.setBankName(technician.getBankName());
        request.setBankAccountNumber(technician.getBankAccountNumber());
        request.setBankAccountHolder(technician.getBankAccountHolder());

        return mapToDto(withdrawalRepository.save(request));
    }

    @Transactional(readOnly = true)
    public List<WithdrawalDto> getMyWithdrawals() {
        User technician = getCurrentUser();
        return withdrawalRepository.findByTechnicianOrderByCreatedAtDesc(technician).stream()
                .map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WithdrawalDto> getAllWithdrawals() {
        return withdrawalRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public WithdrawalDto processWithdrawal(Long id, boolean approved, String adminNote) {
        WithdrawalRequest request = withdrawalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Withdrawal request not found"));
        if (request.getStatus() != WithdrawalStatus.PENDING) {
            throw new RuntimeException("This request has already been processed");
        }

        if (approved) {
            User technician = request.getTechnician();
            BigDecimal balance = technician.getWalletBalance() != null ? technician.getWalletBalance() : BigDecimal.ZERO;
            if (request.getAmount().compareTo(balance) > 0) {
                throw new RuntimeException("Technician's balance is insufficient");
            }
            technician.setWalletBalance(balance.subtract(request.getAmount()));
            userRepository.save(technician);
            request.setStatus(WithdrawalStatus.APPROVED);
            notificationService.createNotification(technician,
                    "Rút tiền thành công",
                    "Yêu cầu rút " + request.getAmount() + " VNĐ đã được duyệt.",
                    "WITHDRAWAL_APPROVED", null);
        } else {
            request.setStatus(WithdrawalStatus.REJECTED);
            notificationService.createNotification(request.getTechnician(),
                    "Rút tiền bị từ chối",
                    "Yêu cầu rút " + request.getAmount() + " VNĐ đã bị từ chối. Lý do: " + (adminNote != null ? adminNote : "Không rõ"),
                    "WITHDRAWAL_REJECTED", null);
        }
        request.setAdminNote(adminNote);
        request.setProcessedAt(LocalDateTime.now());
        return mapToDto(withdrawalRepository.save(request));
    }

    private WithdrawalDto mapToDto(WithdrawalRequest entity) {
        WithdrawalDto dto = new WithdrawalDto();
        dto.setId(entity.getId());
        dto.setTechnicianId(entity.getTechnician().getId());
        dto.setTechnicianName(entity.getTechnician().getFullName());
        dto.setAmount(entity.getAmount());
        dto.setBankName(entity.getBankName());
        dto.setBankAccountNumber(entity.getBankAccountNumber());
        dto.setBankAccountHolder(entity.getBankAccountHolder());
        dto.setStatus(entity.getStatus().name());
        dto.setAdminNote(entity.getAdminNote());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setProcessedAt(entity.getProcessedAt());
        return dto;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
