-- ISP Management System - Database Schema
-- Run this file once to initialize all tables

USE isp_management;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS Users (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('Admin', 'ISP', 'Community') NOT NULL,
    phone_number  VARCHAR(50),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INTERNET PACKAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS Internet_Packages (
    package_id   INT AUTO_INCREMENT PRIMARY KEY,
    isp_id       INT NOT NULL,
    package_name VARCHAR(255) NOT NULL,
    speed_mbps   DECIMAL(10, 2) NOT NULL,
    price        DECIMAL(10, 2) NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (isp_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- INSTALLATION REQUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS Installation_Requests (
    request_id  INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    isp_id      INT NOT NULL,
    package_id  INT NOT NULL,
    status      ENUM('Pending', 'Approved', 'Installed', 'Rejected') DEFAULT 'Pending',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (isp_id)      REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (package_id)  REFERENCES Internet_Packages(package_id) ON DELETE CASCADE
);

-- ============================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS Subscriptions (
    subscription_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id     INT NOT NULL,
    package_id      INT NOT NULL,
    status          ENUM('Active', 'Suspended') DEFAULT 'Active',
    activation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (package_id)  REFERENCES Internet_Packages(package_id) ON DELETE CASCADE
);

-- ============================================================
-- COMPLAINTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS Complaints (
    complaint_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id  INT NOT NULL,
    isp_id       INT NOT NULL,
    issue_type   VARCHAR(255) NOT NULL,
    description  TEXT NOT NULL,
    status       ENUM('Open', 'In Progress', 'Resolved') DEFAULT 'Open',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (isp_id)      REFERENCES Users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- PAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS Payments (
    payment_id      INT AUTO_INCREMENT PRIMARY KEY,
    subscription_id INT NOT NULL,
    amount          DECIMAL(10, 2) NOT NULL,
    payment_method  VARCHAR(100) NOT NULL,
    transaction_ref VARCHAR(255) NOT NULL UNIQUE,
    paid_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subscription_id) REFERENCES Subscriptions(subscription_id) ON DELETE CASCADE
);
