import api from './api';
export const listSenders   = () => api.get('/senders');
export const getSender     = (id) => api.get(`/senders/${id}`);
export const createSender  = (data) => api.post('/senders', data);
export const updateSender  = (id, data) => api.put(`/senders/${id}`, data);
export const deleteSender  = (id) => api.delete(`/senders/${id}`);
