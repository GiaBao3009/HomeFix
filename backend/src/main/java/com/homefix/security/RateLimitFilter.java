package com.homefix.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {
    private static final long WINDOW_MS = 60_000; // 1 minute
    private static final int MAX_REQUESTS = 60;   // per IP per window

    private final Map<String, Window> buckets = new ConcurrentHashMap<>();

    private static class Window {
        long start;
        int count;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/api/auth"); // only limit auth endpoints
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String ip = request.getRemoteAddr();
        long now = Instant.now().toEpochMilli();
        Window w = buckets.computeIfAbsent(ip, k -> {
            Window nw = new Window();
            nw.start = now;
            nw.count = 0;
            return nw;
        });
        synchronized (w) {
            if (now - w.start > WINDOW_MS) {
                w.start = now;
                w.count = 0;
            }
            w.count++;
            if (w.count > MAX_REQUESTS) {
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Too Many Requests\"}");
                return;
            }
        }
        filterChain.doFilter(request, response);
    }
}
