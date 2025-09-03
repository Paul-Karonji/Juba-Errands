import api from './api';

export const listShipments  = (params = {}) => api.get('/shipments', { params });
export const getShipment    = (id) => api.get(`/shipments/${id}`);
export const getByWaybill   = (waybillNo) => api.get(`/shipments/waybill/${waybillNo}`);
export const createShipment = (data) => api.post('/shipments', data);
export const updateShipment = (id, data) => api.put(`/shipments/${id}`, data);
export const deleteShipment = (id) => api.delete(`/shipments/${id}`);
