import axios from 'axios';

const client = axios.create({
  baseURL: 'https://help-center-backend-4wuz.onrender.com/api', // Adjust base URL as needed
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
    }

    // Fallback logic: check generic 'token', then specific tokens if not yet found
    if (!token) {
      token = getCookie('token') || localStorage.getItem('token') || getCookie('customerToken') || localStorage.getItem('customerToken');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default client;
