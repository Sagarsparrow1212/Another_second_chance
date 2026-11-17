/**
 * Per-Tab Session Storage Helper
 * Strictly stores and reads auth sessions from sessionStorage so that each
 * browser tab is completely isolated and users can log into different accounts
 * simultaneously in different tabs.
 */

export const getSessionStorageItem = (key) => {
  try {
    return sessionStorage.getItem(key);
  } catch (err) {
    console.error(`Error reading ${key} from sessionStorage:`, err);
    return null;
  }
};

export const setSessionStorageItem = (key, value) => {
  try {
    sessionStorage.setItem(key, value);
    // Remove from localStorage to prevent cross-tab bleeding
    try {
      localStorage.removeItem(key);
    } catch {}
  } catch (err) {
    console.error(`Error writing ${key} to sessionStorage:`, err);
  }
};

export const removeSessionStorageItem = (key) => {
  try {
    sessionStorage.removeItem(key);
    try {
      localStorage.removeItem(key);
    } catch {}
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
