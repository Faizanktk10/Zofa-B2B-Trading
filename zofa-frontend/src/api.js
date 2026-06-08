import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL
  || (import.meta.env.DEV ? '/api' : 'https://api.zofa.pk/api');

const api = axios.create({
    baseURL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
