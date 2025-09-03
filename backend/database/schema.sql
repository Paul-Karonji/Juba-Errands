-- Juba Errands Nairobi Branch Database Schema
-- Created: September 2, 2025
-- Database: MySQL

-- Create database
CREATE DATABASE IF NOT EXISTS juba_errands_nairobi;
USE juba_errands_nairobi;

-- =====================================================
-- TABLE: senders
-- Stores sender information for shipments
-- =====================================================
CREATE TABLE senders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    id_passport_no VARCHAR(50),
    company_name VARCHAR(255),
    building_floor VARCHAR(100),
    street_address VARCHAR(255),
    estate_town VARCHAR(100),
    telephone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_sender_name (name),
    INDEX idx_sender_company (company_name),
    INDEX idx_sender_id_passport (id_passport_no)
);

-- =====================================================
-- TABLE: receivers
-- Stores receiver information for shipments
-- =====================================================
CREATE TABLE receivers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    id_passport_no VARCHAR(50),
    company_name VARCHAR(255),
    building_floor VARCHAR(100),
    street_address VARCHAR(255),
    estate_town VARCHAR(100),
    telephone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_receiver_name (name),
    INDEX idx_receiver_company (company_name),
    INDEX idx_receiver_id_passport (id_passport_no)
);

-- =====================================================
-- TABLE: shipments
-- Main shipment tracking table
-- =====================================================
CREATE TABLE shipments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    waybill_no VARCHAR(20) NOT NULL UNIQUE,
    date DATE NOT NULL,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    quantity INT NOT NULL,
    weight_kg DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    commercial_value DECIMAL(15,2),
    delivery_location VARCHAR(255),
    status ENUM('Pending', 'In Transit', 'Delivered', 'Cancelled') DEFAULT 'Pending',
    notes TEXT,
    receipt_reference VARCHAR(50),
    courier_name VARCHAR(255),
    staff_no VARCHAR(20),
    signature VARCHAR(255), -- Could store signature image path
    time TIME, -- Time of processing/delivery
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sender_id) REFERENCES senders(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES receivers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    INDEX idx_waybill_no (waybill_no),
    INDEX idx_shipment_date (date),
    INDEX idx_shipment_status (status),
    INDEX idx_receipt_reference (receipt_reference),
    INDEX idx_sender_id (sender_id),
    INDEX idx_receiver_id (receiver_id),
    INDEX idx_staff_no (staff_no)
);

-- =====================================================
-- TABLE: charges
-- Stores all charges associated with shipments
-- =====================================================
CREATE TABLE charges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shipment_id INT NOT NULL,
    base_charge DECIMAL(10,2) DEFAULT 0.00,
    other DECIMAL(10,2) DEFAULT 0.00,
    insurance DECIMAL(10,2) DEFAULT 0.00,
    extra_delivery DECIMAL(10,2) DEFAULT 0.00,
    vat DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'KES', -- KES, UGSH, SSD, RAND, DIRAM, USD
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_charges_shipment_id (shipment_id),
    INDEX idx_charges_total (total),
    INDEX idx_charges_currency (currency)
);

-- =====================================================
-- TABLE: payments
-- Stores payment information for shipments
-- =====================================================
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shipment_id INT NOT NULL,
    payer_account_no VARCHAR(50),
    payment_method ENUM('Cash', 'Till', 'Cheque') NOT NULL,
    payment_date DATE DEFAULT (CURDATE()),
    amount_paid DECIMAL(10,2),
    payment_reference VARCHAR(100),
    payment_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_payment_shipment_id (shipment_id),
    INDEX idx_payment_method (payment_method),
    INDEX idx_payment_date (payment_date),
    INDEX idx_payer_account (payer_account_no)
);

-- =====================================================
-- TABLE: staff
-- Staff management table for audit and tracking
-- =====================================================
CREATE TABLE staff (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staff_no VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telephone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'Staff',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_staff_no (staff_no),
    INDEX idx_staff_active (is_active)
);

-- =====================================================
-- TABLE: audit_logs
-- Track all changes to important records
-- =====================================================
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    action ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    old_values JSON,
    new_values JSON,
    staff_no VARCHAR(20),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_audit_table (table_name),
    INDEX idx_audit_record (record_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_staff (staff_no),
    INDEX idx_audit_date (created_at)
);

-- =====================================================
-- VIEWS for reporting and common queries
-- =====================================================

-- Complete shipment details view
CREATE VIEW v_shipment_details AS
SELECT 
    s.id,
    s.waybill_no,
    s.date,
    s.status,
    s.quantity,
    s.weight_kg,
    s.description,
    s.commercial_value,
    s.delivery_location,
    s.notes,
    s.receipt_reference,
    s.courier_name,
    s.staff_no,
    -- Sender details
    sen.name as sender_name,
    sen.company_name as sender_company,
    sen.telephone as sender_phone,
    sen.email as sender_email,
    sen.estate_town as sender_location,
    -- Receiver details
    rec.name as receiver_name,
    rec.company_name as receiver_company,
    rec.telephone as receiver_phone,
    rec.email as receiver_email,
    rec.estate_town as receiver_location,
    -- Charges
    c.base_charge,
    c.other,
    c.insurance,
    c.extra_delivery,
    c.vat,
    c.total as total_charges,
    c.currency,
    -- Payment details
    p.payment_method,
    p.payer_account_no,
    p.payment_date,
    p.amount_paid,
    s.created_at,
    s.updated_at
FROM shipments s
LEFT JOIN senders sen ON s.sender_id = sen.id
LEFT JOIN receivers rec ON s.receiver_id = rec.id
LEFT JOIN charges c ON s.id = c.shipment_id
LEFT JOIN payments p ON s.id = p.shipment_id;

-- Daily revenue summary view
CREATE VIEW v_daily_revenue AS
SELECT 
    DATE(s.date) as shipment_date,
    COUNT(s.id) as total_shipments,
    SUM(c.total) as total_revenue,
    AVG(c.total) as avg_shipment_value,
    SUM(s.weight_kg) as total_weight,
    COUNT(CASE WHEN s.status = 'Delivered' THEN 1 END) as delivered_count,
    COUNT(CASE WHEN s.status = 'Pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN s.status = 'In Transit' THEN 1 END) as in_transit_count,
    COUNT(CASE WHEN s.status = 'Cancelled' THEN 1 END) as cancelled_count
FROM shipments s
LEFT JOIN charges c ON s.id = c.shipment_id
GROUP BY DATE(s.date)
ORDER BY shipment_date DESC;

-- Payment method summary view
CREATE VIEW v_payment_summary AS
SELECT 
    p.payment_method,
    COUNT(p.id) as transaction_count,
    SUM(p.amount_paid) as total_amount,
    AVG(p.amount_paid) as average_amount,
    MIN(p.payment_date) as first_payment,
    MAX(p.payment_date) as last_payment
FROM payments p
GROUP BY p.payment_method;

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

-- Procedure to create a complete shipment with all related data
DELIMITER //
CREATE PROCEDURE CreateCompleteShipment(
    IN p_waybill_no VARCHAR(20),
    IN p_date DATE,
    -- Sender data
    IN p_sender_name VARCHAR(255),
    IN p_sender_id_passport VARCHAR(50),
    IN p_sender_company VARCHAR(255),
    IN p_sender_building VARCHAR(100),
    IN p_sender_street VARCHAR(255),
    IN p_sender_town VARCHAR(100),
    IN p_sender_phone VARCHAR(20),
    IN p_sender_email VARCHAR(255),
    -- Receiver data
    IN p_receiver_name VARCHAR(255),
    IN p_receiver_id_passport VARCHAR(50),
    IN p_receiver_company VARCHAR(255),
    IN p_receiver_building VARCHAR(100),
    IN p_receiver_street VARCHAR(255),
    IN p_receiver_town VARCHAR(100),
    IN p_receiver_phone VARCHAR(20),
    IN p_receiver_email VARCHAR(255),
    -- Shipment data
    IN p_quantity INT,
    IN p_weight_kg DECIMAL(10,2),
    IN p_description TEXT,
    IN p_commercial_value DECIMAL(15,2),
    IN p_delivery_location VARCHAR(255),
    IN p_status VARCHAR(20),
    IN p_notes TEXT,
    IN p_receipt_reference VARCHAR(50),
    IN p_courier_name VARCHAR(255),
    IN p_staff_no VARCHAR(20),
    -- Charges data
    IN p_base_charge DECIMAL(10,2),
    IN p_other DECIMAL(10,2),
    IN p_insurance DECIMAL(10,2),
    IN p_extra_delivery DECIMAL(10,2),
    IN p_vat DECIMAL(10,2),
    IN p_currency VARCHAR(10),
    -- Payment data
    IN p_payer_account VARCHAR(50),
    IN p_payment_method VARCHAR(10),
    IN p_amount_paid DECIMAL(10,2)
)
BEGIN
    DECLARE v_sender_id INT;
    DECLARE v_receiver_id INT;
    DECLARE v_shipment_id INT;
    DECLARE v_total_charges DECIMAL(10,2);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Insert or get sender
    INSERT INTO senders (name, id_passport_no, company_name, building_floor, street_address, estate_town, telephone, email)
    VALUES (p_sender_name, p_sender_id_passport, p_sender_company, p_sender_building, p_sender_street, p_sender_town, p_sender_phone, p_sender_email)
    ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);
    SET v_sender_id = LAST_INSERT_ID();
    
    -- Insert or get receiver
    INSERT INTO receivers (name, id_passport_no, company_name, building_floor, street_address, estate_town, telephone, email)
    VALUES (p_receiver_name, p_receiver_id_passport, p_receiver_company, p_receiver_building, p_receiver_street, p_receiver_town, p_receiver_phone, p_receiver_email)
    ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);
    SET v_receiver_id = LAST_INSERT_ID();
    
    -- Calculate total charges
    SET v_total_charges = COALESCE(p_base_charge, 0) + COALESCE(p_other, 0) + COALESCE(p_insurance, 0) + COALESCE(p_extra_delivery, 0) + COALESCE(p_vat, 0);
    
    -- Insert shipment
    INSERT INTO shipments (waybill_no, date, sender_id, receiver_id, quantity, weight_kg, description, commercial_value, delivery_location, status, notes, receipt_reference, courier_name, staff_no)
    VALUES (p_waybill_no, p_date, v_sender_id, v_receiver_id, p_quantity, p_weight_kg, p_description, p_commercial_value, p_delivery_location, p_status, p_notes, p_receipt_reference, p_courier_name, p_staff_no);
    SET v_shipment_id = LAST_INSERT_ID();
    
    -- Insert charges
    INSERT INTO charges (shipment_id, base_charge, other, insurance, extra_delivery, vat, total, currency)
    VALUES (v_shipment_id, p_base_charge, p_other, p_insurance, p_extra_delivery, p_vat, v_total_charges, p_currency);
    
    -- Insert payment
    INSERT INTO payments (shipment_id, payer_account_no, payment_method, amount_paid)
    VALUES (v_shipment_id, p_payer_account, p_payment_method, p_amount_paid);
    
    COMMIT;
    
    SELECT v_shipment_id as shipment_id;
END //
DELIMITER ;

-- Function to generate next waybill number
DELIMITER //
CREATE FUNCTION GetNextWaybillNumber() RETURNS VARCHAR(20)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE next_num INT;
    DECLARE next_waybill VARCHAR(20);
    
    SELECT COALESCE(MAX(CAST(waybill_no AS UNSIGNED)), 10000) + 1 INTO next_num
    FROM shipments 
    WHERE waybill_no REGEXP '^[0-9]+$';
    
    SET next_waybill = CAST(next_num AS CHAR);
    
    RETURN next_waybill;
END //
DELIMITER ;

-- =====================================================
-- TRIGGERS for audit logging
-- =====================================================

-- Shipments audit trigger
DELIMITER //
CREATE TRIGGER tr_shipments_audit_insert
AFTER INSERT ON shipments
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (table_name, record_id, action, new_values, staff_no)
    VALUES ('shipments', NEW.id, 'CREATE', JSON_OBJECT(
        'waybill_no', NEW.waybill_no,
        'status', NEW.status,
        'sender_id', NEW.sender_id,
        'receiver_id', NEW.receiver_id
    ), NEW.staff_no);
END //

CREATE TRIGGER tr_shipments_audit_update
AFTER UPDATE ON shipments
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, staff_no)
    VALUES ('shipments', NEW.id, 'UPDATE', JSON_OBJECT(
        'waybill_no', OLD.waybill_no,
        'status', OLD.status,
        'sender_id', OLD.sender_id,
        'receiver_id', OLD.receiver_id
    ), JSON_OBJECT(
        'waybill_no', NEW.waybill_no,
        'status', NEW.status,
        'sender_id', NEW.sender_id,
        'receiver_id', NEW.receiver_id
    ), NEW.staff_no);
END //
DELIMITER ;

-- =====================================================
-- SAMPLE DATA for testing
-- =====================================================

-- Insert sample staff
INSERT INTO staff (staff_no, name, email, telephone, role) VALUES
('ST001', 'John Kamau', 'john.kamau@jubaerrands.com', '+254712345678', 'Manager'),
('ST002', 'Mary Wanjiku', 'mary.wanjiku@jubaerrands.com', '+254723456789', 'Clerk'),
('ST003', 'Peter Ochieng', 'peter.ochieng@jubaerrands.com', '+254734567890', 'Courier');

-- Insert sample senders
INSERT INTO senders (name, id_passport_no, company_name, building_floor, street_address, estate_town, telephone, email) VALUES
('John Doe', '12345678', 'ABC Electronics Ltd', '3rd Floor', 'Kimathi Street', 'Nairobi CBD', '+254712345678', 'john@abcelectronics.co.ke'),
('Jane Smith', '87654321', 'XYZ Trading Co', '2nd Floor', 'Moi Avenue', 'Westlands', '+254723456789', 'jane@xyztrading.co.ke'),
('Robert Johnson', '11223344', 'Johnson Enterprises', 'Ground Floor', 'Uhuru Highway', 'Industrial Area', '+254734567890', 'robert@johnson.co.ke');

-- Insert sample receivers
INSERT INTO receivers (name, id_passport_no, company_name, building_floor, street_address, estate_town, telephone, email) VALUES
('Michael Brown', '98765432', 'Brown & Associates', '1st Floor', 'Juba Main Street', 'Juba Central', '+211912345678', 'michael@brown.ss'),
('Sarah Wilson', '55667788', 'Wilson Imports', '4th Floor', 'University Road', 'Juba', '+211923456789', 'sarah@wilson.ss'),
('David Lee', '99887766', 'Lee Logistics', 'Ground Floor', 'Airport Road', 'Juba Airport', '+211934567890', 'david@lee.ss');

-- Insert sample shipments using the stored procedure
CALL CreateCompleteShipment(
    '34531', '2025-09-02',
    'John Doe', '12345678', 'ABC Electronics Ltd', '3rd Floor', 'Kimathi Street', 'Nairobi CBD', '+254712345678', 'john@abcelectronics.co.ke',
    'Michael Brown', '98765432', 'Brown & Associates', '1st Floor', 'Juba Main Street', 'Juba Central', '+211912345678', 'michael@brown.ss',
    5, 25.50, 'Electronic devices and accessories', 150000.00, 'Juba Main Office', 'In Transit', 'Handle with care - fragile items', 'RCP001', 'Peter Ochieng', 'ST003',
    50000.00, 5000.00, 7500.00, 10000.00, 11600.00, 'KES',
    'ACC123456', 'Cash', 84100.00
);

CALL CreateCompleteShipment(
    '34532', '2025-09-01',
    'Jane Smith', '87654321', 'XYZ Trading Co', '2nd Floor', 'Moi Avenue', 'Westlands', '+254723456789', 'jane@xyztrading.co.ke',
    'Sarah Wilson', '55667788', 'Wilson Imports', '4th Floor', 'University Road', 'Juba', '+211923456789', 'sarah@wilson.ss',
    2, 10.20, 'Office supplies and stationery', 25000.00, 'Wilson Imports Office', 'Delivered', 'Standard delivery', 'RCP002', 'Peter Ochieng', 'ST003',
    15000.00, 2000.00, 2550.00, 0.00, 3128.00, 'KES',
    'ACC789012', 'Till', 22678.00
);

-- =====================================================
-- INDEXES for performance optimization
-- =====================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_shipments_date_status ON shipments(date, status);
CREATE INDEX idx_shipments_sender_receiver ON shipments(sender_id, receiver_id);
CREATE INDEX idx_charges_shipment_total ON charges(shipment_id, total);
CREATE INDEX idx_payments_date_method ON payments(payment_date, payment_method);

-- Full-text search indexes for descriptions and notes
ALTER TABLE shipments ADD FULLTEXT(description, notes);

-- =====================================================
-- FINAL VERIFICATION QUERIES
-- =====================================================

-- Verify tables creation
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    DATA_LENGTH,
    INDEX_LENGTH
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'juba_errands_nairobi'
ORDER BY TABLE_NAME;

-- Verify sample data
SELECT 
    'Senders' as table_name, COUNT(*) as record_count FROM senders
UNION ALL
SELECT 'Receivers', COUNT(*) FROM receivers
UNION ALL  
SELECT 'Shipments', COUNT(*) FROM shipments
UNION ALL
SELECT 'Charges', COUNT(*) FROM charges
UNION ALL
SELECT 'Payments', COUNT(*) FROM payments
UNION ALL
SELECT 'Staff', COUNT(*) FROM staff;

-- Test the complete shipment view
SELECT * FROM v_shipment_details LIMIT 2;

-- Test daily revenue summary
SELECT * FROM v_daily_revenue LIMIT 5;

-- =====================================================
-- DATABASE SETUP COMPLETE
-- =====================================================