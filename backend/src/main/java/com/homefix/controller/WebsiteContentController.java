package com.homefix.controller;

import com.homefix.entity.WebsiteContent;
import com.homefix.service.WebsiteContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/content")
@CrossOrigin(origins = "http://localhost:5173")
public class WebsiteContentController {

    @Autowired
    private WebsiteContentService contentService;

    @GetMapping("/{section}")
    public ResponseEntity<Map<String, Object>> getContentBySection(@PathVariable String section) {
        // Convert section to uppercase to match DB convention
        return ResponseEntity.ok(contentService.getStructuredContentBySection(section.toUpperCase()));
    }

    // Admin endpoint to update content (simplified for now)
    @PostMapping
    public ResponseEntity<WebsiteContent> createContent(@RequestBody WebsiteContent content) {
        return ResponseEntity.ok(contentService.saveContent(content));
    }
}
