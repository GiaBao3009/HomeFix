package com.homefix.service;

import com.homefix.entity.Notification;
import com.homefix.entity.User;
import com.homefix.repository.NotificationRepository;
import com.homefix.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

@Service
public class NotificationService {
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private UserRepository userRepository;

    public List<Notification> getMyNotifications() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    public long getUnreadCount() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
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
        for(Notification n : list) {
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
