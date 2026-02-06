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
}
