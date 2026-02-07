package com.homefix.controller;

import com.homefix.service.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FileUploadController {

    private final FileStorageService fileStorageService;

    public FileUploadController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        String fileName = fileStorageService.storeFile(file);

        String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/files/download/")
                .path(fileName)
                .toUriString();

        Map<String, String> response = new HashMap<>();
        response.put("fileName", fileName);
        response.put("fileUrl", fileDownloadUri);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/download/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName) {
        Path filePath = fileStorageService.loadFileAsResource(fileName);
        Resource resource;
        try {
            resource = new UrlResource(filePath.toUri());
            if(resource.exists()) {
                String contentType = "application/octet-stream";
                try {
                     contentType = java.nio.file.Files.probeContentType(filePath);
                } catch (Exception ex) {
                    // Fallback to default
                }
                
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"))
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
