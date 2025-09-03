const { pool } = require('../config/database');

const helpers = {
  // Generate next waybill number
  generateWaybillNumber: async () => {
    try {
      const [rows] = await pool.execute(`
        SELECT COALESCE(MAX(CAST(waybill_no AS UNSIGNED)), 10000) + 1 as next_number
        FROM shipments 
        WHERE waybill_no REGEXP '^[0-9]+
      `);
      
      return rows[0].next_number.toString();
    } catch (error) {
      // Fallback to timestamp-based number
      return Date.now().toString().slice(-8);
    }
  },

  // Format currency
  formatCurrency: (amount, currency = 'KES') => {
    return `${currency} ${parseFloat(amount).toLocaleString()}`;
  },

  // Calculate charges total
  calculateTotal: (charges) => {
    const { baseCharge = 0, other = 0, insurance = 0, extraDelivery = 0, vat = 0 } = charges;
    return parseFloat(baseCharge) + parseFloat(other) + parseFloat(insurance) + 
           parseFloat(extraDelivery) + parseFloat(vat);
  },

  // Validate email
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate phone number
  isValidPhone: (phone) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  },

  // Generate pagination info
  getPagination: (page, size, total) => {
    const limit = size ? +size : 10;
    const offset = page ? page * limit : 0;
    const totalPages = Math.ceil(total / limit);

    return {
      currentPage: page ? +page : 0,
      pageSize: limit,
      totalItems: total,
      totalPages,
      hasNext: page < totalPages - 1,
      hasPrev: page > 0
    };
  }
};

module.exports = helpers;