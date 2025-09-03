const { pool } = require('../config/database');
const { generateWaybillNumber } = require('../utils/helpers');

const shipmentService = {
  // Get all shipments with filtering and pagination
  getAllShipments: async (filters) => {
    const { status, search, startDate, endDate, page, limit } = filters;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const queryParams = [];

    if (status) {
      whereClause += ' AND s.status = ?';
      queryParams.push(status);
    }

    if (search) {
      whereClause += ' AND (s.waybill_no LIKE ? OR sen.name LIKE ? OR rec.name LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (startDate) {
      whereClause += ' AND s.date >= ?';
      queryParams.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND s.date <= ?';
      queryParams.push(endDate);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM shipments s
      LEFT JOIN senders sen ON s.sender_id = sen.id
      LEFT JOIN receivers rec ON s.receiver_id = rec.id
      ${whereClause}
    `;

    const [countResult] = await pool.execute(countQuery, queryParams);
    const total = countResult[0].total;

    // Get paginated results
    const query = `
      SELECT * FROM v_shipment_details
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);
    const [shipments] = await pool.execute(query, queryParams);

    return { shipments, total };
  },

  // Get shipment by ID
  getShipmentById: async (id) => {
    const query = 'SELECT * FROM v_shipment_details WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  },

  // Get shipment by waybill number
  getByWaybillNumber: async (waybillNo) => {
    const query = 'SELECT * FROM v_shipment_details WHERE waybill_no = ?';
    const [rows] = await pool.execute(query, [waybillNo]);
    return rows[0] || null;
  },

  // Create complete shipment with all related data
  createCompleteShipment: async (shipmentData) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        sender, receiver, quantity, weightKg, description, commercialValue,
        deliveryLocation, status, notes, receiptReference, courierName,
        staffNo, charges, payment
      } = shipmentData;

      // Generate waybill number
      const waybillNo = await generateWaybillNumber();
      const date = new Date().toISOString().split('T')[0];

      // Insert or get sender
      let senderId;
      const [senderExists] = await connection.execute(
        'SELECT id FROM senders WHERE name = ? AND telephone = ?',
        [sender.name, sender.telephone]
      );

      if (senderExists.length > 0) {
        senderId = senderExists[0].id;
      } else {
        const [senderResult] = await connection.execute(`
          INSERT INTO senders (name, id_passport_no, company_name, building_floor, 
                             street_address, estate_town, telephone, email)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          sender.name, sender.idPassport, sender.companyName, sender.buildingFloor,
          sender.streetAddress, sender.estateTown, sender.telephone, sender.email
        ]);
        senderId = senderResult.insertId;
      }

      // Insert or get receiver
      let receiverId;
      const [receiverExists] = await connection.execute(
        'SELECT id FROM receivers WHERE name = ? AND telephone = ?',
        [receiver.name, receiver.telephone]
      );

      if (receiverExists.length > 0) {
        receiverId = receiverExists[0].id;
      } else {
        const [receiverResult] = await connection.execute(`
          INSERT INTO receivers (name, id_passport_no, company_name, building_floor,
                               street_address, estate_town, telephone, email)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          receiver.name, receiver.idPassport, receiver.companyName, receiver.buildingFloor,
          receiver.streetAddress, receiver.estateTown, receiver.telephone, receiver.email
        ]);
        receiverId = receiverResult.insertId;
      }

      // Insert shipment
      const [shipmentResult] = await connection.execute(`
        INSERT INTO shipments (waybill_no, date, sender_id, receiver_id, quantity,
                             weight_kg, description, commercial_value, delivery_location,
                             status, notes, receipt_reference, courier_name, staff_no)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        waybillNo, date, senderId, receiverId, quantity, weightKg, description,
        commercialValue, deliveryLocation, status, notes, receiptReference,
        courierName, staffNo
      ]);

      const shipmentId = shipmentResult.insertId;

      // Insert charges
      const total = (charges.baseCharge || 0) + (charges.other || 0) + 
                   (charges.insurance || 0) + (charges.extraDelivery || 0) + (charges.vat || 0);

      await connection.execute(`
        INSERT INTO charges (shipment_id, base_charge, other, insurance, 
                           extra_delivery, vat, total, currency)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        shipmentId, charges.baseCharge, charges.other, charges.insurance,
        charges.extraDelivery, charges.vat, total, 'KES'
      ]);

      // Insert payment
      await connection.execute(`
        INSERT INTO payments (shipment_id, payer_account_no, payment_method, amount_paid)
        VALUES (?, ?, ?, ?)
      `, [shipmentId, payment.payerAccountNo, payment.paymentMethod, total]);

      await connection.commit();

      // Return the created shipment
      return await this.getShipmentById(shipmentId);

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Update shipment
  updateShipment: async (id, updates) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Update shipment basic info
      if (updates.quantity || updates.weightKg || updates.description || updates.status) {
        await connection.execute(`
          UPDATE shipments 
          SET quantity = COALESCE(?, quantity),
              weight_kg = COALESCE(?, weight_kg),
              description = COALESCE(?, description),
              status = COALESCE(?, status),
              delivery_location = COALESCE(?, delivery_location),
              notes = COALESCE(?, notes),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [
          updates.quantity, updates.weightKg, updates.description, updates.status,
          updates.deliveryLocation, updates.notes, id
        ]);
      }

      // Update charges if provided
      if (updates.charges) {
        const { charges } = updates;
        const total = (charges.baseCharge || 0) + (charges.other || 0) + 
                     (charges.insurance || 0) + (charges.extraDelivery || 0) + (charges.vat || 0);

        await connection.execute(`
          UPDATE charges 
          SET base_charge = COALESCE(?, base_charge),
              other = COALESCE(?, other),
              insurance = COALESCE(?, insurance),
              extra_delivery = COALESCE(?, extra_delivery),
              vat = COALESCE(?, vat),
              total = ?
          WHERE shipment_id = ?
        `, [
          charges.baseCharge, charges.other, charges.insurance,
          charges.extraDelivery, charges.vat, total, id
        ]);
      }

      // Update payment if provided
      if (updates.payment) {
        await connection.execute(`
          UPDATE payments 
          SET payment_method = COALESCE(?, payment_method),
              payer_account_no = COALESCE(?, payer_account_no)
          WHERE shipment_id = ?
        `, [updates.payment.paymentMethod, updates.payment.payerAccountNo, id]);
      }

      await connection.commit();
      return await this.getShipmentById(id);

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Delete shipment
  deleteShipment: async (id) => {
    const query = 'DELETE FROM shipments WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }
};

module.exports = shipmentService;