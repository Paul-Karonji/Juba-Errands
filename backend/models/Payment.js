const { pool } = require('../config/database');

class Payment {
  constructor(data = {}) {
    this.id = data.id || null;
    this.shipmentId = data.shipmentId || null;
    this.payerAccountNo = data.payerAccountNo || null;
    this.paymentMethod = data.paymentMethod || 'Cash';
    this.amountPaid = data.amountPaid || 0;
    this.createdAt = data.createdAt || null;
  }

  // Allowed payment methods
  static get PAYMENT_METHODS() {
    return ['Cash', 'M-Pesa', 'Bank', 'Card'];
  }

  // Convert to database format (camelCase to snake_case)
  toDbFormat() {
    return {
      shipment_id: this.shipmentId,
      payer_account_no: this.payerAccountNo,
      payment_method: this.paymentMethod,
      amount_paid: this.amountPaid
    };
  }

  // Convert from database format (snake_case to camelCase)
  static fromDbFormat(row) {
    return new Payment({
      id: row.id,
      shipmentId: row.shipment_id,
      payerAccountNo: row.payer_account_no,
      paymentMethod: row.payment_method,
      amountPaid: row.amount_paid,
      createdAt: row.created_at
    });
  }

  // Save payment to database
  async save() {
    try {
      const dbData = this.toDbFormat();
      
      if (this.id) {
        // Update existing payment
        const [result] = await pool.execute(`
          UPDATE payments 
          SET shipment_id = ?, payer_account_no = ?, payment_method = ?, amount_paid = ?
          WHERE id = ?
        `, [
          dbData.shipment_id, dbData.payer_account_no, 
          dbData.payment_method, dbData.amount_paid, this.id
        ]);
        
        return result.affectedRows > 0;
      } else {
        // Create new payment
        const [result] = await pool.execute(`
          INSERT INTO payments (shipment_id, payer_account_no, payment_method, amount_paid)
          VALUES (?, ?, ?, ?)
        `, [
          dbData.shipment_id, dbData.payer_account_no,
          dbData.payment_method, dbData.amount_paid
        ]);
        
        this.id = result.insertId;
        return true;
      }
    } catch (error) {
      console.error('Error saving payment:', error);
      throw error;
    }
  }

  // Static methods
  static async findAll() {
    try {
      const [rows] = await pool.execute(`
        SELECT id, shipment_id, payer_account_no, payment_method, 
               amount_paid, created_at
        FROM payments 
        ORDER BY id DESC
      `);
      
      return rows.map(row => Payment.fromDbFormat(row));
    } catch (error) {
      console.error('Error finding all payments:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT id, shipment_id, payer_account_no, payment_method,
               amount_paid, created_at
        FROM payments 
        WHERE id = ?
      `, [id]);
      
      return rows.length > 0 ? Payment.fromDbFormat(rows[0]) : null;
    } catch (error) {
      console.error('Error finding payment by id:', error);
      throw error;
    }
  }

  static async findByShipmentId(shipmentId) {
    try {
      const [rows] = await pool.execute(`
        SELECT id, shipment_id, payer_account_no, payment_method,
               amount_paid, created_at
        FROM payments 
        WHERE shipment_id = ?
        ORDER BY created_at DESC
      `, [shipmentId]);
      
      return rows.map(row => Payment.fromDbFormat(row));
    } catch (error) {
      console.error('Error finding payments by shipment id:', error);
      throw error;
    }
  }

  static async findLatestByShipmentId(shipmentId) {
    try {
      const [rows] = await pool.execute(`
        SELECT id, shipment_id, payer_account_no, payment_method,
               amount_paid, created_at
        FROM payments 
        WHERE shipment_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `, [shipmentId]);
      
      return rows.length > 0 ? Payment.fromDbFormat(rows[0]) : null;
    } catch (error) {
      console.error('Error finding latest payment by shipment id:', error);
      throw error;
    }
  }

  static async getTotalPaidByShipmentId(shipmentId) {
    try {
      const [rows] = await pool.execute(`
        SELECT COALESCE(SUM(amount_paid), 0) as total_paid
        FROM payments 
        WHERE shipment_id = ?
      `, [shipmentId]);
      
      return parseFloat(rows[0]?.total_paid || 0);
    } catch (error) {
      console.error('Error getting total paid by shipment id:', error);
      throw error;
    }
  }

  static async getPaymentsByMethod(method) {
    try {
      const [rows] = await pool.execute(`
        SELECT id, shipment_id, payer_account_no, payment_method,
               amount_paid, created_at
        FROM payments 
        WHERE payment_method = ?
        ORDER BY created_at DESC
      `, [method]);
      
      return rows.map(row => Payment.fromDbFormat(row));
    } catch (error) {
      console.error('Error finding payments by method:', error);
      throw error;
    }
  }

  static async getPaymentStats(startDate = null, endDate = null) {
    try {
      let whereClause = '';
      const params = [];
      
      if (startDate) {
        whereClause += ' WHERE created_at >= ?';
        params.push(startDate);
      }
      
      if (endDate) {
        whereClause += startDate ? ' AND created_at <= ?' : ' WHERE created_at <= ?';
        params.push(endDate);
      }

      const [rows] = await pool.execute(`
        SELECT 
          payment_method,
          COUNT(*) as count,
          SUM(amount_paid) as total_amount,
          AVG(amount_paid) as avg_amount
        FROM payments
        ${whereClause}
        GROUP BY payment_method
        ORDER BY total_amount DESC
      `, params);
      
      return rows;
    } catch (error) {
      console.error('Error getting payment stats:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM payments WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  }

  // Validation
  validate() {
    const errors = [];
    
    if (this.shipmentId && (!Number.isInteger(this.shipmentId) || this.shipmentId <= 0)) {
      errors.push('Invalid shipment ID');
    }
    
    if (this.paymentMethod && !Payment.PAYMENT_METHODS.includes(this.paymentMethod)) {
      errors.push(`Invalid payment method. Must be one of: ${Payment.PAYMENT_METHODS.join(', ')}`);
    }
    
    if (this.amountPaid < 0) {
      errors.push('Amount paid cannot be negative');
    }
    
    if (this.paymentMethod === 'M-Pesa' && !this.payerAccountNo) {
      errors.push('Payer account number is required for M-Pesa payments');
    }
    
    if (this.paymentMethod === 'Bank' && !this.payerAccountNo) {
      errors.push('Payer account number is required for Bank payments');
    }
    
    return errors;
  }

  // Check if payment is complete based on shipment charges
  async isComplete() {
    try {
      if (!this.shipmentId) return false;
      
      // Get total charges for shipment
      const [chargeRows] = await pool.execute(`
        SELECT total FROM charges WHERE shipment_id = ?
      `, [this.shipmentId]);
      
      if (chargeRows.length === 0) return false;
      
      const totalCharges = parseFloat(chargeRows[0].total);
      const totalPaid = await Payment.getTotalPaidByShipmentId(this.shipmentId);
      
      return totalPaid >= totalCharges;
    } catch (error) {
      console.error('Error checking payment completion:', error);
      throw error;
    }
  }
}

module.exports = Payment;