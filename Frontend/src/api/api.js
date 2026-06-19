import axios from 'axios';
import {
    getAccessToken,
    setAccessToken,
    clearAccessToken
} from '../utils/authStore';

const URL = import.meta.env.VITE_URL;

const api = axios.create({
    baseURL: URL,
    withCredentials: true
});

api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;

        if (!error.response || !originalRequest) {
            return Promise.reject(error);
        }

        if (originalRequest._retry) {
            return Promise.reject(error);
        }

        if (error.response.status === 401) {
            originalRequest._retry = true;

            try {
                const res = await axios.post(
                    `${URL}/user/refresh`,
                    {},
                    { withCredentials: true }
                );
                console.log(res);
                
                const newAccessToken = res.data.accessToken;
                setAccessToken(newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                
                return api(originalRequest);

            } catch (refreshError) {
                clearAccessToken();
                window.location.reload();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;