// Token management utilities for handling JWT tokens and refresh logic

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// CSRF token management
let csrfToken = null;

// Fetch CSRF token from server
export const fetchCsrfToken = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/csrf-token`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      csrfToken = data.csrfToken;
      return csrfToken;
    } else {
      throw new Error('Failed to fetch CSRF token');
    }
  } catch (error) {
    console.error('CSRF token fetch error:', error);
    throw error;
  }
};

// Get current CSRF token (fetch if not available)
export const getCsrfToken = async () => {
  if (!csrfToken) {
    await fetchCsrfToken();
  }
  return csrfToken;
};

// Clear CSRF token (useful on logout or token refresh)
export const clearCsrfToken = () => {
  csrfToken = null;
};

// Check if access token is expired or about to expire
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    // Consider token expired if it expires within the next 5 minutes
    return payload.exp < (currentTime + 300);
  } catch (error) {
    console.error('Error parsing token:', error);
    return true;
  }
};

// Refresh access token using refresh token
export const refreshAccessToken = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Include cookies (refresh token)
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Update stored token and user data with consistent keys
      localStorage.setItem('accessToken', data.accessToken);
      if (data.user) {
        localStorage.setItem('userData', JSON.stringify(data.user));
      }
      
      return data.accessToken;
    } else {
      // Refresh failed, redirect to login
      throw new Error('Token refresh failed');
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    
    // Clear stored data and redirect to login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('user');
    clearCsrfToken();
    
    // Only redirect if we're not already on a public page
    if (!window.location.pathname.includes('/login') && 
        !window.location.pathname.includes('/register') &&
        !window.location.pathname.includes('/auth/')) {
      window.location.href = '/login';
    }
    
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('accessToken');
  const user = localStorage.getItem('userData');
  
  // User is authenticated if they have both a token and user data
  return token !== null && user !== null;
};

// Get valid access token (refresh if needed)
export const getValidToken = async () => {
  const currentToken = localStorage.getItem('accessToken');
  
  if (!currentToken || isTokenExpired(currentToken)) {
    try {
      return await refreshAccessToken();
    } catch (error) {
      return null;
    }
  }
  
  return currentToken;
};

// Enhanced fetch function that automatically handles token refresh and CSRF
export const authenticatedFetch = async (url, options = {}) => {
  const token = await getValidToken();
  
  if (!token) {
    throw new Error('No valid authentication token available');
  }
  
  const enhancedOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    },
    credentials: 'include'
  };
  
  // Add CSRF token for state-changing operations
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    try {
      const csrf = await getCsrfToken();
      enhancedOptions.headers['X-CSRF-Token'] = csrf;
    } catch (csrfError) {
      console.error('Failed to get CSRF token:', csrfError);
      // Continue without CSRF token - let server handle the error
    }
  }
  
  const response = await fetch(url, enhancedOptions);
  
  // If we get a 401, try to refresh token once
  if (response.status === 401) {
    try {
      const newToken = await refreshAccessToken();
      
      // Retry the request with new token
      enhancedOptions.headers.Authorization = `Bearer ${newToken}`;
      return await fetch(url, enhancedOptions);
    } catch (refreshError) {
      throw new Error('Authentication failed');
    }
  }
  
  // If we get a 403 CSRF error, try to refresh CSRF token and retry
  if (response.status === 403) {
    try {
      const responseData = await response.clone().json();
      if (responseData.message && responseData.message.includes('CSRF')) {
        // Clear and refetch CSRF token
        clearCsrfToken();
        const newCsrf = await getCsrfToken();
        enhancedOptions.headers['X-CSRF-Token'] = newCsrf;
        return await fetch(url, enhancedOptions);
      }
    } catch (csrfRetryError) {
      console.error('CSRF token retry failed:', csrfRetryError);
    }
  }
  
  return response;
};

// Logout function that clears tokens
export const logout = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      // Call logout endpoint to clear refresh token on server
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear local storage and CSRF token
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    clearCsrfToken();
    
    // Redirect to login
    window.location.href = '/login';
  }
};

// Initialize token refresh on app start
export const initializeTokenRefresh = () => {
  // Check token validity on page load
  const token = localStorage.getItem('accessToken');
  
  if (token && isTokenExpired(token)) {
    // Try to refresh token silently
    refreshAccessToken().catch(() => {
      // If refresh fails, user will be redirected to login
    });
  }
  
  // Set up periodic token refresh (every 10 minutes)
  setInterval(async () => {
    const currentToken = localStorage.getItem('accessToken');
    if (currentToken && isTokenExpired(currentToken)) {
      try {
        await refreshAccessToken();
      } catch (error) {
        // Token refresh failed, user will be redirected to login
      }
    }
  }, 10 * 60 * 1000); // 10 minutes
};