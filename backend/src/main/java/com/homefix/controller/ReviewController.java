package com.homefix.controller;

import com.homefix.dto.ReviewDto;
import com.homefix.dto.TechnicianLeaderboardDto;
import com.homefix.service.ReviewService;
import com.homefix.service.TechnicianEngagementService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
    private final ReviewService reviewService;
    private final TechnicianEngagementService technicianEngagementService;

    public ReviewController(ReviewService reviewService, TechnicianEngagementService technicianEngagementService) {
        this.reviewService = reviewService;
        this.technicianEngagementService = technicianEngagementService;
    }

    @PostMapping
    public ResponseEntity<ReviewDto> createReview(@RequestBody ReviewDto dto) {
        return ResponseEntity.ok(reviewService.createReview(dto));
    }

    @GetMapping("/service/{serviceId}")
    public ResponseEntity<List<ReviewDto>> getReviewsByService(@PathVariable("serviceId") Long serviceId) {
        return ResponseEntity.ok(reviewService.getReviewsByService(serviceId));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<TechnicianLeaderboardDto>> getLeaderboard() {
        return ResponseEntity.ok(technicianEngagementService.getTechnicianLeaderboard());
    }
}
