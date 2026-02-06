package com.homefix.controller;

import com.homefix.entity.Booking;
import com.homefix.repository.BookingRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

@RestController
@RequestMapping("/api/admin/export")
public class ExportController {
    private final BookingRepository bookingRepository;

    public ExportController(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    @GetMapping("/bookings")
    public void exportBookingsToCsv(HttpServletResponse response) throws IOException {
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"bookings.csv\"");

        List<Booking> bookings = bookingRepository.findAll();

        try (PrintWriter writer = response.getWriter()) {
            writer.println("ID,Customer,Service,Price,Status,Time,Address");
            
            for (Booking booking : bookings) {
                writer.printf("%d,%s,%s,%s,%s,%s,%s%n",
                        booking.getId(),
                        escapeSpecialCharacters(booking.getCustomer().getFullName()),
                        escapeSpecialCharacters(booking.getServicePackage().getName()),
                        booking.getTotalPrice(),
                        booking.getStatus(),
                        booking.getBookingTime(),
                        escapeSpecialCharacters(booking.getAddress())
                );
            }
        }
    }

    private String escapeSpecialCharacters(String data) {
        if (data == null) {
            return "";
        }
        String escapedData = data.replaceAll("\\R", " ");
        if (data.contains(",") || data.contains("\"") || data.contains("'")) {
            data = data.replace("\"", "\"\"");
            escapedData = "\"" + data + "\"";
        }
        return escapedData;
    }
}

