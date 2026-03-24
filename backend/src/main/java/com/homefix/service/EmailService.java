package com.homefix.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(String toEmail, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        String htmlContent = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f0f4f8; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
                    .header { background: linear-gradient(135deg, #3b82f6 0%%, #06b6d4 100%%); padding: 40px 32px; text-align: center; }
                    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; }
                    .header p { color: #e0f2fe; margin: 8px 0 0; font-size: 14px; }
                    .body { padding: 40px 32px; }
                    .body h2 { color: #1e293b; margin-top: 0; font-size: 22px; }
                    .body p { color: #475569; line-height: 1.7; font-size: 15px; }
                    .btn { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%%, #06b6d4 100%%); color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-weight: 700; font-size: 16px; margin: 24px 0; }
                    .footer { background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
                    .footer p { color: #94a3b8; font-size: 13px; margin: 4px 0; }
                    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
                    .warning p { color: #92400e; margin: 0; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏠 HomeFix</h1>
                        <p>Hệ thống đặt dịch vụ tiện ích</p>
                    </div>
                    <div class="body">
                        <h2>Đặt lại mật khẩu</h2>
                        <p>Xin chào,</p>
                        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn vào nút bên dưới để tạo mật khẩu mới:</p>
                        <div style="text-align: center;">
                            <a href="%s" class="btn">Đặt lại mật khẩu</a>
                        </div>
                        <div class="warning">
                            <p>⏰ Link này sẽ hết hạn sau <strong>15 phút</strong>. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                        </div>
                        <p>Nếu nút không hoạt động, bạn có thể sao chép và dán link sau vào trình duyệt:</p>
                        <p style="word-break: break-all; color: #3b82f6; font-size: 13px;">%s</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 HomeFix. All rights reserved.</p>
                        <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(resetLink, resetLink);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("HomeFix - Đặt lại mật khẩu");
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Không thể gửi email đặt lại mật khẩu: " + e.getMessage(), e);
        }
    }
}
