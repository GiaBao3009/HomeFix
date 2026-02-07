package com.homefix.service;

import com.homefix.common.Role;
import com.homefix.dto.auth.AuthResponse;
import com.homefix.dto.auth.LoginRequest;
import com.homefix.dto.auth.RegisterRequest;
import com.homefix.entity.User;
import com.homefix.repository.UserRepository;
import com.homefix.security.JwtUtils;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtils jwtUtils, AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.authenticationManager = authenticationManager;
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

        var token = jwtUtils.generateToken(user);
        return new AuthResponse(token, user.getRole().name(), user.getFullName(), user.getId(), user.getAvatarUrl());
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
        
        var token = jwtUtils.generateToken(user);
        return new AuthResponse(token, user.getRole().name(), user.getFullName(), user.getId(), user.getAvatarUrl());
    }
}

