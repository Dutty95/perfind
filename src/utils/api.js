// src/utils/api.js
import { authenticatedFetch, getValidToken, getCsrfToken } from './tokenManager.js';

// Base API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Helper function for making API requests (legacy - for non-authenticated requests)
async function apiRequest(endpoint, method = 'GET', data = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  // Add authorization token if provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add CSRF token for state-changing operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
    try {
      const csrfToken = await getCsrfToken();
      headers['X-CSRF-Token'] = csrfToken;
    } catch (csrfError) {
      console.error('Failed to get CSRF token:', csrfError);
      // Continue without CSRF token - let server handle the error
    }
  }

  const config = {
    method,
    headers,
    body: data ? JSON.stringify(data) : null,
    credentials: 'include'
  };

  // Don't include body for GET requests
  if (method === 'GET') {
    delete config.body;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Something went wrong');
    }

    return responseData;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Enhanced API request function with automatic token refresh
async function authenticatedApiRequest(endpoint, method = 'GET', data = null) {
  const config = {
    method,
    body: data ? JSON.stringify(data) : null
  };

  // Don't include body for GET requests
  if (method === 'GET') {
    delete config.body;
  }

  try {
    const response = await authenticatedFetch(`${API_URL}${endpoint}`, config);
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Something went wrong');
    }

    return responseData;
  } catch (error) {
    console.error('Authenticated API request error:', error);
    throw error;
  }
}

// Auth API calls
const authAPI = {
  // Register a new user
  register: async (userData) => {
    return await apiRequest('/api/auth/register', 'POST', userData);
  },

  // Login user
  login: async (credentials) => {
    return await apiRequest('/api/auth/login', 'POST', credentials);
  },

  // Get user profile
  getProfile: async () => {
    return await authenticatedApiRequest('/api/auth/profile', 'GET');
  },

  // Refresh access token
  refreshToken: async () => {
    return await apiRequest('/api/auth/refresh', 'POST');
  },

  // Logout user
  logout: async () => {
    return await authenticatedApiRequest('/api/auth/logout', 'POST');
  },

  // Forgot password
  forgotPassword: async (email) => {
    return await apiRequest('/api/auth/forgot-password', 'POST', { email });
  }
};

// Transaction API calls
const transactionAPI = {
  // Get all transactions
  getAll: async () => {
    return await authenticatedApiRequest('/api/transactions', 'GET');
  },

  // Get single transaction
  getById: async (id) => {
    return await authenticatedApiRequest(`/api/transactions/${id}`, 'GET');
  },

  // Create new transaction
  create: async (transactionData) => {
    return await authenticatedApiRequest('/api/transactions', 'POST', transactionData);
  },

  // Update transaction
  update: async (id, transactionData) => {
    return await authenticatedApiRequest(`/api/transactions/${id}`, 'PUT', transactionData);
  },

  // Delete transaction
  delete: async (id) => {
    return await authenticatedApiRequest(`/api/transactions/${id}`, 'DELETE');
  },

  // Get transaction statistics
  getStats: async () => {
    return await authenticatedApiRequest('/api/transactions/stats', 'GET');
  },

  // Get monthly income vs expense data
  getMonthlyData: async () => {
    return await authenticatedApiRequest('/api/transactions/monthly', 'GET');
  },

  // Get category breakdown data
  getCategoryData: async () => {
    return await authenticatedApiRequest('/api/transactions/categories', 'GET');
  }
};

// Budget API calls
const budgetAPI = {
  // Get all budgets
  getAll: async () => {
    return await authenticatedApiRequest('/api/budgets', 'GET');
  },

  // Get single budget
  getById: async (id) => {
    return await authenticatedApiRequest(`/api/budgets/${id}`, 'GET');
  },

  // Create new budget
  create: async (budgetData) => {
    return await authenticatedApiRequest('/api/budgets', 'POST', budgetData);
  },

  // Update budget
  update: async (id, budgetData) => {
    return await authenticatedApiRequest(`/api/budgets/${id}`, 'PUT', budgetData);
  },

  // Delete budget
  delete: async (id) => {
    return await authenticatedApiRequest(`/api/budgets/${id}`, 'DELETE');
  },

  // Get budget overview
  getOverview: async () => {
    return await authenticatedApiRequest('/api/budgets/overview', 'GET');
  }
};

// Goal API calls
const goalAPI = {
  // Get all goals
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/goals?${queryString}` : '/api/goals';
    return await authenticatedApiRequest(endpoint, 'GET');
  },

  // Get single goal
  getById: async (id) => {
    return await authenticatedApiRequest(`/api/goals/${id}`, 'GET');
  },

  // Create new goal
  create: async (goalData) => {
    return await authenticatedApiRequest('/api/goals', 'POST', goalData);
  },

  // Update goal
  update: async (id, goalData) => {
    return await authenticatedApiRequest(`/api/goals/${id}`, 'PUT', goalData);
  },

  // Update goal progress
  updateProgress: async (id, progressData) => {
    return await authenticatedApiRequest(`/api/goals/${id}/progress`, 'PATCH', progressData);
  },

  // Delete goal
  delete: async (id) => {
    return await authenticatedApiRequest(`/api/goals/${id}`, 'DELETE');
  },

  // Get goal statistics
  getStats: async () => {
    return await authenticatedApiRequest('/api/goals/stats', 'GET');
  },

  // Get goals overview for dashboard
  getOverview: async () => {
    return await authenticatedApiRequest('/api/goals/overview', 'GET');
  }
};

// Dashboard API calls
const dashboardAPI = {
  // Get dashboard data
  getData: async () => {
    return await authenticatedApiRequest('/api/dashboard', 'GET');
  },

  // Get dashboard overview
  getOverview: async () => {
    return await authenticatedApiRequest('/api/dashboard', 'GET');
  },

  // Get financial insights and recommendations
  getInsights: async () => {
    return await authenticatedApiRequest('/api/dashboard/insights', 'GET');
  },

  // Get spending trends over time
  getTrends: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/dashboard/trends?${queryString}` : '/api/dashboard/trends';
    return await authenticatedApiRequest(endpoint, 'GET');
  },

  // Get expense analytics data
  getExpenseAnalytics: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/dashboard/analytics/expenses?${queryString}` : '/api/dashboard/analytics/expenses';
    return await authenticatedApiRequest(endpoint, 'GET');
  },

  // Get income analytics data
  getIncomeAnalytics: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/dashboard/analytics/income?${queryString}` : '/api/dashboard/analytics/income';
    return await authenticatedApiRequest(endpoint, 'GET');
  }
};

// Report API calls
const reportAPI = {
  // Get all reports with optional filters
  getAll: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const endpoint = queryString ? `/api/reports?${queryString}` : '/api/reports';
    return await authenticatedApiRequest(endpoint, 'GET');
  },

  // Get single report
  getById: async (id) => {
    return await authenticatedApiRequest(`/api/reports/${id}`, 'GET');
  },

  // Generate new report
  generate: async (reportData) => {
    return await authenticatedApiRequest('/api/reports/generate', 'POST', reportData);
  },

  // Delete report
  delete: async (id) => {
    return await authenticatedApiRequest(`/api/reports/${id}`, 'DELETE');
  },

  // Get report templates
  getTemplates: async () => {
    return await authenticatedApiRequest('/api/reports/templates', 'GET');
  },

  // Get quick financial summary
  getQuickSummary: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/reports/summary?${queryString}` : '/api/reports/summary';
    return await authenticatedApiRequest(endpoint, 'GET');
  }
};

// Export all API modules
export default {
  auth: authAPI,
  transactions: transactionAPI,
  budgets: budgetAPI,
  goals: goalAPI,
  dashboard: dashboardAPI,
  reports: reportAPI
};

export { 
  apiRequest, 
  authenticatedApiRequest, 
  authAPI, 
  transactionAPI, 
  budgetAPI, 
  goalAPI, 
  dashboardAPI, 
  reportAPI 
};