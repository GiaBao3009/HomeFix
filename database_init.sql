CREATE DATABASE IF NOT EXISTS homefix;
USE homefix;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS service_images;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS bookings;
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE service_categories (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
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
  status VARCHAR(20) DEFAULT 'ACTIVE',
  CONSTRAINT fk_service_packages_category FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE SET NULL
);

CREATE TABLE service_images (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  service_package_id BIGINT,
  image_url VARCHAR(255),
  CONSTRAINT fk_service_images_package FOREIGN KEY (service_package_id) REFERENCES service_packages(id) ON DELETE CASCADE
);

CREATE TABLE coupons (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_percent DOUBLE NOT NULL,
  max_discount_amount DECIMAL(10,2),
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP NULL,
  usage_limit INT DEFAULT 100,
  used_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'ACTIVE'
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
  total_price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'CASH',
  payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  rejection_reason TEXT NULL,
  completed_at DATETIME NULL,
  CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_package FOREIGN KEY (service_package_id) REFERENCES service_packages(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_technician FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_bookings_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL
);

CREATE TABLE reviews (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT NOT NULL,
  rating INT,
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
  display_order INT
);
