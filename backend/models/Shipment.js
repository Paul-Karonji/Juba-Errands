const { pool } = require('../config/database');
const { generateWaybillNumber } = require('../utils/helpers');

class Shipment {
  constructor(data = {}) {
    this.id = data.id || null;
    this.waybillNo = data.waybillNo || null;
    this.date = data.date || null;
    this.senderId = data.senderId || null;
    this.receiverId = data.receiverId || null;
    this.quantity = data.quantity || 1;
    this.weightKg = data.weightKg || 0;
    this.description = data.description || '';
    this.commercialValue = data.commercialValue || 0;
    this.deliveryLocation = data.deliveryLocation || null;
    this.status = data.status || 'Pending';
    this.notes = data.notes || null;
    this.receiptReference = data.receiptReference || null;
    this.courierName = data.courierName || null;
    this.staffNo = data.staffNo || null;
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  // Allowed statuses
  static get STATUSES() {
    return ['Pending', 'In Transit', 'Delivered', 'Cancelled'];
  }

  // Convert to database format (camelCase to snake_case)
  toDbFormat() {
    return {
      waybill_no: this.waybillNo,
      date: this.date,
      sender_id: this.senderId,
      receiver_id: this.receiverId,
      quantity: this.quantity,
      weight_kg: this.weightKg,
      description: this.description,
      commercial_value: this.commercialValue,
      delivery_location: this.deliveryLocation,
      status: this.status,
      notes: this.notes,
      receipt_reference: this.receiptReference,
      courier_name: this.courierName,
      staff_no: this.staffNo
    };
  }

  // Convert from database format (snake_case to camelCase)
  static fromDbFormat(row) {
    return new Shipment({
      id: row.id,
      waybillNo: row.waybill_no,
      date: row.date,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      quantity: row.quantity,
      weightKg: row.weight_kg,
      description: row.description,
      commercialValue: row.commercial_value,
      deliveryLocation: row.delivery_location,
      status: row.status,
      notes: row.notes,
      receiptReference: row.receipt_reference,
      courierName: row.courier_name,
      staffNo: row.staff_no,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  // Save shipment to database
  async save() {
    try {
      const dbData = this.toDbFormat();
      
      if (this.id) {
        // Update existing shipment
        const [result] = await pool.execute(`
          UPDATE shipments 
          SET waybill_no = ?, date = ?, sender_id = ?, receiver_id = ?, quantity = ?,
              weight_kg = ?, description = ?, commercial_value = ?, delivery_location = ?,
              status = ?, notes = ?, receipt_reference = ?, courier_name = ?, staff_no = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [
          dbData.waybill_no, dbData.date, dbData.sender_id, dbData.receiver_id,
          dbData.quantity, dbData.weight_kg, dbData.description, dbData.commercial_value,
          dbData.delivery_location, dbData.status, dbData.notes, dbData.receipt_reference,
          dbData.courier_name, dbData.staff_no, this.id
        ]);
        
        return result.affectedRows > 0;
      } else {
        // Generate waybill number if not provided
        if (!this.waybillNo) {
          this.waybillNo = await generateWaybillNumber();
        }
        
        // Set date if not provided
        if (!this.date) {
          this.date = new Date().toISOString().split('T')[0];
        }
        
        // Create new shipment
        const [result] = await pool.execute(`
          INSERT INTO shipments (waybill_no, date, sender_id, receiver_id, quantity,
                               weight_kg, description, commercial_value, delivery_location,
                               status, notes, receipt_reference, courier_name, staff_no)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          this.waybillNo, this.date, dbData.sender_id, dbData.receiver_id,
          dbData.quantity, dbData.weight_kg, dbData.description, dbData.commercial_value,
          dbData.delivery_location, dbData.status, dbData.notes, dbData.receipt_reference,
          dbData.courier_name, dbData.staff_no
        ]);
        
        this.id = result.insertId;
        return true;
      }
    } catch (error) {
      console.error('Error saving shipment:', error);
      throw error;
    }
  }

  // Static methods
  static async findAll(filters = {}) {
    try {
      const { status, search, startDate, endDate, page = 1, limit = 10 } = filters;
      
      let whereClause = '';
      const queryParams = [];
      
      if (status) {
        whereClause += ' AND status = ?';
        queryParams.push(status);
      }
      
      if (search) {
        whereClause += ' AND (waybill_no LIKE ? OR sender_name LIKE ? OR receiver_name LIKE ?)';
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      if (startDate) {
        whereClause += ' AND date >= ?';
        queryParams.push(startDate);
      }
      
      if (endDate) {
        whereClause += ' AND date <= ?';
        queryParams.push(endDate);
      }
      
      const offset = (parseInt(page) - 1) * parseInt(limit);
      queryParams.push(parseInt(limit), offset);
      
      const [rows] = await pool.execute(`
        SELECT * FROM v_shipment_details
        WHERE 1=1 ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, queryParams);
      
      return rows;
    } catch (error) {
      console.error('Error finding all shipments:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT * FROM v_shipment_details WHERE id = ?
      `, [id]);
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding shipment by id:', error);
      throw error;
    }
  }

  static async findByWaybillNo(waybillNo) {
    try {
      const [rows] = await pool.execute(`
        SELECT * FROM v_shipment_details WHERE waybill_no = ?
      `, [waybillNo]);
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding shipment by waybill number:', error);
      throw error;
    }
  }

  static async findBySender(senderId) {
    try {
      const [rows] = await pool.execute(`
        SELECT * FROM v_shipment_details 
        WHERE sender_id = ?
        ORDER BY created_at DESC
      `, [senderId]);
      
      return rows;
    } catch (error) {
      console.error('Error finding shipments by sender:', error);
      throw error;
    }
  }

  static async findByReceiver(receiverId) {
    try {
      const [rows] = await pool.execute(`
        SELECT * FROM v_shipment_details 
        WHERE receiver_id = ?
        ORDER BY created_at DESC
      `, [receiverId]);
      
      return rows;
    } catch (error) {
      console.error('Error finding shipments by receiver:', error);
      throw error;
    }
  }

  static async findByStatus(status) {
    try {
      const [rows] = await pool.execute(`
        SELECT * FROM v_shipment_details 
        WHERE status = ?
        ORDER BY created_at DESC
      `, [status]);
      
      return rows;
    } catch (error) {
      console.error('Error finding shipments by status:', error);
      throw error;
    }
  }

  static async findByDateRange(startDate, endDate) {
    try {
      const [rows] = await pool.execute(`
        SELECT * FROM v_shipment_details 
        WHERE date BETWEEN ? AND ?
        ORDER BY date DESC
      `, [startDate, endDate]);
      
      return rows;
    } catch (error) {
      console.error('Error finding shipments by date range:', error);
      throw error;
    }
  }

  static async count(filters = {}) {
    try {
      const { status, search, startDate, endDate } = filters;
      
      let whereClause = '';
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
      
      const [rows] = await pool.execute(`
        SELECT COUNT(*) as total
        FROM shipments s
        LEFT JOIN senders sen ON s.sender_id = sen.id
        LEFT JOIN receivers rec ON s.receiver_id = rec.id
        WHERE 1=1 ${whereClause}
      `, queryParams);
      
      return rows[0]?.total || 0;
    } catch (error) {
      console.error('Error counting shipments:', error);
      throw error;
    }
  }

  static async getStatusBreakdown() {
    try {
      const [rows] = await pool.execute(`
        SELECT status, COUNT(*) as count,
               ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shipments)), 2) as percentage
        FROM shipments
        GROUP BY status
        ORDER BY count DESC
      `);
      
      return rows;
    } catch (error) {
      console.error('Error getting status breakdown:', error);
      throw error;
    }
  }

  static async getRecentShipments(limit = 10) {
    try {
      const [rows] = await pool.execute(`
        SELECT * FROM v_shipment_details
        ORDER BY created_at DESC
        LIMIT ?
      `, [parseInt(limit)]);
      
      return rows;
    } catch (error) {
      console.error('Error getting recent shipments:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM shipments WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting shipment:', error);
      throw error;
    }
  }

  // Instance methods
  async getCharges() {
    try {
      if (!this.id) return null;
      
      const [rows] = await pool.execute(`
        SELECT id, shipment_id, base_charge, other, insurance,
               extra_delivery, vat, total, currency, created_at
        FROM charges 
        WHERE shipment_id = ?
      `, [this.id]);
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error getting shipment charges:', error);
      throw error;
    }
  }

  async getPayments() {
    try {
      if (!this.id) return [];
      
      const [rows] = await pool.execute(`
        SELECT id, shipment_id, payer_account_no, payment_method,
               amount_paid, created_at
        FROM payments 
        WHERE shipment_id = ?
        ORDER BY created_at DESC
      `, [this.id]);
      
      return rows;
    } catch (error) {
      console.error('Error getting shipment payments:', error);
      throw error;
    }
  }

  async getSender() {
    try {
      if (!this.senderId) return null;
      
      const [rows] = await pool.execute(`
        SELECT id, name, id_passport_no, company_name, building_floor,
               street_address, estate_town, telephone, email, created_at
        FROM senders 
        WHERE id = ?
      `, [this.senderId]);
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error getting sender:', error);
      throw error;
    }
  }

  async getReceiver() {
    try {
      if (!this.receiverId) return null;
      
      const [rows] = await pool.execute(`
        SELECT id, name, id_passport_no, company_name, building_floor,
               street_address, estate_town, telephone, email, created_at
        FROM receivers 
        WHERE id = ?
      `, [this.receiverId]);
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error getting receiver:', error);
      throw error;
    }
  }

  async updateStatus(newStatus) {
    try {
      if (!Shipment.STATUSES.includes(newStatus)) {
        throw new Error(`Invalid status: ${newStatus}`);
      }
      
      this.status = newStatus;
      
      const [result] = await pool.execute(`
        UPDATE shipments 
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [newStatus, this.id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating shipment status:', error);
      throw error;
    }
  }

  // Validation
  validate() {
    const errors = [];
    
    if (!this.senderId || !Number.isInteger(this.senderId) || this.senderId <= 0) {
      errors.push('Valid sender ID is required');
    }
    
    if (!this.receiverId || !Number.isInteger(this.receiverId) || this.receiverId <= 0) {
      errors.push('Valid receiver ID is required');
    }
    
    if (!this.description || this.description.trim() === '') {
      errors.push('Description is required');
    }
    
    if (this.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }
    
    if (this.weightKg < 0) {
      errors.push('Weight cannot be negative');
    }
    
    if (this.commercialValue < 0) {
      errors.push('Commercial value cannot be negative');
    }
    
    if (this.status && !Shipment.STATUSES.includes(this.status)) {
      errors.push(`Invalid status. Must be one of: ${Shipment.STATUSES.join(', ')}`);
    }
    
    return errors;
  }

  // Check if shipment is delivered
  isDelivered() {
    return this.status === 'Delivered';
  }

  // Check if shipment is in transit
  isInTransit() {
    return this.status === 'In Transit';
  }

  // Check if shipment is pending
  isPending() {
    return this.status === 'Pending';
  }

  // Check if shipment is cancelled
  isCancelled() {
    return this.status === 'Cancelled';
  }
}

module.exports = Shipment;