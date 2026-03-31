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
                    .header { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); padding: 40px 32px; text-align: center; }
                    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; }
                    .header p { color: #e0f2fe; margin: 8px 0 0; font-size: 14px; }
                    .body { padding: 40px 32px; }
                    .body h2 { color: #1e293b; margin-top: 0; font-size: 22px; }
                    .body p { color: #475569; line-height: 1.7; font-size: 15px; }
                    .btn { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-weight: 700; font-size: 16px; margin: 24px 0; }
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

    public void sendCompletionEmail(Booking booking, String reviewToken) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(booking.getCustomer().getEmail());
            helper.setSubject("HomeFix - Đơn hàng #" + booking.getId() + " đã hoàn thành!");
            String reviewLink = frontendUrl + "/review/" + booking.getId() + "?token=" + reviewToken;
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("HH:mm - dd/MM/yyyy");
            String formattedTime = booking.getBookingTime().format(dtf);
            String techName = booking.getTechnician() != null ? booking.getTechnician().getFullName() : "N/A";
            String htmlContent = """
                <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:40px 20px;">
                <div style="background:white;border-radius:16px;padding:40px;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
                <div style="text-align:center;margin-bottom:32px;">
                <div style="display:inline-block;background:linear-gradient(135deg,#2563eb,#0891b2);color:white;font-size:24px;font-weight:800;padding:12px 20px;border-radius:12px;">HF</div>
                <h1 style="color:#1e293b;margin:16px 0 8px;font-size:24px;">HomeFix</h1></div>
                <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;background:#dcfce7;color:#16a34a;padding:8px 20px;border-radius:20px;font-weight:700;">Hoàn thành</div></div>
                <h2 style="color:#1e293b;font-size:20px;text-align:center;">Đơn hàng #%d đã hoàn thành!</h2>
                <p style="color:#475569;text-align:center;margin-bottom:24px;">Cảm ơn bạn đã sử dụng dịch vụ HomeFix.</p>
                <table style="width:100%%;border-collapse:collapse;margin-bottom:24px;">
                <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:12px 0;color:#64748b;">Dịch vụ</td><td style="padding:12px 0;color:#1e293b;font-weight:600;text-align:right;">%s</td></tr>
                <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:12px 0;color:#64748b;">Kỹ thuật viên</td><td style="padding:12px 0;color:#1e293b;font-weight:600;text-align:right;">%s</td></tr>
                <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:12px 0;color:#64748b;">Thời gian</td><td style="padding:12px 0;color:#1e293b;font-weight:600;text-align:right;">%s</td></tr>
                <tr><td style="padding:12px 0;color:#64748b;">Tổng tiền</td><td style="padding:12px 0;color:#1e293b;font-weight:600;text-align:right;">%s VNĐ</td></tr></table>
                <div style="text-align:center;margin:32px 0;">
                <p style="color:#475569;margin-bottom:16px;">Vui lòng đánh giá để chúng tôi mang đến trải nghiệm tốt nhất!</p>
                <a href="%s" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#06b6d4);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:16px;">Đánh giá ngay</a></div>
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
                <p style="color:#94a3b8;font-size:12px;text-align:center;">© 2024 HomeFix</p></div></div>
                """.formatted(
                    booking.getId(),
                    booking.getServicePackage().getName(),
                    techName,
                    formattedTime,
                    booking.getTotalPrice() != null ? String.format("%,.0f", booking.getTotalPrice()) : "0",
                    reviewLink);
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Không thể gửi email hoàn thành.", e);
        }
    }
}