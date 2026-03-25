package com.homefix.service;

import com.homefix.entity.Booking;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import java.time.format.DateTimeFormatter;

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

    public void sendBookingConfirmationEmail(Booking booking) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String toEmail = booking.getCustomer().getEmail();
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("HomeFix - Xác nhận đặt lịch #" + booking.getId());

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("HH:mm - dd/MM/yyyy");
            String formattedTime = booking.getBookingTime().format(dtf);

            String paymentMethodVi = switch (booking.getPaymentMethod()) {
                case "CASH" -> "Tiền mặt";
                case "BANK_TRANSFER" -> "Chuyển khoản ngân hàng";
                case "MOMO" -> "Ví MoMo";
                case "VNPAY" -> "VNPay QR";
                default -> booking.getPaymentMethod();
            };

            String paymentStatusVi;
            String paymentStatusColor;
            if ("PAID".equals(booking.getPaymentStatus())) {
                paymentStatusVi = "Đã thanh toán ✅";
                paymentStatusColor = "#16a34a";
            } else {
                paymentStatusVi = "Chưa thanh toán ⏳";
                paymentStatusColor = "#ea580c";
            }

            String htmlContent = """
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px 20px;">
                    <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
                        <div style="text-align: center; margin-bottom: 32px;">
                            <div style="display: inline-block; background: linear-gradient(135deg, #2563eb, #0891b2); color: white; font-size: 24px; font-weight: 800; padding: 12px 20px; border-radius: 12px;">HF</div>
                            <h1 style="color: #1e293b; margin: 16px 0 8px; font-size: 24px;">HomeFix</h1>
                            <p style="color: #64748b; margin: 0;">Chăm sóc ngôi nhà của bạn</p>
                        </div>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                        <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 8px;">Xác nhận đặt lịch dịch vụ</h2>
                        <p style="color: #475569; margin-bottom: 24px;">Đơn hàng <strong>#%d</strong> của bạn đã được ghi nhận.</p>

                        <table style="width: 100%%; border-collapse: collapse; margin-bottom: 24px;">
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 12px 0; color: #64748b; font-size: 14px;">📦 Dịch vụ</td>
                                <td style="padding: 12px 0; color: #1e293b; font-weight: 600; text-align: right;">%s</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 12px 0; color: #64748b; font-size: 14px;">🕐 Thời gian hẹn</td>
                                <td style="padding: 12px 0; color: #1e293b; font-weight: 600; text-align: right;">%s</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 12px 0; color: #64748b; font-size: 14px;">📍 Địa chỉ</td>
                                <td style="padding: 12px 0; color: #1e293b; font-weight: 600; text-align: right;">%s</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 12px 0; color: #64748b; font-size: 14px;">💰 Tổng tiền</td>
                                <td style="padding: 12px 0; color: #1e293b; font-weight: 600; text-align: right;">%s VNĐ</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 12px 0; color: #64748b; font-size: 14px;">💳 Phương thức</td>
                                <td style="padding: 12px 0; color: #1e293b; font-weight: 600; text-align: right;">%s</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 0; color: #64748b; font-size: 14px;">📋 Thanh toán</td>
                                <td style="padding: 12px 0; font-weight: 700; text-align: right; color: %s;">%s</td>
                            </tr>
                        </table>

                        <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
                            Cảm ơn bạn đã sử dụng dịch vụ HomeFix. Chúng tôi sẽ liên hệ bạn sớm nhất!
                        </p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                            © 2024 HomeFix. Tất cả quyền được bảo lưu.
                        </p>
                    </div>
                </div>
                """.formatted(
                    booking.getId(),
                    booking.getServicePackage().getName(),
                    formattedTime,
                    booking.getAddress(),
                    booking.getTotalPrice() != null ? String.format("%,.0f", booking.getTotalPrice()) : "0",
                    paymentMethodVi,
                    paymentStatusColor,
                    paymentStatusVi
                );

            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Không thể gửi email xác nhận đặt lịch.", e);
        }
    }
}
