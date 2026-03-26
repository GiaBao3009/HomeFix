package com.homefix.controller;

import com.homefix.repository.BookingRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {
    private final BookingRepository bookingRepository;

    public StatisticsController(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    @GetMapping("/top-services")
    public ResponseEntity<List<Map<String, Object>>> getTopServices() {
        List<Object[]> results = bookingRepository.findTopServices();
        List<Map<String, Object>> response = new ArrayList<>();
        
        for (Object[] row : results) {
            Map<String, Object> map = new HashMap<>();
            map.put("serviceName", row[0]);
            map.put("count", row[1]);
            response.add(map);
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/revenue")
    public ResponseEntity<List<Map<String, Object>>> getRevenueStats() {
        List<Object[]> results = bookingRepository.findRevenueByMonth();
        List<Map<String, Object>> response = new ArrayList<>();

        String[] months = {"", "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", 
                          "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"};

        for (Object[] row : results) {
            Map<String, Object> map = new HashMap<>();
            int monthIndex = ((Number) row[0]).intValue();
            map.put("month", months[monthIndex]);
            map.put("revenue", row[1]);
            response.add(map);
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/profit")
    public ResponseEntity<List<Map<String, Object>>> getProfitStats() {
        List<Object[]> results = bookingRepository.findProfitByMonth();
        List<Map<String, Object>> response = new ArrayList<>();

        String[] months = {"", "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
                "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"};

        for (Object[] row : results) {
            Map<String, Object> map = new HashMap<>();
            int monthIndex = ((Number) row[0]).intValue();
            map.put("month", months[monthIndex]);
            map.put("profit", row[1]);
            response.add(map);
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/order-status")
    public ResponseEntity<List<Map<String, Object>>> getOrderStatusStats() {
        List<Object[]> results = bookingRepository.countByStatus();
        List<Map<String, Object>> response = new ArrayList<>();

        for (Object[] row : results) {
            Map<String, Object> map = new HashMap<>();
            map.put("status", row[0].toString());
            map.put("count", row[1]);
            response.add(map);
        }

        return ResponseEntity.ok(response);
    }
}
