import { API_BASE_URL_V1 } from '@/configs/api';

/**
 * Get the JWT token from localStorage
 * @returns {string|null} The JWT token or null if not found
 */
export const getAuthToken = () => {
  try {
    const sessionData = localStorage.getItem('auth_session');
    if (sessionData) {
      const { token } = JSON.parse(sessionData);
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Make an authenticated API request
 * @param {string} url - The API endpoint URL (can be relative or absolute)
 * @param {RequestInit} options - Fetch options (method, body, etc.)
 * @returns {Promise<Response>} The fetch response
 */
export const authenticatedFetch = async (url, options = {}) => {
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

/**
 * Helper function to build API URL with version 1
 * @param {string} endpoint - The API endpoint (e.g., '/donors', '/merchants')
 * @returns {string} Full API URL
 */
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL_V1}/${cleanEndpoint}`;
};

