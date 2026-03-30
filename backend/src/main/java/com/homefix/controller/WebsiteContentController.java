package com.homefix.controller;

import com.homefix.entity.WebsiteContent;
import com.homefix.service.WebsiteContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/content")
public class WebsiteContentController {

    @Autowired
    private WebsiteContentService contentService;

    @GetMapping("/{section}")
    public ResponseEntity<Map<String, Object>> getContentBySection(@PathVariable("section") String section) {
        // Convert section to uppercase to match DB convention
        return ResponseEntity.ok(contentService.getStructuredContentBySection(section.toUpperCase()));
    }

    // Admin endpoint to update content (simplified for now)
    @PostMapping
    public ResponseEntity<WebsiteContent> createContent(@RequestBody WebsiteContent content) {
        return ResponseEntity.ok(contentService.saveContent(content));
    }
}
