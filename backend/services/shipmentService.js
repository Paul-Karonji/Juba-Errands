const { pool } = require('../config/database');
const { generateWaybillNumber } = require('../utils/helpers');

const shipmentService = {
  // Get all shipments with filtering and pagination
  getAllShipments: async (filters = {}) => {
    try {
      console.log('getAllShipments called with filters:', JSON.stringify(filters));
      
      const { 
        status, 
        search, 
        startDate, 
        endDate, 
        page = 1, 
        limit = 10 
      } = filters;

      const pageInt = Math.max(1, parseInt(page) || 1);
      const limitInt = Math.max(1, parseInt(limit) || 10);
      const offsetInt = (pageInt - 1) * limitInt;

      // First, try the simplest possible query to check if data exists
      try {
        const [basicTest] = await pool.execute('SELECT COUNT(*) as count FROM shipments');
        console.log('Basic shipments count:', basicTest[0].count);
        
        if (basicTest[0].count === 0) {
          console.log('No shipments found in database');
          return {
            shipments: [],
            total: 0,
            page: pageInt,
            limit: limitInt,
            totalPages: 0
          };
        }
      } catch (basicError) {
        console.error('Basic shipments test failed:', basicError.message);
        throw new Error('Cannot access shipments table: ' + basicError.message);
      }

      // Try to use the view first
      let queryResult;
      try {
        console.log('Attempting to use v_shipment_details view...');
        queryResult = await this.queryWithView(status, search, startDate, endDate, pageInt, limitInt, offsetInt);
        console.log('View query successful');
      } catch (viewError) {
        console.log('View query failed:', viewError.message);
        console.log('Falling back to basic shipments query...');
        queryResult = await this.queryBasicShipments(status, search, startDate, endDate, pageInt, limitInt, offsetInt);
      }

      return queryResult;

    } catch (error) {
      console.error('getAllShipments error:', error.message);
      console.error('Stack:', error.stack);
      throw new Error('Database query failed: ' + error.message);
    }
  },

  // Get shipment by ID
  getShipmentById: async (id) => {
    try {
      const shipmentId = parseInt(id);
      if (!shipmentId || shipmentId <= 0) {
        return null;
      }

      // Try view first
      try {
        const [rows] = await pool.execute('SELECT * FROM v_shipment_details WHERE id = ?', [shipmentId]);
        return rows[0] || null;
      } catch (viewError) {
        // Fallback to basic query
        const [rows] = await pool.execute(`
          SELECT 
            s.*,
            sen.name as sender_name,
            rec.name as receiver_name
          FROM shipments s
          LEFT JOIN senders sen ON s.sender_id = sen.id
          LEFT JOIN receivers rec ON s.receiver_id = rec.id
          WHERE s.id = ?
        `, [shipmentId]);
        return rows[0] || null;
      }
    } catch (error) {
      console.error('getShipmentById error:', error);
      return null;
    }
  },

  // Get shipment by waybill number
  getByWaybillNumber: async (waybillNo) => {
    try {
      if (!waybillNo) {
        return null;
      }

      // Try view first
      try {
        const [rows] = await pool.execute('SELECT * FROM v_shipment_details WHERE waybill_no = ?', [waybillNo]);
        return rows[0] || null;
      } catch (viewError) {
        // Fallback to basic query
        const [rows] = await pool.execute(`
          SELECT 
            s.*,
            sen.name as sender_name,
            rec.name as receiver_name
          FROM shipments s
          LEFT JOIN senders sen ON s.sender_id = sen.id
          LEFT JOIN receivers rec ON s.receiver_id = rec.id
          WHERE s.waybill_no = ?
        `, [waybillNo]);
        return rows[0] || null;
      }
    } catch (error) {
      console.error('getByWaybillNumber error:', error);
      return null;
    }
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

      // Validate required fields
      if (!sender?.name || !sender?.telephone) {
        throw new Error('Sender name and telephone are required');
      }
      if (!receiver?.name || !receiver?.telephone) {
        throw new Error('Receiver name and telephone are required');
      }

      // Generate waybill number
      const waybillNo = await generateWaybillNumber();
      const date = new Date().toISOString().split('T')[0];

      // Handle sender
      let senderId;
      const [senderExists] = await connection.execute(
        'SELECT id FROM senders WHERE name = ? AND telephone = ?',
        [sender.name, sender.telephone]
      );

      if (senderExists.length > 0) {
        senderId = senderExists[0].id;
      } else {
        const [senderResult] = await connection.execute(`
          INSERT INTO senders (name, telephone, phone, email, address, id_passport_no, 
                             company_name, building_floor, street_address, estate_town)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          sender.name,
          sender.telephone,
          sender.telephone,
          sender.email || null,
          sender.address || null,
          sender.idPassport || null,
          sender.companyName || null,
          sender.buildingFloor || null,
          sender.streetAddress || null,
          sender.estateTown || null
        ]);
        senderId = senderResult.insertId;
      }

      // Handle receiver
      let receiverId;
      const [receiverExists] = await connection.execute(
        'SELECT id FROM receivers WHERE name = ? AND telephone = ?',
        [receiver.name, receiver.telephone]
      );

      if (receiverExists.length > 0) {
        receiverId = receiverExists[0].id;
      } else {
        const [receiverResult] = await connection.execute(`
          INSERT INTO receivers (name, telephone, phone, email, address, id_passport_no,
                               company_name, building_floor, street_address, estate_town)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          receiver.name,
          receiver.telephone,
          receiver.telephone,
          receiver.email || null,
          receiver.address || null,
          receiver.idPassport || null,
          receiver.companyName || null,
          receiver.buildingFloor || null,
          receiver.streetAddress || null,
          receiver.estateTown || null
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
        waybillNo,
        date,
        senderId,
        receiverId,
        parseInt(quantity) || 1,
        parseFloat(weightKg) || 0,
        description || '',
        parseFloat(commercialValue) || 0,
        deliveryLocation || '',
        status || 'Pending',
        notes || null,
        receiptReference || null,
        courierName || null,
        staffNo || null
      ]);

      const shipmentId = shipmentResult.insertId;

      // Handle charges if charges table exists
      if (charges) {
        try {
          const baseCharge = parseFloat(charges.baseCharge) || 0;
          const other = parseFloat(charges.other) || 0;
          const insurance = parseFloat(charges.insurance) || 0;
          const extraDelivery = parseFloat(charges.extraDelivery) || 0;
          const vat = parseFloat(charges.vat) || 0;
          const total = baseCharge + other + insurance + extraDelivery + vat;

          await connection.execute(`
            INSERT INTO charges (shipment_id, base_charge, other, insurance,
                               extra_delivery, vat, total, currency)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            shipmentId, baseCharge, other, insurance,
            extraDelivery, vat, total, charges.currency || 'KES'
          ]);
        } catch (chargeError) {
          console.log('Charges table not available:', chargeError.message);
        }
      }

      // Handle payment if payments table exists
      if (payment) {
        try {
          await connection.execute(`
            INSERT INTO payments (shipment_id, payer_account_no, payment_method, amount_paid)
            VALUES (?, ?, ?, ?)
          `, [
            shipmentId,
            payment.payerAccountNo || null,
            payment.paymentMethod || 'Cash',
            parseFloat(payment.amountPaid) || 0
          ]);
        } catch (paymentError) {
          console.log('Payments table not available:', paymentError.message);
        }
      }

      await connection.commit();
      return await shipmentService.getShipmentById(shipmentId);

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Update shipment
  updateShipment: async (id, updates) => {
    try {
      const shipmentId = parseInt(id);
      if (!shipmentId || shipmentId <= 0) {
        throw new Error('Invalid shipment ID');
      }

      // Check if shipment exists
      const [exists] = await pool.execute('SELECT id FROM shipments WHERE id = ?', [shipmentId]);
      if (exists.length === 0) {
        return null;
      }

      const updateFields = [];
      const updateValues = [];

      // Build dynamic update query
      if (updates.quantity !== undefined) {
        updateFields.push('quantity = ?');
        updateValues.push(parseInt(updates.quantity) || 1);
      }
      if (updates.weightKg !== undefined) {
        updateFields.push('weight_kg = ?');
        updateValues.push(parseFloat(updates.weightKg) || 0);
      }
      if (updates.description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(updates.description);
      }
      if (updates.status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(updates.status);
      }
      if (updates.deliveryLocation !== undefined) {
        updateFields.push('delivery_location = ?');
        updateValues.push(updates.deliveryLocation);
      }
      if (updates.notes !== undefined) {
        updateFields.push('notes = ?');
        updateValues.push(updates.notes);
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(shipmentId);

        const updateSql = `UPDATE shipments SET ${updateFields.join(', ')} WHERE id = ?`;
        await pool.execute(updateSql, updateValues);
      }

      return await this.getShipmentById(shipmentId);
    } catch (error) {
      console.error('updateShipment error:', error);
      throw error;
    }
  },

  // Delete shipment
  deleteShipment: async (id) => {
    try {
      const shipmentId = parseInt(id);
      if (!shipmentId || shipmentId <= 0) {
        return false;
      }

      const [result] = await pool.execute('DELETE FROM shipments WHERE id = ?', [shipmentId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('deleteShipment error:', error);
      return false;
    }
  }
};

module.exports = shipmentService;