import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000',
  timeout: 5000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      if (error.response.status === 401) {
        console.error("Unauthorized access, please log in again.");
      } else if (error.response.status === 500) {
        console.error("Server error, please try again later.");
      }
    } else if (error.message === 'Network Error') {
      throw new Error('Backend server is not running');
    }
    throw error;
  }
);

export default api;