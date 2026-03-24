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

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("HomeFix - Đặt lại mật khẩu");

            String htmlContent = """
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px 20px;">
                    <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
                        <div style="text-align: center; margin-bottom: 32px;">
                            <div style="display: inline-block; background: linear-gradient(135deg, #2563eb, #0891b2); color: white; font-size: 24px; font-weight: 800; padding: 12px 20px; border-radius: 12px;">HF</div>
                            <h1 style="color: #1e293b; margin: 16px 0 8px; font-size: 24px;">HomeFix</h1>
                            <p style="color: #64748b; margin: 0;">Chăm sóc ngôi nhà của bạn</p>
                        </div>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                        <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 16px;">Yêu cầu đặt lại mật khẩu</h2>
                        <p style="color: #475569; line-height: 1.6; margin-bottom: 24px;">
                            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn vào nút bên dưới để tạo mật khẩu mới:
                        </p>
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #0891b2); color: white; text-decoration: none; padding: 14px 40px; border-radius: 12px; font-size: 16px; font-weight: 600;">Đặt lại mật khẩu</a>
                        </div>
                        <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
                            ⏰ Link này sẽ hết hạn sau <strong>15 phút</strong>.<br>
                            Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
                        </p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                            © 2024 HomeFix. Tất cả quyền được bảo lưu.
                        </p>
                    </div>
                </div>
                """.formatted(resetLink);

            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Không thể gửi email. Vui lòng thử lại sau.", e);
        }
    }
}
