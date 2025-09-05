const { pool } = require('../config/database');
const { generateWaybillNumber } = require('../utils/helpers');

const shipmentService = {
  // Get all shipments with filtering and pagination
  getAllShipments: async (filters) => {
    try {
      const { 
        status, 
        search, 
        startDate, 
        endDate, 
        page = 1, 
        limit = 10 
      } = filters;

      // Ensure page and limit are integers
      const pageInt = parseInt(page) || 1;
      const limitInt = parseInt(limit) || 10;
      const offsetInt = (pageInt - 1) * limitInt;

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
      const total = countResult[0]?.total || 0;

      // Get paginated results - check if view exists first
      let dataQuery;
      try {
        // Try to use the view first
        await pool.execute('SELECT 1 FROM v_shipment_details LIMIT 1');
        
        // View exists, modify where clause for view
        const dataWhereClause = whereClause
          .replace(/sen\./g, 'sender_')
          .replace(/rec\./g, 'receiver_')
          .replace(/s\./g, '');

        dataQuery = `
          SELECT * FROM v_shipment_details
          ${dataWhereClause}
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `;
      } catch (viewError) {
        // View doesn't exist, use direct join query
        console.log('View not found, using direct query');
        dataQuery = `
          SELECT 
            s.*,
            sen.name as sender_name,
            COALESCE(sen.phone, sen.telephone) as sender_telephone,
            sen.email as sender_email,
            rec.name as receiver_name,
            COALESCE(rec.phone, rec.telephone) as receiver_telephone,
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
          LEFT JOIN payments p ON s.id = p.shipment_id
          ${whereClause}
          ORDER BY s.created_at DESC
          LIMIT ? OFFSET ?
        `;
      }

      // Add limit and offset to query params
      const dataQueryParams = [...queryParams, limitInt, offsetInt];
      const [shipments] = await pool.execute(dataQuery, dataQueryParams);

      return { 
        shipments: shipments || [], 
        total,
        page: pageInt,
        limit: limitInt,
        totalPages: Math.ceil(total / limitInt)
      };
    } catch (error) {
      console.error('Error in getAllShipments:', error);
      console.error('Query params:', filters);
      // Return empty result instead of throwing error
      return {
        shipments: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      };
    }
  },

  // Get shipment by ID
  getShipmentById: async (id) => {
    try {
      const idInt = parseInt(id);
      if (!idInt || idInt <= 0) {
        throw new Error('Invalid shipment ID');
      }

      let query;
      try {
        // Try view first
        await pool.execute('SELECT 1 FROM v_shipment_details LIMIT 1');
        query = 'SELECT * FROM v_shipment_details WHERE id = ?';
      } catch (viewError) {
        // Use direct query
        query = `
          SELECT 
            s.*,
            sen.name as sender_name,
            COALESCE(sen.phone, sen.telephone) as sender_telephone,
            sen.email as sender_email,
            rec.name as receiver_name,
            COALESCE(rec.phone, rec.telephone) as receiver_telephone,
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
          LEFT JOIN payments p ON s.id = p.shipment_id
          WHERE s.id = ?
        `;
      }

      const [rows] = await pool.execute(query, [idInt]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error in getShipmentById:', error);
      return null;
    }
  },

  // Get shipment by waybill number
  getByWaybillNumber: async (waybillNo) => {
    try {
      if (!waybillNo || typeof waybillNo !== 'string') {
        throw new Error('Invalid waybill number');
      }

      let query;
      try {
        // Try view first
        await pool.execute('SELECT 1 FROM v_shipment_details LIMIT 1');
        query = 'SELECT * FROM v_shipment_details WHERE waybill_no = ?';
      } catch (viewError) {
        // Use direct query
        query = `
          SELECT 
            s.*,
            sen.name as sender_name,
            COALESCE(sen.phone, sen.telephone) as sender_telephone,
            sen.email as sender_email,
            rec.name as receiver_name,
            COALESCE(rec.phone, rec.telephone) as receiver_telephone,
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
          LEFT JOIN payments p ON s.id = p.shipment_id
          WHERE s.waybill_no = ?
        `;
      }

      const [rows] = await pool.execute(query, [waybillNo]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error in getByWaybillNumber:', error);
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

      // Insert or get sender
      let senderId;
      const [senderExists] = await connection.execute(
        'SELECT id FROM senders WHERE name = ? AND COALESCE(phone, telephone) = ?',
        [sender.name, sender.telephone]
      );

      if (senderExists.length > 0) {
        senderId = senderExists[0].id;
      } else {
        const [senderResult] = await connection.execute(`
          INSERT INTO senders (name, phone, telephone, id_passport_no, company_name, building_floor, 
                             street_address, estate_town, email, address)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          sender.name, 
          sender.telephone,
          sender.telephone,
          sender.idPassport || null, 
          sender.companyName || null, 
          sender.buildingFloor || null,
          sender.streetAddress || null, 
          sender.estateTown || null, 
          sender.email || null,
          sender.address || null
        ]);
        senderId = senderResult.insertId;
      }

      // Insert or get receiver
      let receiverId;
      const [receiverExists] = await connection.execute(
        'SELECT id FROM receivers WHERE name = ? AND COALESCE(phone, telephone) = ?',
        [receiver.name, receiver.telephone]
      );

      if (receiverExists.length > 0) {
        receiverId = receiverExists[0].id;
      } else {
        const [receiverResult] = await connection.execute(`
          INSERT INTO receivers (name, phone, telephone, id_passport_no, company_name, building_floor,
                               street_address, estate_town, email, address)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          receiver.name, 
          receiver.telephone,
          receiver.telephone,
          receiver.idPassport || null, 
          receiver.companyName || null, 
          receiver.buildingFloor || null,
          receiver.streetAddress || null, 
          receiver.estateTown || null, 
          receiver.email || null,
          receiver.address || null
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

      // Insert charges
      const baseCharge = parseFloat(charges?.baseCharge) || 0;
      const other = parseFloat(charges?.other) || 0;
      const insurance = parseFloat(charges?.insurance) || 0;
      const extraDelivery = parseFloat(charges?.extraDelivery) || 0;
      const vat = parseFloat(charges?.vat) || 0;
      const total = baseCharge + other + insurance + extraDelivery + vat;

      await connection.execute(`
        INSERT INTO charges (shipment_id, base_charge, other, insurance, 
                           extra_delivery, vat, total, currency)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        shipmentId, baseCharge, other, insurance,
        extraDelivery, vat, total, charges?.currency || 'KES'
      ]);

      // Insert payment
      await connection.execute(`
        INSERT INTO payments (shipment_id, payer_account_no, payment_method, amount_paid)
        VALUES (?, ?, ?, ?)
      `, [
        shipmentId, 
        payment?.payerAccountNo || null, 
        payment?.paymentMethod || 'Cash', 
        parseFloat(payment?.amountPaid) || total
      ]);

      await connection.commit();

      // Return the created shipment
      return await this.getShipmentById(shipmentId);

    } catch (error) {
      await connection.rollback();
      console.error('Error in createCompleteShipment:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // Update shipment
  updateShipment: async (id, updates) => {
    const connection = await pool.getConnection();
    
    try {
      const idInt = parseInt(id);
      if (!idInt || idInt <= 0) {
        throw new Error('Invalid shipment ID');
      }

      await connection.beginTransaction();

      // Check if shipment exists
      const [existingShipment] = await connection.execute(
        'SELECT id FROM shipments WHERE id = ?', 
        [idInt]
      );
      
      if (existingShipment.length === 0) {
        throw new Error('Shipment not found');
      }

      // Update shipment basic info
      if (updates.quantity || updates.weightKg || updates.description || 
          updates.status || updates.deliveryLocation || updates.notes) {
        
        const updateFields = [];
        const updateValues = [];

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
          updateValues.push(idInt);

          const query = `UPDATE shipments SET ${updateFields.join(', ')} WHERE id = ?`;
          await connection.execute(query, updateValues);
        }
      }

      // Update charges if provided
      if (updates.charges) {
        const { charges } = updates;
        const baseCharge = parseFloat(charges.baseCharge) || 0;
        const other = parseFloat(charges.other) || 0;
        const insurance = parseFloat(charges.insurance) || 0;
        const extraDelivery = parseFloat(charges.extraDelivery) || 0;
        const vat = parseFloat(charges.vat) || 0;
        const total = baseCharge + other + insurance + extraDelivery + vat;

        await connection.execute(`
          UPDATE charges 
          SET base_charge = ?, other = ?, insurance = ?, extra_delivery = ?, vat = ?, total = ?
          WHERE shipment_id = ?
        `, [baseCharge, other, insurance, extraDelivery, vat, total, idInt]);
      }

      // Update payment if provided
      if (updates.payment) {
        const updatePaymentFields = [];
        const updatePaymentValues = [];

        if (updates.payment.paymentMethod !== undefined) {
          updatePaymentFields.push('payment_method = ?');
          updatePaymentValues.push(updates.payment.paymentMethod);
        }
        if (updates.payment.payerAccountNo !== undefined) {
          updatePaymentFields.push('payer_account_no = ?');
          updatePaymentValues.push(updates.payment.payerAccountNo);
        }
        if (updates.payment.amountPaid !== undefined) {
          updatePaymentFields.push('amount_paid = ?');
          updatePaymentValues.push(parseFloat(updates.payment.amountPaid) || 0);
        }

        if (updatePaymentFields.length > 0) {
          updatePaymentValues.push(idInt);
          const query = `UPDATE payments SET ${updatePaymentFields.join(', ')} WHERE shipment_id = ?`;
          await connection.execute(query, updatePaymentValues);
        }
      }

      await connection.commit();
      return await this.getShipmentById(idInt);

    } catch (error) {
      await connection.rollback();
      console.error('Error in updateShipment:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // Delete shipment
  deleteShipment: async (id) => {
    try {
      const idInt = parseInt(id);
      if (!idInt || idInt <= 0) {
        throw new Error('Invalid shipment ID');
      }

      const query = 'DELETE FROM shipments WHERE id = ?';
      const [result] = await pool.execute(query, [idInt]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in deleteShipment:', error);
      return false;
    }
  }
};

module.exports = shipmentService;