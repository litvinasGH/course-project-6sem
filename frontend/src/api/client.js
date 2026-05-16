import axios from 'axios';
import { logger } from '../utils/logger';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const config = error.config || {};
    const status = error.response?.status;
    const message = getApiError(error);

    logger.error('api_request_failed', {
      method: config.method?.toUpperCase(),
      url: config.url,
      status,
      message,
    });

    if (status === 401) {
      window.dispatchEvent(new Event('auth:expired'));
    }

    return Promise.reject(error);
  },
);

export function getApiError(error) {
  const response = error.response?.data;

  if (!response) {
    return 'Network error. Check backend availability.';
  }

  if (response.details?.length) {
    return `${response.error}: ${response.details.join(', ')}`;
  }

  return response.error || 'Request failed.';
}

export default api;
