/**
 * Unified Session Storage Helper
 * Checks sessionStorage first (per-tab session), then falls back to localStorage
 * so users can log in as different accounts across different browser tabs if desired.
 */

export const getSessionStorageItem = (key) => {
  try {
    const sessionVal = sessionStorage.getItem(key);
    if (sessionVal) return sessionVal;
    return localStorage.getItem(key);
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return null;
  }
};

export const setSessionStorageItem = (key, value, persistInLocalStorage = false) => {
  try {
    sessionStorage.setItem(key, value);
    if (persistInLocalStorage) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
};

export const removeSessionStorageItem = (key) => {
  try {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  } catch (err) {
    console.error(`Error removing ${key} from storage:`, err);
  }
};

export const getAuthToken = () => {
  try {
    const sessionData = getSessionStorageItem('auth_session');
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      return parsed.token || null;
    }
    return null;
  } catch (err) {
    console.error('Error getting auth token:', err);
    return null;
  }
};
