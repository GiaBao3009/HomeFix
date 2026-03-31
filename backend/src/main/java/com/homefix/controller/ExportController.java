package com.homefix.controller;

import com.homefix.entity.ExportLog;
import com.homefix.service.ExcelExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/export")
@PreAuthorize("hasRole('ADMIN')")
public class ExportController {

    private final ExcelExportService excelExportService;

    public ExportController(ExcelExportService excelExportService) {
        this.excelExportService = excelExportService;
    }

    @GetMapping("/bookings")
    public ResponseEntity<byte[]> exportBookings() {
        byte[] data = excelExportService.exportBookings();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=don-hang.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @GetMapping("/users")
    public ResponseEntity<byte[]> exportUsers() {
        byte[] data = excelExportService.exportUsers();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=nguoi-dung.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @GetMapping("/revenue")
    public ResponseEntity<byte[]> exportRevenue() {
        byte[] data = excelExportService.exportRevenue();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=doanh-thu.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(excelExportService.getExportStatistics(days));
    }

    @GetMapping("/recent")
    public ResponseEntity<List<ExportLog>> getRecentExports(@RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(excelExportService.getRecentExports(limit));
    }
}
