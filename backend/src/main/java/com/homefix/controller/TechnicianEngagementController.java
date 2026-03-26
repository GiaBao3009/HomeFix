package com.homefix.controller;

import com.homefix.common.TicketStatus;
import com.homefix.dto.BookingChatMessageDto;
import com.homefix.dto.SupportTicketDto;
import com.homefix.dto.TechnicianLeaderboardDto;
import com.homefix.dto.TicketMessageDto;
import com.homefix.service.TechnicianEngagementService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/technician")
public class TechnicianEngagementController {
    private final TechnicianEngagementService technicianEngagementService;

    public TechnicianEngagementController(TechnicianEngagementService technicianEngagementService) {
        this.technicianEngagementService = technicianEngagementService;
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<TechnicianLeaderboardDto>> getLeaderboard() {
        return ResponseEntity.ok(technicianEngagementService.getTechnicianLeaderboard());
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        return ResponseEntity.ok(technicianEngagementService.getAdvancedAnalytics());
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<Map<String, Object>>> getAlerts() {
        return ResponseEntity.ok(technicianEngagementService.getSmartAlerts());
    }

    @GetMapping("/report")
    public ResponseEntity<Map<String, Object>> getAutoReport() {
        return ResponseEntity.ok(technicianEngagementService.generateAutoReport());
    }

    @GetMapping("/interactions")
    public ResponseEntity<List<Map<String, Object>>> getInteractions() {
        return ResponseEntity.ok(technicianEngagementService.getInteractionHistory());
    }

    @PostMapping("/tickets")
    public ResponseEntity<SupportTicketDto> createTicket(@RequestBody SupportTicketDto dto) {
        return ResponseEntity.ok(technicianEngagementService.createTicket(dto));
    }

    @GetMapping("/tickets")
    public ResponseEntity<List<SupportTicketDto>> getTickets() {
        return ResponseEntity.ok(technicianEngagementService.getMyTickets());
    }

    @PatchMapping("/tickets/{id}/status")
    public ResponseEntity<SupportTicketDto> updateTicketStatus(@PathVariable("id") Long id,
            @RequestParam("status") TicketStatus status) {
        return ResponseEntity.ok(technicianEngagementService.updateTicketStatus(id, status));
    }

    @PostMapping("/tickets/{id}/messages")
    public ResponseEntity<TicketMessageDto> addTicketMessage(@PathVariable("id") Long id,
            @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(technicianEngagementService.addTicketMessage(id, payload.getOrDefault("content", "")));
    }

    @GetMapping("/tickets/{id}/messages")
    public ResponseEntity<List<TicketMessageDto>> getTicketMessages(@PathVariable("id") Long id) {
        return ResponseEntity.ok(technicianEngagementService.getTicketMessages(id));
    }

    @PostMapping("/chat/{bookingId}/messages")
    public ResponseEntity<BookingChatMessageDto> sendChat(@PathVariable("bookingId") Long bookingId,
            @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(
                technicianEngagementService.sendChatMessage(bookingId, payload.getOrDefault("content", "")));
    }

    @GetMapping("/chat/{bookingId}/messages")
    public ResponseEntity<List<BookingChatMessageDto>> getChat(@PathVariable("bookingId") Long bookingId) {
        return ResponseEntity.ok(technicianEngagementService.getBookingChatMessages(bookingId));
    }
}
