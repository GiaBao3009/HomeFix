import axios from 'axios';

export const getApiErrorMessage = (error, fallback = 'Có lỗi xảy ra. Vui lòng thử lại.') => {
    if (!error?.response) {
        return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend hoặc reverse proxy.';
    }

    const { data, status } = error.response;

    if ([502, 503, 504].includes(status)) {
        return 'Máy chủ đang tạm thời không phản hồi. Vui lòng thử lại sau.';
    }

    if (typeof data === 'string' && data.trim()) {
        return data;
    }

    if (data && typeof data === 'object') {
        if (typeof data.message === 'string' && data.message.trim()) {
            return data.message;
        }

        const fieldMessages = Object.entries(data)
            .filter(([key, value]) => !['timestamp', 'status', 'error', 'path'].includes(key) && typeof value === 'string' && value.trim())
            .map(([, value]) => value);

        if (fieldMessages.length > 0) {
            return fieldMessages.join(', ');
        }

        if (typeof data.error === 'string' && data.error.trim()) {
            return data.error;
        }
    }

    return error.message || fallback;
};

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

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
