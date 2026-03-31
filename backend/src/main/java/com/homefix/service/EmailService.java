package com.homefix.service;

import com.homefix.entity.Booking;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

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
        String htmlTemplate = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f0f4f8; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
                    .header { background: linear-gradient(135deg, #3b82f6, #06b6d4); padding: 40px 32px; text-align: center; }
                    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; }
                    .header p { color: #e0f2fe; margin: 8px 0 0; font-size: 14px; }
                    .body { padding: 40px 32px; }
                    .body h2 { color: #1e293b; margin-top: 0; font-size: 22px; }
                    .body p { color: #475569; line-height: 1.7; font-size: 15px; }
                    .btn { display: inline-block; background: linear-gradient(135deg, #3b82f6, #06b6d4); color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-weight: 700; font-size: 16px; margin: 24px 0; }
                    .footer { background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
                    .footer p { color: #94a3b8; font-size: 13px; margin: 4px 0; }
                    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
                    .warning p { color: #92400e; margin: 0; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>HomeFix</h1>
                        <p>He thong dat dich vu tien ich</p>
                    </div>
                    <div class="body">
                        <h2>Dat lai mat khau</h2>
                        <p>Xin chao,</p>
                        <p>Chung toi nhan duoc yeu cau dat lai mat khau cho tai khoan cua ban. Nhan vao nut ben duoi de tao mat khau moi:</p>
                        <div style="text-align: center;">
                            <a href="{{RESET_LINK}}" class="btn">Dat lai mat khau</a>
                        </div>
                        <div class="warning">
                            <p>Link nay se het han sau <strong>15 phut</strong>. Neu ban khong yeu cau dat lai mat khau, vui long bo qua email nay.</p>
                        </div>
                        <p>Neu nut khong hoat dong, ban co the sao chep va dan link sau vao trinh duyet:</p>
                        <p style="word-break: break-all; color: #3b82f6; font-size: 13px;">{{RESET_LINK}}</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 HomeFix. All rights reserved.</p>
                        <p>Email nay duoc gui tu dong, vui long khong tra loi.</p>
                    </div>
                </div>
            </body>
            </html>
            """;
        String htmlContent = htmlTemplate.replace("{{RESET_LINK}}", resetLink);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("HomeFix - Dat lai mat khau");
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Khong the gui email dat lai mat khau: " + e.getMessage(), e);
        }
    }

    public void sendBookingConfirmationEmail(Booking booking) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String toEmail = booking.getCustomer().getEmail();
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("HomeFix - Xac nhan dat lich #" + booking.getId());

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("HH:mm - dd/MM/yyyy");
            String formattedTime = booking.getBookingTime().format(dtf);

            String paymentMethodVi = switch (booking.getPaymentMethod()) {
                case "CASH" -> "Tien mat";
                case "BANK_TRANSFER" -> "Chuyen khoan ngan hang";
                case "MOMO" -> "Vi MoMo";
                case "VNPAY" -> "VNPay QR";
                default -> booking.getPaymentMethod();
            };

            String paymentStatusVi;
            String paymentStatusColor;
            if ("PAID".equals(booking.getPaymentStatus())) {
                paymentStatusVi = "Da thanh toan";
                paymentStatusColor = "#16a34a";
            } else {
                paymentStatusVi = "Chua thanh toan";
                paymentStatusColor = "#ea580c";
            }

            String htmlContent = """
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px 20px;">
                    <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
                        <div style="text-align: center; margin-bottom: 32px;">
                            <div style="display: inline-block; background: linear-gradient(135deg, #2563eb, #0891b2); color: white; font-size: 24px; font-weight: 800; padding: 12px 20px; border-radius: 12px;">HF</div>
                            <h1 style="color: #1e293b; margin: 16px 0 8px; font-size: 24px;">HomeFix</h1>
                            <p style="color: #64748b; margin: 0;">Cham soc ngoi nha cua ban</p>
                        </div>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                        <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 8px;">Xac nhan dat lich dich vu</h2>
                        <p style="color: #475569; margin-bottom: 24px;">Don hang <strong>#%d</strong> cua ban da duoc ghi nhan.</p>

                        <table style="width: 100%%; border-collapse: collapse; margin-bottom: 24px;">
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Dich vu</td>
                                <td style="padding: 12px 0; color: #1e293b; font-weight: 600; text-align: right;">%s</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Thoi gian hen</td>
                                <td style="padding: 12px 0; color: #1e293b; font-weight: 600; text-align: right;">%s</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Dia chi</td>
                                <td style="padding: 12px 0; color: #1e293b; font-weight: 600; text-align: right;">%s</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Tong tien</td>
                                <td style="padding: 12px 0; color: #1e293b; font-weight: 600; text-align: right;">%s VND</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Phuong thuc</td>
                                <td style="padding: 12px 0; color: #1e293b; font-weight: 600; text-align: right;">%s</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Thanh toan</td>
                                <td style="padding: 12px 0; font-weight: 700; text-align: right; color: %s;">%s</td>
                            </tr>
                        </table>

                        <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
                            Cam on ban da su dung dich vu HomeFix. Chung toi se lien he ban som nhat.
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
            throw new RuntimeException("Khong the gui email xac nhan dat lich.", e);
        }
    }

    public void sendCompletionEmail(Booking booking, String reviewToken) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(booking.getCustomer().getEmail());
            helper.setSubject("HomeFix - Don hang #" + booking.getId() + " da hoan thanh");

            String reviewLink = frontendUrl + "/review/" + booking.getId() + "?token=" + reviewToken;
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("HH:mm - dd/MM/yyyy");
            String formattedTime = booking.getBookingTime().format(dtf);
            String techName = booking.getTechnician() != null ? booking.getTechnician().getFullName() : "N/A";

            String htmlContent = """
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px 20px;">
                    <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
                        <div style="text-align: center; margin-bottom: 32px;">
                            <div style="display: inline-block; background: linear-gradient(135deg, #2563eb, #0891b2); color: white; font-size: 24px; font-weight: 800; padding: 12px 20px; border-radius: 12px;">HF</div>
                            <h1 style="color: #1e293b; margin: 16px 0 8px; font-size: 24px;">HomeFix</h1>
                        </div>
                        <div style="text-align: center; margin-bottom: 24px;">
                            <div style="display: inline-block; background: #dcfce7; color: #16a34a; padding: 8px 20px; border-radius: 20px; font-weight: 700; font-size: 14px;">Hoan thanh</div>
                        </div>
                        <h2 style="color: #1e293b; font-size: 20px; text-align: center; margin-bottom: 8px;">Don hang #%d da hoan thanh</h2>
                        <p style="color: #475569; text-align: center; margin-bottom: 24px;">Cam on ban da su dung dich vu HomeFix.</p>
                        <table style="width: 100%%; border-collapse: collapse; margin-bottom: 24px;">
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Dich vu</td>
                                <td style="padding: 12px 0; color: #1e293b; font-weight: 600; text-align: right;">%s</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Ky thuat vien</td>
                                <td style="padding: 12px 0; color: #1e293b; font-weight: 600; text-align: right;">%s</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Thoi gian</td>
                                <td style="padding: 12px 0; color: #1e293b; font-weight: 600; text-align: right;">%s</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Tong tien</td>
                                <td style="padding: 12px 0; color: #1e293b; font-weight: 600; text-align: right;">%s VND</td>
                            </tr>
                        </table>
                        <div style="text-align: center; margin: 32px 0;">
                            <p style="color: #475569; margin-bottom: 16px; font-size: 15px;">Vui long danh gia de chung toi mang den trai nghiem tot nhat.</p>
                            <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #06b6d4); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-weight: 700; font-size: 16px;">Danh gia ngay</a>
                        </div>
                    </div>
                </div>
                """.formatted(
                    booking.getId(),
                    booking.getServicePackage().getName(),
                    techName,
                    formattedTime,
                    booking.getTotalPrice() != null ? String.format("%,.0f", booking.getTotalPrice()) : "0",
                    reviewLink
                );

            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Khong the gui email hoan thanh.", e);
        }
    }
}
