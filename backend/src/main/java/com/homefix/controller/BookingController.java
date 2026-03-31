package com.homefix.controller;

import com.homefix.common.BookingStatus;
import com.homefix.dto.BookingDto;
import com.homefix.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    @GetMapping("/available")
    public ResponseEntity<List<BookingDto>> getAvailableBookingsForTechnician() {
        return ResponseEntity.ok(bookingService.getAvailableBookingsForTechnician());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<BookingDto> updateStatus(
            @PathVariable("id") Long id,
            @RequestParam("status") BookingStatus status) {
        return ResponseEntity.ok(bookingService.updateStatus(id, status));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<BookingDto> assignTechnician(
            @PathVariable("id") Long id,
            @RequestParam("technicianId") Long technicianId) {
        return ResponseEntity.ok(bookingService.assignTechnician(id, technicianId));
    }

    @PostMapping("/{id}/claim")
    public ResponseEntity<BookingDto> claimBooking(@PathVariable("id") Long id) {
        return ResponseEntity.ok(bookingService.claimBooking(id));
    }

    @PostMapping("/{id}/technician-response")
    public ResponseEntity<BookingDto> technicianResponse(
            @PathVariable("id") Long id,
            @RequestParam("accepted") boolean accepted,
            @RequestParam(name = "reason", required = false) String reason) {
        return ResponseEntity.ok(bookingService.technicianResponse(id, accepted, reason));
    }

    @PostMapping("/{id}/assistants")
    public ResponseEntity<BookingDto> addAssistantToBooking(
            @PathVariable("id") Long id,
            @RequestParam("assistantId") Long assistantId) {
        return ResponseEntity.ok(bookingService.addAssistantToBooking(id, assistantId));
    }

    @DeleteMapping("/{id}/assistants/{assistantId}")
    public ResponseEntity<BookingDto> removeAssistantFromBooking(
            @PathVariable("id") Long id,
            @PathVariable("assistantId") Long assistantId) {
        return ResponseEntity.ok(bookingService.removeAssistantFromBooking(id, assistantId));
    }

    @PostMapping("/{id}/review-decline")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingDto> reviewDecline(
            @PathVariable("id") Long id,
            @RequestParam("approve") boolean approve) {
        return ResponseEntity.ok(bookingService.reviewDecline(id, approve));
    }

    @PatchMapping("/{id}/confirm-payment")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingDto> confirmPayment(@PathVariable("id") Long id) {
        return ResponseEntity.ok(bookingService.confirmPayment(id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<BookingDto> cancelBooking(
            @PathVariable("id") Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(bookingService.cancelBooking(id, reason));
    }
}
