import api from './api';

export const shipmentService = {
  // Get all shipments with filters
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    
    return await api.get(`/shipments?${params.toString()}`);
  },

  // Get shipment by ID
  getById: async (id) => {
    return await api.get(`/shipments/${id}`);
  },

  // Get shipment by waybill number
  getByWaybill: async (waybillNo) => {
    return await api.get(`/shipments/waybill/${waybillNo}`);
  },

  // Create new shipment
  create: async (shipmentData) => {
    return await api.post('/shipments', shipmentData);
  },

  // Update shipment
  update: async (id, updates) => {
    return await api.put(`/shipments/${id}`, updates);
  },

  // Delete shipment
  delete: async (id) => {
    return await api.delete(`/shipments/${id}`);
  }
};