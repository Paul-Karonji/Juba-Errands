USE juba_errands_nairobi;


-- Reset data
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE payments;
TRUNCATE TABLE charges;
TRUNCATE TABLE shipments;
TRUNCATE TABLE receivers;
TRUNCATE TABLE senders;
SET FOREIGN_KEY_CHECKS = 1;


-- Insert mock senders
INSERT INTO senders (name, phone, email, address, id_passport_no, company_name, building_floor, street_address, estate_town, telephone)
VALUES
('John Mwangi', '0712345678', 'john@example.com', 'Nairobi CBD', 'ID12345', 'Mwangi Electronics', '2nd Floor', 'Moi Avenue', 'Nairobi', '0712345678'),
('Mary Atieno', '0723456789', 'mary@example.com', 'Westlands, Nairobi', 'ID67890', 'Atieno Clothing', '3rd Floor', 'Ring Road', 'Nairobi', '0723456789');

-- Insert mock receivers
INSERT INTO receivers (name, phone, email, address, id_passport_no, company_name, building_floor, street_address, estate_town, telephone)
VALUES
('Peter Kamau', '0734567890', 'peter@example.com', 'Kisumu CBD', 'ID54321', 'Kamau Traders', '1st Floor', 'Oginga Odinga St', 'Kisumu', '0734567890'),
('Jane Wanjiru', '0745678901', 'jane@example.com', 'Mombasa CBD', 'ID98765', 'Wanjiru Wholesalers', 'Ground Floor', 'Nkrumah Rd', 'Mombasa', '0745678901');

-- Insert mock shipments
INSERT INTO shipments (waybill_no, date, sender_id, receiver_id, quantity, weight_kg, description, commercial_value, delivery_location, status, staff_no)
VALUES
('WB001', '2025-09-06', 1, 1, 2, 12.50, 'Electronics - Mobile Phones', 50000.00, 'Kisumu', 'In Transit', 'STF001'),
('WB002', '2025-09-06', 2, 2, 5, 25.00, 'Clothing - Bulk Order', 80000.00, 'Mombasa', 'Pending', 'STF002');

-- Insert mock charges
INSERT INTO charges (shipment_id, base_charge, other, insurance, extra_delivery, vat, total, currency)
VALUES
(1, 4500.00, 200.00, 300.00, 300.00, 500.00, 5800.00, 'KES'),
(2, 7000.00, 500.00, 400.00, 700.00, 800.00, 9400.00, 'KES');

-- Insert mock payments
INSERT INTO payments (shipment_id, payer_account_no, payment_method, amount_paid)
VALUES
(1, 'MPESA12345', 'M-Pesa', 5800.00),
(2, 'CASH67890', 'Cash', 9400.00);
