package com.homefix.controller;

import com.homefix.dto.WithdrawalDto;
import com.homefix.service.WithdrawalService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/withdrawals")
public class WithdrawalController {
    private final WithdrawalService withdrawalService;

    public WithdrawalController(WithdrawalService withdrawalService) {
        this.withdrawalService = withdrawalService;
    }

    @PostMapping
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<WithdrawalDto> createWithdrawal(@RequestBody WithdrawalDto dto) {
        return ResponseEntity.ok(withdrawalService.createWithdrawal(dto));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<List<WithdrawalDto>> getMyWithdrawals() {
        return ResponseEntity.ok(withdrawalService.getMyWithdrawals());
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<WithdrawalDto>> getAllWithdrawals() {
        return ResponseEntity.ok(withdrawalService.getAllWithdrawals());
    }

    @PostMapping("/{id}/process")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WithdrawalDto> processWithdrawal(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> body) {
        boolean approved = Boolean.parseBoolean(body.getOrDefault("approved", false).toString());
        String adminNote = body.get("adminNote") != null ? body.get("adminNote").toString() : null;
        return ResponseEntity.ok(withdrawalService.processWithdrawal(id, approved, adminNote));
    }
}
