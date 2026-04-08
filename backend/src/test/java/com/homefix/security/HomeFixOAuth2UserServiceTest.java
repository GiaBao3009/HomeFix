package com.homefix.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.client.RestOperations;

@ExtendWith(MockitoExtension.class)
class HomeFixOAuth2UserServiceTest {

    @Mock
    private DefaultOAuth2UserService delegate;

    @Mock
    private RestOperations restOperations;

    @Test
    void loadUser_fetchesGithubPrimaryEmailWhenProfileEmailIsMissing() {
        OAuth2UserRequest userRequest = buildUserRequest("github");
        OAuth2User delegateUser = new DefaultOAuth2User(
                List.of(new SimpleGrantedAuthority("ROLE_USER")),
                Map.of("id", 12345L, "login", "octocat"),
                "id");

        when(delegate.loadUser(userRequest)).thenReturn(delegateUser);
        when(restOperations.exchange(
                any(RequestEntity.class),
                any(ParameterizedTypeReference.class)))
                .thenReturn(ResponseEntity.ok(List.of(
                        Map.of("email", "backup@example.com", "primary", false, "verified", true),
                        Map.of("email", "primary@example.com", "primary", true, "verified", true))));

        HomeFixOAuth2UserService service = new HomeFixOAuth2UserService(delegate, restOperations);
        OAuth2User user = service.loadUser(userRequest);

        assertEquals("primary@example.com", user.getAttribute("email"));
        assertEquals("octocat", user.getAttribute("name"));
    }

    @Test
    void loadUser_keepsOtherProvidersUntouched() {
        OAuth2UserRequest userRequest = buildUserRequest("google");
        OAuth2User delegateUser = new DefaultOAuth2User(
                List.of(new SimpleGrantedAuthority("ROLE_USER")),
                Map.of("sub", "abc-123", "email", "google@example.com", "name", "Google User"),
                "sub");

        when(delegate.loadUser(userRequest)).thenReturn(delegateUser);

        HomeFixOAuth2UserService service = new HomeFixOAuth2UserService(delegate, restOperations);
        OAuth2User user = service.loadUser(userRequest);

        assertEquals("google@example.com", user.getAttribute("email"));
        assertEquals("Google User", user.getAttribute("name"));
        verifyNoInteractions(restOperations);
    }

    private OAuth2UserRequest buildUserRequest(String registrationId) {
        ClientRegistration clientRegistration = ClientRegistration.withRegistrationId(registrationId)
                .clientId("client-id")
                .clientSecret("client-secret")
                .clientName(registrationId)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .authorizationUri("https://example.com/oauth/authorize")
                .tokenUri("https://example.com/oauth/token")
                .userInfoUri("https://example.com/userinfo")
                .userNameAttributeName("github".equals(registrationId) ? "id" : "sub")
                .scope("email", "profile")
                .build();

        OAuth2AccessToken accessToken = new OAuth2AccessToken(
                OAuth2AccessToken.TokenType.BEARER,
                "test-access-token",
                Instant.now(),
                Instant.now().plusSeconds(3600));

        return new OAuth2UserRequest(clientRegistration, accessToken);
    }
}
