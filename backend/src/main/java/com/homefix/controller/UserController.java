package com.homefix.controller;

import com.homefix.dto.UserDto;
import com.homefix.dto.auth.ChangePasswordRequest;
import com.homefix.service.BookingService;
import com.homefix.service.ReviewService;
import com.homefix.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final BookingService bookingService;
    private final ReviewService reviewService;

    public UserController(UserService userService, BookingService bookingService, ReviewService reviewService) {
        this.userService = userService;
        this.bookingService = bookingService;
        this.reviewService = reviewService;
    }
    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> updateUserRole(@PathVariable("id") Long id, @RequestParam("role") String role) {
        return ResponseEntity.ok(userService.updateUserRole(id, role));
    }

    @GetMapping("/profile")
    public ResponseEntity<UserDto> getProfile() {
        String email = getCurrentUserEmail();
        return ResponseEntity.ok(userService.getUserProfile(email));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserDto> updateProfile(@RequestBody UserDto userDto) {
        String email = getCurrentUserEmail();
        return ResponseEntity.ok(userService.updateProfile(email, userDto));
    }

    @GetMapping("/technicians")
    public ResponseEntity<List<UserDto>> getTechnicians() {
        return ResponseEntity.ok(userService.getTechnicians());
    }

    @GetMapping("/technician/profile")
    public ResponseEntity<UserDto> getTechnicianProfile() {
        String email = getCurrentUserEmail();
        return ResponseEntity.ok(userService.getUserProfile(email));
    }

    @PutMapping("/technician/profile")
    public ResponseEntity<UserDto> updateTechnicianProfile(@RequestBody UserDto userDto) {
        String email = getCurrentUserEmail();
        return ResponseEntity.ok(userService.updateTechnicianProfile(email, userDto));
    }

    @GetMapping("/technician/wallet")
    public ResponseEntity<Map<String, Object>> getTechnicianWallet() {
        String email = getCurrentUserEmail();
        UserDto profile = userService.getUserProfile(email);
        List<com.homefix.dto.BookingDto> earnings = bookingService.getMyCompletedJobsWithEarnings();
        java.math.BigDecimal lifetimeIncome = earnings.stream()
                .map(item -> item.getTechnicianEarning() == null ? java.math.BigDecimal.ZERO : item.getTechnicianEarning())
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        java.math.BigDecimal totalRevenue = earnings.stream()
                .map(item -> item.getTotalPrice() == null ? java.math.BigDecimal.ZERO : item.getTotalPrice())
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        java.math.BigDecimal totalPlatformProfit = earnings.stream()
                .map(item -> item.getPlatformProfit() == null ? java.math.BigDecimal.ZERO : item.getPlatformProfit())
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        return ResponseEntity.ok(Map.of(
                "walletBalance", profile.getWalletBalance() == null ? java.math.BigDecimal.ZERO : profile.getWalletBalance(),
                "technicianType", profile.getTechnicianType(),
                "approvalStatus", profile.getTechnicianApprovalStatus(),
                "completedJobs", earnings.size(),
                "totalRevenue", totalRevenue,
                "totalPlatformProfit", totalPlatformProfit,
                "lifetimeIncome", lifetimeIncome,
                "items", earnings));
    }

    @GetMapping("/technician/dashboard")
    public ResponseEntity<Map<String, Object>> getTechnicianDashboard() {
        String email = getCurrentUserEmail();
        return ResponseEntity.ok(userService.getTechnicianDashboard(email));
    }

    @GetMapping("/technician/history")
    public ResponseEntity<List<com.homefix.dto.BookingDto>> getTechnicianHistory() {
        return ResponseEntity.ok(bookingService.getMyBookings());
    }

    @GetMapping("/technician/assistant-candidates")
    public ResponseEntity<List<UserDto>> getAssistantCandidates(@RequestParam("bookingId") Long bookingId) {
        String email = getCurrentUserEmail();
        return ResponseEntity.ok(userService.getAssistantCandidates(email, bookingId));
    }

    @GetMapping("/technician/reviews")
    public ResponseEntity<List<com.homefix.dto.ReviewDto>> getTechnicianReviews() {
        String email = getCurrentUserEmail();
        UserDto profile = userService.getUserProfile(email);
        return ResponseEntity.ok(reviewService.getReviewsByTechnician(profile.getId()));
    }

    @PutMapping("/technician/bank-info")
    public ResponseEntity<UserDto> updateBankInfo(@RequestBody Map<String, String> bankInfo) {
        String email = getCurrentUserEmail();
        return ResponseEntity.ok(userService.updateBankInfo(email, bankInfo));
    }

    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(@RequestBody ChangePasswordRequest request) {
        String email = getCurrentUserEmail();
        userService.changePassword(email, request.getOldPassword(), request.getNewPassword());
        return ResponseEntity.ok("Password changed successfully");
    }

    private String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }
}
