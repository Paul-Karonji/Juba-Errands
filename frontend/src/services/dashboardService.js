import api from './api';

export const dashboardService = {
  // Get dashboard statistics
  getStatistics: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/dashboard/statistics?${params.toString()}`);
    return response.data;
  },

  // Get revenue summary
  getRevenueSummary: async (days = 30) => {
    const response = await api.get(`/dashboard/revenue?period=${days}`);
    return response.data;
  },

  // Get status breakdown
  getStatusBreakdown: async () => {
    const response = await api.get('/dashboard/status-breakdown');
    return response.data;
  },

  // Get recent shipments
  getRecentShipments: async (limit = 10) => {
    const response = await api.get(`/dashboard/recent-shipments?limit=${limit}`);
    return response.data;
  }
};