
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
