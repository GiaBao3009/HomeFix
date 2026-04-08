package com.homefix.config;

import com.homefix.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.beans.factory.annotation.Value;

import java.util.List;
import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${homefix.app.cors.allowed-origins}")
    private String allowedOrigins;

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;
    private final com.homefix.security.OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    private final com.homefix.security.HomeFixOAuth2UserService homeFixOAuth2UserService;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter,
            AuthenticationProvider authenticationProvider,
            com.homefix.security.OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler,
            com.homefix.security.HomeFixOAuth2UserService homeFixOAuth2UserService) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.authenticationProvider = authenticationProvider;
        this.oAuth2AuthenticationSuccessHandler = oAuth2AuthenticationSuccessHandler;
        this.homeFixOAuth2UserService = homeFixOAuth2UserService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .headers(headers -> headers
                        .frameOptions(frame -> frame.sameOrigin()))
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers("/api/services/**").permitAll() // Allow all methods for testing, or refine
                                                                         // later
                        .requestMatchers("/api/content/**").permitAll()
                        .requestMatchers("/api/reviews/by-token/**").permitAll()
                        .requestMatchers("/api/files/**").permitAll() // File upload/download
                        .requestMatchers("/uploads/**").permitAll() // Static resources

                        // Coupon endpoints
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/coupons").permitAll() // Allow
                                                                                                              // viewing
                                                                                                              // coupons
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/coupons/validate/**")
                        .authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/coupons").hasRole("ADMIN")
                        .requestMatchers("/ws-chat/**").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui.html", "/swagger-ui/**").permitAll()

                        // Booking Security
                        .requestMatchers("/api/bookings/*/assign").hasRole("ADMIN")
                        .requestMatchers("/api/bookings/*/status").hasAnyRole("ADMIN", "TECHNICIAN")

                        // Admin only endpoints
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        // Technician endpoints
                        .requestMatchers("/api/technician/**").hasAnyRole("TECHNICIAN", "ADMIN")
                        // Authenticated users
                        .anyRequest().authenticated())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo.userService(homeFixOAuth2UserService))
                        .successHandler(oAuth2AuthenticationSuccessHandler));

        return http.build();
    }

    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
