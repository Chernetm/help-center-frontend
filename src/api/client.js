import axios from 'axios';
import { isTokenExpired, clearAuthData } from '../utils/authUtils';
//https://help-center-backend-4wuz.onrender.com/api
const client = axios.create({
  baseURL: 'http://localhost:8090/api', // Adjust base URL as needed
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Helper to read cookies
const getCookie = (name) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

// Add interceptors for auth token if needed
client.interceptors.request.use(
  (config) => {
    let token = null;

    // Prioritize specific tokens based on the request URL
    if (config.url?.includes('/customer')) {
      token = getCookie('customerToken') || localStorage.getItem('customerToken');
    } else if (config.url?.includes('/admin') || config.url?.includes('/agent') || config.url?.includes('/ticket')) {
      token = getCookie('adminToken') || localStorage.getItem('adminToken');
    }

    // Fallback logic
    if (!token) {
      token = getCookie('token') || localStorage.getItem('token') ||
        getCookie('adminToken') || localStorage.getItem('adminToken') ||
        getCookie('customerToken') || localStorage.getItem('customerToken');
    }

    if (token) {
      if (isTokenExpired(token)) {
        clearAuthData();
        // Optional: Redirect to login if needed, or let the 401 handle it naturally 
        // but keeping it clean prevents sending bad tokens.
        // window.location.href = '/login'; // Aggressive redirect
        return Promise.reject(new Error("Token expired"));
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401s globally
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear auth data if 401 is received (token invalid/expired)
      clearAuthData();

      // Determine where to redirect based on the URL or previous state
      // For now, we can redirect to the main login or home
      // window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default client;
