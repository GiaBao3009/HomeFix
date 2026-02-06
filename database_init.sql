-- Create Database
CREATE DATABASE IF NOT EXISTS homefix;
USE homefix;

-- Disable foreign key checks for clean cleanup
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables if they exist
DROP TABLE IF EXISTS website_content;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS service_packages;
DROP TABLE IF EXISTS service_categories;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS coupons;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users Table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role VARCHAR(20) NOT NULL, -- CUSTOMER, ADMIN, TECHNICIAN
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Service Categories Table
CREATE TABLE service_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url VARCHAR(255)
);

-- 3. Service Packages Table
CREATE TABLE service_packages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE
    FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE SET NULL
);

-- 4. Coupons Table
CREATE TABLE coupons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_percent DOUBLE NOT NULL, -- e.g., 10.0 for 10%
    max_discount_amount DECIMAL(10, 2), -- Max discount value
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    usage_limit INT DEFAULT 100,
    used_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE' -- ACTIVE, EXPIRED, DISABLED
);

-- 5. Bookings Table
CREATE TABLE bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    service_package_id BIGINT NOT NULL,
    technician_id BIGINT,
    coupon_id BIGINT,
    booking_time DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL, -- PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
    note TEXT,
    total_price DECIMAL(10, 2),
    address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) DEFAULT 'CASH',
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_package_id) REFERENCES service_packages(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL
);

-- 6. Reviews Table
CREATE TABLE reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- 7. Website Content Table
CREATE TABLE website_content (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    section VARCHAR(255) NOT NULL, -- HOME, ABOUT, CONTACT, REGISTER
    content_key VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    content TEXT,
    image_url VARCHAR(255),
    link_url VARCHAR(255),
    display_order INT
);

-- Initial Data Seeding

-- Users (Password is '123456')
-- BCrypt hash for '123456': $2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRkgVdukPxk.ki5..y.y.y.y.y
INSERT INTO users (email, password, full_name, phone, address, role, avatar_url) VALUES 
('admin@homefix.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRkgVdukPxk.ki5..y.y.y.y.y', 'Quản trị viên', '0901234567', 'Trụ sở chính Hà Nội', 'ADMIN', 'https://placehold.co/150x150/2563eb/white?text=Admin'),
('tech1@homefix.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRkgVdukPxk.ki5..y.y.y.y.y', 'Nguyễn Văn Kỹ Thuật', '0902345678', 'Cầu Giấy, Hà Nội', 'TECHNICIAN', 'https://placehold.co/150x150/f59e0b/white?text=Tech1'),
('tech2@homefix.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRkgVdukPxk.ki5..y.y.y.y.y', 'Trần Văn Thợ', '0902345679', 'Đống Đa, Hà Nội', 'TECHNICIAN', 'https://placehold.co/150x150/f59e0b/white?text=Tech2'),
('customer@homefix.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRkgVdukPxk.ki5..y.y.y.y.y', 'Lê Thị Khách Hàng', '0903456789', 'Thanh Xuân, Hà Nội', 'CUSTOMER', 'https://placehold.co/150x150/10b981/white?text=User');

-- Service Categories
INSERT INTO service_categories (name, description, icon_url) VALUES 
('Dọn dẹp nhà cửa', 'Dịch vụ vệ sinh nhà cửa chuyên nghiệp, sạch sẽ, gọn gàng.', 'https://cdn-icons-png.flaticon.com/512/2061/2061936.png'),
('Sửa chữa điện nước', 'Khắc phục các sự cố điện nước nhanh chóng, an toàn.', 'https://cdn-icons-png.flaticon.com/512/3063/3063823.png'),
('Điện lạnh & Điều hòa', 'Bảo dưỡng, vệ sinh, sửa chữa điều hòa, tủ lạnh, máy giặt.', 'https://cdn-icons-png.flaticon.com/512/3022/3022238.png'),
('Chăm sóc sân vườn', 'Cắt tỉa cây cảnh, dọn cỏ, chăm sóc không gian xanh.', 'https://placehold.co/64x64/16a34a/white?text=Garden');

-- Service Packages
INSERT INTO service_packages (category_id, name, description, price, image_url) VALUES 
(1, 'Dọn nhà theo giờ (Cơ bản)', 'Dọn dẹp cơ bản: quét, lau nhà, lau bụi. Tối thiểu 2 giờ.', 100000, 'https://images.unsplash.com/photo-1581578731117-104f8a746950?auto=format&fit=crop&q=80&w=800'),
(1, 'Tổng vệ sinh nhà cửa', 'Vệ sinh toàn diện: sàn, tường, kính, toilet, bếp. Dành cho nhà mới hoặc lâu ngày.', 1500000, 'https://images.unsplash.com/photo-1527513913476-fa960200f585?auto=format&fit=crop&q=80&w=800'),
(2, 'Sửa chữa điện dân dụng', 'Sửa chập cháy, thay bóng đèn, lắp đặt thiết bị điện.', 200000, 'https://images.unsplash.com/photo-1621905476059-5f81280a0e80?auto=format&fit=crop&q=80&w=800'),
(2, 'Xử lý rò rỉ nước', 'Tìm và sửa rò rỉ đường ống, thay vòi nước, sửa bồn cầu.', 250000, 'https://images.unsplash.com/photo-1505798577917-a651a5d6a301?auto=format&fit=crop&q=80&w=800'),
(3, 'Vệ sinh điều hòa treo tường', 'Vệ sinh dàn nóng, dàn lạnh, kiểm tra gas. Giá trên mỗi máy.', 150000, 'https://images.unsplash.com/photo-1621905476059-5f81280a0e80?auto=format&fit=crop&q=80&w=800'),
(3, 'Bảo dưỡng máy giặt', 'Vệ sinh lồng giặt, kiểm tra động cơ, dây đai.', 300000, 'https://placehold.co/800x600/f1f5f9/334155?text=Washing+Machine'),
(4, 'Cắt tỉa cây cảnh', 'Cắt tỉa tạo dáng cây cảnh, thu gom lá rụng.', 350000, 'https://placehold.co/800x600/dcfce7/15803d?text=Gardening');

-- Coupons
INSERT INTO coupons (code, discount_percent, max_discount_amount, valid_until, usage_limit, status) VALUES
('WELCOME', 10.0, 50000, '2025-12-31 23:59:59', 1000, 'ACTIVE'),
('SUMMER2024', 15.0, 100000, '2024-09-30 23:59:59', 500, 'ACTIVE'),
('HOMEFIXVIP', 20.0, 200000, '2025-12-31 23:59:59', 100, 'ACTIVE');

-- Sample Bookings
INSERT INTO bookings (user_id, service_package_id, technician_id, booking_time, status, notes, total_price, address) VALUES
(4, 1, 2, DATE_ADD(NOW(), INTERVAL 1 DAY), 'ASSIGNED', 'Nhà có chó dữ, vui lòng gọi trước', 200000, '123 Nguyễn Trãi, Thanh Xuân'),
(4, 3, NULL, DATE_ADD(NOW(), INTERVAL 2 DAY), 'PENDING', 'Sửa bóng đèn phòng khách', 200000, '123 Nguyễn Trãi, Thanh Xuân');

-- Website Content
INSERT INTO website_content (section, content_key, title, content, image_url, display_order) VALUES
-- HOME
('HOME', 'hero_title_1', 'Chăm sóc ngôi nhà', 'Chăm sóc ngôi nhà', NULL, 1),
('HOME', 'hero_title_2', 'Trọn vẹn yêu thương', 'Trọn vẹn yêu thương', NULL, 2),
('HOME', 'hero_description', 'Mô tả', 'Đặt lịch thợ lành nghề chuyên nghiệp chỉ trong 30 giây. Cam kết chất lượng cao, giá cả minh bạch và bảo hành dài hạn.', NULL, 3),
('HOME', 'hero_image', 'Background', '', 'https://images.unsplash.com/photo-1505798577917-a651a5d6a301?auto=format&fit=crop&q=80&w=1600', 4),
('HOME', 'hero_badge', 'Badge', 'Nền tảng #1 Việt Nam', NULL, 5),
('HOME', 'stat_customer', 'Khách hàng hài lòng', '15K+', NULL, 1),
('HOME', 'stat_partner', 'Đối tác kỹ thuật', '500+', NULL, 2),
('HOME', 'stat_service', 'Dịch vụ hoàn thành', '45K+', NULL, 3),
('HOME', 'stat_exp', 'Năm kinh nghiệm', '10+', NULL, 4),
('HOME', 'feature', 'Đặt lịch siêu tốc', 'Chỉ mất 30 giây để đặt lịch. Thợ sẽ có mặt tại nhà bạn trong vòng 30 phút sau khi xác nhận.', 'CLOCK', 1),
('HOME', 'feature', 'An tâm tuyệt đối', '100% thợ có lý lịch rõ ràng, được đào tạo bài bản. Bảo hành dịch vụ lên đến 30 ngày.', 'SHIELD', 2),
('HOME', 'feature', 'Giá cả minh bạch', 'Xem giá trước khi đặt. Không phát sinh chi phí phụ. Thanh toán tiện lợi qua nhiều hình thức.', 'ZAP', 3),

-- REGISTER
('REGISTER', 'branding_title', 'Tham gia HomeFix', 'Tham gia HomeFix', NULL, 1),
('REGISTER', 'branding_desc', 'Mô tả', 'Trải nghiệm dịch vụ sửa chữa tại nhà chuyên nghiệp nhất. Kết nối với hàng nghìn thợ lành nghề ngay hôm nay.', NULL, 2),
('REGISTER', 'benefit', 'Đặt lịch nhanh chóng', 'Chỉ 30 giây để hoàn tất', NULL, 1),
('REGISTER', 'benefit', 'Giá cả minh bạch', 'Không phí ẩn, rõ ràng', NULL, 2),
('REGISTER', 'benefit', 'Bảo hành uy tín', 'Cam kết chất lượng 30 ngày', NULL, 3),
('REGISTER', 'background_image', 'Background', '', 'https://images.unsplash.com/photo-1505798577917-a651a5d6a301?auto=format&fit=crop&q=80&w=800', 4),

-- ABOUT
('ABOUT', 'hero_title', 'Câu chuyện HomeFix', 'Câu chuyện HomeFix', NULL, 1),
('ABOUT', 'hero_desc', 'Mô tả', 'Chúng tôi là nền tảng kết nối dịch vụ gia đình hàng đầu, mang đến sự tiện lợi và an tâm tuyệt đối cho ngôi nhà của bạn.', NULL, 2),
('ABOUT', 'mission_title', 'Sứ mệnh', 'Giải phóng bạn khỏi lo toan việc nhà', NULL, 3),
('ABOUT', 'mission_desc', 'Mô tả sứ mệnh', 'HomeFix ra đời với sứ mệnh giải phóng bạn khỏi những lo toan việc nhà. Chúng tôi tin rằng mỗi người đều xứng đáng có một không gian sống sạch sẽ, an toàn và thoải mái để tận hưởng cuộc sống bên gia đình.', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1000', 4),
('ABOUT', 'value', 'Chất lượng', 'Cam kết dịch vụ 5 sao với đội ngũ được đào tạo bài bản.', 'SHIELD', 1),
('ABOUT', 'value', 'Tận tâm', 'Phục vụ khách hàng bằng cả trái tim và sự nhiệt huyết.', 'HEART', 2),
('ABOUT', 'value', 'Đổi mới', 'Không ngừng cải tiến để mang đến trải nghiệm tốt nhất.', 'TRENDING_UP', 3),
('ABOUT', 'value', 'Đồng hành', 'Luôn bên cạnh bạn trong mọi giai đoạn sửa chữa.', 'USERS', 4),
('ABOUT', 'team', 'Nguyễn Văn Vinh', 'Founder & CEO', 'https://i.pravatar.cc/300?img=68', 1),
('ABOUT', 'team', 'Trần Thị Mai', 'Giám đốc Vận hành', 'https://i.pravatar.cc/300?img=49', 2),
('ABOUT', 'team', 'Lê Hoàng Nam', 'Giám đốc Kỹ thuật', 'https://i.pravatar.cc/300?img=12', 3),
('ABOUT', 'timeline', '2014', 'Thành lập HomeFix với 5 thành viên tại Hà Nội', NULL, 1),
('ABOUT', 'timeline', '2016', 'Mở rộng dịch vụ sửa chữa điện nước', NULL, 2),
('ABOUT', 'timeline', '2018', 'Đạt mốc 10.000 khách hàng tin dùng', NULL, 3),
('ABOUT', 'timeline', '2020', 'Ra mắt ứng dụng di động đặt lịch thông minh', NULL, 4),
('ABOUT', 'timeline', '2024', 'Trở thành nền tảng dịch vụ gia đình số 1 Việt Nam', NULL, 5),

-- CONTACT
('CONTACT', 'hero_title', 'Liên hệ', 'Hãy nói chuyện với chúng tôi', NULL, 1),
('CONTACT', 'hero_desc', 'Mô tả', 'Bạn có thắc mắc hoặc cần hỗ trợ? Hãy để lại tin nhắn, HomeFix luôn sẵn sàng lắng nghe!', NULL, 2),
('CONTACT', 'info_address', 'Trụ sở chính', 'Tầng 12, Tòa nhà TechHome, Quận Cầu Giấy, Hà Nội', NULL, 1),
('CONTACT', 'info_hotline', 'Hotline', '1900 1234 56', NULL, 2),
('CONTACT', 'info_email', 'Email', 'support@homefix.vn', NULL, 3),
('CONTACT', 'info_hours', 'Giờ làm việc', 'T2 - T7: 8:00 - 18:00 | CN: 9:00 - 17:00', NULL, 4),

-- HOME (Additional)
('HOME', 'popular_title', 'Dịch vụ phổ biến', 'Dịch vụ phổ biến', NULL, 6),
('HOME', 'popular_desc', 'Mô tả dịch vụ phổ biến', 'Được nhiều khách hàng tin dùng nhất tháng này', NULL, 7),
('HOME', 'cta_title', 'CTA Tiêu đề', 'Sẵn sàng trải nghiệm dịch vụ tốt nhất?', NULL, 8),
('HOME', 'cta_desc', 'CTA Mô tả', 'Hàng nghìn khách hàng đã tin tưởng HomeFix. Đến lượt bạn!', NULL, 9),
('HOME', 'cta_button', 'CTA Button', 'Bắt đầu ngay', NULL, 10),

-- SERVICE_LIST
('SERVICE_LIST', 'page_title', 'Dịch vụ của chúng tôi', 'Giải pháp toàn diện cho ngôi nhà của bạn với đội ngũ chuyên nghiệp', NULL, 1),
('SERVICE_LIST', 'promo_title', 'Ưu đãi đặc biệt', 'Nhận ngay ưu đãi hấp dẫn!', NULL, 2),
('SERVICE_LIST', 'promo_desc', 'Mô tả ưu đãi', 'Nhập mã WELCOME để được giảm ngay 10% cho đơn hàng đầu tiên!', NULL, 3),
('SERVICE_LIST', 'promo_code_1', 'Mã 1', '#SUMMER2024', NULL, 4),
('SERVICE_LIST', 'promo_code_2', 'Mã 2', '#HOMEFIXVIP', NULL, 5),
('SERVICE_LIST', 'promo_code_3', 'Mã 3', '#FLASHSALE', NULL, 6),
('SERVICE_LIST', 'promo_button', 'Nút ưu đãi', 'Xem tất cả ưu đãi', NULL, 7);
