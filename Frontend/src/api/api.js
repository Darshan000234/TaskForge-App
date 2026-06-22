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

        if (error.response.status !== 401) {
            return Promise.reject(error);
        }

        if (originalRequest._retry) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        // 🔴 If refresh already running → wait
        if (refreshPromise) {
            return new Promise((resolve, reject) => {
                refreshQueue.push({
                    resolve: (token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(api(originalRequest));
                    },
                    reject
                });
            });
        }

        refreshPromise = axios.post(
            `${URL}/user/refresh`,
            {},
            { withCredentials: true }
        );
        console.log("REFRESH CALLED");
        try {
            const res = await refreshPromise;

            const newToken = res.data.accessToken;
            setAccessToken(newToken);

            processQueue(null, newToken);

            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);

        } catch (err) {
            processQueue(err, null);

            clearAccessToken();
            window.location.reload();

            return Promise.reject(err);

        } finally {
            refreshPromise = null;
        }
    }
);

export default api;