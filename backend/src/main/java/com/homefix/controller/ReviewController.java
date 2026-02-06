package com.homefix.controller;

import com.homefix.dto.ReviewDto;
import com.homefix.service.ReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    public ResponseEntity<ReviewDto> createReview(@RequestBody ReviewDto dto) {
        return ResponseEntity.ok(reviewService.createReview(dto));
    }

    @GetMapping("/service/{serviceId}")
    public ResponseEntity<List<ReviewDto>> getReviewsByService(@PathVariable Long serviceId) {
        return ResponseEntity.ok(reviewService.getReviewsByService(serviceId));
    }
}
