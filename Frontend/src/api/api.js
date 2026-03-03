import axios from 'axios';

const URL = import.meta.env.VITE_URL;

const api = axios.create({
    baseURL : URL,
    withCredentials: true
});

api.interceptors.request.use((config) => {
    const token  = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;