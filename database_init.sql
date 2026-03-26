CREATE DATABASE IF NOT EXISTS homefix;
USE homefix;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS service_images;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS technician_categories;
DROP TABLE IF EXISTS service_packages;
DROP TABLE IF EXISTS service_categories;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS website_content;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  role VARCHAR(20) NOT NULL,
  avatar_url VARCHAR(255),
  specialty VARCHAR(255),
  experience_years INT,
  work_description TEXT,
  citizen_id VARCHAR(20),
  technician_profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
  technician_type VARCHAR(20),
  technician_approval_status VARCHAR(20) DEFAULT 'NOT_REQUIRED',
  wallet_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  base_location VARCHAR(255),
  available_from TIME,
  available_to TIME,
  available_for_auto_assign BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE service_categories (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon_url VARCHAR(255)
);

CREATE TABLE service_packages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  detailed_description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT chk_service_packages_price CHECK (price >= 0),
  CONSTRAINT chk_service_packages_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
  CONSTRAINT fk_service_packages_category FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE SET NULL
);

CREATE TABLE service_images (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  service_package_id BIGINT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  CONSTRAINT fk_service_images_package FOREIGN KEY (service_package_id) REFERENCES service_packages(id) ON DELETE CASCADE
);

CREATE TABLE coupons (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  discount_percent DOUBLE NOT NULL,
  max_discount_amount DECIMAL(10,2),
  min_order_value DECIMAL(10,2),
  valid_from DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valid_until DATETIME NULL,
  usage_limit INT,
  used_count INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT chk_coupons_discount_percent CHECK (discount_percent >= 0 AND discount_percent <= 100),
  CONSTRAINT chk_coupons_used_count CHECK (used_count >= 0),
  CONSTRAINT chk_coupons_usage_limit CHECK (usage_limit IS NULL OR usage_limit >= 0),
  CONSTRAINT chk_coupons_usage_balance CHECK (usage_limit IS NULL OR used_count <= usage_limit),
  CONSTRAINT chk_coupons_dates CHECK (valid_until IS NULL OR valid_until >= valid_from),
  CONSTRAINT chk_coupons_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'DISABLED'))
);

CREATE TABLE bookings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  service_package_id BIGINT NOT NULL,
  technician_id BIGINT NULL,
  coupon_id BIGINT NULL,
  booking_time DATETIME NOT NULL,
  address VARCHAR(255) NOT NULL,
  note TEXT,
  status VARCHAR(20) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'CASH',
  payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  rejection_reason TEXT NULL,
  completed_at DATETIME NULL,
  technician_earning DECIMAL(10,2) NOT NULL DEFAULT 0,
  platform_profit DECIMAL(10,2) NOT NULL DEFAULT 0,
  version BIGINT NULL,
  CONSTRAINT chk_bookings_status CHECK (status IN ('PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DECLINED')),
  CONSTRAINT chk_bookings_total_price CHECK (total_price >= 0),
  CONSTRAINT chk_bookings_payment_method CHECK (payment_method IN ('CASH', 'MOMO', 'VNPAY')),
  CONSTRAINT chk_bookings_payment_status CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_package FOREIGN KEY (service_package_id) REFERENCES service_packages(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_technician FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_bookings_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL
);

CREATE TABLE technician_categories (
  technician_id BIGINT NOT NULL,
  category_id BIGINT NOT NULL,
  PRIMARY KEY (technician_id, category_id),
  CONSTRAINT fk_technician_categories_technician FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_technician_categories_category FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE CASCADE
);

CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_technician ON bookings(technician_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_booking_time ON bookings(booking_time);
CREATE INDEX idx_bookings_service_package ON bookings(service_package_id);

CREATE TABLE reviews (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT NOT NULL UNIQUE,
  rating INT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_reviews_rating CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT fk_reviews_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE TABLE website_content (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  section VARCHAR(255) NOT NULL,
  content_key VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  content TEXT,
  image_url VARCHAR(255),
  link_url VARCHAR(255),
  display_order INT,
  CONSTRAINT uq_website_content_order UNIQUE (section, content_key, display_order)
);

CREATE TABLE notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  title VARCHAR(255),
  message TEXT,
  is_read BIT(1) NOT NULL DEFAULT b'0',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  type VARCHAR(50),
  related_id BIGINT,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);

CREATE TABLE password_reset_tokens (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(255) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  expires_at DATETIME NOT NULL,
  used BIT(1) NOT NULL DEFAULT b'0',
  CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens(user_id);
