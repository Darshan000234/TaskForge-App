import axios from 'axios';
import {
    getAccessToken,
    setAccessToken,
    clearAccessToken
} from '../utils/authStore';
import toast from 'react-hot-toast';
const URL = import.meta.env.VITE_URL;

const api = axios.create({
    baseURL: URL,
    withCredentials: true
});

// 🔴 ONLY THIS (no isRefreshing)
let refreshPromise = null;
let refreshQueue = [];

const processQueue = (error, token = null) => {
    refreshQueue.forEach(p => {
        if (error) {
            p.reject(error);
        } else {
            p.resolve(token);
        }
    });
    refreshQueue = [];
};

api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        // console.log(token);
        
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

        if (error.response.status === 429) {
            const retryAfter = error.response.headers["retry-after"];

            toast.error(
                retryAfter
                    ? `Too many requests. Please try again in ${retryAfter} seconds.`
                    : "Too many requests. Please wait a moment and try again.",
                {
                    id: "rate-limit-toast",
                }
            );

            return Promise.reject(error);
        }

        if (error.response.status !== 401) {
            return Promise.reject(error);
        }

        if (originalRequest._retry) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (refreshPromise) {
            return new Promise((resolve, reject) => {
                refreshQueue.push({
                    resolve: (token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(api(originalRequest));
                    },
                    reject,
                });
            });
        }

        refreshPromise = axios.post(
            `${URL}/user/refresh`,
            {},
            { withCredentials: true }
        );

        try {
            const res = await refreshPromise;

            const newToken = res.data.accessToken;
            // console.log(res);
            
            setAccessToken(newToken);
            processQueue(null, newToken);

            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            return api(originalRequest);

        } catch (err) {
            processQueue(err, null);

            clearAccessToken();
            window.location.href = "/Signup_login";

            return Promise.reject(err);

        } finally {
            refreshPromise = null;
        }
    }
);

export default api;