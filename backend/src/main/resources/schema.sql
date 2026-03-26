
-- Disable foreign key checks for clean cleanup
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables if they exist
DROP TABLE IF EXISTS website_content;
DROP TABLE IF EXISTS service_images;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS support_ticket_messages;
DROP TABLE IF EXISTS support_tickets;
DROP TABLE IF EXISTS booking_chat_messages;
DROP TABLE IF EXISTS technician_interaction_logs;
DROP TABLE IF EXISTS technician_categories;
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
    specialty VARCHAR(255),
    experience_years INT,
    work_description TEXT,
    citizen_id VARCHAR(20),
    technician_profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
    technician_type VARCHAR(20),
    technician_approval_status VARCHAR(20) DEFAULT 'NOT_REQUIRED',
    wallet_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    base_location VARCHAR(255),
    available_from TIME,
    available_to TIME,
    available_for_auto_assign BOOLEAN NOT NULL DEFAULT TRUE,
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
    detailed_description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE
    FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE SET NULL
);

-- 4. Service Images Table
CREATE TABLE service_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    service_package_id BIGINT,
    image_url VARCHAR(255),
    FOREIGN KEY (service_package_id) REFERENCES service_packages(id) ON DELETE CASCADE
);

-- 5. Coupons Table
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

-- 6. Bookings Table
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
    address VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'CASH',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    completed_at DATETIME,
    technician_earning DECIMAL(10, 2) NOT NULL DEFAULT 0,
    platform_profit DECIMAL(10, 2) NOT NULL DEFAULT 0,
    version BIGINT,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_package_id) REFERENCES service_packages(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL
);

CREATE TABLE technician_categories (
    technician_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    PRIMARY KEY (technician_id, category_id),
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE CASCADE
);

CREATE TABLE support_tickets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT,
    customer_id BIGINT NOT NULL,
    technician_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    due_at DATETIME,
    resolved_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE support_ticket_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE booking_chat_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE technician_interaction_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    technician_id BIGINT NOT NULL,
    customer_id BIGINT,
    booking_id BIGINT,
    interaction_type VARCHAR(100) NOT NULL,
    detail TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

CREATE INDEX idx_support_tickets_technician_status ON support_tickets(technician_id, status);
CREATE INDEX idx_booking_chat_booking_expired ON booking_chat_messages(booking_id, deleted, expires_at);
CREATE INDEX idx_interaction_technician_created ON technician_interaction_logs(technician_id, created_at);

-- 7. Reviews Table
CREATE TABLE reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- 8. Website Content Table
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
