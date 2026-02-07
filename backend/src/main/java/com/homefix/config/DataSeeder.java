package com.homefix.config;

import com.homefix.common.BookingStatus;
import com.homefix.common.Role;
import com.homefix.entity.Booking;
import com.homefix.entity.Coupon;
import com.homefix.entity.ServiceCategory;
import com.homefix.entity.ServicePackage;
import com.homefix.entity.ServiceImage;
import com.homefix.entity.User;
import com.homefix.entity.WebsiteContent;
import com.homefix.repository.BookingRepository;
import com.homefix.repository.CouponRepository;
import com.homefix.repository.ReviewRepository;
import com.homefix.repository.ServiceCategoryRepository;
import com.homefix.repository.ServicePackageRepository;
import com.homefix.repository.UserRepository;
import com.homefix.repository.WebsiteContentRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

        private final UserRepository userRepository;
        private final ServiceCategoryRepository categoryRepository;
        private final ServicePackageRepository packageRepository;
        private final CouponRepository couponRepository;
        private final WebsiteContentRepository contentRepository;
        private final BookingRepository bookingRepository;
        private final ReviewRepository reviewRepository;
        private final PasswordEncoder passwordEncoder;

        public DataSeeder(UserRepository userRepository,
                        ServiceCategoryRepository categoryRepository,
                        ServicePackageRepository packageRepository,
                        CouponRepository couponRepository,
                        WebsiteContentRepository contentRepository,
                        BookingRepository bookingRepository,
                        ReviewRepository reviewRepository,
                        PasswordEncoder passwordEncoder) {
                this.userRepository = userRepository;
                this.categoryRepository = categoryRepository;
                this.packageRepository = packageRepository;
                this.couponRepository = couponRepository;
                this.contentRepository = contentRepository;
                this.bookingRepository = bookingRepository;
                this.reviewRepository = reviewRepository;
                this.passwordEncoder = passwordEncoder;
        }

        @Override
        public void run(String... args) throws Exception {
                System.out.println("Cleaning database...");
                try {
                        reviewRepository.deleteAllInBatch();
                        bookingRepository.deleteAllInBatch();
                        couponRepository.deleteAllInBatch();
                        packageRepository.deleteAllInBatch();
                        categoryRepository.deleteAllInBatch();
                        userRepository.deleteAllInBatch();
                        contentRepository.deleteAllInBatch();
                } catch (Exception e) {
                        System.err.println("Error cleaning database: " + e.getMessage());
                }

                seedUsers();
                seedServices();
                seedCoupons();
                seedWebsiteContent();
                seedBookings();
        }

        private void seedBookings() {
                System.out.println("Starting seedBookings...");
                try {
                        User customer = userRepository.findByEmail("customer@homefix.com").orElse(null);
                        User tech1 = userRepository.findByEmail("tech1@homefix.com").orElse(null);
                        User tech2 = userRepository.findByEmail("tech2@homefix.com").orElse(null);

                        if (customer == null || tech1 == null || tech2 == null) {
                                System.out.println("Skipping seedBookings: Missing users");
                                return;
                        }

                        List<ServicePackage> packages = packageRepository.findAll();
                        if (packages.isEmpty()) {
                                System.out.println("Skipping seedBookings: Missing packages");
                                return;
                        }

                        List<Booking> bookings = new ArrayList<>();

                        // Ensure we have at least one PENDING booking (for Dispatch)
                        if (bookingRepository.findByStatus(BookingStatus.PENDING).isEmpty()) {
                                Booking b1 = new Booking();
                                b1.setCustomer(customer);
                                b1.setServicePackage(packages.get(0)); // Cleaning Basic
                                b1.setBookingTime(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0));
                                b1.setAddress("123 Xuan Thuy, Cau Giay, Hanoi");
                                b1.setNote("Please bring cleaning tools");
                                b1.setStatus(BookingStatus.PENDING);
                                b1.setPaymentMethod("CASH");
                                b1.setPaymentStatus("PENDING");
                                b1.setTotalPrice(packages.get(0).getPrice());
                                bookings.add(b1);
                        }

                        // Ensure Tech 1 has bookings
                        if (bookingRepository.findByTechnicianId(tech1.getId()).isEmpty()) {
                                // Assigned Booking (Tech 1)
                                Booking b2 = new Booking();
                                b2.setCustomer(customer);
                                b2.setServicePackage(packages.get(1)); // Cleaning Deep
                                b2.setBookingTime(LocalDateTime.now().plusDays(2).withHour(14).withMinute(0));
                                b2.setAddress("456 Lang Ha, Dong Da, Hanoi");
                                b2.setStatus(BookingStatus.ASSIGNED);
                                b2.setTechnician(tech1);
                                b2.setPaymentMethod("VN_PAY");
                                b2.setPaymentStatus("PAID");
                                b2.setTotalPrice(packages.get(1).getPrice());
                                bookings.add(b2);

                                // Completed Booking (Tech 1)
                                Booking b4 = new Booking();
                                b4.setCustomer(customer);
                                b4.setServicePackage(packages.get(0));
                                b4.setBookingTime(LocalDateTime.now().minusDays(5));
                                b4.setAddress("123 Xuan Thuy, Cau Giay, Hanoi");
                                b4.setStatus(BookingStatus.COMPLETED);
                                b4.setTechnician(tech1);
                                b4.setPaymentMethod("MOMO");
                                b4.setPaymentStatus("PAID");
                                b4.setTotalPrice(packages.get(0).getPrice());
                                bookings.add(b4);
                        }

                        // Ensure Tech 2 has bookings
                        if (bookingRepository.findByTechnicianId(tech2.getId()).isEmpty()) {
                                // In Progress Booking (Tech 2)
                                Booking b3 = new Booking();
                                b3.setCustomer(customer);
                                b3.setServicePackage(packages.get(2)); // Electric Fix
                                b3.setBookingTime(LocalDateTime.now().plusHours(1));
                                b3.setAddress("789 Nguyen Trai, Thanh Xuan, Hanoi");
                                b3.setStatus(BookingStatus.IN_PROGRESS);
                                b3.setTechnician(tech2);
                                b3.setPaymentMethod("CASH");
                                b3.setPaymentStatus("PENDING");
                                b3.setTotalPrice(packages.get(2).getPrice());
                                bookings.add(b3);

                                // Completed Booking (Tech 2) - For chart data
                                Booking b5 = new Booking();
                                b5.setCustomer(customer);
                                b5.setServicePackage(packages.get(2));
                                b5.setBookingTime(LocalDateTime.now().minusMonths(1));
                                b5.setAddress("88 Lang Ha, Dong Da, Hanoi");
                                b5.setStatus(BookingStatus.COMPLETED);
                                b5.setTechnician(tech2);
                                b5.setPaymentMethod("CASH");
                                b5.setPaymentStatus("PAID");
                                b5.setTotalPrice(packages.get(2).getPrice());
                                bookings.add(b5);
                        }

                        if (!bookings.isEmpty()) {
                                for (Booking b : bookings) {
                                        try {
                                                bookingRepository.save(b);
                                        } catch (Exception e) {
                                                System.err.println("Error seeding booking: " + e.getMessage());
                                        }
                                }
                                System.out.println("Bookings seeding process completed.");
                        }
                } catch (Exception e) {
                        System.err.println("Critical error in seedBookings: " + e.getMessage());
                        e.printStackTrace();
                }
        }

        private void seedWebsiteContent() {
                // Clear existing content to ensure latest data is seeded
                contentRepository.deleteAll();

                List<WebsiteContent> contents = new ArrayList<>();

                // --- HOME PAGE ---
                // Hero Section
                contents.add(new WebsiteContent("HOME", "hero_title_1", "Chăm sóc ngôi nhà", "Chăm sóc ngôi nhà", null,
                                1));
                contents.add(new WebsiteContent("HOME", "hero_title_2", "Trọn vẹn yêu thương", "Trọn vẹn yêu thương",
                                null, 2));
                contents.add(new WebsiteContent("HOME", "hero_description", "Mô tả",
                                "Đặt lịch thợ lành nghề chuyên nghiệp chỉ trong 30 giây. Cam kết chất lượng cao, giá cả minh bạch và bảo hành dài hạn.",
                                null, 3));
                contents.add(new WebsiteContent("HOME", "hero_image", "Background", "",
                                "https://placehold.co/1600x900/png?text=HomeFix+Hero",
                                4));
                contents.add(new WebsiteContent("HOME", "hero_badge", "Badge", "Nền tảng #1 Việt Nam", null, 5));

                // Stats
                contents.add(new WebsiteContent("HOME", "stat_customer", "Khách hàng hài lòng", "15K+", null, 1));
                contents.add(new WebsiteContent("HOME", "stat_partner", "Đối tác kỹ thuật", "500+", null, 2));
                contents.add(new WebsiteContent("HOME", "stat_service", "Dịch vụ hoàn thành", "45K+", null, 3));
                contents.add(new WebsiteContent("HOME", "stat_exp", "Năm kinh nghiệm", "10+", null, 4));

                // Features (Why Choose Us)
                contents.add(new WebsiteContent("HOME", "feature", "Đặt lịch siêu tốc",
                                "Chỉ mất 30 giây để đặt lịch. Thợ sẽ có mặt tại nhà bạn trong vòng 30 phút sau khi xác nhận.",
                                "CLOCK", 1));
                contents.add(new WebsiteContent("HOME", "feature", "An tâm tuyệt đối",
                                "100% thợ có lý lịch rõ ràng, được đào tạo bài bản. Bảo hành dịch vụ lên đến 30 ngày.",
                                "SHIELD", 2));
                contents.add(new WebsiteContent("HOME", "feature", "Giá cả minh bạch",
                                "Xem giá trước khi đặt. Không phát sinh chi phí phụ. Thanh toán tiện lợi qua nhiều hình thức.",
                                "ZAP", 3));

                // --- REGISTER PAGE ---
                contents.add(new WebsiteContent("REGISTER", "branding_title", "Tham gia HomeFix", "Tham gia HomeFix",
                                null, 1));
                contents.add(new WebsiteContent("REGISTER", "branding_desc", "Mô tả",
                                "Trải nghiệm dịch vụ sửa chữa tại nhà chuyên nghiệp nhất. Kết nối với hàng nghìn thợ lành nghề ngay hôm nay.",
                                null, 2));
                contents.add(new WebsiteContent("REGISTER", "benefit", "Đặt lịch nhanh chóng",
                                "Chỉ 30 giây để hoàn tất", null, 1));
                contents.add(new WebsiteContent("REGISTER", "benefit", "Giá cả minh bạch", "Không phí ẩn, rõ ràng",
                                null, 2));
                contents.add(new WebsiteContent("REGISTER", "benefit", "Bảo hành uy tín", "Cam kết chất lượng 30 ngày",
                                null, 3));
                contents.add(new WebsiteContent("REGISTER", "background_image", "Background", "",
                                "https://placehold.co/800x600/png?text=Register+Background",
                                4));

                // --- ABOUT PAGE ---
                contents.add(new WebsiteContent("ABOUT", "hero_title", "Câu chuyện HomeFix", "Câu chuyện HomeFix", null,
                                1));
                contents.add(new WebsiteContent("ABOUT", "hero_desc", "Mô tả",
                                "Chúng tôi là nền tảng kết nối dịch vụ gia đình hàng đầu, mang đến sự tiện lợi và an tâm tuyệt đối cho ngôi nhà của bạn.",
                                null, 2));
                contents.add(new WebsiteContent("ABOUT", "mission_title", "Sứ mệnh",
                                "Giải phóng bạn khỏi lo toan việc nhà", null, 3));
                contents.add(new WebsiteContent("ABOUT", "mission_desc", "Mô tả sứ mệnh",
                                "HomeFix ra đời với sứ mệnh giải phóng bạn khỏi những lo toan việc nhà. Chúng tôi tin rằng mỗi người đều xứng đáng có một không gian sống sạch sẽ, an toàn và thoải mái để tận hưởng cuộc sống bên gia đình.",
                                "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1000",
                                4));

                // Core Values
                contents.add(new WebsiteContent("ABOUT", "value", "Chất lượng",
                                "Cam kết dịch vụ 5 sao với đội ngũ được đào tạo bài bản.", "SHIELD", 1));
                contents.add(new WebsiteContent("ABOUT", "value", "Tận tâm",
                                "Phục vụ khách hàng bằng cả trái tim và sự nhiệt huyết.", "HEART", 2));
                contents.add(new WebsiteContent("ABOUT", "value", "Đổi mới",
                                "Không ngừng cải tiến để mang đến trải nghiệm tốt nhất.", "TRENDING_UP", 3));
                contents.add(new WebsiteContent("ABOUT", "value", "Đồng hành",
                                "Luôn bên cạnh bạn trong mọi giai đoạn sửa chữa.", "USERS", 4));

                // Team
                contents.add(new WebsiteContent("ABOUT", "team", "Nguyễn Văn Vinh", "Founder & CEO",
                                "https://i.pravatar.cc/300?img=68", 1));
                contents.add(new WebsiteContent("ABOUT", "team", "Trần Thị Mai", "Giám đốc Vận hành",
                                "https://i.pravatar.cc/300?img=49", 2));
                contents.add(new WebsiteContent("ABOUT", "team", "Lê Hoàng Nam", "Giám đốc Kỹ thuật",
                                "https://i.pravatar.cc/300?img=12", 3));

                // Timeline
                contents.add(new WebsiteContent("ABOUT", "timeline", "2014",
                                "Thành lập HomeFix với 5 thành viên tại Hà Nội", null, 1));
                contents.add(new WebsiteContent("ABOUT", "timeline", "2016", "Mở rộng dịch vụ sửa chữa điện nước", null,
                                2));
                contents.add(new WebsiteContent("ABOUT", "timeline", "2018", "Đạt mốc 10.000 khách hàng tin dùng", null,
                                3));
                contents.add(new WebsiteContent("ABOUT", "timeline", "2020",
                                "Ra mắt ứng dụng di động đặt lịch thông minh", null, 4));
                contents.add(new WebsiteContent("ABOUT", "timeline", "2024",
                                "Trở thành nền tảng dịch vụ gia đình số 1 Việt Nam", null, 5));

                // --- CONTACT PAGE ---
                contents.add(new WebsiteContent("CONTACT", "hero_title", "Liên hệ", "Hãy nói chuyện với chúng tôi",
                                null, 1));
                contents.add(new WebsiteContent("CONTACT", "hero_desc", "Mô tả",
                                "Bạn có thắc mắc hoặc cần hỗ trợ? Hãy để lại tin nhắn, HomeFix luôn sẵn sàng lắng nghe!",
                                null, 2));

                contents.add(new WebsiteContent("CONTACT", "info_address", "Trụ sở chính",
                                "Tầng 12, Tòa nhà TechHome, Quận Cầu Giấy, Hà Nội", null, 1));
                contents.add(new WebsiteContent("CONTACT", "info_hotline", "Hotline", "1900 1234 56", null, 2));
                contents.add(new WebsiteContent("CONTACT", "info_email", "Email", "support@homefix.vn", null, 3));
                contents.add(new WebsiteContent("CONTACT", "info_hours", "Giờ làm việc",
                                "T2 - T7: 8:00 - 18:00 | CN: 9:00 - 17:00", null, 4));

                // --- HOME PAGE (Additional) ---
                contents.add(new WebsiteContent("HOME", "popular_title", "Dịch vụ phổ biến", "Dịch vụ phổ biến", null,
                                6));
                contents.add(new WebsiteContent("HOME", "popular_desc", "Mô tả dịch vụ phổ biến",
                                "Được nhiều khách hàng tin dùng nhất tháng này", null, 7));
                contents.add(new WebsiteContent("HOME", "cta_title", "CTA Tiêu đề",
                                "Sẵn sàng trải nghiệm dịch vụ tốt nhất?", null, 8));
                contents.add(new WebsiteContent("HOME", "cta_desc", "CTA Mô tả",
                                "Hàng nghìn khách hàng đã tin tưởng HomeFix. Đến lượt bạn!", null, 9));
                contents.add(new WebsiteContent("HOME", "cta_button", "CTA Button", "Bắt đầu ngay", null, 10));

                // --- SERVICE LIST PAGE ---
                contents.add(new WebsiteContent("SERVICE_LIST", "page_title", "Dịch vụ của chúng tôi",
                                "Giải pháp toàn diện cho ngôi nhà của bạn với đội ngũ chuyên nghiệp", null, 1));
                contents.add(new WebsiteContent("SERVICE_LIST", "promo_title", "Ưu đãi đặc biệt",
                                "Nhận ngay ưu đãi hấp dẫn!", null, 2));
                contents.add(new WebsiteContent("SERVICE_LIST", "promo_desc", "Mô tả ưu đãi",
                                "Nhập mã WELCOME để được giảm ngay 10% cho đơn hàng đầu tiên!", null, 3));
                contents.add(new WebsiteContent("SERVICE_LIST", "promo_code_1", "Mã 1", "#SUMMER2024", null, 4));
                contents.add(new WebsiteContent("SERVICE_LIST", "promo_code_2", "Mã 2", "#HOMEFIXVIP", null, 5));
                contents.add(new WebsiteContent("SERVICE_LIST", "promo_code_3", "Mã 3", "#FLASHSALE", null, 6));
                contents.add(new WebsiteContent("SERVICE_LIST", "promo_button", "Nút ưu đãi", "Xem tất cả ưu đãi", null,
                                7));

                contentRepository.saveAll(contents);
                System.out.println("Website content seeded successfully!");
        }

        private void seedUsers() {
                // Admin
                createOrUpdateUser("admin@homefix.com", "Quản trị viên", "123456", "0901234567", "Trụ sở chính Hà Nội",
                                Role.ADMIN);

                // Technician 1
                createOrUpdateUser("tech1@homefix.com", "Nguyễn Văn Kỹ Thuật", "123456", "0902345678",
                                "Cầu Giấy, Hà Nội",
                                Role.TECHNICIAN);

                // Technician 2
                createOrUpdateUser("tech2@homefix.com", "Trần Văn Thợ", "123456", "0902345679", "Đống Đa, Hà Nội",
                                Role.TECHNICIAN);

                // Customer
                createOrUpdateUser("customer@homefix.com", "Lê Thị Khách Hàng", "123456", "0903456789",
                                "Thanh Xuân, Hà Nội",
                                Role.CUSTOMER);

                System.out.println("Users seeded/updated successfully!");

                // Verify Admin Password
                User admin = userRepository.findByEmail("admin@homefix.com").orElse(null);
                if (admin != null) {
                        boolean matches = passwordEncoder.matches("123456", admin.getPassword());
                        System.out.println("DEBUG: Admin password verification (123456): " + matches);
                        System.out.println("DEBUG: Admin encoded password: " + admin.getPassword());
                }
        }

        private void createOrUpdateUser(String email, String fullName, String password, String phone, String address,
                        Role role) {
                User user = userRepository.findByEmail(email).orElse(new User());
                user.setEmail(email);
                user.setFullName(fullName);
                // Reset password to ensure access in dev environment
                user.setPassword(passwordEncoder.encode(password));
                user.setPhone(phone);
                user.setAddress(address);
                user.setRole(role);
                userRepository.save(user);
        }

        private void seedServices() {
                if (categoryRepository.count() == 0) {
                        // Categories
                        ServiceCategory cleaning = new ServiceCategory();
                        cleaning.setName("Dọn dẹp nhà cửa");
                        cleaning.setDescription("Dịch vụ vệ sinh nhà cửa chuyên nghiệp, sạch sẽ, gọn gàng.");
                        cleaning.setIconUrl("https://cdn-icons-png.flaticon.com/512/2061/2061936.png");

                        ServiceCategory repair = new ServiceCategory();
                        repair.setName("Sửa chữa điện nước");
                        repair.setDescription("Khắc phục các sự cố điện nước nhanh chóng, an toàn.");
                        repair.setIconUrl("https://cdn-icons-png.flaticon.com/512/3063/3063823.png");

                        ServiceCategory ac = new ServiceCategory();
                        ac.setName("Điện lạnh & Điều hòa");
                        ac.setDescription("Bảo dưỡng, vệ sinh, sửa chữa điều hòa, tủ lạnh, máy giặt.");
                        ac.setIconUrl("https://cdn-icons-png.flaticon.com/512/3022/3022238.png");

                        categoryRepository.saveAll(List.of(cleaning, repair, ac));

                        // Packages for Cleaning
                        List<ServicePackage> packages = new ArrayList<>();

                        ServicePackage cleanBasic = new ServicePackage();
                        cleanBasic.setName("Dọn nhà theo giờ (Cơ bản)");
                        cleanBasic.setDescription("Dọn dẹp cơ bản: quét, lau nhà, lau bụi. Tối thiểu 2 giờ.");
                        cleanBasic.setDetailedDescription("Dịch vụ dọn nhà theo giờ của HomeFix bao gồm:\n" +
                                        "- Quét và lau sàn nhà toàn bộ các phòng\n" +
                                        "- Lau bụi các bề mặt nội thất, kệ tủ, bàn ghế\n" +
                                        "- Làm sạch khu vực bếp cơ bản (bề mặt bếp, chậu rửa)\n" +
                                        "- Làm sạch toilet, bồn cầu, chậu rửa mặt\n" +
                                        "- Thu gom và đổ rác sinh hoạt\n" +
                                        "Phù hợp cho nhu cầu dọn dẹp hàng ngày hoặc định kỳ hàng tuần. Không bao gồm giặt thảm, sofa hay làm sạch sâu.");
                        cleanBasic.setPrice(new BigDecimal("100000")); // 100k/h
                        cleanBasic.setImageUrl(
                                        "https://images.unsplash.com/photo-1581578731117-104f8a746950?auto=format&fit=crop&q=80&w=800");
                        cleanBasic.addImage(new ServiceImage(
                                        "https://images.unsplash.com/photo-1528740561666-dc24705f08a7?auto=format&fit=crop&q=80&w=800",
                                        cleanBasic));
                        cleanBasic.addImage(new ServiceImage(
                                        "https://images.unsplash.com/photo-1584622050111-993a426fbf0a?auto=format&fit=crop&q=80&w=800",
                                        cleanBasic));
                        cleanBasic.setCategory(cleaning);
                        packages.add(cleanBasic);

                        ServicePackage cleanDeep = new ServicePackage();
                        cleanDeep.setName("Tổng vệ sinh nhà cửa");
                        cleanDeep.setDescription(
                                        "Vệ sinh toàn diện: sàn, tường, kính, toilet, bếp. Dành cho nhà mới hoặc lâu ngày.");
                        cleanDeep.setDetailedDescription(
                                        "Gói tổng vệ sinh chuyên sâu dành cho nhà mới xây, nhà mới sửa chữa hoặc lâu ngày không dọn dẹp:\n"
                                                        +
                                                        "- Làm sạch toàn bộ trần, tường, sàn, cửa kính (mặt trong)\n" +
                                                        "- Vệ sinh chi tiết nội thất: tủ, giường, bàn ghế (hút bụi, lau chùi)\n"
                                                        +
                                                        "- Tẩy rửa chuyên sâu nhà vệ sinh, nhà tắm (tẩy ố, diệt khuẩn)\n"
                                                        +
                                                        "- Làm sạch khu vực bếp: tủ bếp, hút mùi, tường bếp\n" +
                                                        "- Sử dụng máy móc và hóa chất chuyên dụng để đánh bay vết bẩn cứng đầu.");
                        cleanDeep.setPrice(new BigDecimal("1500000")); // 1.5M trọn gói
                        cleanDeep.setImageUrl(
                                        "https://images.unsplash.com/photo-1527513913476-fa960200f585?auto=format&fit=crop&q=80&w=800");
                        cleanDeep.addImage(new ServiceImage(
                                        "https://images.unsplash.com/photo-1585421514738-01798e1e7f3b?auto=format&fit=crop&q=80&w=800",
                                        cleanDeep));
                        cleanDeep.addImage(new ServiceImage(
                                        "https://plus.unsplash.com/premium_photo-1663126298656-33616be83c32?auto=format&fit=crop&q=80&w=800",
                                        cleanDeep));
                        cleanDeep.setCategory(cleaning);
                        packages.add(cleanDeep);

                        // Packages for Repair
                        ServicePackage electricFix = new ServicePackage();
                        electricFix.setName("Sửa chữa điện dân dụng");
                        electricFix.setDescription("Sửa chập cháy, thay bóng đèn, lắp đặt thiết bị điện.");
                        electricFix.setDetailedDescription(
                                        "Dịch vụ sửa chữa điện dân dụng 24/7, khắc phục nhanh các sự cố:\n" +
                                                        "- Xử lý chập cháy, mất điện cục bộ hoặc toàn phần\n" +
                                                        "- Thay thế, lắp đặt bóng đèn, ổ cắm, công tắc, aptomat\n" +
                                                        "- Lắp đặt quạt trần, quạt treo tường, đèn trang trí\n" +
                                                        "- Kiểm tra và bảo trì hệ thống điện gia đình đảm bảo an toàn.");
                        electricFix.setPrice(new BigDecimal("200000")); // Khảo sát + sửa nhỏ
                        electricFix.setImageUrl(
                                        "https://placehold.co/800x600/png?text=Electric+Repair");
                        electricFix.addImage(new ServiceImage(
                                        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800",
                                        electricFix));
                        electricFix.setCategory(repair);
                        packages.add(electricFix);

                        ServicePackage waterFix = new ServicePackage();
                        waterFix.setName("Xử lý rò rỉ nước");
                        waterFix.setDescription("Tìm và sửa rò rỉ đường ống, thay vòi nước, sửa bồn cầu.");
                        waterFix.setPrice(new BigDecimal("250000"));
                        waterFix.setImageUrl(
                                        "https://images.unsplash.com/photo-1505798577917-a651a5d6a301?auto=format&fit=crop&q=80&w=800");
                        waterFix.setCategory(repair);
                        packages.add(waterFix);

                        // Packages for AC
                        ServicePackage acClean = new ServicePackage();
                        acClean.setName("Vệ sinh điều hòa treo tường");
                        acClean.setDescription("Vệ sinh dàn nóng, dàn lạnh, kiểm tra gas. Giá trên mỗi máy.");
                        acClean.setPrice(new BigDecimal("150000"));
                        acClean.setImageUrl(
                                        "https://placehold.co/800x600/png?text=AC+Cleaning"); // Placeholder
                        acClean.setCategory(ac);
                        packages.add(acClean);

                        packageRepository.saveAll(packages);
                        System.out.println("Services seeded successfully!");
                }
        }

        private void seedCoupons() {
                if (couponRepository.count() == 0) {
                        List<Coupon> coupons = new ArrayList<>();

                        Coupon welcome = new Coupon();
                        welcome.setCode("WELCOME");
                        welcome.setDiscountPercent(10.0);
                        welcome.setMaxDiscountAmount(new BigDecimal("50000"));
                        welcome.setValidUntil(LocalDateTime.now().plusYears(1));
                        welcome.setUsageLimit(1000);
                        welcome.setStatus("ACTIVE");
                        coupons.add(welcome);

                        Coupon summer = new Coupon();
                        summer.setCode("SUMMER2026");
                        summer.setDiscountPercent(15.0);
                        summer.setMaxDiscountAmount(new BigDecimal("100000"));
                        summer.setValidUntil(LocalDateTime.now().plusMonths(6));
                        summer.setUsageLimit(500);
                        summer.setStatus("ACTIVE");
                        coupons.add(summer);

                        Coupon vip = new Coupon();
                        vip.setCode("HOMEFIXVIP");
                        vip.setDiscountPercent(20.0);
                        vip.setMaxDiscountAmount(new BigDecimal("200000"));
                        vip.setValidUntil(LocalDateTime.now().plusYears(1));
                        vip.setUsageLimit(100);
                        vip.setStatus("ACTIVE");
                        coupons.add(vip);

                        couponRepository.saveAll(coupons);
                        System.out.println("Coupons seeded successfully!");
                }
        }
}
