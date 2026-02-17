/**
 * API Configuration
 * Centralized configuration for API base URLs
 * 
 * Usage:
 *   import { API_BASE_URL, API_BASE_URL_V1 } from '@/configs/api';
 * 
 * Environment-based configuration:
 *   - Development: http://localhost:5000
 *   - Production: Set via environment variable or update this file
 */

// Get API base URL from environment variable or use default
const getApiBaseUrl = () => {
  // Check for environment variable (useful for production builds)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // When accessing from another device, use the current hostname instead of localhost
  // This allows the frontend to connect to the backend when accessed via IP address
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If accessing via IP address or non-localhost hostname, use that for API
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:5000`;
    }
  }
  
  // Default to localhost for development
  return 'http://localhost:5000';
};

// Base API URL (without version)
export const API_BASE_URL = getApiBaseUrl();

// API URL with version 1
export const API_BASE_URL_V1 = `${API_BASE_URL}/api/v1`;

// Helper function to get full file URL
export const getFileUrl = (filePath) => {
  if (!filePath) return null;
  
  // If filePath already includes http:// or https://, return as is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // Otherwise, prepend the base URL
  return `${API_BASE_URL}${filePath}`;
};

// Helper function to get upload file URL
export const getUploadUrl = (category, fileName) => {
  if (!fileName) return null;
  return `${API_BASE_URL}/uploads/${category}/${fileName}`;
};

