package com.homefix.controller;

import com.homefix.dto.UserDto;
import com.homefix.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {
    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<UserDto> updateUserRole(
            @PathVariable("id") Long id,
            @RequestBody Map<String, String> payload
    ) {
        String newRole = payload.get("role");
        return ResponseEntity.ok(userService.updateUserRole(id, newRole));
    }

    @PatchMapping("/{id}/technician-approval")
    public ResponseEntity<UserDto> approveTechnician(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Boolean> payload
    ) {
        boolean approved = payload.getOrDefault("approved", false);
        return ResponseEntity.ok(userService.approveTechnician(id, approved));
    }
}

