const dashboardService = require('../services/dashboardService');

const dashboardController = {
  // Get dashboard statistics
  getStatistics: async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      
      const stats = await dashboardService.getDashboardStats({
        startDate,
        endDate
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  },

  // Get revenue summary
  getRevenueSummary: async (req, res, next) => {
    try {
      const { period = '30' } = req.query; // Default to 30 days
      
      const revenue = await dashboardService.getRevenueSummary(parseInt(period));

      res.json({
        success: true,
        data: revenue
      });
    } catch (error) {
      next(error);
    }
  },

  // Get shipment status breakdown
  getStatusBreakdown: async (req, res, next) => {
    try {
      const breakdown = await dashboardService.getStatusBreakdown();

      res.json({
        success: true,
        data: breakdown
      });
    } catch (error) {
      next(error);
    }
  },

  // Get recent shipments
  getRecentShipments: async (req, res, next) => {
    try {
      const { limit = 10 } = req.query;
      
      const shipments = await dashboardService.getRecentShipments(parseInt(limit));

      res.json({
        success: true,
        data: shipments
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = dashboardController;