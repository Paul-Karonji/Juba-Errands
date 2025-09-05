const { pool } = require('../config/database');

class Receiver {
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
    return new Receiver({
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

  // Save receiver to database
  async save() {
    try {
      const dbData = this.toDbFormat();
      
      if (this.id) {
        // Update existing receiver
        const [result] = await pool.execute(`
          UPDATE receivers 
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
        // Create new receiver
        const [result] = await pool.execute(`
          INSERT INTO receivers (name, id_passport_no, company_name, building_floor,
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
      console.error('Error saving receiver:', error);
      throw error;
    }
  }

  // Static methods
  static async findAll() {
    try {
      const [rows] = await pool.execute(`
        SELECT id, name, id_passport_no, company_name, building_floor,
               street_address, estate_town, telephone, email, created_at
        FROM receivers 
        ORDER BY name ASC
      `);
      
      return rows.map(row => Receiver.fromDbFormat(row));
    } catch (error) {
      console.error('Error finding all receivers:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT id, name, id_passport_no, company_name, building_floor,
               street_address, estate_town, telephone, email, created_at
        FROM receivers 
        WHERE id = ?
      `, [id]);
      
      return rows.length > 0 ? Receiver.fromDbFormat(rows[0]) : null;
    } catch (error) {
      console.error('Error finding receiver by id:', error);
      throw error;
    }
  }

  static async findByNameAndPhone(name, telephone) {
    try {
      const [rows] = await pool.execute(`
        SELECT id, name, id_passport_no, company_name, building_floor,
               street_address, estate_town, telephone, email, created_at
        FROM receivers 
        WHERE name = ? AND telephone = ?
      `, [name, telephone]);
      
      return rows.length > 0 ? Receiver.fromDbFormat(rows[0]) : null;
    } catch (error) {
      console.error('Error finding receiver by name and phone:', error);
      throw error;
    }
  }

  static async findByPhone(telephone) {
    try {
      const [rows] = await pool.execute(`
        SELECT id, name, id_passport_no, company_name, building_floor,
               street_address, estate_town, telephone, email, created_at
        FROM receivers 
        WHERE telephone = ?
        ORDER BY created_at DESC
      `, [telephone]);
      
      return rows.map(row => Receiver.fromDbFormat(row));
    } catch (error) {
      console.error('Error finding receivers by phone:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute(`
        SELECT id, name, id_passport_no, company_name, building_floor,
               street_address, estate_town, telephone, email, created_at
        FROM receivers 
        WHERE email = ?
        ORDER BY created_at DESC
      `, [email]);
      
      return rows.map(row => Receiver.fromDbFormat(row));
    } catch (error) {
      console.error('Error finding receivers by email:', error);
      throw error;
    }
  }

  static async search(searchTerm) {
    try {
      const searchPattern = `%${searchTerm}%`;
      const [rows] = await pool.execute(`
        SELECT id, name, id_passport_no, company_name, building_floor,
               street_address, estate_town, telephone, email, created_at
        FROM receivers 
        WHERE name LIKE ? OR telephone LIKE ? OR email LIKE ? OR company_name LIKE ?
        ORDER BY name ASC
      `, [searchPattern, searchPattern, searchPattern, searchPattern]);
      
      return rows.map(row => Receiver.fromDbFormat(row));
    } catch (error) {
      console.error('Error searching receivers:', error);
      throw error;
    }
  }

  static async findByLocation(location) {
    try {
      const locationPattern = `%${location}%`;
      const [rows] = await pool.execute(`
        SELECT id, name, id_passport_no, company_name, building_floor,
               street_address, estate_town, telephone, email, created_at
        FROM receivers 
        WHERE estate_town LIKE ? OR street_address LIKE ?
        ORDER BY name ASC
      `, [locationPattern, locationPattern]);
      
      return rows.map(row => Receiver.fromDbFormat(row));
    } catch (error) {
      console.error('Error finding receivers by location:', error);
      throw error;
    }
  }

  static async getReceiversWithShipmentCount() {
    try {
      const [rows] = await pool.execute(`
        SELECT r.id, r.name, r.id_passport_no, r.company_name, r.building_floor,
               r.street_address, r.estate_town, r.telephone, r.email, r.created_at,
               COUNT(s.id) as shipment_count
        FROM receivers r
        LEFT JOIN shipments s ON r.id = s.receiver_id
        GROUP BY r.id, r.name, r.id_passport_no, r.company_name, r.building_floor,
                 r.street_address, r.estate_town, r.telephone, r.email, r.created_at
        ORDER BY shipment_count DESC, r.name ASC
      `);
      
      return rows.map(row => ({
        ...Receiver.fromDbFormat(row),
        shipmentCount: row.shipment_count
      }));
    } catch (error) {
      console.error('Error finding receivers with shipment count:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM receivers WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting receiver:', error);
      throw error;
    }
  }

  // Get shipments for this receiver
  async getShipments() {
    try {
      if (!this.id) return [];
      
      const [rows] = await pool.execute(`
        SELECT * FROM v_shipment_details WHERE receiver_id = ?
        ORDER BY created_at DESC
      `, [this.id]);
      
      return rows;
    } catch (error) {
      console.error('Error getting receiver shipments:', error);
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

module.exports = Receiver;