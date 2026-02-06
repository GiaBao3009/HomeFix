package com.homefix.controller;

import com.homefix.common.BookingStatus;
import com.homefix.entity.Booking;
import com.homefix.repository.BookingRepository;
import com.homefix.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private NotificationService notificationService;

    @PostMapping("/create-url")
    public ResponseEntity<Map<String, String>> createPaymentUrl(@RequestBody Map<String, Object> payload) {
        Long bookingId = Long.parseLong(payload.get("bookingId").toString());
        String method = payload.get("method").toString();
        
        // In a real app, we would call Momo/VNPay API here to get the payment URL
        // For simulation, we generate a local URL
        String paymentUrl = "http://localhost:5173/payment/gateway?bookingId=" + bookingId + "&method=" + method;
        
        Map<String, String> response = new HashMap<>();
        response.put("paymentUrl", paymentUrl);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/confirm")
    public ResponseEntity<String> confirmPayment(@RequestBody Map<String, Object> payload) {
        Long bookingId = Long.parseLong(payload.get("bookingId").toString());
        boolean success = Boolean.parseBoolean(payload.get("success").toString());
        
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        if (success) {
            booking.setPaymentStatus("PAID");
            booking.setStatus(BookingStatus.CONFIRMED); // Auto confirm if paid
            bookingRepository.save(booking);
            
            notificationService.createNotification(
                booking.getCustomer(),
                "Thanh toán thành công",
                "Đơn hàng #" + booking.getId() + " đã được thanh toán thành công.",
                "ORDER",
                booking.getId()
            );
            
            return ResponseEntity.ok("Payment confirmed");
        } else {
            booking.setPaymentStatus("FAILED");
            bookingRepository.save(booking);
            return ResponseEntity.badRequest().body("Payment failed");
        }
    }
}
