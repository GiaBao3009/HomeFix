package com.homefix.service;

import com.homefix.dto.NotificationDto;
import com.homefix.entity.Notification;
import com.homefix.entity.User;
import com.homefix.repository.NotificationRepository;
import com.homefix.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {
    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    public List<NotificationDto> getMyNotifications() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        if (email == null || "anonymousUser".equals(email)) {
            return List.of();
        }
        return userRepository.findByEmail(email)
                .map(user -> notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                        .stream()
                        .map(this::mapToDto)
                        .collect(Collectors.toList()))
                .orElse(List.of());
    }

    private NotificationDto mapToDto(Notification n) {
        return new NotificationDto(
                n.getId(),
                n.getTitle(),
                n.getMessage(),
                n.isRead(),
                n.getCreatedAt(),
                n.getType(),
                n.getRelatedId());
    }

    public long getUnreadCount() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        if (email == null || "anonymousUser".equals(email)) {
            return 0;
        }
        return userRepository.findByEmail(email)
                .map(user -> notificationRepository.countByUserIdAndIsReadFalse(user.getId()))
                .orElse(0L);
    }

    public void markAsRead(Long id) {
        Notification n = notificationRepository.findById(id).orElseThrow();
        // Verify ownership?
        n.setRead(true);
        notificationRepository.save(n);
    }

    public void markAllAsRead() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        for (Notification n : list) {
            n.setRead(true);
        }
        notificationRepository.saveAll(list);
    }

    public void createNotification(User user, String title, String message, String type, Long relatedId) {
        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setMessage(message);
        n.setType(type);
        n.setRelatedId(relatedId);
        notificationRepository.save(n);
    }
}
