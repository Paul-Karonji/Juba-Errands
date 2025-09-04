-- Create database
CREATE DATABASE IF NOT EXISTS juba_errands_nairobi;
USE juba_errands_nairobi;

-- Senders table
CREATE TABLE senders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  id_passport_no VARCHAR(100),
  company_name VARCHAR(255),
  building_floor VARCHAR(255),
  street_address VARCHAR(255),
  estate_town VARCHAR(255),
  telephone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Receivers table
CREATE TABLE receivers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  id_passport_no VARCHAR(100),
  company_name VARCHAR(255),
  building_floor VARCHAR(255),
  street_address VARCHAR(255),
  estate_town VARCHAR(255),
  telephone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shipments table
CREATE TABLE shipments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  waybill_no VARCHAR(50) UNIQUE NOT NULL,
  date DATE NOT NULL,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  quantity INT DEFAULT 1,
  weight_kg DECIMAL(10,2) DEFAULT 0,
  description TEXT,
  commercial_value DECIMAL(10,2) DEFAULT 0,
  delivery_location VARCHAR(255),
  status ENUM('Pending', 'In Transit', 'Delivered', 'Cancelled') DEFAULT 'Pending',
  notes TEXT,
  receipt_reference VARCHAR(100),
  courier_name VARCHAR(255),
  staff_no VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES senders(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES receivers(id) ON DELETE CASCADE
);

-- Charges table
CREATE TABLE charges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  shipment_id INT NOT NULL,
  base_charge DECIMAL(10,2) DEFAULT 0,
  other DECIMAL(10,2) DEFAULT 0,
  insurance DECIMAL(10,2) DEFAULT 0,
  extra_delivery DECIMAL(10,2) DEFAULT 0,
  vat DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'KES',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

-- Payments table
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  shipment_id INT NOT NULL,
  payer_account_no VARCHAR(100),
  payment_method ENUM('Cash', 'M-Pesa', 'Bank', 'Card') DEFAULT 'Cash',
  amount_paid DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

-- Create the view used in shipmentService
CREATE VIEW v_shipment_details AS
SELECT 
  s.*,
  sen.name as sender_name,
  sen.telephone as sender_telephone,
  sen.email as sender_email,
  rec.name as receiver_name,
  rec.telephone as receiver_telephone,
  rec.email as receiver_email,
  c.base_charge,
  c.other,
  c.insurance,
  c.extra_delivery,
  c.vat,
  c.total as charge_total,
  c.currency,
  p.payment_method,
  p.amount_paid,
  p.payer_account_no
FROM shipments s
LEFT JOIN senders sen ON s.sender_id = sen.id
LEFT JOIN receivers rec ON s.receiver_id = rec.id
LEFT JOIN charges c ON s.id = c.shipment_id
LEFT JOIN payments p ON s.id = p.shipment_id;