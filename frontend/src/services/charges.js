import api from './api';
export const listCharges = () => api.get('/charges');
export const getCharges = (id) => api.get(`/charges/${id}`);
export const getChargesByShipment = (shipmentId) => api.get(`/charges/shipment/${shipmentId}`);
export const createCharges = (data) => api.post('/charges', data);
export const updateCharges = (id, data) => api.put(`/charges/${id}`, data);
export const deleteCharges = (id) => api.delete(`/charges/${id}`);