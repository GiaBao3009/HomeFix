package com.homefix.controller;

import com.homefix.dto.WithdrawalDto;
import com.homefix.service.WithdrawalService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
public class WithdrawalController {

    private final WithdrawalService withdrawalService;

    public WithdrawalController(WithdrawalService withdrawalService) {
        this.withdrawalService = withdrawalService;
    }

    @PostMapping("/api/technician/withdrawals")
    public ResponseEntity<WithdrawalDto> createWithdrawal(@RequestBody Map<String, Object> body) {
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        return ResponseEntity.ok(withdrawalService.createWithdrawal(amount));
    }

    @GetMapping("/api/technician/withdrawals")
    public ResponseEntity<List<WithdrawalDto>> getMyWithdrawals() {
        return ResponseEntity.ok(withdrawalService.getMyWithdrawals());
    }

    @GetMapping("/api/admin/withdrawals")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<WithdrawalDto>> getAllWithdrawals() {
        return ResponseEntity.ok(withdrawalService.getAllWithdrawals());
    }

    @PatchMapping("/api/admin/withdrawals/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WithdrawalDto> processWithdrawal(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> body) {
        boolean approve = Boolean.parseBoolean(body.get("approve").toString());
        String adminNote = body.get("adminNote") != null ? body.get("adminNote").toString() : null;
        return ResponseEntity.ok(withdrawalService.processWithdrawal(id, approve, adminNote));
    }
}
