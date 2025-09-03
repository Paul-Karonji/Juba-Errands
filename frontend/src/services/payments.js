import api from './api';
export const listPayments = () => api.get('/payments');
export const getPayment = (id) => api.get(`/payments/${id}`);
export const getPaymentsByShipment = (shipmentId) => api.get(`/payments/shipment/${shipmentId}`);
export const createPayment = (data) => api.post('/payments', data);
export const updatePayment = (id, data) => api.put(`/payments/${id}`, data);
export const deletePayment = (id) => api.delete(`/payments/${id}`);