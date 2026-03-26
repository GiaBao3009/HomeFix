package com.homefix.service;

import com.homefix.common.Role;
import com.homefix.dto.auth.AuthResponse;
import com.homefix.dto.auth.LoginRequest;
import com.homefix.dto.auth.RegisterRequest;
import com.homefix.entity.User;
import com.homefix.entity.PasswordResetToken;
import com.homefix.repository.UserRepository;
import com.homefix.repository.PasswordResetTokenRepository;
import com.homefix.security.JwtUtils;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final PasswordResetTokenRepository resetRepo;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtils jwtUtils, AuthenticationManager authenticationManager, PasswordResetTokenRepository resetRepo, EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.authenticationManager = authenticationManager;
        this.resetRepo = resetRepo;
        this.emailService = emailService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        Role userRole = Role.CUSTOMER;
        if (request.getRole() != null) {
            try {
                userRole = Role.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Default to CUSTOMER if invalid
                userRole = Role.CUSTOMER;
            }
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());
        user.setRole(userRole);

        userRepository.save(user);

        return toAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();
        
        return toAuthResponse(user);
    }

    public Map<String, String> requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Email không tồn tại"));
        PasswordResetToken prt = new PasswordResetToken(user, 15);
        resetRepo.save(prt);
        emailService.sendPasswordResetEmail(user.getEmail(), prt.getToken());
        return Map.of("message", "Đã gửi hướng dẫn đặt lại mật khẩu vào email của bạn");
    }

    @Transactional
    public Map<String, String> resetPassword(String token, String newPassword) {
        PasswordResetToken prt = resetRepo.findByToken(token).orElseThrow(() -> new RuntimeException("Token không hợp lệ"));
        if (prt.isUsed() || prt.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token đã hết hạn hoặc đã sử dụng");
        }
        User user = prt.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        prt.setUsed(true);
        resetRepo.save(prt);
        return Map.of("message", "Đặt lại mật khẩu thành công");
    }

    private AuthResponse toAuthResponse(User user) {
        var token = jwtUtils.generateToken(user);
        AuthResponse response = new AuthResponse(token, user.getRole().name(), user.getFullName(), user.getId(), user.getAvatarUrl());
        response.setTechnicianProfileCompleted(user.isTechnicianProfileCompleted());
        response.setTechnicianType(user.getTechnicianType() != null ? user.getTechnicianType().name() : null);
        response.setTechnicianApprovalStatus(user.getTechnicianApprovalStatus() != null ? user.getTechnicianApprovalStatus().name() : null);
        return response;
    }
}
