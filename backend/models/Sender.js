const { pool } = require('../config/database');

class Sender {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.idPassportNo = data.idPassportNo || null;
    this.companyName = data.companyName || null;
    this.buildingFloor = data.buildingFloor || null;
    this.streetAddress = data.streetAddress || null;
    this.estateTown = data.estateTown || null;
    this.telephone = data.telephone || '';
    this.email = data.email || null;
    this.createdAt = data.createdAt || null;
  }

  // Convert to database format (camelCase to snake_case)
  toDbFormat() {
    return {
      name: this.name,
      id_passport_no: this.idPassportNo,
      company_name: this.companyName,
      building_floor: this.buildingFloor,
      street_address: this.streetAddress,
      estate_town: this.estateTown,
      telephone: this.telephone,
      email: this.email
    };
  }

  // Convert from database format (snake_case to camelCase)
  static fromDbFormat(row) {
    return new Sender({
      id: row.id,
      name: row.name,
      idPassportNo: row.id_passport_no,
      companyName: row.company_name,
      buildingFloor: row.building_floor,
      streetAddress: row.street_address,
      estateTown: row.estate_town,
      telephone: row.telephone,
      email: row.email,
      createdAt: row.created_at
    });
  }

  // Get full address
  getFullAddress() {
    const addressParts = [
      this.buildingFloor,
      this.streetAddress,
      this.estateTown
    ].filter(part => part && part.trim() !== '');
    
    return addressParts.join(', ');
  }

  // Save sender to database
  async save() {
    try {
      const dbData = this.toDbFormat();
      
      if (this.id) {
        // Update existing sender
        const [result] = await pool.execute(`
          UPDATE senders 
          SET name = ?, id_passport_no = ?, company_name = ?, building_floor = ?,
              street_address = ?, estate_town = ?, telephone = ?, email = ?
          WHERE id = ?
        `, [
          dbData.name, dbData.id_passport_no, dbData.company_name,
          dbData.building_floor, dbData.street_address, dbData.estate_town,
          dbData.telephone, dbData.email, this.id
        ]);
        
        return result.affectedRows > 0;
      } else {
        // Create new sender
        const [result] = await pool.execute(`
          INSERT INTO senders (name, id_passport_no, company_name, building_floor,
                             street_address, estate_town, telephone, email)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          dbData.name, dbData.id_passport_no, dbData.company_name,
          dbData.building_floor, dbData.street_address, dbData.estate_town,
          dbData.telephone, dbData.email
        ]);
        
        this.id = result.insertId;
        return true;
      }
    } catch (error) {
      console.error('Error saving sender:', error);
      throw error;
    }
  }

  // Static methods
  static async findAll() {
    try {
      const [rows] = await pool.execute(`
        SELECT id, name, id_passport_no, company_name, building_floor,
               street_address, estate_town, telephone, email, created_at
        FROM senders 
        ORDER BY name ASC
      `);
      
      return rows.map(row => Sender.fromDbFormat(row));
    } catch (error) {
      console.error('Error finding all senders:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT id, name, id_passport_no, company_name, building_floor,
               street_address, estate_town, telephone, email, created_at
        FROM senders 
        WHERE id = ?
      `, [id]);
      
      return rows.length > 0 ? Sender.fromDbFormat(rows[0]) : null;
    } catch (error) {
      console.error('Error finding sender by id:', error);
      throw error;
    }
  }

  static async findByNameAndPhone(name, telephone) {
    try {
      const [rows] = await pool.execute(`
        SELECT id, name, id_passport_no, company_name, building_floor,
               street_address, estate_town, telephone, email, created_at
        FROM senders 
        WHERE name = ? AND telephone = ?
      `, [name, telephone]);
      
      return rows.length > 0 ? Sender.fromDbFormat(rows[0]) : null;
    } catch (error) {
      console.error('Error finding sender by name and phone:', error);
      throw error;
    }
  }

  static async findByPhone(telephone) {
    try {
      const [rows] = await pool.execute(`
        SELECT id, name, id_passport_no, company_name, building_floor,
               street_address, estate_town, telephone, email, created_at
        FROM senders 
        WHERE telephone = ?
        ORDER BY created_at DESC
      `, [telephone]);
      
      return rows.map(row => Sender.fromDbFormat(row));
    } catch (error) {
      console.error('Error finding senders by phone:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute(`
        SELECT id, name, id_passport_no, company_name, building_floor,
               street_address, estate_town, telephone, email, created_at
        FROM senders 
        WHERE email = ?
        ORDER BY created_at DESC
      `, [email]);
      
      return rows.map(row => Sender.fromDbFormat(row));
    } catch (error) {
      console.error('Error finding senders by email:', error);
      throw error;
    }
  }

  static async search(searchTerm) {
    try {
      const searchPattern = `%${searchTerm}%`;
      const [rows] = await pool.execute(`
        SELECT id, name, id_passport_no, company_name, building_floor,
               street_address, estate_town, telephone, email, created_at
        FROM senders 
        WHERE name LIKE ? OR telephone LIKE ? OR email LIKE ? OR company_name LIKE ?
        ORDER BY name ASC
      `, [searchPattern, searchPattern, searchPattern, searchPattern]);
      
      return rows.map(row => Sender.fromDbFormat(row));
    } catch (error) {
      console.error('Error searching senders:', error);
      throw error;
    }
  }

  static async findByLocation(location) {
    try {
      const locationPattern = `%${location}%`;
      const [rows] = await pool.execute(`
        SELECT id, name, id_passport_no, company_name, building_floor,
               street_address, estate_town, telephone, email, created_at
        FROM senders 
        WHERE estate_town LIKE ? OR street_address LIKE ?
        ORDER BY name ASC
      `, [locationPattern, locationPattern]);
      
      return rows.map(row => Sender.fromDbFormat(row));
    } catch (error) {
      console.error('Error finding senders by location:', error);
      throw error;
    }
  }

  static async getSendersWithShipmentCount() {
    try {
      const [rows] = await pool.execute(`
        SELECT s.id, s.name, s.id_passport_no, s.company_name, s.building_floor,
               s.street_address, s.estate_town, s.telephone, s.email, s.created_at,
               COUNT(sh.id) as shipment_count
        FROM senders s
        LEFT JOIN shipments sh ON s.id = sh.sender_id
        GROUP BY s.id, s.name, s.id_passport_no, s.company_name, s.building_floor,
                 s.street_address, s.estate_town, s.telephone, s.email, s.created_at
        ORDER BY shipment_count DESC, s.name ASC
      `);
      
      return rows.map(row => ({
        ...Sender.fromDbFormat(row),
        shipmentCount: row.shipment_count
      }));
    } catch (error) {
      console.error('Error finding senders with shipment count:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM senders WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting sender:', error);
      throw error;
    }
  }

  // Get shipments for this sender
  async getShipments() {
    try {
      if (!this.id) return [];
      
      const [rows] = await pool.execute(`
        SELECT * FROM v_shipment_details WHERE sender_id = ?
        ORDER BY created_at DESC
      `, [this.id]);
      
      return rows;
    } catch (error) {
      console.error('Error getting sender shipments:', error);
      throw error;
    }
  }

  // Validation
  validate() {
    const errors = [];
    
    if (!this.name || this.name.trim() === '') {
      errors.push('Name is required');
    }
    
    if (!this.telephone || this.telephone.trim() === '') {
      errors.push('Telephone is required');
    }
    
    if (this.email && !this.isValidEmail(this.email)) {
      errors.push('Invalid email format');
    }
    
    if (this.telephone && !this.isValidPhone(this.telephone)) {
      errors.push('Invalid phone number format');
    }
    
    return errors;
  }

  // Helper validation methods
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone) {
    const phoneRegex = /^\+?[0-9\s\-\(\)]{7,}$/;
    return phoneRegex.test(phone);
  }
}

module.exports = Sender;