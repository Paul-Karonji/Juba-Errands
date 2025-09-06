const { pool } = require('../config/database');

const dashboardService = {
  // Get dashboard statistics
  getDashboardStats: async (filters = {}) => {
    try {
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
          COALESCE(SUM(c.total), 0) as totalRevenue,
          COALESCE(AVG(c.total), 0) as averageShipmentValue,
          COALESCE(SUM(s.weight_kg), 0) as totalWeight
        FROM shipments s
        LEFT JOIN charges c ON s.id = c.shipment_id
        WHERE 1=1 ${whereClause}
      `;

      const [rows] = await pool.execute(query, params);
      return rows[0] || {
        totalShipments: 0,
        deliveredShipments: 0,
        pendingShipments: 0,
        inTransitShipments: 0,
        cancelledShipments: 0,
        totalRevenue: 0,
        averageShipmentValue: 0,
        totalWeight: 0
      };
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      throw new Error('Failed to fetch dashboard statistics');
    }
  },

  // Get revenue summary over time
  getRevenueSummary: async (days = 30) => {
    try {
      const daysInt = parseInt(days) || 30;
      
      const query = `
        SELECT 
          DATE(s.date) as date,
          COUNT(s.id) as shipmentCount,
          COALESCE(SUM(c.total), 0) as dailyRevenue,
          COALESCE(AVG(c.total), 0) as avgShipmentValue
        FROM shipments s
        LEFT JOIN charges c ON s.id = c.shipment_id
        WHERE s.date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY DATE(s.date)
        ORDER BY date DESC
      `;

      const [rows] = await pool.execute(query, [daysInt]);
      return rows || [];
    } catch (error) {
      console.error('Error in getRevenueSummary:', error);
      throw new Error('Failed to fetch revenue summary');
    }
  },

  // Get status breakdown
  getStatusBreakdown: async () => {
    try {
      const query = `
        SELECT 
          status,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shipments)), 2) as percentage
        FROM shipments
        GROUP BY status
        ORDER BY count DESC
      `;

      const [rows] = await pool.execute(query, []);
      return rows || [];
    } catch (error) {
      console.error('Error in getStatusBreakdown:', error);
      throw new Error('Failed to fetch status breakdown');
    }
  },

  // Get recent shipments
  getRecentShipments: async (limit = 10) => {
    try {
      console.log('getRecentShipments called with limit:', limit);
      const limitInt = parseInt(limit) || 10;
      
      // First try to use the view if it exists
      try {
        console.log('Trying to use v_shipment_details view...');
        const query = `
          SELECT * FROM v_shipment_details
          ORDER BY created_at DESC
          LIMIT ?
        `;
        const [rows] = await pool.execute(query, [limitInt]);
        console.log('View query successful, found:', rows.length, 'recent shipments');
        return rows || [];
      } catch (viewError) {
        console.log('View not available, using basic query:', viewError.message);
        
        // Fallback to basic query with joins
        const query = `
          SELECT 
            s.id,
            s.waybill_no,
            s.date,
            s.sender_id,
            s.receiver_id,
            s.quantity,
            s.weight_kg,
            s.description,
            s.commercial_value,
            s.delivery_location,
            s.status,
            s.notes,
            s.receipt_reference,
            s.courier_name,
            s.staff_no,
            s.created_at,
            s.updated_at,
            sen.name as sender_name,
            COALESCE(sen.phone, sen.telephone) as sender_telephone,
            sen.email as sender_email,
            rec.name as receiver_name,
            COALESCE(rec.phone, rec.telephone) as receiver_telephone,
            rec.email as receiver_email
          FROM shipments s
          LEFT JOIN senders sen ON s.sender_id = sen.id
          LEFT JOIN receivers rec ON s.receiver_id = rec.id
          ORDER BY s.created_at DESC
          LIMIT ?
        `;
        
        const [rows] = await pool.execute(query, [limitInt]);
        console.log('Basic query successful, found:', rows.length, 'recent shipments');
        return rows || [];
      }
    } catch (error) {
      console.error('Error in getRecentShipments:', error);
      console.error('Query params:', [limit]);
      throw new Error('Failed to fetch recent shipments');
    }
  },

  // Get payment method breakdown
  getPaymentMethodBreakdown: async () => {
    try {
      const query = `
        SELECT 
          p.payment_method,
          COUNT(*) as count,
          COALESCE(SUM(p.amount_paid), 0) as totalAmount,
          COALESCE(AVG(p.amount_paid), 0) as avgAmount
        FROM payments p
        GROUP BY p.payment_method
        ORDER BY count DESC
      `;

      const [rows] = await pool.execute(query, []);
      return rows || [];
    } catch (error) {
      console.error('Error in getPaymentMethodBreakdown:', error);
      // Return empty array instead of throwing error if payments table doesn't exist
      return [];
    }
  },

  // Get top delivery locations
  getTopDeliveryLocations: async (limit = 10) => {
    try {
      const limitInt = parseInt(limit) || 10;
      
      const query = `
        SELECT 
          delivery_location,
          COUNT(*) as shipmentCount,
          COALESCE(SUM(c.total), 0) as totalRevenue
        FROM shipments s
        LEFT JOIN charges c ON s.id = c.shipment_id
        WHERE delivery_location IS NOT NULL AND delivery_location != ''
        GROUP BY delivery_location
        ORDER BY shipmentCount DESC
        LIMIT ?
      `;

      const [rows] = await pool.execute(query, [limitInt]);
      return rows || [];
    } catch (error) {
      console.error('Error in getTopDeliveryLocations:', error);
      throw new Error('Failed to fetch top delivery locations');
    }
  }
};

module.exports = dashboardService;