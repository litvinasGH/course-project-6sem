import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

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
