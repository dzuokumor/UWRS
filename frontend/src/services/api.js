import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
  }
});

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    } else if (typeof config.data === 'object') {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  error => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    if (!error.response) {
      if (error.message === 'Network Error') {
        error.message = 'Unable to connect to server. Please check your network connection.';
      } else if (error.code === 'ECONNABORTED') {
        error.message = 'Request timeout. Please try again.';
      }
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    switch (status) {
      case 400:
        error.message = data.message || 'Invalid request data. Please check your input.';
        break;
      case 401:
        error.message = data.message || 'Session expired. Please log in again.';
        localStorage.removeItem('token');
        if (!window.location.pathname.includes('/login')) {
          window.location = '/login';
        }
        break;
      case 403:
        error.message = data.message || 'You do not have permission for this action.';
        break;
      case 404:
        error.message = data.message || 'The requested resource was not found.';
        break;
      case 413:
        error.message = data.message || 'File size too large. Please upload a smaller file.';
        break;
      case 500:
        error.message = data.message || 'Internal server error. Please try again later.';
        break;
      default:
        error.message = data.message || `Request failed with status ${status}`;
    }

    if (status >= 500) {
      console.error('Server error:', error.response);
    }

    return Promise.reject(error);
  }
);

export default api;