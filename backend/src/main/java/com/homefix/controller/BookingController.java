package com.homefix.controller;

import com.homefix.common.BookingStatus;
import com.homefix.dto.BookingDto;
import com.homefix.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<BookingDto> createBooking(@RequestBody BookingDto dto) {
        return ResponseEntity.ok(bookingService.createBooking(dto));
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<List<BookingDto>> getMyBookings() {
        return ResponseEntity.ok(bookingService.getMyBookings());
    }

    @GetMapping("/all")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingDto>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<BookingDto> updateStatus(
            @PathVariable Long id,
            @RequestParam BookingStatus status) {
        return ResponseEntity.ok(bookingService.updateStatus(id, status));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<BookingDto> assignTechnician(
            @PathVariable Long id,
            @RequestParam Long technicianId) {
        return ResponseEntity.ok(bookingService.assignTechnician(id, technicianId));
    }

    @PostMapping("/{id}/technician-response")
    public ResponseEntity<BookingDto> technicianResponse(
            @PathVariable Long id,
            @RequestParam boolean accepted,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(bookingService.technicianResponse(id, accepted, reason));
    }

    @PostMapping("/{id}/review-decline")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingDto> reviewDecline(
            @PathVariable Long id,
            @RequestParam boolean approve) {
        return ResponseEntity.ok(bookingService.reviewDecline(id, approve));
    }
}
