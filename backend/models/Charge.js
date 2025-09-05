const { pool } = require('../config/database');

class Charge {
  constructor(data = {}) {
    this.id = data.id || null;
    this.shipmentId = data.shipmentId || null;
    this.baseCharge = data.baseCharge || 0;
    this.other = data.other || 0;
    this.insurance = data.insurance || 0;
    this.extraDelivery = data.extraDelivery || 0;
    this.vat = data.vat || 0;
    this.total = data.total || this.calculateTotal();
    this.currency = data.currency || 'KES';
    this.createdAt = data.createdAt || null;
  }

  // Calculate total charges
  calculateTotal() {
    return parseFloat(this.baseCharge) + parseFloat(this.other) + 
           parseFloat(this.insurance) + parseFloat(this.extraDelivery) + 
           parseFloat(this.vat);
  }

  // Convert to database format (camelCase to snake_case)
  toDbFormat() {
    return {
      shipment_id: this.shipmentId,
      base_charge: this.baseCharge,
      other: this.other,
      insurance: this.insurance,
      extra_delivery: this.extraDelivery,
      vat: this.vat,
      total: this.total || this.calculateTotal(),
      currency: this.currency
    };
  }

  // Convert from database format (snake_case to camelCase)
  static fromDbFormat(row) {
    return new Charge({
      id: row.id,
      shipmentId: row.shipment_id,
      baseCharge: row.base_charge,
      other: row.other,
      insurance: row.insurance,
      extraDelivery: row.extra_delivery,
      vat: row.vat,
      total: row.total,
      currency: row.currency,
      createdAt: row.created_at
    });
  }

  // Save charge to database
  async save() {
    try {
      const dbData = this.toDbFormat();
      
      if (this.id) {
        // Update existing charge
        const [result] = await pool.execute(`
          UPDATE charges 
          SET shipment_id = ?, base_charge = ?, other = ?, insurance = ?, 
              extra_delivery = ?, vat = ?, total = ?, currency = ?
          WHERE id = ?
        `, [
          dbData.shipment_id, dbData.base_charge, dbData.other, 
          dbData.insurance, dbData.extra_delivery, dbData.vat, 
          dbData.total, dbData.currency, this.id
        ]);
        
        return result.affectedRows > 0;
      } else {
        // Create new charge
        const [result] = await pool.execute(`
          INSERT INTO charges (shipment_id, base_charge, other, insurance, 
                             extra_delivery, vat, total, currency)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          dbData.shipment_id, dbData.base_charge, dbData.other,
          dbData.insurance, dbData.extra_delivery, dbData.vat,
          dbData.total, dbData.currency
        ]);
        
        this.id = result.insertId;
        return true;
      }
    } catch (error) {
      console.error('Error saving charge:', error);
      throw error;
    }
  }

  // Static methods
  static async findAll() {
    try {
      const [rows] = await pool.execute(`
        SELECT id, shipment_id, base_charge, other, insurance, 
               extra_delivery, vat, total, currency, created_at
        FROM charges 
        ORDER BY id DESC
      `);
      
      return rows.map(row => Charge.fromDbFormat(row));
    } catch (error) {
      console.error('Error finding all charges:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT id, shipment_id, base_charge, other, insurance,
               extra_delivery, vat, total, currency, created_at
        FROM charges 
        WHERE id = ?
      `, [id]);
      
      return rows.length > 0 ? Charge.fromDbFormat(rows[0]) : null;
    } catch (error) {
      console.error('Error finding charge by id:', error);
      throw error;
    }
  }

  static async findByShipmentId(shipmentId) {
    try {
      const [rows] = await pool.execute(`
        SELECT id, shipment_id, base_charge, other, insurance,
               extra_delivery, vat, total, currency, created_at
        FROM charges 
        WHERE shipment_id = ?
      `, [shipmentId]);
      
      return rows.length > 0 ? Charge.fromDbFormat(rows[0]) : null;
    } catch (error) {
      console.error('Error finding charge by shipment id:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM charges WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting charge:', error);
      throw error;
    }
  }

  // Validation
  validate() {
    const errors = [];
    
    if (this.shipmentId && (!Number.isInteger(this.shipmentId) || this.shipmentId <= 0)) {
      errors.push('Invalid shipment ID');
    }
    
    if (this.baseCharge < 0) errors.push('Base charge cannot be negative');
    if (this.other < 0) errors.push('Other charges cannot be negative');
    if (this.insurance < 0) errors.push('Insurance cannot be negative');
    if (this.extraDelivery < 0) errors.push('Extra delivery cannot be negative');
    if (this.vat < 0) errors.push('VAT cannot be negative');
    
    return errors;
  }
}

module.exports = Charge;