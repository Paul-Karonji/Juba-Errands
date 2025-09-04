import axios from 'axios';

// Remove the full URL since you're using proxy
const API_BASE_URL = '/api'; // Changed from 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) localStorage.removeItem('token');
    return Promise.reject(error);
  }
);

export default api;