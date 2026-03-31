package com.homefix.repository;

import com.homefix.entity.ExportLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ExportLogRepository extends JpaRepository<ExportLog, Long> {

    List<ExportLog> findAllByOrderByCreatedAtDesc();

    List<ExportLog> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime from, LocalDateTime to);

    @Query("SELECT DATE(e.createdAt) as day, COUNT(e) as cnt FROM ExportLog e WHERE e.createdAt >= :since GROUP BY DATE(e.createdAt) ORDER BY day")
    List<Object[]> countByDay(@Param("since") LocalDateTime since);

    @Query("SELECT e.exportType, COUNT(e) FROM ExportLog e WHERE e.createdAt >= :since GROUP BY e.exportType")
    List<Object[]> countByType(@Param("since") LocalDateTime since);

    @Query("SELECT e.userName, COUNT(e) FROM ExportLog e WHERE e.createdAt >= :since GROUP BY e.userName ORDER BY COUNT(e) DESC")
    List<Object[]> countByUser(@Param("since") LocalDateTime since);

    @Query("SELECT AVG(e.fileSize) FROM ExportLog e WHERE e.createdAt >= :since")
    Double avgFileSize(@Param("since") LocalDateTime since);

    @Query("SELECT AVG(e.durationMs) FROM ExportLog e WHERE e.createdAt >= :since")
    Double avgDuration(@Param("since") LocalDateTime since);

    long countByCreatedAtAfter(LocalDateTime since);
}
