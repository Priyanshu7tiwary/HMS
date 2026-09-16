import { create } from 'zustand';
import api from '@/lib/api';

const useAuthStore = create((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true, // Initial loading state
    error: null,

    // Initialize auth state from local storage on mount
    initialize: () => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');

            if (token && userStr) {
                try {
                    const user = JSON.parse(userStr);
                    set({ token, user, isAuthenticated: true, isLoading: false });
                } catch (e) {
                    console.error("Failed to parse user from local storage", e);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
                }
            } else {
                set({ token: null, user: null, isAuthenticated: false, isLoading: false });
            }
        } else {
            set({ isLoading: false });
        }
    },

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/login', { email, password });
            const { user, token } = response.data.data; // Adjust based on actual API response structure

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            set({ user, token, isAuthenticated: true, isLoading: false });
            return true;
        } catch (error) {
            const msg = error.response?.data?.message || 'Login failed';
            set({ error: msg, isLoading: false });
            return false;
        }
    },

    register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
            await api.post('/auth', { name, email, password });
            set({ isLoading: false });
            return true; // Registration successful
        } catch (error) {
            const msg = error.response?.data?.message || 'Registration failed';
            set({ error: msg, isLoading: false });
            return false;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
    },
}));

export default useAuthStore;
