const { pool } = require('../config/database');

const dashboardService = {
  // Get dashboard statistics
  getDashboardStats: async (filters = {}) => {
    const { startDate, endDate } = filters;
    
    let whereClause = '';
    const params = [];

    if (startDate) {
      whereClause += ' AND s.date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND s.date <= ?';
      params.push(endDate);
    }

    const query = `
      SELECT 
        COUNT(s.id) as totalShipments,
        SUM(CASE WHEN s.status = 'Delivered' THEN 1 ELSE 0 END) as deliveredShipments,
        SUM(CASE WHEN s.status = 'Pending' THEN 1 ELSE 0 END) as pendingShipments,
        SUM(CASE WHEN s.status = 'In Transit' THEN 1 ELSE 0 END) as inTransitShipments,
        SUM(CASE WHEN s.status = 'Cancelled' THEN 1 ELSE 0 END) as cancelledShipments,
        SUM(c.total) as totalRevenue,
        AVG(c.total) as averageShipmentValue,
        SUM(s.weight_kg) as totalWeight
      FROM shipments s
      LEFT JOIN charges c ON s.id = c.shipment_id
      WHERE 1=1 ${whereClause}
    `;

    const [rows] = await pool.execute(query, params);
    return rows[0];
  },

  // Get revenue summary over time
  getRevenueSummary: async (days = 30) => {
    const query = `
      SELECT 
        DATE(s.date) as date,
        COUNT(s.id) as shipmentCount,
        SUM(c.total) as dailyRevenue,
        AVG(c.total) as avgShipmentValue
      FROM shipments s
      LEFT JOIN charges c ON s.id = c.shipment_id
      WHERE s.date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(s.date)
      ORDER BY date DESC
    `;

    const [rows] = await pool.execute(query, [days]);
    return rows;
  },

  // Get status breakdown
  getStatusBreakdown: async () => {
    const query = `
      SELECT 
        status,
        COUNT(*) as count,
        (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shipments)) as percentage
      FROM shipments
      GROUP BY status
    `;

    const [rows] = await pool.execute(query);
    return rows;
  },

  // Get recent shipments
  getRecentShipments: async (limit = 10) => {
    const query = `
      SELECT * FROM v_shipment_details
      ORDER BY created_at DESC
      LIMIT ?
    `;

    const [rows] = await pool.execute(query, [limit]);
    return rows;
  },

  // Get payment method breakdown
  getPaymentMethodBreakdown: async () => {
    const query = `
      SELECT 
        p.payment_method,
        COUNT(*) as count,
        SUM(p.amount_paid) as totalAmount,
        AVG(p.amount_paid) as avgAmount
      FROM payments p
      GROUP BY p.payment_method
    `;

    const [rows] = await pool.execute(query);
    return rows;
  },

  // Get top delivery locations
  getTopDeliveryLocations: async (limit = 10) => {
    const query = `
      SELECT 
        delivery_location,
        COUNT(*) as shipmentCount,
        SUM(c.total) as totalRevenue
      FROM shipments s
      LEFT JOIN charges c ON s.id = c.shipment_id
      WHERE delivery_location IS NOT NULL AND delivery_location != ''
      GROUP BY delivery_location
      ORDER BY shipmentCount DESC
      LIMIT ?
    `;

    const [rows] = await pool.execute(query, [limit]);
    return rows;
  }
};

module.exports = dashboardService;