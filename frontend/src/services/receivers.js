import api from './api';
export const listReceivers = () => api.get('/receivers');
export const getReceiver = (id) => api.get(`/receivers/${id}`);
export const createReceiver = (data) => api.post('/receivers', data);
export const updateReceiver = (id, data) => api.put(`/receivers/${id}`, data);
export const deleteReceiver = (id) => api.delete(`/receivers/${id}`);