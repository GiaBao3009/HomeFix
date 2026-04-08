package com.homefix.service;

import com.homefix.entity.Booking;
import com.homefix.entity.ExportLog;
import com.homefix.entity.User;
import com.homefix.repository.BookingRepository;
import com.homefix.repository.ExportLogRepository;
import com.homefix.repository.UserRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class ExcelExportService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ExportLogRepository exportLogRepository;

    public ExcelExportService(BookingRepository bookingRepository, UserRepository userRepository, ExportLogRepository exportLogRepository) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.exportLogRepository = exportLogRepository;
    }

    public byte[] exportBookings() {
        long start = System.currentTimeMillis();
        List<Booking> bookings = bookingRepository.findAll();

        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Đơn hàng");
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle dateStyle = wb.createCellStyle();
            dateStyle.setDataFormat(wb.createDataFormat().getFormat("dd/MM/yyyy HH:mm"));

            String[] headers = {"ID", "Khách hàng", "Dịch vụ", "Ngày đặt", "Địa chỉ", "Trạng thái", "Tổng tiền", "Thu nhập thợ", "Lợi nhuận"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Booking b : bookings) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(b.getId());
                row.createCell(1).setCellValue(b.getCustomer() != null ? b.getCustomer().getFullName() : "");
                row.createCell(2).setCellValue(b.resolveServiceName() != null ? b.resolveServiceName() : "");
                Cell dateCell = row.createCell(3);
                if (b.getBookingTime() != null) {
                    dateCell.setCellValue(b.getBookingTime().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
                }
                row.createCell(4).setCellValue(b.getAddress() != null ? b.getAddress() : "");
                row.createCell(5).setCellValue(b.getStatus() != null ? b.getStatus().name() : "");
                row.createCell(6).setCellValue(b.getTotalPrice() != null ? b.getTotalPrice().doubleValue() : 0);
                row.createCell(7).setCellValue(b.getTechnicianEarning() != null ? b.getTechnicianEarning().doubleValue() : 0);
                row.createCell(8).setCellValue(b.getPlatformProfit() != null ? b.getPlatformProfit().doubleValue() : 0);
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);

            byte[] data = toBytes(wb);
            logExport("BOOKINGS", "don-hang.xlsx", data.length, bookings.size(), System.currentTimeMillis() - start);
            return data;
        } catch (Exception e) {
            throw new RuntimeException("Lỗi xuất Excel đơn hàng", e);
        }
    }

    public byte[] exportUsers() {
        long start = System.currentTimeMillis();
        List<User> users = userRepository.findAll();

        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Người dùng");
            CellStyle headerStyle = createHeaderStyle(wb);

            String[] headers = {"ID", "Họ tên", "Email", "SĐT", "Vai trò", "Loại thợ", "Trạng thái duyệt"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (User u : users) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(u.getId());
                row.createCell(1).setCellValue(u.getFullName() != null ? u.getFullName() : "");
                row.createCell(2).setCellValue(u.getEmail() != null ? u.getEmail() : "");
                row.createCell(3).setCellValue(u.getPhone() != null ? u.getPhone() : "");
                row.createCell(4).setCellValue(u.getRole() != null ? u.getRole().name() : "");
                row.createCell(5).setCellValue(u.getTechnicianType() != null ? u.getTechnicianType().name() : "");
                row.createCell(6).setCellValue(u.getTechnicianApprovalStatus() != null ? u.getTechnicianApprovalStatus().name() : "");
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);

            byte[] data = toBytes(wb);
            logExport("USERS", "nguoi-dung.xlsx", data.length, users.size(), System.currentTimeMillis() - start);
            return data;
        } catch (Exception e) {
            throw new RuntimeException("Lỗi xuất Excel người dùng", e);
        }
    }

    public byte[] exportRevenue() {
        long start = System.currentTimeMillis();
        List<Booking> completed = bookingRepository.findAll().stream()
                .filter(b -> b.getStatus() != null && "COMPLETED".equals(b.getStatus().name()))
                .toList();

        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Doanh thu");
            CellStyle headerStyle = createHeaderStyle(wb);

            String[] headers = {"ID", "Dịch vụ", "Khách hàng", "Thợ chính", "Tổng tiền", "Thu nhập thợ", "Lợi nhuận nền tảng", "Ngày hoàn thành"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Booking b : completed) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(b.getId());
                row.createCell(1).setCellValue(b.resolveServiceName() != null ? b.resolveServiceName() : "");
                row.createCell(2).setCellValue(b.getCustomer() != null ? b.getCustomer().getFullName() : "");
                row.createCell(3).setCellValue(b.getTechnician() != null ? b.getTechnician().getFullName() : "");
                row.createCell(4).setCellValue(b.getTotalPrice() != null ? b.getTotalPrice().doubleValue() : 0);
                row.createCell(5).setCellValue(b.getTechnicianEarning() != null ? b.getTechnicianEarning().doubleValue() : 0);
                row.createCell(6).setCellValue(b.getPlatformProfit() != null ? b.getPlatformProfit().doubleValue() : 0);
                row.createCell(7).setCellValue(b.getBookingTime() != null ? b.getBookingTime().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : "");
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);

            byte[] data = toBytes(wb);
            logExport("REVENUE", "doanh-thu.xlsx", data.length, completed.size(), System.currentTimeMillis() - start);
            return data;
        } catch (Exception e) {
            throw new RuntimeException("Lỗi xuất Excel doanh thu", e);
        }
    }

    public Map<String, Object> getExportStatistics(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<Object[]> byDay = exportLogRepository.countByDay(since);
        List<Object[]> byType = exportLogRepository.countByType(since);
        List<Object[]> byUser = exportLogRepository.countByUser(since);
        Double avgSize = exportLogRepository.avgFileSize(since);
        Double avgDur = exportLogRepository.avgDuration(since);
        long total = exportLogRepository.countByCreatedAtAfter(since);

        return Map.of(
                "totalExports", total,
                "avgFileSize", avgSize != null ? Math.round(avgSize) : 0,
                "avgDurationMs", avgDur != null ? Math.round(avgDur) : 0,
                "byDay", byDay.stream().map(r -> Map.of("date", r[0].toString(), "count", ((Number) r[1]).longValue())).toList(),
                "byType", byType.stream().map(r -> Map.of("type", r[0], "count", ((Number) r[1]).longValue())).toList(),
                "byUser", byUser.stream().map(r -> Map.of("user", r[0], "count", ((Number) r[1]).longValue())).toList()
        );
    }

    public List<ExportLog> getRecentExports(int limit) {
        List<ExportLog> all = exportLogRepository.findAllByOrderByCreatedAtDesc();
        return all.size() > limit ? all.subList(0, limit) : all;
    }

    private CellStyle createHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 12);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        return style;
    }

    private byte[] toBytes(XSSFWorkbook wb) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        wb.write(out);
        return out.toByteArray();
    }

    private void logExport(String type, String fileName, long fileSize, int rowCount, long durationMs) {
        try {
            ExportLog log = new ExportLog();
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof User user) {
                log.setUserId(user.getId());
                log.setUserName(user.getFullName());
            } else if (auth != null) {
                log.setUserName(auth.getName());
            }
            log.setExportType(type);
            log.setFileName(fileName);
            log.setFileSize(fileSize);
            log.setRowCount(rowCount);
            log.setDurationMs(durationMs);
            exportLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("Failed to log export: " + e.getMessage());
        }
    }
}
