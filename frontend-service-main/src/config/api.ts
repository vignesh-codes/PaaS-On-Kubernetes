// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    REGISTER: `${AUTH_BASE_URL}/v2/auth/register`,
    LOGIN: `${AUTH_BASE_URL}/v1/auth/login`,
    LOGOUT: `${AUTH_BASE_URL}/v1/auth/logout`,
  },
  
  // Deployment endpoints
  DEPLOYMENTS: {
    BASE: `${API_BASE_URL}/v1/deployments/`,
    TENANT: `${API_BASE_URL}/v1/deployments/tenant/`,
    BY_NAME: (name: string) => `${API_BASE_URL}/v1/deployments/${name}`,
  },
  
  // Build/Scout endpoints
  BUILD: {
    SCOUT: `${API_BASE_URL}/v1/build/scout/`,
  },
};

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  AUTH_URL: AUTH_BASE_URL,
  HEADERS: {
    'Content-Type': 'application/json',
    'Origin': window.location.origin,
  },
};
