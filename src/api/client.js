import axios from 'axios';
import { isTokenExpired, clearAuthData } from '../utils/authUtils';
//https://help-center-backend-4wuz.onrender.com/api
//https://help-center-backend-1.onrender.com/api
const client = axios.create({
  baseURL: 'https://help-center-backend-1.onrender.com/api', // Adjust base URL as needed
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
    const url = config.url || '';

    // Check for Admin/Agent routes first to avoid overlap (e.g., /admin/customers)
    const isAdminRequest = url.includes('/admin') || url.includes('/agent') || url.includes('/ticket');
    const isCustomerRequest = !isAdminRequest && (url.includes('/customer') || url.startsWith('customer/'));

    if (isAdminRequest) {
      token = getCookie('adminToken') || localStorage.getItem('adminToken');
    } else if (isCustomerRequest) {
      token = getCookie('customerToken') || localStorage.getItem('customerToken');
    }

    // Fallback logic - only if no specific token was found above
    if (!token) {
      if (isCustomerRequest) {
        // We already tried customer tokens, maybe generic 'token' exists?
        token = getCookie('token') || localStorage.getItem('token');
      } else if (isAdminRequest) {
        token = getCookie('token') || localStorage.getItem('token');
      } else {
        // Truly generic request
        token = getCookie('token') || localStorage.getItem('token') ||
          getCookie('adminToken') || localStorage.getItem('adminToken') ||
          getCookie('customerToken') || localStorage.getItem('customerToken');
      }
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

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle 401s and token refresh
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return client(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const isAdmin = originalRequest.url.includes('/admin') || originalRequest.url.includes('/agent') || originalRequest.url.includes('/ticket');
      const refreshToken = isAdmin
        ? (getCookie('adminRefreshToken') || localStorage.getItem('adminRefreshToken'))
        : (getCookie('customerRefreshToken') || localStorage.getItem('customerRefreshToken'));

      if (refreshToken) {
        try {
          const refreshUrl = isAdmin ? '/auth/admin/refresh' : '/auth/customer/refresh';
          // Use axios directly to avoid interceptors loop
          const response = await axios.post(`${client.defaults.baseURL}${refreshUrl}`, { refreshToken });

          const { token: newToken, refreshToken: newRefreshToken, expiresIn } = response.data;

          // Update storage
          if (isAdmin) {
            localStorage.setItem('adminToken', newToken);
            localStorage.setItem('adminRefreshToken', newRefreshToken);
            document.cookie = `adminToken=${newToken}; max-age=${expiresIn}; path=/`;
            document.cookie = `adminRefreshToken=${newRefreshToken}; max-age=${3600 * 24 * 30}; path=/`;
          } else {
            localStorage.setItem('customerToken', newToken);
            localStorage.setItem('customerRefreshToken', newRefreshToken);
            document.cookie = `customerToken=${newToken}; max-age=${expiresIn}; path=/`;
            document.cookie = `customerRefreshToken=${newRefreshToken}; max-age=${3600 * 24 * 30}; path=/`;
          }

          processQueue(null, newToken);
          isRefreshing = false;

          originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
          return client(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;
          clearAuthData();
          // Optionally redirect to login
          // window.location.href = isAdmin ? '/admin/login' : '/login';
          return Promise.reject(refreshError);
        }
      } else {
        clearAuthData();
      }
    }
    return Promise.reject(error);
  }
);

export default client;
