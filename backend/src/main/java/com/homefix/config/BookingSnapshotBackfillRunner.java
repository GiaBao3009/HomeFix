package com.homefix.config;

import com.homefix.service.BookingSnapshotService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class BookingSnapshotBackfillRunner implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(BookingSnapshotBackfillRunner.class);

    private final BookingSnapshotService bookingSnapshotService;

    public BookingSnapshotBackfillRunner(BookingSnapshotService bookingSnapshotService) {
        this.bookingSnapshotService = bookingSnapshotService;
    }

    @Override
    public void run(String... args) {
        int updated = bookingSnapshotService.backfillMissingSnapshots();
        if (updated > 0) {
            log.info("Backfilled service snapshots for {} bookings", updated);
        }
    }
}
