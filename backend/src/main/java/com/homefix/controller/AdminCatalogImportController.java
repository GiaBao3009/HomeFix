package com.homefix.controller;

import com.homefix.dto.CatalogImportResultDto;
import com.homefix.service.CatalogImportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/catalog-import")
public class AdminCatalogImportController {
    private final CatalogImportService catalogImportService;

    public AdminCatalogImportController(CatalogImportService catalogImportService) {
        this.catalogImportService = catalogImportService;
    }

    @PostMapping("/categories")
    public ResponseEntity<CatalogImportResultDto> importCategories(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(catalogImportService.importCategories(file));
    }

    @PostMapping("/packages")
    public ResponseEntity<CatalogImportResultDto> importPackages(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(catalogImportService.importPackages(file));
    }

    @GetMapping("/categories/template")
    public ResponseEntity<byte[]> downloadCategoryTemplate() {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=homefix-category-template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(catalogImportService.downloadCategoryTemplate());
    }

    @GetMapping("/packages/template")
    public ResponseEntity<byte[]> downloadPackageTemplate() {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=homefix-service-template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(catalogImportService.downloadPackageTemplate());
    }
}
