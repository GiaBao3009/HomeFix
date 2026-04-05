package com.homefix.service;

import com.homefix.entity.Booking;
import com.homefix.repository.BookingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BookingSnapshotService {
    private final BookingRepository bookingRepository;

    public BookingSnapshotService(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    @Transactional
    public int backfillMissingSnapshots() {
        List<Booking> bookings = bookingRepository.findBookingsMissingServiceSnapshot();
        int updated = 0;
        for (Booking booking : bookings) {
            if (booking.captureServiceSnapshotIfMissing()) {
                updated++;
            }
        }
        return updated;
    }
}
