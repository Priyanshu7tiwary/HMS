import axios from 'axios';

// Create an Axios instance
const api = axios.create({
    baseURL: 'http://localhost:5000/api/v1', // Should be an environment variable
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to inject the JWT token
api.interceptors.request.use(
    (config) => {
        // We'll rely on localStorage or cookies for token storage.
        // For simplicity in this implementation, let's use localStorage.
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Logic to handle unauthorized access (e.g., redirect to login)
            // For now, we just reject the error, components will handle redirects
            if (typeof window !== 'undefined') {
                // Optional: Clear token if it's invalid
                // localStorage.removeItem('token');
                // window.location.href = '/login'; 
            }
        }
        return Promise.reject(error);
    }
);

export default api;
