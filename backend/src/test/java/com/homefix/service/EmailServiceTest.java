package com.homefix.service;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;

import java.lang.reflect.Field;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EmailServiceTest {

    @Test
    void sendPasswordResetEmail_rendersResetLinkWithoutFormatErrors() throws Exception {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        EmailService emailService = new EmailService(mailSender);
        setField(emailService, "fromEmail", "noreply@homefix.test");
        setField(emailService, "frontendUrl", "https://homefix.ink");

        assertDoesNotThrow(() -> emailService.sendPasswordResetEmail("user@example.com", "token-123"));
        verify(mailSender).send(mimeMessage);
        org.junit.jupiter.api.Assertions.assertEquals("HomeFix - Dat lai mat khau", mimeMessage.getSubject());
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
