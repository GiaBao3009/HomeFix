package com.homefix.security;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.RequestEntity;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestOperations;
import org.springframework.web.client.RestTemplate;

@Service
public class HomeFixOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {
    private static final Logger logger = LoggerFactory.getLogger(HomeFixOAuth2UserService.class);
    private static final URI GITHUB_EMAILS_URI = URI.create("https://api.github.com/user/emails");

    private final DefaultOAuth2UserService delegate;
    private final RestOperations restOperations;

    public HomeFixOAuth2UserService() {
        this(new DefaultOAuth2UserService(), new RestTemplate());
    }

    HomeFixOAuth2UserService(DefaultOAuth2UserService delegate, RestOperations restOperations) {
        this.delegate = delegate;
        this.restOperations = restOperations;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = delegate.loadUser(userRequest);
        Map<String, Object> attributes = new LinkedHashMap<>(oauth2User.getAttributes());
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        if ("github".equalsIgnoreCase(registrationId)) {
            enrichGithubAttributes(attributes, userRequest.getAccessToken().getTokenValue());
        }

        if (isBlank(stringAttribute(attributes, "name"))) {
            attributes.put("name", resolveFallbackName(attributes));
        }

        String nameAttributeKey = resolveNameAttributeKey(userRequest, attributes);
        return new DefaultOAuth2User(oauth2User.getAuthorities(), attributes, nameAttributeKey);
    }

    private void enrichGithubAttributes(Map<String, Object> attributes, String accessToken) {
        if (isBlank(stringAttribute(attributes, "email"))) {
            String githubEmail = fetchGithubPrimaryEmail(accessToken);
            if (!isBlank(githubEmail)) {
                attributes.put("email", githubEmail);
            }
        }

        if (isBlank(stringAttribute(attributes, "name"))) {
            String login = stringAttribute(attributes, "login");
            if (!isBlank(login)) {
                attributes.put("name", login);
            }
        }
    }

    private String fetchGithubPrimaryEmail(String accessToken) {
        try {
            RequestEntity<Void> request = RequestEntity.get(GITHUB_EMAILS_URI)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .header(HttpHeaders.ACCEPT, "application/vnd.github+json")
                    .header("X-GitHub-Api-Version", "2022-11-28")
                    .build();

            List<Map<String, Object>> emails = restOperations.exchange(
                    request,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {
                    }).getBody();

            if (emails == null || emails.isEmpty()) {
                return null;
            }

            String primaryVerified = findGithubEmail(emails, true, true);
            if (!isBlank(primaryVerified)) {
                return primaryVerified;
            }

            String primary = findGithubEmail(emails, true, false);
            if (!isBlank(primary)) {
                return primary;
            }

            String verified = findGithubEmail(emails, false, true);
            if (!isBlank(verified)) {
                return verified;
            }

            return findGithubEmail(emails, false, false);
        } catch (RestClientException error) {
            logger.warn("Could not fetch GitHub primary email for OAuth login", error);
            return null;
        }
    }

    private String findGithubEmail(List<Map<String, Object>> emails, boolean requirePrimary, boolean requireVerified) {
        for (Map<String, Object> emailEntry : emails) {
            String email = stringAttribute(emailEntry, "email");
            if (isBlank(email)) {
                continue;
            }

            boolean primary = Boolean.TRUE.equals(emailEntry.get("primary"));
            boolean verified = Boolean.TRUE.equals(emailEntry.get("verified"));
            if ((!requirePrimary || primary) && (!requireVerified || verified)) {
                return email;
            }
        }
        return null;
    }

    private String resolveNameAttributeKey(OAuth2UserRequest userRequest, Map<String, Object> attributes) {
        String configuredKey = userRequest.getClientRegistration()
                .getProviderDetails()
                .getUserInfoEndpoint()
                .getUserNameAttributeName();

        if (!isBlank(configuredKey) && attributes.containsKey(configuredKey)) {
            return configuredKey;
        }
        if (attributes.containsKey("sub")) {
            return "sub";
        }
        if (attributes.containsKey("id")) {
            return "id";
        }
        if (attributes.containsKey("email")) {
            return "email";
        }
        return attributes.keySet().stream().findFirst().orElse("name");
    }

    private String resolveFallbackName(Map<String, Object> attributes) {
        String login = stringAttribute(attributes, "login");
        if (!isBlank(login)) {
            return login;
        }

        String email = stringAttribute(attributes, "email");
        if (!isBlank(email) && email.contains("@")) {
            return email.substring(0, email.indexOf('@'));
        }
        return "OAuth User";
    }

    private String stringAttribute(Map<String, Object> attributes, String key) {
        Object value = attributes.get(key);
        return value == null ? null : String.valueOf(value).trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
