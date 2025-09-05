// models/Staff.js
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class Staff {
  constructor(data = {}) {
    this.id = data.id || null;
    this.staffNo = data.staffNo || null;
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.email = data.email || '';
    this.phoneNumber = data.phoneNumber || '';
    this.role = data.role || 'staff';
    this.department = data.department || null;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.passwordHash = data.passwordHash || null;
    this.lastLogin = data.lastLogin || null;
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  // Available roles
  static get ROLES() {
    return ['admin', 'manager', 'staff', 'courier'];
  }

  // Available departments
  static get DEPARTMENTS() {
    return ['Operations', 'Customer Service', 'Finance', 'Administration', 'Logistics'];
  }

  // Get full name
  getFullName() {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  // Convert to database format (camelCase to snake_case)
  toDbFormat() {
    return {
      staff_no: this.staffNo,
      first_name: this.firstName,
      last_name: this.lastName,
      email: this.email,
      phone_number: this.phoneNumber,
      role: this.role,
      department: this.department,
      is_active: this.isActive,
      password_hash: this.passwordHash,
      last_login: this.lastLogin
    };
  }

  // Convert from database format (snake_case to camelCase)
  static fromDbFormat(row) {
    return new Staff({
      id: row.id,
      staffNo: row.staff_no,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phoneNumber: row.phone_number,
      role: row.role,
      department: row.department,
      isActive: row.is_active,
      passwordHash: row.password_hash,
      lastLogin: row.last_login,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  // Hash password
  async hashPassword(password) {
    const saltRounds = 12;
    this.passwordHash = await bcrypt.hash(password, saltRounds);
    return this.passwordHash;
  }

  // Verify password
  async verifyPassword(password) {
    if (!this.passwordHash) return false;
    return await bcrypt.compare(password, this.passwordHash);
  }

  // Generate staff number
  static async generateStaffNo() {
    try {
      const [rows] = await pool.execute(`
        SELECT COALESCE(MAX(CAST(SUBSTRING(staff_no, 4) AS UNSIGNED)), 1000) + 1 as next_number
        FROM staff 
        WHERE staff_no REGEXP '^STF[0-9]+$'
      `);

      return `STF${rows[0].next_number}`;
    } catch (error) {
      console.error('Error generating staff number:', error);
      return `STF${Date.now().toString().slice(-6)}`;
    }
  }

  // Basic validation (throws on error)
  validate() {
    if (!this.firstName?.trim()) throw new Error('First name is required');
    if (!this.lastName?.trim()) throw new Error('Last name is required');
    if (!this.email?.trim()) throw new Error('Email is required');
    if (!Staff.ROLES.includes(this.role)) throw new Error('Invalid role');
    if (this.department && !Staff.DEPARTMENTS.includes(this.department)) {
      throw new Error('Invalid department');
    }
  }

  // Save staff to database
  async save() {
    try {
      await this.createTableIfNotExists();
      this.validate();

      const dbData = this.toDbFormat();

      if (this.id) {
        // Update existing staff
        const [result] = await pool.execute(
          `
          UPDATE staff 
             SET staff_no = ?, first_name = ?, last_name = ?, email = ?, 
                 phone_number = ?, role = ?, department = ?, is_active = ?,
                 password_hash = ?, last_login = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?
        `,
          [
            dbData.staff_no,
            dbData.first_name,
            dbData.last_name,
            dbData.email,
            dbData.phone_number,
            dbData.role,
            dbData.department,
            dbData.is_active,
            dbData.password_hash,
            dbData.last_login,
            this.id
          ]
        );

        return result.affectedRows > 0;
      } else {
        // Generate staff number if not provided
        if (!this.staffNo) {
          this.staffNo = await Staff.generateStaffNo();
        }

        // Create new staff
        const [result] = await pool.execute(
          `
          INSERT INTO staff (staff_no, first_name, last_name, email, phone_number,
                             role, department, is_active, password_hash, last_login)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            this.staffNo,
            dbData.first_name,
            dbData.last_name,
            dbData.email,
            dbData.phone_number,
            dbData.role,
            dbData.department,
            dbData.is_active,
            dbData.password_hash,
            dbData.last_login
          ]
        );

        this.id = result.insertId;
        return true;
      }
    } catch (error) {
      // MySQL duplicate key errors
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('email')) {
          error = new Error('Email already in use');
        } else if (error.message.includes('staff_no')) {
          error = new Error('Staff number already exists');
        }
      }
      console.error('Error saving staff:', error);
      throw error;
    }
  }

  // Create staff table if it doesn't exist
  async createTableIfNotExists() {
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS staff (
          id INT PRIMARY KEY AUTO_INCREMENT,
          staff_no VARCHAR(20) UNIQUE NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone_number VARCHAR(20),
          role ENUM('admin', 'manager', 'staff', 'courier') DEFAULT 'staff',
          department VARCHAR(100),
          is_active BOOLEAN DEFAULT TRUE,
          password_hash VARCHAR(255),
          last_login TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_staff_no (staff_no),
          INDEX idx_email (email),
          INDEX idx_role (role),
          INDEX idx_active (is_active)
        )
      `);
    } catch (error) {
      console.error('Error creating staff table:', error);
      throw error;
    }
  }

  // -------- Static helpers / queries --------

  static async findById(id) {
    const [rows] = await pool.execute(`SELECT * FROM staff WHERE id = ? LIMIT 1`, [id]);
    if (!rows.length) return null;
    return Staff.fromDbFormat(rows[0]);
    }

  static async findByEmail(email) {
    const [rows] = await pool.execute(`SELECT * FROM staff WHERE email = ? LIMIT 1`, [email]);
    if (!rows.length) return null;
    return Staff.fromDbFormat(rows[0]);
  }

  static async findByStaffNo(staffNo) {
    const [rows] = await pool.execute(`SELECT * FROM staff WHERE staff_no = ? LIMIT 1`, [staffNo]);
    if (!rows.length) return null;
    return Staff.fromDbFormat(rows[0]);
  }

  static async emailExists(email) {
    const [rows] = await pool.execute(`SELECT 1 FROM staff WHERE email = ? LIMIT 1`, [email]);
    return rows.length > 0;
  }

  static async staffNoExists(staffNo) {
    const [rows] = await pool.execute(`SELECT 1 FROM staff WHERE staff_no = ? LIMIT 1`, [staffNo]);
    return rows.length > 0;
  }

  // Authenticate and update last_login
  static async authenticate(email, password) {
    const staff = await Staff.findByEmail(email);
    if (!staff) return null;
    if (!staff.isActive) return null;

    const ok = await staff.verifyPassword(password);
    if (!ok) return null;

    await pool.execute(`UPDATE staff SET last_login = CURRENT_TIMESTAMP WHERE id = ?`, [staff.id]);
    staff.lastLogin = new Date();
    return staff;
  }

  // Update password (hashes internally)
  static async updatePassword(id, newPassword) {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    const [result] = await pool.execute(
      `UPDATE staff SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [passwordHash, id]
    );
    return result.affectedRows > 0;
  }

  // Activate / Deactivate
  static async setActive(id, isActive) {
    const [result] = await pool.execute(
      `UPDATE staff SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [isActive ? 1 : 0, id]
    );
    return result.affectedRows > 0;
  }

  async deactivate() {
    if (!this.id) throw new Error('Cannot deactivate unsaved staff');
    const ok = await Staff.setActive(this.id, false);
    if (ok) this.isActive = false;
    return ok;
  }

  async activate() {
    if (!this.id) throw new Error('Cannot activate unsaved staff');
    const ok = await Staff.setActive(this.id, true);
    if (ok) this.isActive = true;
    return ok;
  }

  // Delete (hard delete)
  static async deleteById(id) {
    const [result] = await pool.execute(`DELETE FROM staff WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  // Paginated list / search
  static async list({
    page = 1,
    pageSize = 20,
    search = '',
    role = null,
    department = null,
    isActive = null,
    orderBy = 'created_at',
    order = 'DESC'
  } = {}) {
    const validOrderBy = new Set([
      'created_at',
      'updated_at',
      'first_name',
      'last_name',
      'email',
      'role',
      'department',
      'is_active',
      'staff_no'
    ]);
    if (!validOrderBy.has(orderBy)) orderBy = 'created_at';
    order = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const where = [];
    const params = [];

    if (search) {
      where.push(`(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR staff_no LIKE ?)`);
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (role) {
      where.push(`role = ?`);
      params.push(role);
    }
    if (department) {
      where.push(`department = ?`);
      params.push(department);
    }
    if (isActive !== null && isActive !== undefined) {
      where.push(`is_active = ?`);
      params.push(isActive ? 1 : 0);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (page - 1) * pageSize;

    const [rows] = await pool.execute(
      `
      SELECT SQL_CALC_FOUND_ROWS *
        FROM staff
        ${whereSql}
       ORDER BY ${orderBy} ${order}
       LIMIT ? OFFSET ?
    `,
      [...params, pageSize, offset]
    );
    const [countRows] = await pool.execute(`SELECT FOUND_ROWS() AS total`);
    const total = countRows[0].total;

    return {
      data: rows.map(Staff.fromDbFormat),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    };
  }
}

module.exports = Staff;
