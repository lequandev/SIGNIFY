import axios from 'axios';

const DEFAULT_API_URL = 'http://localhost:8080/api';
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const rawApiUrl = (configuredApiUrl || DEFAULT_API_URL).replace(/\/+$/, '');
export const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
